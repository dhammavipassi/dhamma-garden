#!/usr/bin/env python3
"""
sync-from-vault.py
Syncs published notes from Obsidian vault to Quartz content directory.

Usage:
  python3 sync-from-vault.py          # sync and push
  python3 sync-from-vault.py --dry-run # preview only, no changes
  python3 sync-from-vault.py --no-push # sync but don't push

Workflow:
  1. Scan vault for notes with `publish: true` in frontmatter
  2. Copy them to Quartz content/ preserving vault relative paths
  3. Resolve and copy image dependencies (![[image.png]])
  4. Resolve and copy transclusion dependencies (![[note]])
  5. Clean up stale files from content/ (except index.md)
  6. Git commit and push
"""

import argparse
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

# ── Configuration ──────────────────────────────────────────────
VAULT_ROOT = Path("/Users/dhammavipassi/Obsidian")
QUARTZ_ROOT = Path("/Users/dhammavipassi/Github_projects/dhamma-garden")
CONTENT_DIR = QUARTZ_ROOT / "content"
PRESERVE_FILES = {"index.md"}  # Don't touch these in content/
# 站点结构页：不在 vault 里，直接在 repo 里维护，同步时不清理
PRESERVE_DIRS = {"佛法修学", "AI实践", "关于"}

# ── Patterns ───────────────────────────────────────────────────
PUBLISH_PATTERN = re.compile(r'^publish:\s*true\s*$', re.MULTILINE)
IMAGE_EXTS = {'.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.tiff', '.tif'}
IMAGE_EMBED_PATTERN = re.compile(
    r'!\[\[([^\]]+\.(?:png|jpg|jpeg|gif|svg|webp|bmp|tiff?))\]\]',
    re.IGNORECASE
)
TRANSCLUSION_PATTERN = re.compile(r'!\[\[([^\]]+)\]\]')

# ── Vault file index (built once for fast lookup) ──────────────
vault_file_index: dict[str, Path] = {}  # filename -> absolute path
vault_md_index: dict[str, Path] = {}    # note name (without .md) -> absolute path


def build_vault_index():
    """Build a filename → path index for the entire vault."""
    global vault_file_index, vault_md_index
    for root, dirs, files in os.walk(VAULT_ROOT):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '.obsidian']
        for f in files:
            fpath = Path(root) / f
            vault_file_index[f] = fpath
            if f.endswith('.md'):
                vault_md_index[f[:-3]] = fpath
    print(f"  Vault index: {len(vault_file_index)} files, {len(vault_md_index)} notes")


def parse_frontmatter(filepath: Path) -> tuple[bool, str]:
    """Check if a file has publish: true in frontmatter. Returns (is_published, content)."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return False, ""

    if not content.startswith('---'):
        return False, content

    end = content.find('\n---', 3)
    if end == -1:
        return False, content

    frontmatter = content[3:end]
    return bool(PUBLISH_PATTERN.search(frontmatter)), content


def find_publishable_notes() -> list[tuple[Path, str]]:
    """Find all notes with publish: true in the vault."""
    publishable = []
    for root, dirs, files in os.walk(VAULT_ROOT):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '.obsidian']
        for f in files:
            if f.endswith('.md'):
                fpath = Path(root) / f
                is_pub, content = parse_frontmatter(fpath)
                if is_pub:
                    rel = fpath.relative_to(VAULT_ROOT)
                    publishable.append((rel, content))
    return publishable


def find_image_in_vault(image_ref: str) -> Path | None:
    """Find an image file in the vault by name or path."""
    # Strip alt text / dimensions: ![[image.png|alt 100x200]] → image.png
    image_ref = image_ref.split('|')[0].strip()

    # Try as path relative to vault root
    if '/' in image_ref:
        candidate = VAULT_ROOT / image_ref
        if candidate.exists():
            return candidate

    # Try by filename in index
    filename = Path(image_ref).name
    if filename in vault_file_index:
        return vault_file_index[filename]

    return None


def find_note_in_vault(note_ref: str) -> Path | None:
    """Find a note in the vault by name, path, or header/block reference."""
    # Strip header/block reference and alias: [[folder/Note#Header|alias]] → folder/Note
    note_ref = note_ref.split('#')[0].split('|')[0].strip()
    if not note_ref:
        return None

    # Try as path relative to vault root
    if '/' in note_ref:
        candidate = VAULT_ROOT / (note_ref + '.md')
        if candidate.exists():
            return candidate

    # Try by note name in index
    if note_ref in vault_md_index:
        return vault_md_index[note_ref]

    return None


def extract_image_deps(content: str) -> set[str]:
    """Extract all ![[image.png]] references from content."""
    deps = set()
    for m in IMAGE_EMBED_PATTERN.finditer(content):
        deps.add(m.group(1).split('|')[0].strip())
    return deps


def extract_transclusion_deps(content: str) -> set[str]:
    """Extract all ![[note]] transclusion references (excluding images)."""
    deps = set()
    for m in TRANSCLUSION_PATTERN.finditer(content):
        ref = m.group(1).split('|')[0].strip()
        # Skip images (handled separately)
        ext = Path(ref).suffix.lower()
        if ext not in IMAGE_EXTS:
            deps.add(ref)
    return deps


def clean_content_dir():
    """Remove all files from content/ except preserved files and dirs."""
    print("Cleaning content/ directory...")
    removed = 0
    for item in CONTENT_DIR.iterdir():
        if item.name in PRESERVE_FILES:
            continue
        if item.is_dir() and item.name in PRESERVE_DIRS:
            continue
        if item.is_dir():
            shutil.rmtree(item)
            removed += 1
        else:
            item.unlink()
            removed += 1
    if removed:
        print(f"  Removed {removed} stale items")


def sync(dry_run: bool = False, no_push: bool = False):
    """Main sync function."""
    print("=== Vault → Quartz Sync ===")
    print(f"Vault:  {VAULT_ROOT}")
    print(f"Quartz: {QUARTZ_ROOT}")

    print("\nBuilding vault index...")
    build_vault_index()

    print("\nScanning for publishable notes...")
    publishable = find_publishable_notes()

    if not publishable:
        print("No notes with publish: true found.")
        print("Add `publish: true` to the frontmatter of notes you want to publish.")
        if not dry_run:
            clean_content_dir()
        return

    print(f"Found {len(publishable)} publishable note(s):")
    for rel, _ in publishable:
        print(f"  - {rel}")

    if dry_run:
        print("\n[dry-run] Would copy these notes + dependencies to content/")
        # Preview dependencies
        for rel, content in publishable:
            images = extract_image_deps(content)
            transclusions = extract_transclusion_deps(content)
            if images:
                print(f"  Images for {rel}: {images}")
            if transclusions:
                print(f"  Transclusions for {rel}: {transclusions}")
        return

    # Clean content directory
    clean_content_dir()

    # Copy notes and resolve dependencies (BFS for transclusion chains)
    copied: set[str] = set()
    queue: list[tuple[Path, str]] = list(publishable)
    processed: set[str] = set()

    while queue:
        rel_path, content = queue.pop(0)
        str_path = str(rel_path)

        if str_path in processed:
            continue
        processed.add(str_path)

        # Copy the note
        src = VAULT_ROOT / rel_path
        dest = CONTENT_DIR / rel_path
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        copied.add(str_path)
        print(f"  ✓ {rel_path}")

        # Copy image dependencies
        for img_ref in extract_image_deps(content):
            img_path = find_image_in_vault(img_ref)
            if img_path:
                img_rel = img_path.relative_to(VAULT_ROOT)
                img_str = str(img_rel)
                if img_str not in copied:
                    img_dest = CONTENT_DIR / img_rel
                    img_dest.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(img_path, img_dest)
                    copied.add(img_str)
                    print(f"    📎 {img_rel}")
            else:
                print(f"    ⚠ Image not found: {img_ref}")

        # Queue transclusion dependencies
        for trans_ref in extract_transclusion_deps(content):
            note_path = find_note_in_vault(trans_ref)
            if note_path:
                note_rel = note_path.relative_to(VAULT_ROOT)
                note_str = str(note_rel)
                if note_str not in processed:
                    _, trans_content = parse_frontmatter(note_path)
                    queue.append((note_rel, trans_content))
                    print(f"    ↪ {note_rel} (transclusion)")
            else:
                print(f"    ⚠ Transcluded note not found: {trans_ref}")

    print(f"\nTotal: {len(copied)} files copied to content/")

    # Git operations
    if no_push:
        print("\n[--no-push] Skipping git operations.")
        return

    print("\nCommitting and pushing...")
    os.chdir(QUARTZ_ROOT)

    subprocess.run(["git", "add", "-A"], check=True)

    # Check if there are changes
    result = subprocess.run(
        ["git", "diff", "--cached", "--quiet"],
        capture_output=True
    )
    if result.returncode == 0:
        print("No changes to commit.")
        return

    commit_msg = f"sync: {len(publishable)} notes from vault ({len(copied)} files total)"
    subprocess.run(["git", "commit", "-m", commit_msg], check=True)
    subprocess.run(["git", "push"], check=True)
    print(f"✓ Pushed: {commit_msg}")
    print("Cloudflare Pages will auto-deploy shortly.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync published notes from Obsidian vault to Quartz")
    parser.add_argument("--dry-run", action="store_true", help="Preview without making changes")
    parser.add_argument("--no-push", action="store_true", help="Sync but don't git push")
    args = parser.parse_args()

    sync(dry_run=args.dry_run, no_push=args.no_push)
