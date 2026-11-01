"""Optional developer tool: preserve original paths and generate sibling WebPs."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--replace", action="store_true", help="Regenerar derivadas já existentes")
    args = parser.parse_args()
    try:
        from PIL import Image, ImageOps
    except ImportError:
        parser.exit(2, "Instale Pillow no ambiente de desenvolvimento para otimizar imagens.\n")
    converted = 0
    try:
        for directory in (ROOT / "dist/assets/Cards", ROOT / "dist/assets/Mapa"):
            for source in sorted(directory.rglob("*")):
                if "Base de cards" in source.parts or source.suffix.lower() not in (".png", ".jpg", ".jpeg"):
                    continue
                if source.is_symlink():
                    raise ValueError(f"Link simbólico não permitido: {source}")
                target = source.with_suffix(".webp")
                if target.exists() and not args.replace:
                    continue
                with Image.open(source) as image:
                    if image.width * image.height > 60_000_000:
                        raise ValueError(f"Imagem excede 60 MP: {source}")
                    output = ImageOps.exif_transpose(image)
                    output.thumbnail((2400, 2400))
                    temp = target.with_suffix(".webp.tmp")
                    try:
                        output.save(temp, format="WEBP", quality=90, method=6)
                        temp.replace(target)
                    finally:
                        temp.unlink(missing_ok=True)
                converted += 1
    except (OSError, ValueError) as error:
        print(json.dumps({"event": "asset_optimization_failed", "message": str(error)}, ensure_ascii=False))
        return 1
    print(json.dumps({"event": "assets_optimized", "created": converted}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
