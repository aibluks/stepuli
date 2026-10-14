import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import cloud_rebuild_model as rebuild


class RebuildTests(unittest.TestCase):
    def test_platform_and_python_are_fixed(self):
        rebuild.validate_platform('Darwin', 'arm64', '26.1', (3, 12))
        for system, cpu, version, python in [('Linux', 'arm64', '26.0', (3, 12)), ('Darwin', 'x86_64', '26.0', (3, 12)), ('Darwin', 'arm64', '15.0', (3, 12)), ('Darwin', 'arm64', '26.0', (3, 14))]:
            with self.subTest(system=system, cpu=cpu, version=version, python=python), self.assertRaises(RuntimeError):
                rebuild.validate_platform(system, cpu, version, python)

    def test_frozen_recipe_agrees_with_transport_manifest(self):
        recipe = rebuild.load_recipe(rebuild.HERE / 'recipe.json')
        manifest = json.loads((rebuild.HERE.parent / 'models/experimental/transport/transport-manifest.json').read_text())
        self.assertEqual(recipe['transport_parts'], manifest['parts'])
        self.assertEqual(recipe['output'], manifest['assembled_model'])

    def test_bad_download_hash_stops_before_any_rebuild(self):
        with tempfile.TemporaryDirectory() as tmp:
            destination = Path(tmp) / 'download'
            destination.write_bytes(b'wrong data')
            with patch.object(rebuild, 'run') as run, self.assertRaises(RuntimeError):
                rebuild.download_public('https://example.invalid/frozen', destination, {'bytes': 10, 'sha256': '0' * 64})
            run.assert_called_once()

    def test_wrong_full_model_identity_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            model = Path(tmp) / 'model'
            model.write_bytes(b'GGUF')
            with self.assertRaises(RuntimeError):
                rebuild.verify_file(model, rebuild.EXPECTED_MODEL_SIZE, rebuild.EXPECTED_MODEL_SHA)



"""Local tests exercise fail-closed gates only; never download or rebuild weights."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import cloud_rebuild_model as model


class RebuildGuards(unittest.TestCase):
    def test_platform_is_exact(self):
        model.validate_platform('Darwin', 'arm64', '26.1', (3, 12))
        for system, machine, version, python in [('Linux','arm64','26',(3,12)),
            ('Darwin','x86_64','26',(3,12)),('Darwin','arm64','15.6',(3,12)),
            ('Darwin','arm64','26',(3,11))]:
            with self.assertRaises(RuntimeError):
                model.validate_platform(system,machine,version,python)

    def test_recipe_freezes_model_and_parts(self):
        recipe=model.load_recipe(model.HERE/'recipe.json')
        self.assertEqual(len(recipe['transport_parts']),16)
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)/'bad.json';recipe['output']['sha256']='0'*64
            path.write_text(json.dumps(recipe))
            with self.assertRaises(RuntimeError):model.load_recipe(path)

    def test_file_rejects_wrong_bytes_size_and_symlink(self):
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)/'input';path.write_bytes(b'correct')
            digest=hashlib.sha256(b'correct').hexdigest()
            model.verify_file(path,7,digest)
            for size,sha in [(6,digest),(7,'0'*64)]:
                with self.assertRaises(RuntimeError):model.verify_file(path,size,sha)
            link=Path(temp)/'link';link.symlink_to(path)
            with self.assertRaises(RuntimeError):model.verify_file(link,7,digest)

    def test_insufficient_disk_never_downloads(self):
        with tempfile.TemporaryDirectory() as temp:
            out=Path(temp)/'fresh'
            with patch.object(model,'validate_platform'),patch.object(model.shutil,'disk_usage') as usage,patch.object(model,'download_public') as download:
                usage.return_value.free=0
                with self.assertRaises(RuntimeError):model.prepare(out)
                download.assert_not_called();self.assertEqual(list(out.iterdir()),[])

    def test_existing_files_are_preserved(self):
        with tempfile.TemporaryDirectory() as temp:
            out=Path(temp);file=out/'keep';file.write_text('unrelated')
            with patch.object(model,'validate_platform'),patch.object(model,'download_public') as download:
                with self.assertRaises(RuntimeError):model.prepare(out)
                download.assert_not_called();self.assertEqual(file.read_text(),'unrelated')

    def test_failure_cleans_only_own_temporary_scratch(self):
        with tempfile.TemporaryDirectory() as temp:
            out=Path(temp)/'fresh';sibling=Path(temp)/'keep';sibling.write_text('unrelated')
            with patch.object(model,'validate_platform'),patch.object(model.shutil,'disk_usage') as usage,patch.object(model,'download_public',side_effect=RuntimeError('simulated transfer failure')):
                usage.return_value.free=20_000_000_000
                with self.assertRaises(RuntimeError):model.prepare(out)
            self.assertEqual(list(out.iterdir()),[]);self.assertEqual(sibling.read_text(),'unrelated')


if __name__=='__main__':unittest.main()
