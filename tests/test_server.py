"""Configuration and HTTP contract tests, with only standard-library dependencies."""
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
import tempfile
from threading import Thread
import unittest
from urllib.error import HTTPError
from urllib.request import urlopen

from serve import AtlasHandler, ROOT, read_config


class ConfigTests(unittest.TestCase):
    def test_default_config(self):
        config = read_config(ROOT / "config.toml")
        self.assertEqual(config["host"], "127.0.0.1")
        self.assertTrue((config["directory"] / "index.html").is_file())

    def test_rejects_bad_config(self):
        for config in ('host="0.0.0.0"', 'port=80', 'port=true', 'directory="/etc"'):
            with self.subTest(config=config), tempfile.NamedTemporaryFile(suffix=".toml", mode="w") as f:
                f.write("[server]\n" + config)
                f.flush()
                with self.assertRaises(ValueError):
                    read_config(Path(f.name))


class HTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), partial(AtlasHandler, directory=str(ROOT / "dist")))
        cls.thread = Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def test_index_and_module_types(self):
        with urlopen(self.base + "/") as response:
            self.assertEqual(response.status, 200)
            self.assertIn(b"Atlas de Cr", response.read())
            self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")
        with urlopen(self.base + "/app.js") as response:
            self.assertIn("javascript", response.headers["Content-Type"])

    def test_no_project_files_or_directory_listing(self):
        for path in ("/../config.toml", "/%2e%2e/serve.py", "/assets/"):
            with self.subTest(path=path), self.assertRaises(HTTPError) as caught:
                urlopen(self.base + path)
            self.assertIn(caught.exception.code, (403, 404))


if __name__ == "__main__":
    unittest.main()
