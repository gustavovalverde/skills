# Sources and scope

- [Google TypeScript style guide: identifiers](https://google.github.io/styleguide/tsguide.html#identifiers) gives naming conventions for Google's TypeScript code. Use it as a language-specific reference, not authority to rewrite other projects' interface prefixes, constants, or acronyms.
- [Python PEP 8: naming conventions](https://peps.python.org/pep-0008/#naming-conventions) supplies Python-specific guidance and emphasizes compatibility and consistency with surrounding code. Its casing rules differ from TypeScript conventions.
- [React: custom hook names](https://react.dev/learn/reusing-logic-with-custom-hooks#hook-names-always-start-with-use) explains why hook names communicate framework-specific calling constraints. This applies to React hooks, not every function in every language.
- [Martin Fowler: ubiquitous language](https://martinfowler.com/bliki/UbiquitousLanguage.html) describes shared vocabulary connecting domain understanding and software. Apply the relevant bounded context's meaning rather than forcing one term across unrelated domains.
- [Martin Fowler: command–query separation](https://martinfowler.com/bliki/CommandQuerySeparation.html) distinguishes observation from state change and discusses practical exceptions. It does not require splitting an atomic mutation that returns a useful result.
- [Artem Zakirullin: Cognitive load is what matters](https://github.com/zakirullin/cognitive-load) offers practitioner examples of reducing the effort of interpreting code. Treat these as qualitative design arguments, not proof of fixed naming lengths, memory limits, or agent-search performance.

Consult these sources when a convention or rationale is disputed. The examples here apply the ideas contextually; external works retain their own licenses and terms.
