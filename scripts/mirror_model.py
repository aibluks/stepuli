"""Mirror only the frozen Stepuli transport parts. No Hugging Face credentials needed."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys

REPOSITORY = "aibluks/stepuli"
TAG = "v0.1.0-v8-experimental"
HF_REPOSITORY = "aibluks/stepuli-gemma-4-e2b-v8-experimental"
MODEL = "stepuli-v8-experimental-Q4_K_M.gguf"
MODEL_BYTES = 3106738304
MODEL_SHA256 = "00ab71619a71fad1260eb3ea5ce6071e4a4face0a2b36a4a7b0a918f0690626b"
MANIFEST_SHA256 = "df9353965d46f432dde848685de6b2dbc0d640932a9f7eeb763ac74b761c7302"
PART_BYTES = 200000000
MANIFEST = Path(__file__).resolve().parents[1] / "models/experimental/transport/transport-manifest.json"


def revision(value):
    if not re.fullmatch(r"[0-9a-f]{40}", value):
        raise ValueError("Use an immutable, anonymously verified 40-character lowercase HF commit SHA")
    return value


def manifest():
    raw = MANIFEST.read_bytes()
    if hashlib.sha256(raw).hexdigest() != MANIFEST_SHA256:
        raise ValueError("Frozen transport manifest changed")
    data = json.loads(raw)
    if data["assembled_model"] != {"filename": MODEL, "bytes": MODEL_BYTES, "sha256": MODEL_SHA256}:
        raise ValueError("Unexpected assembled model")
    if data["part_count"] != 16 or data["part_size_bytes"] != PART_BYTES or len(data["parts"]) != 16:
        raise ValueError("Unexpected part layout")
    for index, part in enumerate(data["parts"], 1):
        size = PART_BYTES if index < 16 else MODEL_BYTES - 15 * PART_BYTES
        if part["filename"] != f"{MODEL}.part-{index:03d}" or part["bytes"] != size:
            raise ValueError("Unexpected part filename or size")
        if not re.fullmatch(r"[0-9a-f]{64}", part["sha256"]):
            raise ValueError("Invalid part checksum")
    return data


def digest(path):
    sha = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(8 * 1024 * 1024):
            sha.update(chunk)
    return sha.hexdigest()


def check_file(path, size, sha):
    if path.is_symlink() or path.stat().st_size != size or digest(path) != sha:
        raise ValueError(f"Checksum or size mismatch: {path.name}")


def split_verified(source, output, parts):
    # Caller verifies the full model first. Each produced part is independently checked.
    with source.open("rb") as stream:
        for part in parts:
            remaining = part["bytes"]
            destination = output / part["filename"]
            with destination.open("xb") as target:
                while remaining:
                    chunk = stream.read(min(8 * 1024 * 1024, remaining))
                    if not chunk:
                        raise ValueError("Source ended before the expected part boundary")
                    target.write(chunk)
                    remaining -= len(chunk)
            check_file(destination, part["bytes"], part["sha256"])
        if stream.read(1):
            raise ValueError("Unexpected extra source bytes")


def prepare(value):
    pinned = revision(value)  # Reject input before any network request or filesystem write.
    data = manifest()
    output = Path("model-transport")
    output.mkdir()  # Refuse to reuse an existing working directory.
    source = output / MODEL
    url = f"https://huggingface.co/{HF_REPOSITORY}/resolve/{pinned}/{MODEL}"
    subprocess.run(["curl", "-q", "--fail", "--location", "--proto", "=https", "--proto-redir", "=https",
                    "--retry", "5", "--retry-delay", "5", "--connect-timeout", "30", "--max-time", "3600",
                    "--output", str(source), url], check=True)
    check_file(source, MODEL_BYTES, MODEL_SHA256)
    with source.open("rb") as stream:
        if stream.read(4) != b"GGUF":
            raise ValueError("Missing GGUF header")
    split_verified(source, output, data["parts"])
    print(f"Verified full model and all {len(data['parts'])} byte transport parts at HF revision {pinned}")


def upload():
    if os.environ.get("GITHUB_REPOSITORY") != REPOSITORY or os.environ.get("GITHUB_REF") != "refs/heads/main":
        raise ValueError("Release writes are restricted to the canonical repository main branch")
    data = manifest()
    # Validate EVERY part before the first release mutation.
    for part in data["parts"]:
        check_file(Path("model-transport") / part["filename"], part["bytes"], part["sha256"])
    release = json.loads(subprocess.check_output(["gh", "release", "view", TAG, "--repo", REPOSITORY,
                                                 "--json", "tagName,isDraft,isPrerelease"]))
    if release != {"tagName": TAG, "isDraft": False, "isPrerelease": True}:
        raise ValueError("Expected existing experimental public pre-release")
    for part in data["parts"]:
        # Explicit exact path; never glob, create a release, or touch adapter/metadata assets.
        subprocess.run(["gh", "release", "upload", TAG, str(Path("model-transport") / part["filename"]),
                        "--repo", REPOSITORY, "--clobber"], check=True)
    print("Uploaded 16 transport parts. Anonymous full-download verification is still required.")


if __name__ == "__main__":
    if sys.argv[1:] == ["prepare"]:
        prepare(os.environ.get("HF_REVISION", ""))
    elif sys.argv[1:] == ["upload"]:
        upload()
    else:
        raise SystemExit("Usage: mirror_model.py prepare|upload")
