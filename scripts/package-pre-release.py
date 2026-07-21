from __future__ import annotations

import argparse
import stat
import zipfile
from pathlib import Path

FIXED_TIME = (2026, 7, 21, 0, 0, 0)
EXCLUDED_PARTS = {'.git', 'node_modules', 'dist', '.astro', 'coverage', '.runtime', '__pycache__'}
EXCLUDED_SUFFIXES = {'.pyc', '.pyo', '.swp', '.tmp'}
PROHIBITED_NAMES = {'.env', 'google-service-account.json'}
DOC_ROOTS = {
    'docs', 'reports', 'schemas', 'sbom', 'licenses', 'config/release',
    'README.md', 'CHANGELOG.md', 'SECURITY.md', 'AGENTS.md',
}


def include(path: Path, mode: str) -> bool:
    rel = path.as_posix()
    if any(part in EXCLUDED_PARTS for part in path.parts):
        return False
    if path.suffix in EXCLUDED_SUFFIXES:
        return False
    if path.name != '.env.example' and (path.name in PROHIBITED_NAMES or path.name.startswith('.env.')):
        return False
    if mode == 'source':
        return True
    return any(rel == root or rel.startswith(root + '/') for root in DOC_ROOTS)


def package(root: Path, output: Path, mode: str, top_level: str) -> tuple[int, int]:
    files = []
    for path in root.rglob('*'):
        if path.is_symlink():
            raise RuntimeError(f'SUBSOLO_RELEASE_SYMLINK: {path.relative_to(root)}')
        if path.is_file() and include(path.relative_to(root), mode):
            files.append(path)
    files.sort(key=lambda p: p.relative_to(root).as_posix())
    output.parent.mkdir(parents=True, exist_ok=True)
    total = 0
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9, strict_timestamps=True) as archive:
        for path in files:
            rel = path.relative_to(root).as_posix()
            data = path.read_bytes()
            total += len(data)
            info = zipfile.ZipInfo(f'{top_level}/{rel}', FIXED_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (stat.S_IFREG | 0o644) << 16
            info.create_system = 3
            archive.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    return len(files), total


parser = argparse.ArgumentParser()
parser.add_argument('--root', default='.')
parser.add_argument('--output', required=True)
parser.add_argument('--mode', choices=['source', 'documentation'], required=True)
parser.add_argument('--top-level', required=True)
args = parser.parse_args()
count, total = package(Path(args.root).resolve(), Path(args.output).resolve(), args.mode, args.top_level)
print(f'ZIP {args.mode} gerado: {count} arquivos, {total} bytes de entrada.')
