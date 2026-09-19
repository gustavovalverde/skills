"""Check local Markdown file links and host plugin identity; no dependencies."""
import json
import re
from pathlib import Path
from urllib.parse import unquote

root = Path(__file__).resolve().parents[1]
errors = []
catalog = (root / "docs/references.md").read_text()
catalog_urls = set(re.findall(r"https?://[^\s)]+", catalog))
manifests = [json.loads((root / host / "plugin.json").read_text())
             for host in (".codex-plugin", ".claude-plugin")]
for key in ("name", "version", "license"):
    if manifests[0].get(key) != manifests[1].get(key):
        errors.append(f"Plugin manifests disagree on {key}")
for file in root.rglob("*.md"):
    if ".git" in file.relative_to(root).parts:
        continue
    for target in re.findall(r"\]\(([^)]+)\)", file.read_text()):
        if target.startswith(("https://", "http://")) and target not in catalog_urls:
            errors.append(f"{file.relative_to(root)}: external reference absent from docs/references.md: {target}")
        if ":" in target or target.startswith("#"):
            continue
        path = unquote(target.split("#")[0])
        if path and not (file.parent / path).exists():
            errors.append(f"{file.relative_to(root)}: missing {target}")
if errors:
    raise SystemExit("\n".join(errors))
print("Local links, external-reference coverage, and plugin identities agree.")
