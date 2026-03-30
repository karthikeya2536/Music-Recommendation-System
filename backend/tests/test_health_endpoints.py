import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.main import app


class HealthEndpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_returns_ok(self):
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'ok')
        self.assertIn('version', data)
        self.assertIn('timestamp', data)

    def test_ready_returns_200_when_dependencies_ready(self):
        with patch('backend.main.get_db', return_value=object()), patch(
            'backend.main.get_recommendation_artifact_status',
            return_value={
                'embeddings_exists': True,
                'dataset_exists': True,
                'service_initialized': False,
                'service_loaded': False,
            },
        ):
            response = self.client.get('/ready')

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body['status'], 'ready')
        self.assertTrue(body['checks']['database'])
        self.assertTrue(body['checks']['recommendation_artifacts'])

    def test_ready_returns_503_when_database_unavailable(self):
        with patch('backend.main.get_db', return_value=None), patch(
            'backend.main.get_recommendation_artifact_status',
            return_value={
                'embeddings_exists': True,
                'dataset_exists': True,
                'service_initialized': False,
                'service_loaded': False,
            },
        ):
            response = self.client.get('/ready')

        self.assertEqual(response.status_code, 503)
        body = response.json()
        self.assertEqual(body['status'], 'degraded')
        self.assertFalse(body['checks']['database'])


if __name__ == '__main__':
    unittest.main()
