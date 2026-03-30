#!/usr/bin/env python3
"""Post-deploy smoke and stabilization checks for Sonicstream."""

from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path
from typing import Any
from urllib import error, request


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Run post-deploy smoke checks')
    parser.add_argument('--base-url', default=os.environ.get('SMOKE_API_BASE_URL', 'http://localhost:8000'))
    parser.add_argument('--probe-user', default=os.environ.get('SMOKE_PROBE_USER_ID', 'smoke_user'))
    parser.add_argument('--forbidden-user', default=os.environ.get('SMOKE_FORBIDDEN_USER_ID', 'other_user'))
    parser.add_argument('--token', default=os.environ.get('SMOKE_BEARER_TOKEN', ''))
    parser.add_argument('--timeout-seconds', type=int, default=10)
    parser.add_argument('--report', default='dev_reports/post_deploy_smoke_report.json')
    return parser.parse_args()


def _request_json(url: str, timeout: int, token: str = '') -> tuple[int, dict[str, Any]]:
    headers = {'Accept': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = request.Request(url=url, headers=headers, method='GET')

    try:
        with request.urlopen(req, timeout=timeout) as resp:
            status = int(resp.status)
            body = resp.read().decode('utf-8')
    except error.HTTPError as exc:
        status = int(exc.code)
        body = exc.read().decode('utf-8') if exc.fp else ''
    payload: dict[str, Any] = {}
    if body:
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            payload = {'raw': body[:1000]}
    return status, payload


def run_check(results: list[dict[str, Any]], name: str, expected: int, url: str, timeout: int, token: str = '') -> bool:
    started = time.perf_counter()
    status, payload = _request_json(url, timeout=timeout, token=token)
    duration_ms = round((time.perf_counter() - started) * 1000, 2)
    ok = status == expected
    results.append(
        {
            'name': name,
            'url': url,
            'expected_status': expected,
            'actual_status': status,
            'duration_ms': duration_ms,
            'ok': ok,
            'response': payload,
        }
    )
    return ok


def resolve(path: str, root: Path) -> Path:
    target = Path(path)
    if target.is_absolute():
        return target
    return root / target


def main() -> int:
    args = parse_args()
    root = Path(__file__).resolve().parents[2]
    report_path = resolve(args.report, root)
    base = args.base_url.rstrip('/')

    results: list[dict[str, Any]] = []

    ok_all = True
    ok_all &= run_check(results, 'health', 200, f'{base}/health', args.timeout_seconds)
    ok_all &= run_check(results, 'ready', 200, f'{base}/ready', args.timeout_seconds)
    ok_all &= run_check(results, 'metrics-json', 200, f'{base}/metrics', args.timeout_seconds)

    prom_url = f'{base}/metrics/prometheus'
    prom_status, _ = _request_json(prom_url, timeout=args.timeout_seconds)
    results.append(
        {
            'name': 'metrics-prometheus',
            'url': prom_url,
            'expected_status': 200,
            'actual_status': prom_status,
            'duration_ms': None,
            'ok': prom_status == 200,
            'response': {},
        }
    )
    ok_all &= prom_status == 200

    unauth_url = f'{base}/api/v1/library/{args.probe_user}'
    ok_all &= run_check(results, 'library-unauthorized', 401, unauth_url, args.timeout_seconds)

    if args.token:
        auth_url = f'{base}/api/v1/library/{args.probe_user}'
        ok_all &= run_check(results, 'library-authorized', 200, auth_url, args.timeout_seconds, token=args.token)

        forbidden_url = f'{base}/api/v1/library/{args.forbidden_user}'
        ok_all &= run_check(results, 'library-forbidden', 403, forbidden_url, args.timeout_seconds, token=args.token)

    payload = {
        'status': 'ok' if ok_all else 'failed',
        'base_url': base,
        'results': results,
    }

    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(payload, indent=2), encoding='utf-8')

    print(f'Post-deploy smoke report: {report_path}')
    if ok_all:
        print('All smoke checks passed.')
        return 0

    print('Smoke checks failed. Inspect report for details.')
    return 1


if __name__ == '__main__':
    raise SystemExit(main())
