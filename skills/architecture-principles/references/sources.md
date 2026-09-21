# Sources and scope

Consult these sources for attribution or when a design tradeoff needs deeper study. They offer design arguments, not universal thresholds or a compliance checklist.

- [Martin Fowler: YAGNI](https://martinfowler.com/bliki/Yagni.html) distinguishes speculative capabilities from work that keeps software easy to change. It supports evaluating the cost of carrying unused flexibility, not banning single-implementation interfaces.
- [Robert C. Martin: the single responsibility principle](https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html) explains cohesion through reasons and actors that drive change. It does not establish a method-count limit.
- [Barbara Liskov and Jeannette Wing: A Behavioral Notion of Subtyping](https://www.cs.cmu.edu/~wing/publications/LiskovWing94.pdf) grounds substitutability in behavioral specifications and preserved properties. Type signatures or the presence of a type check alone cannot settle the question.
- [John Ousterhout: A Philosophy of Software Design](https://web.stanford.edu/~ouster/cgi-bin/book.php) discusses managing complexity through module design and information hiding. The author's page identifies the book; consult the relevant edition before attributing an exact passage.
- [Tim Peters: The Zen of Python, PEP 20](https://peps.python.org/pep-0020/) offers Python design aphorisms about simplicity, readability, and explicit behavior. Apply them with language and framework context, not as a language-independent ban on nesting or implicit conventions.

The decision questions and examples here are practical guidance, not numerical measures of human comprehension. No fixed working-memory capacity determines an acceptable function or module size. External works retain their own licenses and terms.
