# Skills

Agent skills for clear documentation, pull requests, interface copy, and prose editing. Install with [skills](https://github.com/vercel-labs/skills) for Cursor, Codex, Claude Code, and other supported agents.

## Install

From your project, with Node.js and npm installed:

```sh
npx skills add gustavovalverde/skills
```

Choose the skills and agents you want, then start a fresh session. For native plugins or a local checkout, see the [installation guide](docs/installation.md).

## Try a skill

Select a skill in your agent and describe the task:

| Skill | Example request |
|---|---|
| [write-docs](skills/write-docs/SKILL.md) | “Write a setup guide with prerequisites, a working example, and expected results.” |
| [write-pr](skills/write-pr/SKILL.md) | “Write the PR description from this diff. Explain the behavior change and review risks.” |
| [write-ui-copy](skills/write-ui-copy/SKILL.md) | “Review this screen's labels and errors. Remove hints that repeat the controls.” |
| [edit-prose](skills/edit-prose/SKILL.md) | “Make this draft easier to follow while preserving its evidence and caveats.” |

Agents can also select a skill when the task fits. Ordinary replies and small wording edits do not need a writing workflow.

## Customize

Keep your preferred spelling, punctuation, and terminology in your project instructions. Each skill works independently; edit its files under `skills/` to adapt it.

See [contributing](CONTRIBUTING.md) for checks and [external references](docs/references.md) for source guidance and [licensing](docs/provenance.md) for attribution.

## License

[MIT](LICENSE).
