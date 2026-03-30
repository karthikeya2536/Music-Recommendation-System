import unittest

from backend.services.catalog import CatalogService


class CatalogCacheTests(unittest.TestCase):
    def test_trending_uses_cache_after_first_call(self):
        svc = CatalogService()
        calls = {'count': 0}

        def fake_query(limit: int):
            calls['count'] += 1
            return [{'id': '1', 'title': 'A'}]

        svc._query_trending_tracks = fake_query  # type: ignore[attr-defined]

        first = svc.get_trending_tracks(20)
        second = svc.get_trending_tracks(20)

        self.assertEqual(first, second)
        self.assertEqual(calls['count'], 1)

        stats = svc.get_cache_stats()
        self.assertGreaterEqual(stats['hits'], 1)
        self.assertGreaterEqual(stats['misses'], 1)

    def test_cache_entry_expires(self):
        svc = CatalogService()
        calls = {'count': 0}

        now = {'t': 1000.0}

        def fake_now():
            return now['t']

        def fake_query(limit: int):
            calls['count'] += 1
            return [{'id': '2', 'title': 'B'}]

        svc._now = fake_now  # type: ignore[method-assign]
        svc._query_new_releases = fake_query  # type: ignore[attr-defined]

        svc.get_new_releases(15)
        now['t'] += 25.0
        svc.get_new_releases(15)

        self.assertEqual(calls['count'], 2)


if __name__ == '__main__':
    unittest.main()
