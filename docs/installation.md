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

## Codex

Run in your terminal:

```sh
codex plugin marketplace add /path/to/skills
codex plugin add steward@gustavovalverde-skills
```

Start a fresh task and find the installed skills in the skill picker.

## Claude Code

Run inside a Claude Code session:

```text
/plugin marketplace add /path/to/skills
/plugin install steward@gustavovalverde-skills
```

Start a fresh session and invoke a skill, such as `/steward:software-design` or `/steward:docs-writing`. See the [README](../README.md#skills) for the full selection.

## Check pull request bodies in Claude Code

`pr-writing` includes an optional Claude Code hook. The hook checks the title and body before `gh pr create` or `gh pr edit` runs, and blocks the command when they exceed the skill's limits. It is off until you add it to your settings.

Add this entry to `~/.claude/settings.json`. The path assumes a user-level install with the skills CLI; change it if your copy of the skill is elsewhere:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$HOME/.claude/skills/pr-writing/scripts/gh-pr-hook.mjs\""
          }
        ]
      }
    ]
  }
}
```

With the hook on:

- The agent must pass the body with `--body-file`, from a file written in an earlier step. The hook blocks an inline `--body`, because it cannot read one.
- A blocked command shows the limit it broke, such as the word count or the title length.
- To allow a longer body for one command, prefix it with `PR_BODY_MAX_WORDS=600`.
- To add your own reminder to every allowed command, append `--note "your text"` to the hook command.

The hook needs Node.js 20 or later. It ignores commands that post no body, and it never blocks a command when the hook itself fails.

## Earlier plugin name

The plugin was previously named `skills`. Claude Code moves existing installs to `steward` on the next marketplace sync. In Codex, remove the old plugin and add the new one:

```sh
codex plugin remove skills@gustavovalverde-skills
codex plugin add steward@gustavovalverde-skills
```

## Check the result

Check that the packaged skills appear, then try an example from the [README](../README.md#skills). If skills appear twice, remove one installation route.
