"""Build a reproducible, self-contained Linux download from the working source."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]


def build_package() -> Path:
    """Package the same source set as the Vercel build, using Python's zipfile."""
    target = ROOT / "dist" / "caldris-linux.zip"
    with ZipFile(target, "w", ZIP_DEFLATED) as archive:
        files = [ROOT / name for name in ("README.md", "AGENTS.md", "Makefile", "serve.py", "config.toml", "assets.config.json", "package.json", "CHANGELOG.md", "vercel.json")]
        for directory in ("dist", "tests", "scripts", "docs"):
            files += sorted((ROOT / directory).rglob("*"))
        for path in files:
            if not path.is_file() or path == target or "__pycache__" in path.parts or path.suffix == ".pyc" or path.name.endswith(".webp.tmp"):
                continue
            if path.is_symlink():
                raise ValueError(f"Link simbólico não permitido: {path.name}")
            if "Base de cards" in path.parts:
                continue
            if path.suffix.lower() in (".png", ".jpg", ".jpeg") and path.with_suffix(".webp").is_file():
                continue
            archive.write(path, Path("caldris-atlas") / path.relative_to(ROOT))
    return target


if __name__ == "__main__":
    target = build_package()
    print(f"Pacote criado: {target.name} ({target.stat().st_size:,} bytes)")
