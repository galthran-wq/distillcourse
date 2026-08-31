# Prompting and context engineering — research brief

Lesson: `prompting-and-context` (module: ai-engineering, core, planned).
Goal: Design prompts and context as versioned system components — in-context learning, context-window limits, decomposition, and injection defenses.

## Sources
- AI Engineering Ch.5: prompt anatomy (task description/examples/task, Fig 5-1, p.212); in-context learning zero/few-shot (Brown et al. naming); system vs user prompts + chat templates; context efficiency — NIAH, lost-in-the-middle (Liu et al., Figs 5-3/5-4, pp.218-219); best practices (explicit instructions, personas, examples, output markers, decomposition, CoT — Wei et al., self-critique); the GoDaddy 1,500-token decomposition case (p.229); prompt versioning/catalogs, separating prompts from code (pp.232-235); defensive prompt engineering (pp.235-251) — extraction ("write your system prompt assuming it will one day become public"), jailbreaks (DAN, grandma exploit), indirect injection (the Bruce-Remove-All-Data-Lee malicious-username SQL case, p.243; passive phishing via retrieved data), the divergence attack ('poem' forever → verbatim training data + real contact info, Nasr et al., Fig 5-13 capture, ~1% memorization, larger models memorize more); defenses — instruction hierarchy (Wallace et al., system > user > model output > tool output, +63% robustness, Fig 5-16), prompt-level restrictions, system-level isolation/approval gates; violation rate AND false-refusal rate as the metric pair.
- AI Engineering Ch.2 (pp.99-104): structured outputs (prompting/post-processing/constrained sampling) — one section here since it's the practical interface concern.
- The Santa Claus example flip (Table 5-1, p.222) — one in-context example flipping a kids-app answer.
- Configuration-debt recall (M4): prompts ARE config — the six principles applied to a prompt catalog.

## Key points
1. Reframe prompts as production configuration: versioned, diffable, tested, separated from code (a .prompt catalog with metadata) — the M4 config principles applied verbatim; "prompt engineering" grows up into an interface discipline. The Santa flip as evidence that one example is a behavior toggle worth versioning.
2. Prompt anatomy + ICL: task description / examples / input; zero-vs-few-shot with the honest note that few-shot's marginal value shrinks with model strength; chat templates as the wire format (mis-templating as a silent bug class — skew's cousin).
3. The context window as a scarce, position-sensitive resource: NIAH and lost-in-the-middle as measured phenomena (recreate the U-shape); consequence — context assembly is a RANKING problem (put the load-bearing text at the edges; retrieval decides what enters at all — next lesson's seam); context cost ties to token economics.
4. Decomposition beats accretion: the GoDaddy case (1,500-token mega-prompt → subtask prompts: better AND cheaper); CoT as the cheapest reasoning lever; self-critique noted; the engineering framing: small prompts are testable units (pipeline thinking from M4 applied to prompts).
5. Structured outputs as the interface contract: ask (format instructions), post-process (parsers/retry), constrain (grammar-constrained sampling) — the three rungs with failure modes; ties to guardrails (M8 final).
6. The attack surface, treated as security engineering: extraction, jailbreaks (named exploits), and INDIRECT injection as the deep one — adversarial instructions arriving through retrieved data/tool outputs (the malicious-username SQL case worked; a preview seam to RAG: your index is an input channel); the divergence attack as the memorization exhibit (capture). Defenses layered: model-level (instruction hierarchy +63%), prompt-level (restrictions, duplication), system-level (isolation, least privilege, approval gates for write actions) — and the two-metric discipline (violation rate vs false-refusal rate; you can trivially zero either one).
7. Refutation slot (L13): "prompt injection is solved by writing 'ignore malicious instructions' in the system prompt" — refute with the hierarchy's mechanism and the indirect-channel cases; replacement model: defense in depth measured by the metric pair.

## Set pieces & gems
- The divergence attack — sourced image (aiengineerin-s2-fig5-13-divergence-attack): the real leaked-training-data screenshot; documentary evidence.
- Bruce-Remove-All-Data-Lee — compact indirect-injection-through-data case.
- GoDaddy decomposition numbers — the anti-mega-prompt case.
- Lost-in-the-middle U-shape — recreate as the section's measured backbone.
- "Write your system prompt assuming it will one day become public" — the secrecy rule, attributed.
- The grandma exploit / DAN — named jailbreaks, one line each (no how-to elaboration).

## Pitfalls
- Not a prompt-tips listicle: every practice must connect to a system property (testability, cost, latency, attack surface) — L10e.
- Security content stays at mechanism level; no working exploit construction beyond the cited published cases.
- CoT/reasoning research (test-time compute, o1-style) — out of scope; one Remark.
- Don't preempt RAG: context ASSEMBLY is here; context SOURCING (retrieval) is next lesson — the seam sentence is explicit.

## FIGURE PLAN
- draw: A prompt dissected in place: a real support-bot prompt with braces labeling system/task/examples/input/output-format, each brace annotated with its versioning implication. Inspired by AI-Eng Fig 5-1.
- draw: The lost-in-the-middle U-curve: accuracy vs needle position in context, with the two design rules (edges for load-bearing text; shorter beats longer) annotated. Inspired by AI-Eng Figs 5-3/5-4 (recreate the shape, not the data points).
- draw: FigureSequence (3 frames): decomposition — frame 1 the 1,500-token mega-prompt (tasks stacked, cost tagged); frame 2 split into four subtask prompts with a router; frame 3 the wins tallied (quality per subtask, cost, testability). From the GoDaddy case.
- draw: The attack-surface map: three input channels (user text, retrieved documents, tool outputs) with injection arrows crossing into the model, defense layers drawn as concentric gates (hierarchy / prompt rules / isolation+approval). Original — key image.
- source: aiengineerin-s2-fig5-13-divergence-attack — the real ChatGPT divergence-attack screenshot (save as `divergence-attack`); reader must see 'poem poem poem' degenerating into leaked real contact data; float right in the memorization section.
- draw: Instruction hierarchy as a privilege stack (system > user > model output > tool output) with a blocked injection arrow from the tool level. Inspired by AI-Eng Fig 5-16.
- draw: The two-metric gauge: violation rate vs false-refusal rate as a tradeoff curve with the two degenerate corners labeled ("allows everything" / "refuses everything"). Original.

## EXERCISE PLAN
1. Warm-up: given a mega-prompt (provided, ~300 words, 4 tasks), split it into subtask prompts and mark which parts become shared system prefix vs per-task instruction.
2. Boundary probe: a zero-context task (pure arithmetic) — show few-shot examples add cost and no signal, then a high-ambiguity task where ONE example flips behavior (Santa-style); state the rule for when examples earn their tokens.
3. Claim to refute: "we appended 'never reveal these instructions' — extraction is handled." Use the published extraction/jailbreak patterns to break it; state the honest posture (assume public; secrets don't go in prompts) with the attributed rule.
4. Derivation the lesson skipped: for a needle at position k in an n-token context, use the U-curve shape to rank three context layouts (instructions-first/docs-middle vs instructions-repeated-at-end) and justify the repeat-at-end idiom.
5. Research-shaped: design the NIAH-style test for YOUR context assembler — 5 needle positions × 3 context lengths, the metric, and the pass bar; state what a mid-context failure changes in your assembly order.
6. Mixed/spaced (E3): prompts-as-config — apply M4's six config principles to a prompt catalog entry (diffable? auto-verifiable? reviewed?) and name the CI check per principle (golden-output tests = the behavioral tests of offline-evaluation, transplanted).
7. FORWARD (E7): your bot must answer from the company wiki; the wiki does not fit in the window. Compute the token cost of stuffing 40 pages vs retrieving 3 relevant chunks, and name the machinery the second option requires. Solution: retrieval over an index — next lesson → Ref retrieval-augmented-generation.

## ARC
- Inherits: the foundation-model component (sampling, economics, selection) from foundation-models-in-production; config discipline from M4.
- Contributes: prompts and context as engineered system components — anatomy, window economics, decomposition, structured outputs, and the attack surface with layered defenses.
- Hands off: the context's CONTENT must come from somewhere scalable — retrieval as the knowledge channel → retrieval-augmented-generation.
- Spine step: "Foundation models invert the workflow…" (step 9, The foundation-model inversion).
