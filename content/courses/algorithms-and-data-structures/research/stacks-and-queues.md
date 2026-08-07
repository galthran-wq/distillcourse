# Brief: stacks-and-queues

Goal: implement stack and queue ADTs and select between them by access
pattern. First pure "interface" lesson — LIFO/FIFO as disciplines, either
implementable on the previous lesson's structures.

## Sources to consult
- CLRS §10.1.3 (stacks and queues on arrays; underflow/overflow; circular
  wraparound).
- Sedgewick 1.3 (slides 55-59: Dijkstra's two-stack arithmetic-expression
  evaluator, worked on (1+((2+3)*(4*5))) = 101; postfix/Łukasiewicz aside;
  linked vs resizing-array implementations).
- Morin ODS §1.2.1 (Queue/Stack/Deque as restricted List interfaces),
  §2.3 (ArrayQueue: circular indexing via modular arithmetic).
- MIT 6.006 L02 for scoreboard continuity.

## Key points the lesson must cover
1. LIFO and FIFO are access disciplines over the same three operations
   (insert / remove / peek); the removal rule is the entire difference.
2. Stack on an array: top index, O(1) push/pop. Stack on a linked list: head
   insertion. Both worked briefly.
3. Queue on an array requires the circular-buffer trick (head/tail indices
   mod capacity) to avoid O(n) shifting; queue on a doubly linked list is
   trivial. Work the wraparound arithmetic concretely.
4. The call stack: function frames are a stack; deep recursion overflows it —
   the systems-level reason "recursion has a hidden data structure". This
   also pre-seeds DFS-via-stack (graph module).
5. Selection guidance: undo histories / matching brackets / DFS ⇒ stack;
   task scheduling / BFS ⇒ queue. Keep the applications one line each; BFS
   and DFS get <Ref> forward pointers.
6. Queue from two stacks with O(1) amortized per operation — state the trick,
   compute the "each element crosses each stack once" argument informally,
   and flag that the accounting is the next lesson's topic (E7 material).

## Worked examples and set pieces
- **Two-stack expression evaluator** (Sedgewick 1.3): the lesson's central
  worked example — a miniature interpreter from two stacks; full trace on
  (1+((2+3)*(4*5))). Ends with the one-line JVM/PostScript connection.
- **Bracket matching** as the parallel exercise (E1/L7 pair to the
  evaluator): push on open, pop-and-check on close.
- **Circular buffer wraparound** worked with a capacity-5 array and 8
  enqueue/dequeue operations crossing the boundary.
- E7 forward-reach exercise: the two-stack queue — reader computes total
  moves for a mixed op sequence and lands on amortized reasoning, named in
  dynamic-arrays-and-amortized-analysis (<Ref>).

## Pitfalls
- No priority queues here — explicitly out of scope until
  binary-heaps-and-priority-queues (say so at the close per L10c).
- Deques: one sentence, not a section.
- The evaluator handles fully parenthesized expressions only; do not drift
  into precedence parsing.

## FIGURE PLAN
- draw: stack vs queue side by side — same insert sequence, arrows showing
  which end removal takes; LIFO/FIFO labels bound by color to the removal
  arrows. Single <Figure>.
- draw: <FigureSequence>, 5-6 frames: two-stack evaluation of
  (1+((2+3)*(4*5))) — value stack and operator stack shown each frame; one
  push/pop event per frame; final frame shows 101 alone. Inspired by
  Sedgewick 1.3 slides 55-59.
- draw: <FigureSequence>, 3 frames: circular buffer on a capacity-5 array —
  fill to wrap, dequeue two, enqueue past the boundary; head/tail indices
  annotated with the mod arithmetic. Inspired by ODS §2.3.
- draw: call-stack growth during a recursive call chain — frames stacking,
  with the overflow line marked. Single <Figure>.
- draw: queue-from-two-stacks flow — inbox stack, outbox stack, the flip
  arrow; each element's two crossings marked. Single <Figure>.
