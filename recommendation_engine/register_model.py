#!/usr/bin/env python3
"""Register or update recommendation model entries in model_registry.json."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Register recommendation model artifacts')
    parser.add_argument('--registry', default='recommendation_engine/model_registry.json')
    parser.add_argument('--model-id', required=True)
    parser.add_argument('--embeddings', default='recommendation_engine/final_embeddings.pt')
    parser.add_argument('--hnn-model', default='recommendation_engine/hnn_model.pth')
    parser.add_argument('--mf-model', default='recommendation_engine/mf_model.pth')
    parser.add_argument('--dataset', default='backend/dataset.json')
    parser.add_argument('--metrics-json', default='{}')
    parser.add_argument('--notes', default='')
    parser.add_argument('--set-active', action='store_true')
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    path = Path(args.registry)
    path.parent.mkdir(parents=True, exist_ok=True)

    if path.exists():
        data = json.loads(path.read_text(encoding='utf-8'))
    else:
        data = {'active_model': None, 'models': {}}

    models = data.setdefault('models', {})

    try:
        metrics = json.loads(args.metrics_json)
    except json.JSONDecodeError as exc:
        print(f'Invalid metrics JSON: {exc}')
        return 1

    models[args.model_id] = {
        'created_at': datetime.now(timezone.utc).isoformat(),
        'notes': args.notes,
        'artifacts': {
            'embeddings': args.embeddings,
            'hnn_model': args.hnn_model,
            'mf_model': args.mf_model,
            'dataset': args.dataset,
        },
        'metrics': metrics,
    }

    if args.set_active or not data.get('active_model'):
        data['active_model'] = args.model_id

    path.write_text(json.dumps(data, indent=2), encoding='utf-8')
    print(f'Registry updated at {path} with model: {args.model_id}')
    print(f"Active model: {data.get('active_model')}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
