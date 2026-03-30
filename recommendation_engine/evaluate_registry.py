#!/usr/bin/env python3
"""Evaluate active recommendation registry entry for deploy gating."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Evaluate active recommendation registry entry')
    parser.add_argument('--registry', default='recommendation_engine/model_registry.json')
    parser.add_argument('--min-users', type=int, default=1)
    parser.add_argument('--min-songs', type=int, default=1)
    parser.add_argument('--strict-dataset-match', action='store_true')
    parser.add_argument('--report', default='dev_reports/recommendation_registry_eval.json')
    return parser.parse_args()


def resolve(path: str, root: Path) -> Path:
    p = Path(path)
    if p.is_absolute():
        return p
    return root / p


def fail(message: str, report_path: Path, payload: dict) -> int:
    payload['status'] = 'failed'
    payload['error'] = message
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(payload, indent=2), encoding='utf-8')
    print(message)
    return 1


def runtime_numpy_major() -> int | None:
    try:
        import numpy as np  # type: ignore
    except Exception:
        return None

    parts = str(getattr(np, '__version__', '')).split('.')
    if not parts:
        return None
    head = parts[0].strip()
    return int(head) if head.isdigit() else None


def main() -> int:
    args = parse_args()
    root = Path(__file__).resolve().parents[1]
    registry_path = resolve(args.registry, root)
    report_path = resolve(args.report, root)

    payload: dict = {
        'status': 'ok',
        'registry_path': str(registry_path),
        'active_model': None,
        'checks': {},
        'warnings': [],
    }

    if not registry_path.exists():
        return fail(f'Registry not found: {registry_path}', report_path, payload)

    registry = json.loads(registry_path.read_text(encoding='utf-8'))
    active_id = registry.get('active_model')
    payload['active_model'] = active_id

    if not active_id:
        return fail('Registry has no active_model', report_path, payload)

    record = registry.get('models', {}).get(active_id)
    if not isinstance(record, dict):
        return fail(f'Active model record missing: {active_id}', report_path, payload)

    artifacts = record.get('artifacts', {})
    embeddings_path = resolve(artifacts.get('embeddings', ''), root)
    dataset_path = resolve(artifacts.get('dataset', ''), root)

    payload['checks']['embeddings_exists'] = embeddings_path.exists()
    payload['checks']['dataset_exists'] = dataset_path.exists()

    if not embeddings_path.exists():
        return fail(f'Embeddings missing: {embeddings_path}', report_path, payload)
    if not dataset_path.exists():
        return fail(f'Dataset missing: {dataset_path}', report_path, payload)

    numpy_major = runtime_numpy_major()
    payload['checks']['runtime_numpy_major'] = numpy_major
    if numpy_major is not None and numpy_major >= 2:
        return fail(
            f'Runtime NumPy major version is {numpy_major}. Install numpy<2 before running registry evaluation.',
            report_path,
            payload,
        )

    import torch

    emb = torch.load(str(embeddings_path), map_location='cpu')
    user_emb = emb.get('user_embeddings')
    song_emb = emb.get('song_embeddings')

    if user_emb is None or song_emb is None:
        return fail('Embeddings file missing required tensors', report_path, payload)

    payload['checks']['user_embedding_rows'] = int(user_emb.shape[0])
    payload['checks']['song_embedding_rows'] = int(song_emb.shape[0])

    if user_emb.shape[0] < args.min_users:
        return fail(f'User embeddings below threshold: {user_emb.shape[0]} < {args.min_users}', report_path, payload)
    if song_emb.shape[0] < args.min_songs:
        return fail(f'Song embeddings below threshold: {song_emb.shape[0]} < {args.min_songs}', report_path, payload)

    dataset = json.loads(dataset_path.read_text(encoding='utf-8'))
    payload['checks']['dataset_rows'] = len(dataset) if isinstance(dataset, list) else 0

    if isinstance(dataset, list) and len(dataset) != int(song_emb.shape[0]):
        msg = f"Dataset/song embedding count mismatch: dataset={len(dataset)} embeddings={song_emb.shape[0]}"
        if args.strict_dataset_match:
            return fail(msg, report_path, payload)
        payload['warnings'].append(msg)

    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(payload, indent=2), encoding='utf-8')
    print(f"Registry evaluation passed. Report: {report_path}")
    if payload['warnings']:
        print('Warnings:')
        for warning in payload['warnings']:
            print(f'- {warning}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
