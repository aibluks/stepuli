import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import mirror_model as mirror


class MirrorTests(unittest.TestCase):
    def test_frozen_manifest_has_exact_sixteen_parts(self):
        data = mirror.manifest()
        self.assertEqual(sum(p["bytes"] for p in data["parts"]), mirror.MODEL_BYTES)
        self.assertEqual(len(data["parts"]), 16)

    def test_invalid_revision_rejected_before_network(self):
        for value in ["main", "a" * 39, "A" * 40, "$(whoami)", "../" + "a" * 40]:
            with self.subTest(value=value), patch.object(mirror.subprocess, "run") as run:
                with self.assertRaises(ValueError):
                    mirror.prepare(value)
                run.assert_not_called()
        self.assertEqual(mirror.revision("a" * 40), "a" * 40)

    def test_split_boundaries_and_hash_rejection(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); source = root / "input"; source.write_bytes(b"GGUF123456")
            parts = [{"filename": "one", "bytes": 4, "sha256": hashlib.sha256(b"GGUF").hexdigest()},
                     {"filename": "two", "bytes": 6, "sha256": hashlib.sha256(b"123456").hexdigest()}]
            mirror.split_verified(source, root, parts)
            self.assertEqual((root / "two").read_bytes(), b"123456")
            (root / "two").write_bytes(b"badbad")
            with self.assertRaises(ValueError):
                mirror.check_file(root / "two", 6, parts[1]["sha256"])

    def test_manifest_tampering_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            altered = Path(tmp) / "manifest.json"
            altered.write_bytes(mirror.MANIFEST.read_bytes() + b" ")
            with patch.object(mirror, "MANIFEST", altered), self.assertRaises(ValueError):
                mirror.manifest()

    def test_missing_or_bad_part_prevents_any_release_command(self):
        with patch.dict(mirror.os.environ, {"GITHUB_REPOSITORY": mirror.REPOSITORY, "GITHUB_REF": "refs/heads/main"}), patch.object(mirror, "check_file", side_effect=ValueError("bad part")), patch.object(mirror.subprocess, "run") as run, patch.object(mirror.subprocess, "check_output") as read:
            with self.assertRaises(ValueError):
                mirror.upload()
            run.assert_not_called()
            read.assert_not_called()

    def test_local_rebuild_wrong_hash_never_splits(self):
        with tempfile.TemporaryDirectory() as tmp:
            model = Path(tmp) / "rebuilt.gguf"
            model.write_bytes(b"GGUFwrong")
            with patch.object(mirror, "split_verified") as split:
                with self.assertRaises(ValueError):
                    mirror.prepare_local(model)
                split.assert_not_called()

    def test_last_bad_part_still_prevents_all_release_commands(self):
        outcomes = [None] * 15 + [ValueError("last part corrupt")]
        with patch.dict(mirror.os.environ, {"GITHUB_REPOSITORY": mirror.REPOSITORY, "GITHUB_REF": "refs/heads/main"}), patch.object(mirror, "check_file", side_effect=outcomes) as checks, patch.object(mirror.subprocess, "run") as run, patch.object(mirror.subprocess, "check_output") as read:
            with self.assertRaises(ValueError):
                mirror.upload()
            self.assertEqual(checks.call_count, 16)
            run.assert_not_called()
            read.assert_not_called()

    def test_upload_rejects_other_repository_before_gh(self):
        with patch.dict(mirror.os.environ, {"GITHUB_REPOSITORY": "other/repo", "GITHUB_REF": "refs/heads/main"}), patch.object(mirror.subprocess, "run") as run:
            with self.assertRaises(ValueError):
                mirror.upload()
            run.assert_not_called()


if __name__ == "__main__":
    unittest.main()
