import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
GATE_PATH = REPO_ROOT / ".agent" / "zero_context_gate.py"


def run_gate(args, repo_root=None, env=None):
    target_root = str(repo_root or REPO_ROOT)
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)
    return subprocess.run(
        ["python3", str(GATE_PATH), *args, "--repo-root", target_root],
        cwd=REPO_ROOT,
        env=merged_env,
        text=True,
        capture_output=True,
        check=False,
    )


class ZeroContextGateTests(unittest.TestCase):
    def make_temp_repo(self):
        root = Path(tempfile.mkdtemp(prefix="cc-zero-context-"))
        (root / ".agent").mkdir(parents=True)
        (root / "docs").mkdir(parents=True)
        (root / "AGENTS.md").write_text("# Agent Guide\n", encoding="utf-8")
        (root / "REVIEW.md").write_text("# Review Rules\n", encoding="utf-8")
        (root / "CLAUDE.md").write_text("# Claude\n", encoding="utf-8")
        (root / "README.md").write_text("# Readme\n", encoding="utf-8")
        (root / "docs" / "ZERO-CONTEXT-CONTRIBUTION.md").write_text("# Zero Context\n", encoding="utf-8")
        (root / ".agent" / "zero_context_gate.py").write_text("# vendored elsewhere\n", encoding="utf-8")
        self.addCleanup(lambda: shutil.rmtree(root, ignore_errors=True))
        return root

    def write_json(self, path, value):
        path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")

    def base_contract(self, commands):
        return {
            "version": 1,
            "repo": "fixture",
            "canonical_doctrine": "docs/ZERO-CONTEXT-CONTRIBUTION.md",
            "source_of_truth": [
                "docs/ZERO-CONTEXT-CONTRIBUTION.md",
                ".agent/contribution-contract.json",
                "CLAUDE.md",
                "AGENTS.md",
                "REVIEW.md",
                "README.md",
            ],
            "required_files": [
                "AGENTS.md",
                "REVIEW.md",
                "CLAUDE.md",
                "docs/ZERO-CONTEXT-CONTRIBUTION.md",
                ".agent/contribution-contract.json",
                ".agent/zero_context_gate.py",
            ],
            "boundaries": {
                "portable_paths": [".agent/", "docs/", "AGENTS.md", "REVIEW.md", "README.md", "CLAUDE.md"],
                "protected_paths": ["dist/", "node_modules/"],
                "forbidden_actions": [
                    "Do not use shell-inline or inline-code verification commands.",
                    "Do not execute install or deploy commands through the contract.",
                ],
            },
            "review": {
                "rules": ["Report findings first."],
                "classification": {
                    "one_off_judgment": "Keep one-off judgment in the review itself.",
                    "repeatable_defect": "Promote repeatable defects into tests, lint rules, or CI.",
                    "missing_domain_knowledge": "Promote missing domain knowledge into canonical docs or a reusable skill.",
                    "agent_behavior_failure": "Promote agent behavior failures into operating evals.",
                },
            },
            "escalate_if": ["Verification requires installs or secrets."],
            "verification": {"commands": commands},
        }

    def test_audits_the_real_repo_contract(self):
        result = run_gate(["audit", "--json"])
        self.assertEqual(result.returncode, 0, msg=result.stderr)
        payload = json.loads(result.stdout)
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["audit"]["canonical_doctrine"], "docs/ZERO-CONTEXT-CONTRIBUTION.md")
        self.assertEqual(
            [command["id"] for command in payload["audit"]["commands"]],
            ["gate-tests", "lint", "format-check", "build", "unit-tests", "playwright-smoke"],
        )

    def test_rejects_shell_inline_verification_commands_during_audit(self):
        temp_repo = self.make_temp_repo()
        self.write_json(
            temp_repo / ".agent" / "contribution-contract.json",
            self.base_contract(
                [{"id": "unsafe", "cwd": ".", "argv": ["bash", "-c", "echo nope"]}]
            ),
        )

        result = run_gate(["audit", "--json"], repo_root=temp_repo)
        self.assertEqual(result.returncode, 1)
        payload = json.loads(result.stdout)
        self.assertFalse(payload["ok"])
        self.assertRegex("\n".join(payload["errors"]), "shell-inline execution")

    def test_fails_when_required_file_is_missing(self):
        temp_repo = self.make_temp_repo()
        contract = self.base_contract([{"id": "safe", "cwd": ".", "argv": ["python3", "--version"]}])
        contract["required_files"].append("tests/test_zero_context_gate.py")
        self.write_json(temp_repo / ".agent" / "contribution-contract.json", contract)

        result = run_gate(["audit", "--json"], repo_root=temp_repo)
        self.assertEqual(result.returncode, 1)
        payload = json.loads(result.stdout)
        self.assertFalse(payload["ok"])
        self.assertRegex("\n".join(payload["errors"]), "missing required_files entry")

    def test_fails_closed_when_a_verify_command_exits_nonzero(self):
        temp_repo = self.make_temp_repo()
        (temp_repo / "tools").mkdir()
        (temp_repo / "tools" / "fail.py").write_text("raise SystemExit(7)\n", encoding="utf-8")
        self.write_json(
            temp_repo / ".agent" / "contribution-contract.json",
            self.base_contract(
                [
                    {
                        "id": "fixture-fail",
                        "cwd": ".",
                        "argv": ["python3", "tools/fail.py"],
                        "timeout_seconds": 5,
                    }
                ]
            ),
        )

        result = run_gate(["verify", "--json"], repo_root=temp_repo)
        self.assertEqual(result.returncode, 1)
        payload = json.loads(result.stdout)
        self.assertFalse(payload["ok"])
        self.assertRegex("\n".join(payload["errors"]), "exit code 7")
        self.assertEqual(payload["commands"][0]["id"], "fixture-fail")
        self.assertFalse(payload["commands"][0]["ok"])
        self.assertEqual(payload["commands"][0]["returncode"], 7)


if __name__ == "__main__":
    unittest.main()
