# Alternative installation methods

Use a native plugin to install the packaged skills together. For individual skills, use the installer in the [README](../README.md#install). Choose one route to avoid duplicates.

Use an existing checkout for the commands below. Replace `/path/to/skills` with its absolute path.

## Choose an agent

The skills installer supports Cursor and other agents in addition to Codex and Claude Code. Choose your agent interactively or name it explicitly:

```sh
npx skills add gustavovalverde/skills --agent cursor
```

See the installer's [supported agents](https://github.com/vercel-labs/skills#supported-agents) for available targets. The native plugin instructions below apply specifically to Codex and Claude Code.

## Individual skills from a local checkout

Run from the project where you want to install the skills:

```sh
npx skills add /path/to/skills
```

Choose the skills and agents you want, then start a fresh session.

## Update a global installation

Review and merge changes in this repository before updating installed skills. Compare any edited local copies with the repository first, and preserve useful changes in a pull request before reinstalling.

Install the repository's skills for Codex and Claude Code:

```sh
npx skills add gustavovalverde/skills --global --agent codex claude-code --skill '*' --yes
npx skills list --global --agent codex claude-code
```

The default installer uses one source directory under `~/.agents/skills` and links Claude Code to it. Avoid `--copy` when both agents should share the same files. Run the installation on each machine where you use the skills.

Older independent copies under `~/.codex/skills` can remain discoverable after installation. Compare their complete file contents with the installed source, preserve any differences, and remove only the redundant copies belonging to this repository. A Claude symlink to the shared source is an intended installation entry, not another copy to delete.

Check for earlier names as well as identical names: `write-docs`, `write-pr`, `write-ui-copy`, and `edit-prose` preceded `docs-writing`, `pr-writing`, `ui-copy`, and `text-editing`, respectively. Confirm their provenance before removing them; do not remove unrelated skills with similar responsibilities.

Verify that each installed skill's manifest and supporting files match the merged revision, and that Claude's links resolve to the shared source. The installer listing establishes presence, not content equality or availability in an already-open chat. Start fresh Codex and Claude sessions after updating, and check their skill catalogs.

## Codex

Run in your terminal:

```sh
codex plugin marketplace add /path/to/skills
codex plugin add skills@gustavovalverde-skills
```

Start a fresh task and find the installed skills in the skill picker.

## Claude Code

Run inside a Claude Code session:

```text
/plugin marketplace add /path/to/skills
/plugin install skills@gustavovalverde-skills
```

Start a fresh session and invoke a skill, such as `/skills:software-design` or `/skills:docs-writing`. See the [README](../README.md#try-a-skill) for the full selection.

## Check the result

Check that the packaged skills appear, then try an example from the [README](../README.md#try-a-skill). If skills appear twice, remove one installation route.
