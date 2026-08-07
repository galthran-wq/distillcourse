# Brief: arrays-and-linked-lists

Goal: compare arrays and linked lists by operation cost. Opens the
data-structures arc; establishes the "interface vs implementation" and
"operation-cost scoreboard" conventions reused by every later structure
lesson.

## Sources to consult
- CLRS §10.1 (arrays, matrices row-major layout — Fig 10.1 one matrix stored
  multiple ways), §10.2 (linked lists: singly, doubly, sentinels).
- Morin ODS Ch. 1 §1.2 (the List/USet/SSet interface discipline — adopt
  "interface first, implementation second" as the module's format contract),
  Ch. 3 (SLList, DLList; the three-case insert/delete diagrams Fig 3.4-3.5).
- MIT 6.006 L02: the Sequence-interface operations scoreboard (build, get_at,
  set_at, insert_first/last/at, delete_…) — the accumulating comparison table
  this module should reuse lesson after lesson.
- Sedgewick 1.3 slides 9-10, 27-30: boxes-and-pointers push/insert traces
  (oldfirst/first reassignment) — the canonical pointer-surgery drawings.

## Key points the lesson must cover
1. Array = contiguous memory + index arithmetic: address = base + i·width,
   hence O(1) random access; O(n) insert/delete at arbitrary position (shift).
2. Fixed capacity as the array's structural limit (dynamic resize deferred one
   lesson — say so explicitly; L10c).
3. Singly linked list: node = value + next pointer; O(1) splice at a known
   node, O(n) access by index; head insertion O(1).
4. Doubly linked list: prev pointer buys O(1) delete given only the node;
   sentinel trick removes edge cases (one paragraph).
5. The scoreboard: a table of costs per operation per structure — introduce it
   as a running artifact the next lessons will extend (6.006 device).
6. Constant factors and cache locality: contiguous beats pointer-chased even
   at equal asymptotics — one honest qualitative paragraph, no cache-line
   arithmetic.

## Worked examples and set pieces
- **Pointer-surgery insert** (Sedgewick 1.3): the before/during/after
  reassignment of next pointers — the classic beginner failure (losing the
  rest of the list by reordering assignments) is the L13 refutation slot:
  "assignment order in pointer splicing doesn't matter" — show the order that
  orphans the tail.
- **Interface vs implementation** (ODS §1.2): stack/queue/list as interfaces
  arrive next lesson; here plant the distinction with the Sequence interface.
- E7 forward-reach exercise: count the total cost of n successive appends to
  a fixed-capacity array that is copied to a 1-larger array each time
  (arithmetic series ⇒ Θ(n²)) — the wall that dynamic-arrays-and-amortized-
  analysis removes (<Ref>).

## Pitfalls
- No language-specific memory management (malloc/GC) beyond one sentence.
- Do not teach SEList/unrolled lists (ODS 3.3) — course-2 texture.
- Keep matrices/2D layout to a single aside (row-major only) or cut.
- The cache paragraph must not overclaim: "often faster in practice," backed
  by the contiguity argument, no invented benchmark numbers.

## FIGURE PLAN
- draw: array memory strip — boxes with addresses beneath, the address
  computation base + i·width annotated onto element i. Single <Figure>.
- draw: singly linked list boxes-and-pointers with head, one node's
  value/next fields labeled. Single <Figure>.
- draw: <FigureSequence>, 3 frames: inserting a node after position p — frame
  1 new node allocated, frame 2 new.next = p.next, frame 3 p.next = new; a
  final annotation on what breaks if frames 2-3 swap. Inspired by Sedgewick
  1.3 pointer traces.
- draw: doubly-linked delete-given-node — the two pointer reassignments
  around the removed node. Single <Figure>. Inspired by ODS Fig 3.4-3.5.
- draw: the operations scoreboard v1 — rows: array, singly linked, doubly
  linked; columns: access by index, search, insert/delete at front/back/known
  position. Single <Figure> (styled table). Inspired by 6.006 L02's
  accumulating table.
- draw: contiguous vs pointer-chased memory-access pattern sketch — one
  straight sweep vs scattered hops across a memory strip. Single <Figure>.
