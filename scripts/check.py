"""Check skills, links, and plugin metadata; no dependencies."""
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import unquote

root = Path(__file__).resolve().parents[1]
errors = []

# Keys accepted by both the Agent Skills specification and the Codex validator.
ALLOWED_KEYS = {"name", "description", "license", "allowed-tools", "metadata"}
NAME = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
BODY_WORD_BUDGET = 600


def read_json(path):
    return json.loads((root / path).read_text())


def frontmatter(text):
    match = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not match:
        return None, text
    fields = dict(re.findall(r"^([A-Za-z0-9_-]+):[ \t]*(.*)$", match.group(1), re.M))
    return fields, match.group(2)


# Skills
root_license = (root / "LICENSE").read_bytes()
for skill in sorted(p for p in (root / "skills").iterdir() if p.is_dir()):
    where = f"skills/{skill.name}"
    skill_md = skill / "SKILL.md"
    if not skill_md.exists():
        errors.append(f"{where}: missing SKILL.md")
        continue
    fields, body = frontmatter(skill_md.read_text())
    if fields is None:
        errors.append(f"{where}/SKILL.md: missing YAML frontmatter")
        continue
    for key in sorted(set(fields) - ALLOWED_KEYS):
        errors.append(f"{where}/SKILL.md: frontmatter key not portable: {key}")
    name, description = fields.get("name", ""), fields.get("description", "")
    if name != skill.name:
        errors.append(f"{where}/SKILL.md: name {name!r} must match the folder name")
    if not NAME.match(name) or len(name) > 64:
        errors.append(f"{where}/SKILL.md: name must be lowercase words joined by single hyphens, at most 64 characters")
    if not description or len(description) > 1024:
        errors.append(f"{where}/SKILL.md: description must be 1 to 1024 characters")
    if "<" in description or ">" in description:
        errors.append(f"{where}/SKILL.md: description must not contain angle brackets")
    words = len(re.sub(r"```.*?```", "", body, flags=re.S).split())
    if words > BODY_WORD_BUDGET:
        errors.append(f"{where}/SKILL.md: body has {words} words; move detail to references (budget {BODY_WORD_BUDGET})")

    linked = {unquote(t.split("#")[0]) for t in re.findall(r"\]\(([^)]+)\)", body)}
    for ref in sorted((skill / "references").glob("*.md")):
        if ref.name != "sources.md" and f"references/{ref.name}" not in linked:
            errors.append(f"{where}/SKILL.md: references/{ref.name} is never linked")

    openai_yaml = skill / "agents" / "openai.yaml"
    if not openai_yaml.exists():
        errors.append(f"{where}: missing agents/openai.yaml")
    else:
        interface = dict(re.findall(r'^\s+(\w+):\s*"(.*)"\s*$', openai_yaml.read_text(), re.M))
        for key in ("display_name", "short_description", "default_prompt"):
            if not interface.get(key):
                errors.append(f"{where}/agents/openai.yaml: missing quoted {key}")
        if not 25 <= len(interface.get("short_description", "")) <= 64:
            errors.append(f"{where}/agents/openai.yaml: short_description must be 25 to 64 characters")
        if f"${skill.name}" not in interface.get("default_prompt", ""):
            errors.append(f"{where}/agents/openai.yaml: default_prompt must mention ${skill.name}")

    license_file = skill / "LICENSE"
    if not license_file.exists() or license_file.read_bytes() != root_license:
        errors.append(f"{where}/LICENSE must be a copy of the root LICENSE")

# Links
catalog_urls = set(re.findall(r"https?://[^\s)]+", (root / "docs/references.md").read_text()))
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

# Plugin metadata
claude, codex = read_json(".claude-plugin/plugin.json"), read_json(".codex-plugin/plugin.json")
for key in ("name", "version", "license", "description"):
    if claude.get(key) != codex.get(key):
        errors.append(f"Plugin manifests disagree on {key}")
claude_market = read_json(".claude-plugin/marketplace.json")
codex_market = read_json(".agents/plugins/marketplace.json")
claude_entries = {p["name"]: p for p in claude_market["plugins"]}
if claude["name"] not in claude_entries:
    errors.append("Claude marketplace does not list the plugin by its manifest name")
elif claude_entries[claude["name"]].get("description") != claude["description"]:
    errors.append("Claude marketplace description differs from the plugin manifest")
if claude["name"] not in {p["name"] for p in codex_market["plugins"]}:
    errors.append("Codex marketplace does not list the plugin by its manifest name")
for old, new in claude_market.get("renames", {}).items():
    if new not in claude_entries:
        errors.append(f"Marketplace rename {old} -> {new} points to an unlisted plugin")


# Installed copies use the version to detect updates, so shipped changes need a bump.
def git(*args):
    result = subprocess.run(["git", "-C", str(root), *args], capture_output=True, text=True)
    return result.stdout.strip() if result.returncode == 0 else None


base = git("merge-base", "HEAD", "origin/main")
if base is None:
    print("Skipped the version check: origin/main is not available.")
else:
    shipped = git("diff", "--name-only", base, "--", "skills")
    previous = git("show", f"{base}:.claude-plugin/plugin.json")
    if shipped and previous and json.loads(previous).get("version") == claude.get("version"):
        errors.append(f"Skills changed since origin/main; bump the plugin version from {claude.get('version')}")

if errors:
    raise SystemExit("\n".join(errors))
print("Skills, links, and plugin metadata agree.")
