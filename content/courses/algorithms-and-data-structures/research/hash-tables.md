# Brief: hash-tables

Goal: explain expected-O(1) dictionary operations and the cost of collisions.
Closes the elementary-structures module — its L16 application slot: reading a
real production incident (HashDoS) against the theory.

## Sources to consult
- CLRS §11.1 (direct addressing — the idealized starting point), §11.2
  (chaining; Theorems 11.1-11.2: unsuccessful/successful search Θ(1+α)),
  §11.3 (hash functions: division, multiplication; universal hashing at
  mention level only), §11.4 (open addressing; linear probing and its
  deletion pitfall, Fig 11.6; Theorem 11.6 expected probes 1/(1-α)).
- CLRS §5.4.1 (birthday paradox: ~23 people for a shared birthday) — the
  collision-inevitability intuition.
- Sedgewick 3.4: Java's base-31 String.hashCode; separate-chaining vs
  linear-probing cost formulas; the HashDoS war story end to end
  (CVE-2012-2739, Crosby-Wallach 2003, the 2^N colliding-string family).
- CMU 15-210 L11: the pigeonhole/adversary argument — for ANY fixed hash
  function there exists a key set hashing to one bucket; randomization
  (universal hashing) as the principled fix. Use for the "is O(1) real?"
  section; keep universal hashing to a half-page forward pointer (course 2).
- MIT 6.006 L04: comparison-model Ω(log n) search lower bound — why hashing
  must leave the comparison model to beat it (strong opening motivation).

## Key points the lesson must cover
1. Direct-address tables: O(1) everything, O(|U|) space — untenable; hashing
   compresses U to m buckets, so collisions are forced (pigeonhole +
   birthday-paradox numbers).
2. Chaining: expected chain length α = n/m under simple uniform hashing;
   search Θ(1+α); derivation carried (indicator-style counting, kept light).
3. Open addressing: probe sequences, linear probing; clustering in one
   qualitative paragraph; deletion needs tombstones (Fig 11.6 pitfall as a
   worked micro-example).
4. Resizing at a load-factor threshold ⇒ amortized O(1) — the dynamic-array
   argument transplanted (reinforce, one paragraph + <Ref>).
5. What "expected" is doing: guarantee holds over hash-function randomness /
   the uniform-hashing assumption, not over inputs; a bad or predictable
   hash function gives worst-case O(n). The HashDoS incident is the receipts.
6. Hash functions in practice: division method, why m prime or power-of-two
   care; Java's 31 (prime + shift-subtract) as the real-world instance.
7. The trade named in the opening: hashing forfeits ordered operations
   (min, successor, range) — the gap the BST module opens with (L10c close).

## Worked examples and set pieces
- **Birthday paradox computation** (CLRS §5.4.1): 23 people ⇒ >50% shared
  birthday; recast as "how quickly a near-empty table collides."
- **HashDoS war story** (Sedgewick 3.4 slides 37-40): a POST request of
  colliding keys turns each insert into O(n) — Bro server DoS'd with less
  bandwidth than dial-up (Crosby-Wallach 2003); CVE-2012-2739. The L16
  application: state which theorem the attack weaponizes (worst case of
  chaining) and which fix restores the theory (randomized/keyed hashing).
- **Linear-probing delete gone wrong**: 5-slot table, three keys, delete the
  middle of a probe chain, search now falsely fails — then tombstones.
- E7 forward-reach: "store keys sorted and binary-search them" comparison —
  O(log n) with order vs O(1) without; the reader computes what hashing gave
  up, opening the BST module (<Ref> binary-search-trees).

## Pitfalls
- Do not derive universal hashing's collision bound (course 2 / CLRS 11.3.3);
  name the idea in one paragraph as the principled answer to the adversary.
- Perfect hashing, cuckoo hashing, tabulation: out of scope entirely.
- Keep probability machinery to expectations of indicator counts; no
  variance/concentration.
- α notation collides with the union-find lesson's inverse-Ackermann α —
  both are standard; add a disambiguating sentence in whichever ships later.

## FIGURE PLAN
- draw: key-space funnel — huge U mapped through h into m buckets, two keys
  landing in one bucket highlighted as the collision. Single <Figure>.
- draw: chaining table — bucket array with short lists; α annotated as
  average list length; the searched key's path highlighted. Single <Figure>.
  Inspired by CLRS Fig 11.3.
- draw: <FigureSequence>, 4 frames: linear-probing insert of three colliding
  keys, then a delete breaking the probe chain, then the failed search, then
  the tombstone fix. One change per frame. Inspired by CLRS Fig 11.6.
- draw: expected-cost curves vs load factor α — chaining 1+α vs linear
  probing ~(1+1/(1-α))/2 hit cost blowing up near α=1. Single <Figure>.
  Inspired by Sedgewick 3.4 formulas.
- source: algorithmspa-s1-hashdos-bugreport — crop the Red Hat Bugzilla
  ticket quadrant; save under figures/ as `hashdos-cve-2012-2739.png`.
  Reader must be able to see: the Bugzilla header, bug id 750533, and the
  CVE-2012-2739 designation. Placement: float right beside the war-story
  paragraphs. (Real incident artifact; a redrawing would falsify it.)
- draw: attack schematic — attacker-chosen colliding keys all chaining into
  one bucket while the other buckets sit empty; per-insert cost annotation
  growing linearly. Single <Figure>, directly under the war story.
