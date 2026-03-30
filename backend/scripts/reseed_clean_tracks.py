#!/usr/bin/env python3
"""Replace Firestore tracks with clean streamable records from backend/dataset.json."""

from __future__ import annotations

import json
from pathlib import Path

from backend.db.firestore import get_db


BLOCKED_DOMAINS = ("pixabay.com", "soundhelix.com")


def is_streamable(url: str) -> bool:
    lowered = (url or "").strip().lower()
    if not lowered:
        return False
    return not any(domain in lowered for domain in BLOCKED_DOMAINS)


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    dataset_path = root / "backend" / "dataset.json"

    if not dataset_path.exists():
        print(f"Dataset not found: {dataset_path}")
        return 1

    db = get_db()
    if not db:
        print("Firestore unavailable")
        return 1

    tracks = json.loads(dataset_path.read_text(encoding="utf-8"))
    if not isinstance(tracks, list):
        print("Dataset must be a list")
        return 1

    cleaned = []
    seen = set()
    skipped = 0
    for track in tracks:
        if not isinstance(track, dict):
            skipped += 1
            continue
        track_id = str(track.get("id", "")).strip()
        audio_url = str(track.get("audioUrl", "")).strip()
        if not track_id or track_id in seen or not is_streamable(audio_url):
            skipped += 1
            continue
        seen.add(track_id)
        cleaned.append(track)

    print(f"Prepared {len(cleaned)} clean tracks (skipped {skipped}).")

    collection = db.collection("tracks")

    # Delete existing docs in batches.
    existing_refs = [doc.reference for doc in collection.stream()]
    print(f"Deleting existing docs: {len(existing_refs)}")
    for i in range(0, len(existing_refs), 400):
        batch = db.batch()
        for ref in existing_refs[i : i + 400]:
            batch.delete(ref)
        batch.commit()

    # Insert cleaned docs in batches.
    print("Inserting cleaned docs...")
    for i in range(0, len(cleaned), 400):
        batch = db.batch()
        for track in cleaned[i : i + 400]:
            ref = collection.document(track["id"])
            batch.set(ref, track)
        batch.commit()

    print("Reseed complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
