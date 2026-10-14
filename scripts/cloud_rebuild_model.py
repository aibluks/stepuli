#!/usr/bin/env python3
"""Prepare the exact Stepuli model from public inputs. No publishing or credentials.

python3 cloud_rebuild_model.py --output-dir /fresh/job-owned/directory
The verified model is left there; only this helper's TemporaryDirectory is removed.
Import-safe: importing this module starts no downloads, commands, or model work.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import tarfile
import tempfile

HERE = Path(__file__).resolve().parent
EXPECTED_MODEL_SHA = '00ab71619a71fad1260eb3ea5ce6071e4a4face0a2b36a4a7b0a918f0690626b'
EXPECTED_MODEL_SIZE = 3106738304
EXPECTED_OVERRIDE_SHA = '273ade42a8d3a73b45382fe25dbfa2d3efe4ae7cf094ba020e7cba8a90df55a9'
CHUNK_BYTES = 200000000


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for block in iter(lambda: handle.read(8 * 1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def verify_file(path: Path, expected_size: int, expected_sha: str) -> None:
    if not path.is_file() or path.is_symlink():
        raise RuntimeError(f'Expected regular file: {path.name}')
    if path.stat().st_size != expected_size:
        raise RuntimeError(f'Size mismatch: {path.name}')
    if sha256(path) != expected_sha:
        raise RuntimeError(f'SHA256 mismatch: {path.name}')


def validate_platform(system: str, machine: str, macos_version: str,
                      python_version: tuple[int, int]) -> None:
    if system != 'Darwin' or machine != 'arm64' or macos_version.split('.')[0] != '26':
        raise RuntimeError('Requires macOS 26 ARM64; no Linux/x64 substitution is allowed.')
    if python_version != (3, 12):
        raise RuntimeError('Requires pinned setup-python Python 3.12.')


def load_recipe(path: Path) -> dict:
    recipe = json.loads(path.read_text())
    if recipe['output']['sha256'] != EXPECTED_MODEL_SHA or recipe['output']['bytes'] != EXPECTED_MODEL_SIZE:
        raise RuntimeError('Recipe output identity differs from the frozen tested model.')
    if recipe['override_file']['sha256'] != EXPECTED_OVERRIDE_SHA or recipe['threads'] != 4:
        raise RuntimeError('Recipe changed the original merge/quantization settings.')
    if recipe['transport_part_bytes'] != CHUNK_BYTES or len(recipe['transport_parts']) != 16:
        raise RuntimeError('Recipe changed transport packaging.')
    if sum(part['bytes'] for part in recipe['transport_parts']) != EXPECTED_MODEL_SIZE:
        raise RuntimeError('Transport part sizes do not total the original model.')
    for index, part in enumerate(recipe['transport_parts'], 1):
        expected_name = recipe['output']['filename'] + f'.part-{index:03d}'
        if part['filename'] != expected_name or part['bytes'] != (CHUNK_BYTES if index < 16 else 106738304):
            raise RuntimeError('Unexpected transport part name/size.')
    if recipe['quantization'] != {'type': 'Q4_K_M', 'general_name': 'Stepuli V8 Experimental Q4 Derived', 'allow_requantize': False}:
        raise RuntimeError('Quantization recipe differs from the original.')
    return recipe


def run(command: list[str], timeout: int) -> subprocess.CompletedProcess:
    # Commands contain only pinned public URLs and job-owned paths; no token reads.
    return subprocess.run(command, check=True, timeout=timeout)


def download_public(url: str, destination: Path, identity: dict) -> None:
    # --disable is first to bypass curl client configuration. No auth headers.
    run(['curl', '--disable', '--fail', '--location', '--silent', '--show-error',
         '--proto', '=https', '--proto-redir', '=https',
         '--retry', '3', '--retry-delay', '2', '--connect-timeout', '30',
         '--max-time', '1200', '--output', str(destination), url], timeout=1250)
    verify_file(destination, identity['bytes'], identity['sha256'])


def create_overrides(python: Path, base: Path, adapter: Path, output: Path) -> None:
    code = r'''
from pathlib import Path
from gguf import GGUFReader
import re,sys
base=GGUFReader(sys.argv[1]);adapter=GGUFReader(sys.argv[2])
adapted={t.name.rsplit('.lora_',1)[0] for t in adapter.tensors}
assert len(adapted)==140
text=''.join('^'+re.escape(t.name)+'$='+t.tensor_type.name+'\n' for t in base.tensors if t.name not in adapted)
assert len(text.splitlines())==461
Path(sys.argv[3]).write_text(text)
'''
    run([str(python), '-c', code, str(base), str(adapter), str(output)], timeout=180)
    if len(output.read_text().splitlines()) != 461 or sha256(output) != EXPECTED_OVERRIDE_SHA:
        raise RuntimeError('Exact 461-line original override file was not reproduced.')


def verify_runtime(export: Path, quantize: Path) -> None:
    # This pinned exporter implements --version; the quantizer exposes only usage.
    result = subprocess.run([str(export), '--version'], check=True, text=True,
                            capture_output=True, timeout=30)
    version = result.stdout + result.stderr
    if 'build 11429' not in version or 'd81235049' not in version:
        raise RuntimeError('Pinned official exporter version check failed.')
    result = subprocess.run([str(quantize), '--help'], check=False, text=True,
                            capture_output=True, timeout=30)
    usage = result.stdout + result.stderr
    if result.returncode != 1 or 'usage' not in usage.lower() or not all(
            flag in usage for flag in ['--tensor-type-file', '--override-kv', 'Q4_K_M']):
        raise RuntimeError('Pinned quantizer usage/required flags check failed.')
    # The archive SHA256 checked before extraction authenticates both binaries.


def prepare(output_dir: Path, recipe_path: Path = HERE / 'recipe.json') -> Path:
    recipe = load_recipe(recipe_path)
    validate_platform(platform.system(), platform.machine(), platform.mac_ver()[0], sys.version_info[:2])
    if output_dir.is_symlink():
        raise RuntimeError('Output directory must not be a symlink.')
    if output_dir.exists():
        if not output_dir.is_dir() or any(output_dir.iterdir()):
            raise RuntimeError('Use a fresh or empty output directory; existing files are preserved.')
    else:
        output_dir.mkdir(parents=True, exist_ok=False)
    if shutil.disk_usage(output_dir).free < recipe['minimum_free_bytes']:
        raise RuntimeError('At least 11 GB free disk is required before rebuilding.')
    final_path = output_dir / recipe['output']['filename']
    report = None
    # Holds only cloud-generated inputs/intermediates/tools; cleans on success/failure.
    with tempfile.TemporaryDirectory(prefix='.stepuli-rebuild-', dir=output_dir) as temporary:
        scratch = Path(temporary)
        base = scratch / 'base.gguf'
        adapter = scratch / 'adapter.gguf'
        archive = scratch / 'runtime.tar.gz'
        for key, path in [('base', base), ('adapter', adapter), ('runtime', archive)]:
            identity = recipe['inputs'][key]
            print(f'Downloading and checking public {key}', file=sys.stderr, flush=True)
            download_public(identity['url'], path, identity)
        with tarfile.open(archive, 'r:gz') as bundle:
            bundle.extractall(scratch / 'runtime', filter='data')
        runtime = scratch / 'runtime' / recipe['inputs']['runtime']['directory']
        export = runtime / 'llama-export-lora'
        quantize = runtime / 'llama-quantize'
        verify_runtime(export, quantize)
        venv = scratch / 'venv'
        run([sys.executable, '-m', 'venv', str(venv)], timeout=120)
        python = venv / 'bin/python'
        run([str(python), '-m', 'pip', '--disable-pip-version-check', 'install',
             '--no-input', '--no-cache-dir', '--only-binary=:all:', *recipe['python_packages']], timeout=600)
        overrides = scratch / 'preserve-unadapted-tensor-types.txt'
        create_overrides(python, base, adapter, overrides)
        mixed = scratch / 'mixed.gguf'
        generated = scratch / recipe['output']['filename']
        run([str(export), '-m', str(base), '--lora', str(adapter), '-o', str(mixed), '-t', '4'], timeout=600)
        run([str(quantize), '--tensor-type-file', str(overrides), '--override-kv',
             'general.name=str:Stepuli V8 Experimental Q4 Derived',
             str(mixed), str(generated), 'Q4_K_M', '4'], timeout=600)
        verify_file(generated, EXPECTED_MODEL_SIZE, EXPECTED_MODEL_SHA)
        with generated.open('rb') as handle:
            if handle.read(4) != b'GGUF':
                raise RuntimeError('Generated model is not GGUF.')
        report = {'project': 'Stepuli', 'publisher': 'AI Bluks',
                  'verified_model': recipe['output'], 'inputs': recipe['inputs'],
                  'exact_override_sha256': sha256(overrides),
                  'transport_gate': 'mirror_model.prepare_local must verify every frozen part hash before publishing.',
                  'host_architecture': platform.machine(), 'host_macos': platform.mac_ver()[0],
                  'publication_performed': False,
                  'scope': 'Exact frozen-byte reproduction and packaging preparation only; no training, inference, credentials, or uploads.'}
        generated.rename(final_path)
    # Public base/mixed files and tool/venv scratch are now gone before later splitting.
    (output_dir / 'rebuild-verification.json').write_text(json.dumps(report, indent=2) + '\n')
    return final_path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, required=True)
    arguments = parser.parse_args()
    model = prepare(arguments.output_dir)
    print(json.dumps({'verified_model_path': str(model.resolve()),
                      'sha256': EXPECTED_MODEL_SHA, 'bytes': EXPECTED_MODEL_SIZE,
                      'all16_transport_hashes_verified': False,
                      'next': 'Call mirror_model.prepare_local(verified_model_path) separately; publishing requires its own guarded step.'}))


if __name__ == '__main__':
    main()
