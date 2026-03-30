import unittest

from fastapi.testclient import TestClient

from backend.main import app


class MonitoringSmokeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_ready_metrics_smoke(self):
        health = self.client.get('/health')
        self.assertEqual(health.status_code, 200)

        ready = self.client.get('/ready')
        self.assertIn(ready.status_code, (200, 503))

        unauthorized = self.client.get('/api/v1/library/user_1')
        self.assertEqual(unauthorized.status_code, 401)

        metrics = self.client.get('/metrics')
        self.assertEqual(metrics.status_code, 200)

        body = metrics.json()
        self.assertEqual(body['status'], 'ok')
        self.assertIn('counters', body)
        self.assertIn('latency_ms', body)
        self.assertGreaterEqual(body['counters']['total_requests'], 4)
        self.assertIn('/health', body['counters']['path_counts'])
        self.assertIn('auth_failures', body['counters'])
        self.assertIn('catalog_cache', body['counters'])
        self.assertGreaterEqual(body['counters']['auth_failures'].get('missing_token', 0), 1)

        if ready.status_code == 200:
            self.assertIn('recommendation', ready.json().get('details', {}))
            self.assertIn('registry', ready.json()['details']['recommendation'])

        prom = self.client.get('/metrics/prometheus')
        self.assertEqual(prom.status_code, 200)
        self.assertIn('sonicstream_http_requests_total', prom.text)
        self.assertIn('sonicstream_auth_failures_total', prom.text)
        self.assertIn('sonicstream_catalog_cache_hits', prom.text)


if __name__ == '__main__':
    unittest.main()
