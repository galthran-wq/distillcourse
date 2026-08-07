# Course 2 proposal: Advanced Algorithms

Not a course directory — a module-level outline for the human to curate into
one if wanted. "Algorithms and Data Structures" (this course, course 1)
covers the load-bearing undergraduate core: asymptotics, elementary and
tree-based data structures, sorting/searching, the three design paradigms
(divide-and-conquer, greedy, dynamic programming), graph traversal and
weighted-graph algorithms, and a first look at NP-completeness. Every
university sequence this was benchmarked against (MIT 6.006+6.046+6.851/854,
CMU 15-210+15-451, Stanford CS161+CS166/168/261, Berkeley CS170+CS270, UIUC
CS374+CS473) puts a comparable second half of material into a follow-on
course or two — this document is that second half, organized as modules with
the sources that would ground each one.

Suggested split: this could be one dense advanced course, or two
(`advanced-algorithms` for modules 1-4, `algorithmic-toolbox-for-scale` for
modules 5-7) if the human wants a three-course sequence instead of two —
several of the benchmarked schools (Stanford, MIT) do run three.

## Module A — Amortized analysis, done properly

Course 1 covers the aggregate method (dynamic-array doubling) only. This
module adds the accounting and potential methods and applies them to
self-adjusting structures.

- Accounting method, potential method — general techniques beyond the
  aggregate method used in course 1.
- Splay trees — self-adjusting BSTs with no explicit balance invariant,
  amortized O(log n) via the potential method.
- Fibonacci heaps — decrease-key in O(1) amortized, the structure that makes
  Dijkstra with decrease-key run in O(E + V log V) instead of O(E log V).

**Grounding sources**

- D. D. Sleator, R. E. Tarjan, "Self-Adjusting Binary Search Trees," *Journal
  of the ACM* 32(3), 652-686, 1985 —
  https://www.cs.cmu.edu/~sleator/papers/self-adjusting.pdf (free,
  author-hosted)
- M. L. Fredman, R. E. Tarjan, "Fibonacci Heaps and Their Uses in Improved
  Network Optimization Algorithms," *Journal of the ACM* 34(3), 596-615, 1987
- MIT 6.851 Advanced Data Structures (Erik Demaine) —
  https://courses.csail.mit.edu/6.851/spring21/ (free; amortization and
  self-adjusting structures lectures)
- CLRS 4th ed., ch. 16-17 (amortized analysis) and ch. 19 (Fibonacci heaps)

## Module B — Advanced data structures

The structures course 1 deliberately stops short of: predecessor structures
faster than a balanced BST, structures that remember every past version of
themselves, and structures that use asymptotically less space than a naive
representation.

- B-trees — external-memory-friendly balanced trees, the structure behind
  every on-disk database index.
- van Emde Boas trees — predecessor/successor queries in O(log log U) over a
  bounded universe.
- Persistent data structures — querying or updating any past version of a
  structure, not just the latest.
- Succinct data structures — rank/select over a bit vector in space close to
  the information-theoretic minimum.

**Grounding sources**

- R. Bayer, E. M. McCreight, "Organization and Maintenance of Large Ordered
  Indexes," *Acta Informatica* 1, 173-189, 1972
- P. van Emde Boas, R. Kaas, E. Zijlstra, "Design and Implementation of an
  Efficient Priority Queue," *Mathematical Systems Theory* 10, 99-127, 1976
- J. R. Driscoll, N. Sarnak, D. D. Sleator, R. E. Tarjan, "Making Data
  Structures Persistent," *Journal of Computer and System Sciences* 38(1),
  86-124, 1989 — https://www.cs.cmu.edu/~sleator/papers/another-persistence.pdf
  (free, author-hosted)
- Stanford CS166 Advanced Data Structures —
  https://web.stanford.edu/class/cs166/ (free; the strongest single syllabus
  for this whole module — B-trees, fusion trees, succinct rank/select, vEB)
- MIT 6.851 Advanced Data Structures —
  https://courses.csail.mit.edu/6.851/spring21/ (free; persistence and
  succinct-structure lectures)
- R. E. Tarjan, *Data Structures and Network Algorithms*, SIAM, 1983 (no free
  edition; the terse original synthesis by the field's central figure —
  report to the human for purchase)

## Module C — Network flow and matching

Course 1's graph modules stop at shortest paths and MSTs. Flow networks are
the next model up, and a large share of "how do I optimally assign/route/
schedule X" problems reduce to max flow or matching.

- Max flow / min cut, Ford-Fulkerson and Edmonds-Karp.
- Applications: bipartite matching, edge-disjoint paths, project selection,
  image segmentation.
- Min-cost flow, and where it subsumes shortest paths and matching as special
  cases.

**Grounding sources**

- L. R. Ford Jr., D. R. Fulkerson, "Maximal Flow Through a Network,"
  *Canadian Journal of Mathematics* 8, 399-404, 1956
- J. Edmonds, R. M. Karp, "Theoretical Improvements in Algorithmic Efficiency
  for Network Flow Problems," *Journal of the ACM* 19(2), 248-264, 1972
- J. E. Hopcroft, R. M. Karp, "An n^{5/2} Algorithm for Maximum Matchings in
  Bipartite Graphs," *SIAM Journal on Computing* 2(4), 1973
- R. K. Ahuja, T. L. Magnanti, J. B. Orlin, *Network Flows: Theory,
  Algorithms, and Applications*, Prentice Hall, 1993 (no free edition; the
  standard comprehensive monograph — report to the human for purchase)
- MIT 6.854 Advanced Algorithms (David Karger and successors) —
  https://courses.csail.mit.edu/6.854/21/course_materials.html (free)

## Module D — Linear programming, duality, and NP-completeness in depth

Course 1 gives NP-completeness a first pass (Cook-Levin, one reduction, a
practitioner's map of coping strategies). This module goes back through it
properly and adds the optimization framework — LP — that the approximation
module in E depends on.

- Linear programming: formulation, the simplex method, strong duality.
- LP duality as a unifying lens on max-flow/min-cut and matching (already
  seen concretely in module C).
- NP-completeness reductions in depth: a working set of 8-10 reductions
  (3-SAT, vertex cover, independent set, clique, Hamiltonian cycle, subset
  sum, graph coloring), building the practical skill of *constructing* a
  reduction, not just recognizing one.
- A brief map of complexity theory beyond NP: PSPACE, the polynomial
  hierarchy, #P — enough to place NP-completeness in context without a full
  complexity-theory course.

**Grounding sources**

- S. A. Cook, "The Complexity of Theorem-Proving Procedures," *3rd ACM
  Symposium on Theory of Computing*, 151-158, 1971 — free PDF:
  https://www.inf.unibz.it/~calvanese/teaching/14-15-tc/material/cook-1971-NP-completeness-of-SAT.pdf
- R. M. Karp, "Reducibility Among Combinatorial Problems," in *Complexity of
  Computer Computations*, 85-103, 1972 — free PDF:
  https://www.cs.umd.edu/~gasarch/BLOGPAPERS/Karp.pdf
- L. A. Levin, "Universal Sequential Search Problems," *Problems of
  Information Transmission* 9(3), 265-266, 1973 (independent Soviet
  discovery, historically important to cite alongside Cook)
- M. R. Garey, D. S. Johnson, *Computers and Intractability: A Guide to the
  Theory of NP-Completeness*, W. H. Freeman, 1979 (no free edition; the
  canonical reduction catalog — report to the human for purchase)
- D. Gale, H. W. Kuhn, A. W. Tucker, "Linear Programming and the Theory of
  Games," in *Activity Analysis of Production and Allocation*, 317-329, 1951
  (first rigorous LP duality proof)
- Stanford CS261 Optimization and Algorithmic Paradigms (Trevisan /
  Roughgarden offerings) — https://theory.stanford.edu/~trevisan/cs261/ and
  https://timroughgarden.org/cs261/cs261.html (free)
- Berkeley CS170 (Vazirani) and CS270 (Satish Rao) —
  https://cs170.org/ and https://people.eecs.berkeley.edu/~satishr/cs270/fa25/
  (free)
- S. Arora, B. Barak, *Computational Complexity: A Modern Approach*,
  Cambridge University Press, 2009 — free author draft:
  https://theory.cs.princeton.edu/complexity/book.pdf (for the "map beyond
  NP" section only; graduate-level, use sparingly)

## Module E — Randomized and approximation algorithms

Two families that share a home because both trade a guarantee (determinism,
or exact optimality) for tractability, and both depend on module D's LP
machinery for their most powerful techniques (LP rounding, randomized
rounding).

- Randomized algorithms: Las Vegas vs. Monte Carlo, tail bounds
  (Markov/Chebyshev/Chernoff), randomized min-cut, universal hashing.
- Approximation algorithms: greedy and LP-rounding approximations, the
  primal-dual method, PTAS/FPTAS, and hardness-of-approximation as the
  natural sequel to module D's NP-completeness.

**Grounding sources**

- R. Motwani, P. Raghavan, *Randomized Algorithms*, Cambridge University
  Press, 1995 (no free edition; the classic organizing text — report to the
  human for purchase)
- M. Mitzenmacher, E. Upfal, *Probability and Computing*, 2nd ed., Cambridge
  University Press, 2017 (no free edition; the modern probability companion
  — report to the human for purchase)
- R. M. Karp, "An Introduction to Randomized Algorithms," *Discrete Applied
  Mathematics* 34, 165-201, 1991 — free PDF:
  https://immorlica.com/randAlg/Karp91.pdf
- D. R. Karger, "Global Min-Cuts in RNC, and Other Ramifications of a Simple
  Min-Cut Algorithm," *4th ACM-SIAM Symposium on Discrete Algorithms*, 21-30,
  1993
- J. L. Carter, M. N. Wegman, "Universal Classes of Hash Functions," *Journal
  of Computer and System Sciences* 18, 143-154, 1979 — free PDF:
  https://www.cs.princeton.edu/courses/archive/fall09/cos521/Handouts/universalclasses.pdf
- D. P. Williamson, D. B. Shmoys, *The Design of Approximation Algorithms*,
  Cambridge University Press, 2011 — free authorized PDF:
  https://www.designofapproxalgs.com/book.pdf (the best single synthesis for
  this half of the module)
- V. V. Vazirani, *Approximation Algorithms*, Springer, 2001 — free
  author-hosted PDF: https://www.ics.uci.edu/~vazirani/book.pdf
- N. Harvey, *A First Course in Randomized Algorithms* — free draft:
  https://www.cs.ubc.ca/~nickhar/Book1.pdf

## Module F — String algorithms

Deferred from course 1 entirely; a self-contained module a busy engineer
needs for text search, bioinformatics, and compiler/interpreter work
(connects to the `information-theory` course's Lempel-Ziv/dictionary-coding
lessons, which assume string matching as background).

- Exact string matching: KMP, Boyer-Moore, Rabin-Karp (three different ideas
  for the same problem — automaton, bad-character skipping, hashing).
- Tries.
- Suffix trees and suffix arrays — the structures that make "does this
  pattern occur anywhere in this text" and its variants run in time
  independent of how many times you ask.

**Grounding sources**

- D. E. Knuth, J. H. Morris Jr., V. R. Pratt, "Fast Pattern Matching in
  Strings," *SIAM Journal on Computing* 6(2), 323-350, 1977 — free PDF:
  https://www.cs.jhu.edu/~misha/Spring23/Knuth77.pdf
- R. S. Boyer, J. S. Moore, "A Fast String Searching Algorithm,"
  *Communications of the ACM* 20(10), 762-772, 1977
- M. O. Rabin, R. M. Karp, "Efficient Randomized Pattern-Matching
  Algorithms," *IBM Journal of Research and Development* 31(2), 249-260,
  1987 — free PDF: https://didawiki.cli.di.unipi.it/lib/exe/fetch.php/bio/kr87.pdf
- E. M. McCreight, "A Space-Economical Suffix Tree Construction Algorithm,"
  *Journal of the ACM* 23(2), 262-272, 1976
- U. Manber, G. Myers, "Suffix Arrays: A New Method for On-Line String
  Searches," *SIAM Journal on Computing* 22(5), 935-948, 1993 — free PDF:
  https://publications.mpi-cbg.de/Manber_1993_5474.pdf
- CMU 02-714 String Algorithms (Carl Kingsford) —
  https://www.cs.cmu.edu/~ckingsf/class/02714-f13/ (free)
- Stanford CS166 (again — its string-structures unit covers suffix trees
  alongside the advanced-data-structures material of module B)

## Module G — Geometry, parallelism, and algorithms for scale

A grab-bag module by design: each piece is a self-contained bridge from the
core sequence to an adjacent specialty, sized to give a working vocabulary
rather than a full treatment.

- Computational geometry basics: convex hulls, line-segment intersection,
  closest-pair-of-points revisited properly (course 1's D&C lesson only
  gestures at it).
- Parallel algorithms: work/span analysis, the fork-join model.
- External-memory and cache-oblivious algorithms: what changes when memory
  hierarchy, not instruction count, dominates cost.
- Streaming and sketching (the explicit ML-adjacent bridge): count-min
  sketch, Bloom filters, locality-sensitive hashing, the one-pass/
  limited-memory model. Positioned last because it is the natural hand-off
  to a statistics/ML-adjacent course — it depends on hashing, probability,
  and approximation, not on statistical learning theory.

**Grounding sources**

- B. H. Bloom, "Space/Time Trade-offs in Hash Coding with Allowable Errors,"
  *Communications of the ACM* 13(7), 422-426, 1970
- D. Karger, E. Lehman, F. T. Leighton, R. Panigrahy, M. S. Levine, D. Lewin,
  "Consistent Hashing and Random Trees," *29th ACM Symposium on Theory of
  Computing*, 654-663, 1997
- M. Frigo, C. E. Leiserson, H. Prokop, S. Ramachandran, "Cache-Oblivious
  Algorithms," *40th IEEE Symposium on Foundations of Computer Science*,
  285-297, 1999
- Stanford CS168 The Modern Algorithmic Toolbox (Gregory Valiant) —
  https://web.stanford.edu/class/cs168/ (free; the best single bridge from
  core algorithms to streaming/sketching/ML-adjacent material)
- CMU 15-210 Parallel and Sequential Data Structures and Algorithms —
  https://www.cs.cmu.edu/~15210/ , free textbook:
  https://www.cs.cmu.edu/~15210/docs/book.pdf (the strongest free source for
  the parallel-algorithms piece; work/span analysis throughout)
- G. Blelloch, L. Dhulipala, Y. Sun, *Introduction to Parallel Algorithms* —
  free draft PDF: https://www.cs.cmu.edu/~guyb/paralg/paralg/parallel.pdf
- Stanford CS268 Geometric Algorithms (Leonidas Guibas, archived) —
  http://graphics.stanford.edu/courses/cs268-09-winter/notes.html (free)
- MIT 2.158J Computational Geometry —
  https://ocw.mit.edu/courses/2-158j-computational-geometry-spring-2003/
  (free)

## Cross-cutting reference works (not tied to one module)

- D. E. Knuth, *The Art of Computer Programming*, vols. 1-4A — the
  research-level encyclopedia every module above ultimately traces back to;
  no free edition, report to the human for purchase.
- J. Erickson, *Algorithms*, 2019 — free, CC BY 4.0:
  https://jeffe.cs.illinois.edu/teaching/algorithms/ — its advanced chapters
  (LP, randomized algorithms, amortization, splay trees, string algorithms)
  cover pieces of modules A, D, E, and F in one consistently free source and
  are worth assigning as the spine text if the human wants a single book
  rather than per-module notes.
- MIT 6.854 Advanced Algorithms course-materials page —
  https://courses.csail.mit.edu/6.854/21/course_materials.html — the single
  broadest free graduate syllabus, touching modules A-E; useful as a sanity
  check on sequencing when the human curates the split.

## Notes on methodology

Research route: `mcp__perplexity__perplexity_research` (Perplexity Agent API,
deep-research preset) was available in this session and used for one
comprehensive query covering canonical textbooks, university syllabi, load-
bearing primary papers, surveys, and visual/interactive resources across the
whole subject (undergraduate core through advanced/graduate material). Its
output was cross-checked against the material's known structure and curated
by hand into course 1's `course.yaml` and this proposal — sources were not
copied wholesale; each one earns a distinct role (a lesson, or a module here)
and near-duplicate alternatives (e.g. multiple red-black-tree treatments,
multiple LP-duality histories) were pruned to one.
