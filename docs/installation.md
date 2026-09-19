# Alternative installation methods

Use a native plugin to install all four skills together. For individual skills, use the installer in the [README](../README.md#install). Choose one route to avoid duplicates.

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

Start a fresh session and invoke `/skills:write-docs`, `/skills:write-pr`, `/skills:edit-prose`, or `/skills:write-ui-copy`.

## Check the result

Check that all four skills appear, then try an example from the [README](../README.md#try-a-skill). If skills appear twice, remove one installation route.
