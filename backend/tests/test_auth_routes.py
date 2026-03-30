import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.core.auth import get_current_user
from backend.main import app


class FakeDocSnapshot:
    def __init__(self, data=None, exists=False):
        self._data = data or {}
        self.exists = exists

    def to_dict(self):
        return self._data


class FakeDocRef:
    def __init__(self, doc_id, store):
        self.doc_id = doc_id
        self.store = store

    def set(self, payload, merge=False):
        current = self.store.setdefault(self.doc_id, {})
        if merge:
            current.update(payload)
        else:
            self.store[self.doc_id] = dict(payload)

    def update(self, payload):
        current = self.store.setdefault(self.doc_id, {})
        current.update(payload)

    def get(self):
        if self.doc_id in self.store:
            return FakeDocSnapshot(self.store[self.doc_id], exists=True)
        return FakeDocSnapshot({}, exists=False)

    def collection(self, name):
        sub_key = f"{self.doc_id}:{name}"
        sub_store = self.store.setdefault(sub_key, {})
        return FakeCollection(sub_store)


class FakeCollection:
    def __init__(self, store):
        self.store = store

    def document(self, doc_id):
        return FakeDocRef(doc_id, self.store)

    def add(self, payload):
        key = f"auto_{len(self.store)+1}"
        self.store[key] = payload
        return key

    def stream(self):
        return [FakeDocSnapshot(v, exists=True) for v in self.store.values()]


class FakeDB:
    def __init__(self):
        self.collections = {}

    def collection(self, name):
        store = self.collections.setdefault(name, {})
        return FakeCollection(store)


class AuthRouteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides = {}

    def test_library_requires_auth(self):
        response = self.client.get('/api/v1/library/user_1')
        self.assertEqual(response.status_code, 401)

    def test_library_forbidden_for_other_user(self):
        app.dependency_overrides[get_current_user] = lambda: {'uid': 'user_A'}
        response = self.client.get('/api/v1/library/user_B')
        self.assertEqual(response.status_code, 403)

    def test_like_uses_uid_from_token(self):
        fake_db = FakeDB()
        app.dependency_overrides[get_current_user] = lambda: {'uid': 'secure_uid'}

        with patch('backend.api.v1.endpoints.library.get_db', return_value=fake_db):
            response = self.client.post(
                '/api/v1/library/like',
                json={'song_id': 's_42', 'action': 'add'},
            )

        self.assertEqual(response.status_code, 200)
        users_store = fake_db.collections.get('users', {})
        self.assertIn('secure_uid', users_store)

    def test_interaction_uses_uid_from_token(self):
        fake_db = FakeDB()
        app.dependency_overrides[get_current_user] = lambda: {'uid': 'listener_7'}

        with patch('backend.api.v1.endpoints.interactions.get_db', return_value=fake_db):
            response = self.client.post(
                '/api/v1/interactions/track',
                json={
                    'song_id': 's_10',
                    'duration_listened': 45,
                    'total_duration': 180,
                    'percent_listened': 0.25,
                },
            )

        self.assertEqual(response.status_code, 200)
        interactions = fake_db.collections.get('interactions', {})
        self.assertEqual(len(interactions), 1)
        payload = list(interactions.values())[0]
        self.assertEqual(payload['user_id'], 'listener_7')

    def test_interaction_rejects_unknown_field(self):
        app.dependency_overrides[get_current_user] = lambda: {'uid': 'listener_8'}

        with patch('backend.api.v1.endpoints.interactions.get_db', return_value=FakeDB()):
            response = self.client.post(
                '/api/v1/interactions/track',
                json={'song_id': 's_10', 'unexpected': 'value'},
            )

        self.assertEqual(response.status_code, 422)


if __name__ == '__main__':
    unittest.main()

