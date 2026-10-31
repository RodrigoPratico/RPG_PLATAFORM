#!/usr/bin/env python3
"""Serve the atlas on loopback with validated configuration and JSON logs.

Persistence belongs to IndexedDB in the browser; this server never writes campaign
data to disk. Use the application's complete JSON backup for portable copies.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import logging
from pathlib import Path
import sys
from typing import Any

if sys.version_info < (3, 11):
    sys.exit("Caldris requer Python 3.11 ou superior.")

import tomllib

ROOT = Path(__file__).resolve().parent


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        return json.dumps({"time": datetime.now(timezone.utc).isoformat(),
                           "level": record.levelname.lower(),
                           "event": getattr(record, "event", "server"),
                           "message": record.getMessage()}, ensure_ascii=False)


logger = logging.getLogger("caldris")
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)
logger.setLevel(logging.INFO)


def read_config(path: Path) -> dict[str, Any]:
    """Read TOML and reject non-loopback hosts, bad ports and external roots."""
    with path.open("rb") as stream:
        document = tomllib.load(stream)
    config = document.get("server", {})
    if not isinstance(config, dict):
        raise ValueError("A configuração [server] deve ser uma tabela TOML.")
    host, port = config.get("host", "127.0.0.1"), config.get("port", 8080)
    if host not in ("127.0.0.1", "localhost"):
        raise ValueError("Use host 127.0.0.1 ou localhost; o servidor é pessoal e local.")
    if isinstance(port, bool) or not isinstance(port, int) or not 1024 <= port <= 65535:
        raise ValueError("A porta deve ser um inteiro entre 1024 e 65535.")
    directory = (ROOT / config.get("directory", "dist")).resolve()
    if not directory.is_relative_to(ROOT) or not (directory / "index.html").is_file():
        raise ValueError("O diretório deve pertencer ao projeto e conter index.html.")
    if any(path.is_symlink() for path in directory.rglob("*")):
        raise ValueError("Links simbólicos não são permitidos na pasta pública.")
    return {"host": host, "port": port, "directory": directory}


class AtlasHandler(SimpleHTTPRequestHandler):
    """Static file handler with a narrow document root and safe response headers."""
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript",
                      ".webp": "image/webp", ".svg": "image/svg+xml"}

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; "
                         "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
                         "connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
        super().end_headers()

    def list_directory(self, path: str) -> None:
        self.send_error(403, "Listagem de diretórios desativada")
        return None

    def log_message(self, format: str, *args: Any) -> None:
        logger.info(format, *args, extra={"event": "http_request"})


def main() -> int:
    parser = argparse.ArgumentParser(description="Caldris · servidor pessoal do atlas de RPG")
    parser.add_argument("--config", type=Path, default=ROOT / "config.toml")
    parser.add_argument("--port", type=int, help="Substitui a porta do arquivo TOML")
    args = parser.parse_args()
    server: ThreadingHTTPServer | None = None
    try:
        config = read_config(args.config)
        if not (ROOT / "dist" / "caldris-linux.zip").exists():
            from scripts.package import build_package
            build_package()
        port = args.port if args.port is not None else config["port"]
        if not 1024 <= port <= 65535:
            raise ValueError("A porta deve estar entre 1024 e 65535.")
        server = ThreadingHTTPServer((config["host"], port), partial(AtlasHandler, directory=str(config["directory"])))
        logger.info("Atlas disponível em http://%s:%s · Ctrl+C para encerrar", config["host"], port,
                    extra={"event": "server_ready"})
        server.serve_forever(poll_interval=0.3)
    except KeyboardInterrupt:
        logger.info("Servidor encerrado", extra={"event": "server_stopped"})
    except (OSError, ValueError, TypeError, tomllib.TOMLDecodeError) as error:
        logger.error("%s", error, extra={"event": "startup_failed"})
        return 1
    finally:
        if server is not None:
            server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
