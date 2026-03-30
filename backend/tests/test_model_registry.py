import json
import tempfile
import unittest
from pathlib import Path

from backend.services import model_registry


class ModelRegistryTests(unittest.TestCase):
    def test_registry_status_valid_when_active_artifacts_exist(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            rec_dir = root / 'recommendation_engine'
            rec_dir.mkdir(parents=True, exist_ok=True)
            (root / 'backend').mkdir(parents=True, exist_ok=True)

            embeddings = rec_dir / 'emb.pt'
            dataset = root / 'backend' / 'dataset.json'
            embeddings.write_bytes(b'not-used-in-this-test')
            dataset.write_text('[]', encoding='utf-8')

            registry_path = rec_dir / 'model_registry.json'
            registry_path.write_text(
                json.dumps(
                    {
                        'active_model': 'm1',
                        'models': {
                            'm1': {
                                'artifacts': {
                                    'embeddings': str(embeddings),
                                    'dataset': str(dataset),
                                }
                            }
                        },
                    }
                ),
                encoding='utf-8',
            )

            original = model_registry.settings.MODEL_REGISTRY_PATH
            model_registry.settings.MODEL_REGISTRY_PATH = str(registry_path)
            try:
                status = model_registry.get_registry_status()
            finally:
                model_registry.settings.MODEL_REGISTRY_PATH = original

            self.assertTrue(status['exists'])
            self.assertEqual(status['active_model'], 'm1')
            self.assertTrue(status['valid'])


if __name__ == '__main__':
    unittest.main()
