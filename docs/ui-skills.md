# UI skills directory

Which skills to load for product interface work, where they come from, and which ones to keep out. The recommendations come from 237 corrections given to coding agents during UI work between August and October 2026, in Claude Code and Codex, and from a survey of the most-installed UI skills in October 2026.

## What agents got wrong

| Correction | Count | Covered by |
|---|---:|---|
| Too much text: obvious, repeated, or over-explained, where an icon or tooltip would do | 42 | `ui-copy` |
| Visual style and density: off-palette color, oversized elements, sprawling layouts | 30 | `ui-composition` |
| Invented components instead of the design system and upstream blocks | 28 | `ui-composition`, `shadcn` |
| Wording: technical, generic, or naming internal values | 27 | `ui-copy` |
| Button hierarchy, placement, and alignment | 25 | `ui-composition` |
| Reporting done without using the UI at desktop and mobile widths | 24 | `ui-composition` |
| Component choice: button groups instead of selects, rows of actions instead of menus | 18 | `ui-composition` |
| Forms and states: asking too much, no defaults, irrelevant fields | 17 | `ui-composition` |
| Language register and punctuation of the product's locale | 10 | Project instructions |
| Accessibility and other | 16 | `better-accessibility`, project instructions |

Two patterns explain most of the repetition:

- In 40 of 70 copy corrections, `ui-copy` was already loaded. Skills loaded beside it pushed the other way: one asks for what, why, and how in every message plus three alternatives, one invents copy and placeholder content, and one requires Title Case.
- Codex sessions loaded the same skills, conflicting ones included, because Codex reads the global skills folder that the skills CLI installs into.

## Load

| Skill | Source | When |
|---|---|---|
| `ui-copy` | this repository | Automatically, for any interface text, including landing and pricing pages |
| `ui-composition` | this repository | Automatically, for any screen, component, form, or section |
| `shadcn` | `shadcn-ui/ui` | Automatically in shadcn projects; it owns component and token conventions |
| `vercel-react-best-practices` | `vercel-labs/agent-skills` | Automatically in React projects; it covers code, not appearance |
| `better-accessibility` | `jakubkrehel/skills` | Automatically for accessibility work; run it before merge as the WCAG 2.2 A and AA gate |
| `better-layout`, `better-colors` | `jakubkrehel/skills` | Automatically for responsive, zoom, right-to-left, palette, and contrast work |
| `better-writing` | `jakubkrehel/skills` | Automatically beside `ui-copy`; it phrases the text `ui-copy` keeps and checks terminology and plurals |
| `make-interfaces-feel-better`, `fixing-motion-performance` | `jakubkrehel/make-interfaces-feel-better`, `ibelick/ui-skills` | Automatically for polish and animation work; project motion tokens win over their example values |
| `review-animations` | `emilkowalski/skills` | By name in Claude Code, automatically in Codex, as a motion review |
| `frontend-design` | `anthropics/skills` | By name for a new brand or marketing surface, never for product screens; set `skillOverrides` to `user-invocable-only` in Claude Code, while Codex loads it automatically |
| `copywriting` | `coreyhaines31/marketingskills` | Automatically for landing-page drafts, followed by the `ui-copy` deletion pass |

`npx skills add -g` installs into `~/.agents/skills`, which Codex reads directly and Claude Code reads through a symlink in `~/.claude/skills`, so one install or removal reaches both agents.

In Claude Code, a skill in `~/.claude/skills` shadows a project skill with the same name, and `skillOverrides` set to `user-invocable-only` keeps a skill available by name without loading it automatically; plugin skills can only be turned off with their whole plugin. In Codex, a `[[skills.config]]` entry with `enabled = false` in `~/.codex/config.toml` turns off one skill by name or path, and a project cannot turn off a user skill.

## Keep out of product work

| Skill | Source | Reason |
|---|---|---|
| `ux-copy` | `anthropics/knowledge-work-plugins` | Requires an explanation on every message and three alternatives, the opposite of `ui-copy` |
| `web-design-guidelines` | `vercel-labs/agent-skills` | Requires Title Case, which is wrong for many languages, and fetches its rules from a main branch on every run |
| `competitors`, `marketing-psychology` | `coreyhaines31/marketingskills` | Comparison pages and urgency tactics conflict with value-led, competitor-neutral copy |
| Duplicate copies of a skill | plugins | A plugin copy and a standalone copy of the same skill load twice and can disagree |

## Keep in each project

Each product repository needs a short `DESIGN.md` that states its tokens, components, and composition rules, linking to longer guides. `ui-composition` reads it first. Put the locale's language register, punctuation, legal qualifiers, and brand terms in the project's instructions or voice guide, not in shared skills.
