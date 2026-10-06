# Steward

Agent skills for looking after software projects: design and API decisions, code organization and naming, the documentation, pull requests, and interface text that go with them, and triage of issues and pull requests. They follow the [Agent Skills specification](https://agentskills.io/specification) and work with Claude Code, Codex, Cursor, and other supported agents.

## Install

From your project, with Node.js and npm installed, run the [skills CLI](https://github.com/vercel-labs/skills):

```sh
npx skills add gustavovalverde/skills
```

Choose the skills and agents you want, then start a fresh session. To install a single skill, name it:

```sh
npx skills add gustavovalverde/skills --skill pr-writing
```

To install every skill as one Claude Code or Codex plugin named `steward`, follow the [installation guide](docs/installation.md).

## Skills

Agents load a skill when your request matches it. You can also ask for one by name: `/pr-writing` in Claude Code, `/steward:pr-writing` with the plugin, or `$pr-writing` in Codex.

### Engineering decisions

| Skill | Use it to | Example request |
|---|---|---|
| [software-design](skills/software-design/SKILL.md) | Plan a feature or refactor | “Plan this feature from common usage through ownership and module boundaries. Identify the first useful implementation slice.” |
| [public-api-design](skills/public-api-design/SKILL.md) | Shape a developer-facing contract | “Review this SDK setup from the caller’s perspective. Simplify common usage while preserving compatibility.” |
| [codebase-structure](skills/codebase-structure/SKILL.md) | Decide where code belongs | “Choose where this feature belongs and check which boundaries a file move must preserve.” |
| [identifier-naming](skills/identifier-naming/SKILL.md) | Choose names and rename safely | “Review these names for clarity and propagate the rename without changing public keys.” |

### Writing

| Skill | Use it to | Example request |
|---|---|---|
| [docs-writing](skills/docs-writing/SKILL.md) | Write documentation and decision records | “Write a setup guide with prerequisites, a working example, and expected results.” |
| [pr-writing](skills/pr-writing/SKILL.md) | Describe a change for reviewers or users | “Write the PR description from this diff. Explain the behavior change and review risks.” |
| [ui-copy](skills/ui-copy/SKILL.md) | Write the least interface text users need | “Review this screen's labels and errors. Remove hints that repeat the controls.” |
| [text-editing](skills/text-editing/SKILL.md) | Improve an existing draft | “Make this draft easier to follow while preserving its evidence and caveats.” |

### Repository triage

| Skill | Use it to | Example request |
|---|---|---|
| [backlog-triage](skills/backlog-triage/SKILL.md) | Triage issues and pull requests | “Assess the next batch of open issues and their pull requests, find duplicates and competing fixes, and recommend actions. Keep GitHub read-only.” |

## How they work together

Each skill works on its own, so you can install only the ones you need. `software-design` handles decisions that span several concerns. When one question needs more depth, it hands the work to `public-api-design`, `codebase-structure`, or `identifier-naming`, passing along what it has already established, and to `docs-writing` when you want the decision recorded. `codebase-structure` and `identifier-naming` hand questions to each other: placement first, then names.

The writing skills stay independent. Ordinary replies and small wording fixes need none of them.

The triage skills work in any GitHub repository. They read the repository's own instructions, and load any installed skill that profiles the repository, such as a team's contracts, packages, and branches.

## Customize

Keep your preferred spelling, punctuation, and terminology in your project instructions rather than in the skills. To adapt a skill itself, edit its files under `skills/`.

See [AGENTS.md](AGENTS.md) for how skills are written, [contributing](CONTRIBUTING.md) for checks, [external references](docs/references.md) for source guidance, and [licensing](docs/provenance.md) for attribution.

## License

[MIT](LICENSE).
