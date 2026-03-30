#!/usr/bin/env python3
"""Security and deployment baseline verifier for Sonicstream."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path
from typing import List, Tuple


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def check_file_exists(path: Path, label: str, failures: List[str]) -> None:
    if not path.exists():
        failures.append(f"Missing required file: {label} ({path})")


def check_contains(text: str, needle: str, label: str, failures: List[str]) -> None:
    if needle not in text:
        failures.append(f"Missing required config '{needle}' in {label}")


def git_tracked_files(repo_root: Path) -> List[str]:
    try:
        result = subprocess.run(
            ["git", "ls-files"],
            cwd=repo_root,
            check=True,
            capture_output=True,
            text=True,
        )
    except Exception:
        return []
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def runtime_numpy_major() -> int | None:
    try:
        import numpy as np  # type: ignore
    except Exception:
        return None

    parts = str(getattr(np, "__version__", "")).split(".")
    if not parts:
        return None
    head = parts[0].strip()
    return int(head) if head.isdigit() else None


def run_checks(repo_root: Path, mode: str) -> Tuple[List[str], List[str]]:
    failures: List[str] = []
    warnings: List[str] = []

    gh_workflow = repo_root / ".github" / "workflows" / "ci-security.yml"
    firestore_rules = repo_root / "firestore.rules"
    firebase_json = repo_root / "firebase.json"
    gitignore = repo_root / ".gitignore"
    backend_env_example = repo_root / "backend" / ".env.example"
    frontend_env_example = repo_root / "frontend" / ".env.example"
    root_requirements = repo_root / "requirements.txt"
    backend_requirements = repo_root / "backend" / "requirements.txt"

    check_file_exists(gh_workflow, "CI workflow", failures)
    check_file_exists(firestore_rules, "Firestore rules", failures)
    check_file_exists(firebase_json, "Firebase config", failures)
    check_file_exists(gitignore, "Git ignore file", failures)
    check_file_exists(backend_env_example, "backend env example", failures)
    check_file_exists(frontend_env_example, "frontend env example", failures)
    check_file_exists(root_requirements, "root requirements", failures)
    check_file_exists(backend_requirements, "backend requirements", failures)

    gitignore_text = read_text(gitignore)
    check_contains(gitignore_text, ".env", ".gitignore", failures)
    check_contains(gitignore_text, "backend/serviceAccountKey.json", ".gitignore", failures)

    backend_env_text = read_text(backend_env_example)
    for key in [
        "ADMIN_UIDS",
        "FIREBASE_CREDENTIALS_PATH",
        "RATE_LIMIT_WINDOW_SECONDS",
        "RATE_LIMIT_READ_MAX",
        "RATE_LIMIT_WRITE_MAX",
    ]:
        check_contains(backend_env_text, key, "backend/.env.example", failures)

    frontend_env_text = read_text(frontend_env_example)
    for key in [
        "VITE_API_BASE_URL",
        "VITE_FIREBASE_API_KEY",
        "VITE_FIREBASE_AUTH_DOMAIN",
        "VITE_FIREBASE_PROJECT_ID",
    ]:
        check_contains(frontend_env_text, key, "frontend/.env.example", failures)

    root_req_text = read_text(root_requirements)
    backend_req_text = read_text(backend_requirements)
    check_contains(root_req_text, "numpy<2", "requirements.txt", failures)
    check_contains(backend_req_text, "numpy<2", "backend/requirements.txt", failures)

    numpy_major = runtime_numpy_major()
    if numpy_major is None:
        warnings.append("Could not determine runtime NumPy version")
    elif numpy_major >= 2:
        failures.append(
            f"Runtime NumPy major version is {numpy_major}. Install numpy<2 for torch artifact compatibility."
        )

    workflow_text = read_text(gh_workflow)
    for step in ["Backend auth tests", "Monitoring smoke tests", "Run Gitleaks"]:
        check_contains(workflow_text, step, ".github/workflows/ci-security.yml", failures)

    tracked = git_tracked_files(repo_root)
    sensitive_patterns = [
        ".env",
        ".env.local",
        "serviceAccountKey.json",
        "backend/serviceAccountKey.json",
    ]
    for file_path in tracked:
        normalized = file_path.replace("\\", "/")
        if any(pattern in normalized for pattern in sensitive_patterns):
            failures.append(f"Sensitive file appears tracked in git: {file_path}")

    if mode == "deploy":
        admin_uids = os.environ.get("ADMIN_UIDS", "").strip()
        if not admin_uids:
            failures.append("ADMIN_UIDS is not set in environment for deploy mode")

        has_service_account = bool(os.environ.get("FIREBASE_SERVICE_ACCOUNT", "").strip())
        if not has_service_account:
            warnings.append(
                "FIREBASE_SERVICE_ACCOUNT is not set. Ensure FIREBASE_CREDENTIALS_PATH is securely mounted in deployment."
            )

    return failures, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify security/deployment baseline")
    parser.add_argument("--ci", action="store_true", help="Run checks suitable for CI")
    parser.add_argument("--deploy", action="store_true", help="Run stricter deploy-time checks")
    args = parser.parse_args()

    mode = "default"
    if args.deploy:
        mode = "deploy"
    elif args.ci:
        mode = "ci"

    repo_root = Path(__file__).resolve().parents[2]
    failures, warnings = run_checks(repo_root, mode)

    print("Security verification mode:", mode)
    if warnings:
        print("Warnings:")
        for warning in warnings:
            print("  -", warning)

    if failures:
        print("Failures:")
        for failure in failures:
            print("  -", failure)
        return 1

    print("All security baseline checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
