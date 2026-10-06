"""Measure how often Claude Code loads the expected skill for each review example.

Each example runs in a fresh `claude -p` session inside a temporary project that
holds this repository's skills. `--setting-sources project` keeps user-level
skills, settings, and CLAUDE.md out, so installed copies of these skills cannot
compete with the ones under test. A run stops at the first decisive event: a
Skill call, or an answer given without one. Every run is a real model session
and consumes usage.

    python3 scripts/trigger_eval.py                   # skills in the working tree
    python3 scripts/trigger_eval.py --ref origin/main # skills at another commit
    python3 scripts/trigger_eval.py --with-installed  # add your other skills as competitors
"""
import argparse
import io
import json
import shutil
import subprocess
import tarfile
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

root = Path(__file__).resolve().parents[1]
# Tools that change files or reach the network are blocked; the run stops before acting anyway.
BLOCKED_TOOLS = "Bash Edit Write NotebookEdit WebFetch WebSearch Agent"


def build_project(ref, with_installed):
    project = Path(tempfile.mkdtemp(prefix="trigger-eval-"))
    skills_dir = project / ".claude" / "skills"
    if ref:
        archive = subprocess.run(["git", "-C", str(root), "archive", ref, "skills"],
                                 capture_output=True, check=True).stdout
        with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
            if hasattr(tarfile, "data_filter"):
                tar.extractall(project / ".claude", filter="data")
            else:
                tar.extractall(project / ".claude")
    else:
        shutil.copytree(root / "skills", skills_dir)
    ours = {p.name for p in skills_dir.iterdir() if (p / "SKILL.md").exists()}
    installed = Path.home() / ".claude" / "skills"
    if with_installed and installed.is_dir():
        for skill in sorted(installed.iterdir()):
            if skill.name not in ours and (skill / "SKILL.md").exists():
                (skills_dir / skill.name).symlink_to(skill.resolve())
    return project, ours


def run_once(project, message, model, timeout):
    cmd = ["claude", "-p", "--output-format", "stream-json", "--verbose", "--strict-mcp-config",
           "--setting-sources", "project", "--no-session-persistence", "--disallowedTools", BLOCKED_TOOLS]
    if model:
        cmd += ["--model", model]
    # The prompt goes on stdin because --disallowedTools would consume a trailing argument.
    proc = subprocess.Popen(cmd, cwd=project, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                            stderr=subprocess.DEVNULL, text=True)
    assert proc.stdin and proc.stdout
    proc.stdin.write(message)
    proc.stdin.close()
    started, other_tools = time.time(), 0
    try:
        for line in proc.stdout:
            if time.time() - started > timeout:
                return "timeout"
            try:
                event = json.loads(line)
            except ValueError:
                continue
            if event.get("type") == "result":
                return None
            if event.get("type") != "assistant":
                continue
            blocks = event.get("message", {}).get("content", [])
            uses = [b for b in blocks if b.get("type") == "tool_use"]
            skills = [b.get("input", {}).get("skill", "") for b in uses if b.get("name") == "Skill"]
            if skills:
                return skills[0].split(":")[-1]
            other_tools += len(uses)
            if other_tools >= 4 or (not uses and any(b.get("type") == "text" for b in blocks)):
                return None
        return None
    finally:
        proc.kill()
        proc.wait()


def main():
    parser = argparse.ArgumentParser(description="Measure skill triggering in real Claude Code sessions.")
    parser.add_argument("--ref", help="git ref whose skills to test (default: working tree)")
    parser.add_argument("--examples", default=str(root / "docs/review-examples.json"))
    parser.add_argument("--only", help="comma-separated example ids")
    parser.add_argument("--runs", type=int, default=3, help="sessions per example (default: 3)")
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--model", help="model alias or name (default: the CLI default)")
    parser.add_argument("--with-installed", action="store_true",
                        help="add skills from ~/.claude/skills as competitors")
    parser.add_argument("--timeout", type=int, default=180, help="seconds per session")
    parser.add_argument("--out", help="write per-run results to this JSON file")
    args = parser.parse_args()

    examples = json.loads(Path(args.examples).read_text())
    if args.only:
        wanted = set(args.only.split(","))
        examples = [e for e in examples if e["id"] in wanted]
    project, ours = build_project(args.ref, args.with_installed)
    try:
        jobs = [(e, i) for e in examples for i in range(args.runs)]

        def run(job):
            example, _ = job
            message = example["request"] + (f"\n\nContext: {example['facts']}" if example["facts"] else "")
            return example["id"], run_once(project, message, args.model, args.timeout)

        picks = {e["id"]: [] for e in examples}
        with ThreadPoolExecutor(args.workers) as pool:
            for example_id, pick in pool.map(run, jobs):
                picks[example_id].append(pick)
    finally:
        shutil.rmtree(project)

    passed = {"trigger": [0, 0], "none": [0, 0]}
    failures = []
    for example in examples:
        expected, runs = set(example["expected_skills"]), picks[example["id"]]
        if expected:
            ok = sum(p in expected for p in runs) / len(runs) > 0.5
            bucket = "trigger"
        else:
            ok = sum(p in ours for p in runs) / len(runs) < 0.5
            bucket = "none"
        passed[bucket][0] += ok
        passed[bucket][1] += 1
        if not ok:
            failures.append((example["id"], ",".join(sorted(expected)) or "none", runs))

    label = args.ref or "working tree"
    print(f"{label}: should load a skill {passed['trigger'][0]}/{passed['trigger'][1]}, "
          f"should load none {passed['none'][0]}/{passed['none'][1]} ({args.runs} runs each)")
    for example_id, expected, runs in failures:
        print(f"  FAIL {example_id}: expected {expected}, loaded {[p or '-' for p in runs]}")
    if args.out:
        Path(args.out).write_text(json.dumps(picks, indent=1) + "\n")


if __name__ == "__main__":
    main()
