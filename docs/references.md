# External references

Sources for the skills' writing guidance and installation instructions. Choose references relevant to the reader, artifact, and language; a source's house style or numerical target is not a universal requirement.

## Documentation and technical language

- [Diátaxis compass](https://diataxis.fr/compass/): choose documentation form by the reader's need to learn, act, look up, or understand.
- [Diátaxis how-to guides](https://diataxis.fr/how-to-guides/): organize around a practical user goal and keep unrelated explanation separate.
- [Mintlify writing standards](https://github.com/mintlify/docs/blob/main/skill.md#writing-standards): direct language, prerequisites, useful examples, and removal of filler. Platform configuration and component requirements are outside this writing guidance.
- [Google developer documentation style highlights](https://developers.google.com/style/highlights): conditions before instructions, accessible language, descriptive links, and appropriate formatting.
- [ASD-STE100 overview](https://www.asd-ste100.org/about_STE.html): Simplified Technical English is a controlled language with writing rules and a dictionary. The official overview identifies Issue 9 (January 2025). Plain English documentation is not automatically STE-compliant. Apply the full standard only when requested and when the applicable official material is available.

## Plain language and comprehension

- [Digital.gov: introduction to plain language](https://digital.gov/resources/an-introduction-to-plain-language) grounds clarity in the intended audience's understanding and use.
- [Digital.gov: clear and short](https://digital.gov/guides/plain-language/writing/clear-short) offers sentence, paragraph, and section guidance. Its length suggestions are editorial heuristics, not universal pass/fail rules.
- [Digital.gov: style](https://digital.gov/guides/plain-language/writing/style) addresses noun strings, abbreviations, and examples. Apply the reader's terminology rather than mechanically replacing technical words.
- [OPM: plain language](https://www.opm.gov/information-management/plain-language/) discusses audience, organization, and sentence length. Its suggested 15–20-word average is agency guidance, not a required target for every language or artifact.
- [Digital.gov: test for understanding](https://digital.gov/guides/plain-language/test) describes ways to check whether readers understand and can use content. Select a method proportionate to the uncertainty.
- [Digital.gov: accessibility for content designers](https://digital.gov/guides/accessibility-for-teams/content-design/) covers content structure and alternatives that support access; readability scores alone do not establish accessibility.
- [CDC: Clear Communication Index score sheet](https://www.cdc.gov/ccindex/pdf/full-index-score-sheet.pdf), revised July 2014, is a structured communication-review instrument. Its audience, objective, and scoring criteria must fit the task before using its score; it is not a general prose grade.
- [CMS: written-material toolkit, Part 6, Chapter 1](https://www.cms.gov/Outreach-and-Education/Outreach/WrittenMaterialsToolkit/Downloads/ToolkitPart06Chapter01.pdf), September 2010, explains why formulas cannot replace reader feedback. Its scope is written material, with limitations on generalizing to online reading.

## Interface writing and accessibility

- Microsoft's [UI writing guidance](https://learn.microsoft.com/en-us/windows/apps/design/style/writing-style) uses periods for complete sentences in tooltips, errors, and dialogs. This is an example of a coherent convention, not a requirement to override another product's design system.
- [W3C form instructions](https://www.w3.org/WAI/tutorials/forms/instructions/): visible labels and usable instructions.
- [W3C user notifications](https://www.w3.org/WAI/tutorials/forms/notifications/): clear feedback and guidance to correct errors.

## Skill design and explanation

- [HumanLayer: show-me](https://github.com/humanlayer/skills/blob/main/plugins/show-me/skills/show-me/SKILL.md): choose a compact representation for the question, use a focused diff when context is familiar, and show a complete example when omitted context would hide ownership or order. Place visuals beside their supporting explanation.
- [Matt Pocock: writing for agents](https://github.com/mattpocock/skills/blob/main/skills/productivity/writing-for-agents/SKILL.md): focused triggers, conditional references, and grouping related instructions.
- [Matt Pocock: writing shape](https://github.com/mattpocock/skills/blob/main/skills/in-progress/writing-shape/SKILL.md): establish concepts before relying on them and assess each paragraph's contribution. An experimental writing workflow, not a mandatory drafting process.
- [Matt Pocock: writing beats](https://github.com/mattpocock/skills/blob/main/skills/in-progress/writing-beats/SKILL.md): end when the reader's purpose is fulfilled, rather than exhausting the source material. An experimental workflow.
- [Matt Pocock: writing documentation](https://github.com/mattpocock/skills/blob/main/.agents/writing-docs.md): explain when a skill is useful and how readers can recognize its result.
- [Matt Pocock: wait-what](https://github.com/mattpocock/skills/blob/main/skills/productivity/wait-what/SKILL.md): restore missing context when an explanation does not land. Requesting simplified English does not establish STE compliance.

## Architecture and software design

- [Martin Fowler: YAGNI](https://martinfowler.com/bliki/Yagni.html) distinguishes speculative capabilities from work that keeps software easy to change. It supports evaluating the cost of carrying unused flexibility, not banning single-implementation interfaces.
- [Robert C. Martin: the single responsibility principle](https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html) explains cohesion through reasons and actors that drive change. It does not establish a method-count limit.
- [Barbara Liskov and Jeannette Wing: A Behavioral Notion of Subtyping](https://www.cs.cmu.edu/~wing/publications/LiskovWing94.pdf) grounds substitutability in behavioral specifications and preserved properties. Type signatures or the presence of a type check alone cannot settle the question.
- [John Ousterhout: A Philosophy of Software Design](https://web.stanford.edu/~ouster/cgi-bin/book.php) discusses managing complexity through module design and information hiding. The author's page identifies the book; consult the relevant edition before attributing an exact passage.
- [Tim Peters: The Zen of Python, PEP 20](https://peps.python.org/pep-0020/) offers Python design aphorisms about simplicity, readability, and explicit behavior. Apply them with language and framework context, not as a language-independent ban on nesting or implicit conventions.

- [Matt Pocock: codebase design](https://github.com/mattpocock/skills/blob/main/skills/engineering/codebase-design/SKILL.md) connects caller effort, locality of change, and testability through module interfaces. These are useful design questions; its fixed vocabulary and adapter-count rules are not requirements here.

## Public API design

- [Steven Clarke: Describing and Measuring API Usability with the Cognitive Dimensions](https://www.cl.cam.ac.uk/~afb21/CognitiveDimensions/workshop2005/Clarke_position_paper.pdf) describes an API usability study in which developers could not relate low-level classes to their tasks. It motivates evaluating abstraction level, discovery, premature commitment, and change effort against the intended users. This position paper is not a universal scoring system; its observed task timings do not predict another API's usability.
- [John Ousterhout: Designing Abstractions](https://web.stanford.edu/~ouster/CS349W/lectures/abstraction.html) argues for simple interfaces that hide substantial implementation complexity and let users learn special cases after the common case. These lecture notes support reasoning about caller burden, not a fixed quota for methods or entrypoints.
- [Microsoft: Azure SDK Language Design Guidelines for Python](https://learn.microsoft.com/en-us/azure/developer/python/sdk/fundamentals/language-design-guidelines) discusses idiomatic usage, consistency, simplicity, and progressive disclosure. Use the general design questions across projects; Azure and Python conventions are not requirements for unrelated APIs.
- [Google: AIP-100, API Design Review FAQ](https://google.aip.dev/100) frames review around the user's understanding of the API and encourages early design feedback. Its review process and other Google API rules apply in their own context, not automatically to every library or protocol.

## Installation

- [Skills CLI](https://github.com/vercel-labs/skills): installation from repositories and local directories.
- [Supported agents](https://github.com/vercel-labs/skills#supported-agents): agent names and installation targets.

## Further reading

- Gary Provost, *100 Ways to Improve Your Writing*.
- William Strunk Jr. and E. B. White, *The Elements of Style*.
- Joseph M. Williams, *Style: Lessons in Clarity and Grace*.

Check the relevant edition before quoting a passage or attributing an exact rule. External works retain their own licenses and terms.
