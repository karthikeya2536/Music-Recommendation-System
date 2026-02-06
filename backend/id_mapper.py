import json
import os

MAPPING_FILE = os.path.join(os.path.dirname(__file__), "user_mapping.json")

def load_mapping():
    if os.path.exists(MAPPING_FILE):
        with open(MAPPING_FILE, "r") as f:
            return json.load(f)
    return {"uid_to_idx": {}, "idx_to_uid": {}, "next_idx": 0}

def save_mapping(mapping):
    with open(MAPPING_FILE, "w") as f:
        json.dump(mapping, f, indent=2)

def get_user_idx(uid, create=True):
    mapping = load_mapping()
    uid_to_idx = mapping["uid_to_idx"]

    if uid in uid_to_idx:
        return uid_to_idx[uid]
    
    if create:
        idx = mapping["next_idx"]
        # TODO: Check if this idx exceeds model capacity?
        # For now, we assume we can resize or reserved space.
        # But if we started model with NUM_USERS from dataset, we simply append.
        mapping["uid_to_idx"][uid] = idx
        mapping["idx_to_uid"][str(idx)] = uid
        mapping["next_idx"] += 1
        save_mapping(mapping)
        return idx
    
    return None
