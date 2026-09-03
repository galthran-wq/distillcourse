# End-to-end design: harmful content detection — research brief

Lesson: `design-harmful-content` (module: canonical-designs, worked-practice, planned). Fourth of the module's four end-to-end case dissections (RESTRUCTURE AMENDMENT): full problem dissection in the engineering register — requirements → metrics → data → model → serving → monitoring — never interview prep. The one shape in the module that is NOT a ranking funnel: classification under extreme imbalance whose output is an enforcement action.
Goal: Produce a complete design for a harmful-content system — multimodal fusion, multi-task classification under extreme imbalance, a human review queue, and enforcement with appeals.

## Sources
- Aminian & Xu Ch.5 Harmful Content Detection (pp.93-114): the reference dissection — multimodal post framing; late fusion vs early fusion (Fig 5.5); one-binary-classifier-per-class vs multi-label vs multi-task heads on a shared backbone (Fig 5.11); severe class imbalance; user reports and appeals as data sources; recall-at-fixed-precision evaluation; the "~500 million posts published every day" scale argument for early fusion (enough data to learn the hard joint representation).
- Rules of ML #34: for binary filters, make short-term sacrifices for clean data — deliberately let ~1% of would-be-blocked content through to users specifically to harvest unbiased labels, versus learning only from user reports (which are sampling-biased). The lesson's most counterintuitive design move.
- DMLS Ch.4 (class-imbalance metrics and methods) — recall only; classical-ml and labels-and-feedback-loops own the machinery.
- Burkov Ch.9 §9.4 (monitoring for abuse: rate limiting, reputation, behavior classification) — one Remark on the adjacent abuse-detection layer.
- AI Engineering Ch.4 (pp.169-171): the safety/harm-category taxonomies (OpenAI/Llama Guard) — named once as the policy layer's vocabulary; and the NewsGuard cross-lingual gap (ChatGPT refused 6/7 misinformation prompts in English, complied 7/7 in Chinese) as the per-language-slice cautionary Remark.
- Course lessons this dissection assembles: offline-evaluation (PR curves, slicing, behavioral tests), labels-and-feedback-loops (report/appeal labels, active learning), problem-framing-and-baselines (the zero-rule trap at 99.95% prevalence), failures-and-drift (adversarial drift), monitoring-and-observability (prevalence tracking), batch-and-online-prediction (gate vs sweep serving modes).

## Key points
1. Requirements price the two errors separately: a missed harm (recall failure) and a wrongful takedown (precision failure) have different costs, different victims, and different appeal volumes — so the operating contract is per-class recall at a fixed precision, never accuracy; estimation from ~500M posts/day and sub-0.1% prevalence to flags/day and reviewer headcount. Two serving modes from one model: a synchronous pre-publication gate for the worst classes (latency-bound — batch/online recall) and an asynchronous post-publication sweep for the rest.
2. Framing as a maintenance decision (Aminian Fig 5.11): N per-class binary models (independent retraining, N× serving cost, consistent-per-class thresholds) vs one multi-label model vs multi-task heads on a shared multimodal backbone (shared representation, per-class heads and thresholds, one backbone to retrain) — and what onboarding a NEW violation class costs under each.
3. Fusion: early vs late, decided by data volume and by the meme — harmless text over a harmless image is harmful only jointly, which is exactly the case two unimodal classifiers plus a merge cannot see; at 500M posts/day there is enough signal to learn the joint representation. What late fusion still buys: per-modality debuggability and reuse (one Remark).
4. Data under extreme imbalance: label sources ranked by bias and cost — user reports (biased toward visible/reported harm types), reviewer verdicts (gold but scarce), appeal outcomes (second-opinion labels on the model's own positives); Rules #34's 1% pass-through as the unbiased estimator of what the filter misses; imbalance machinery (weights/resampling/focal) recalled in one Remark, not re-taught.
5. The human review loop as a designed component, not an afterthought: the model is triage — the queue ranked by severity × uncertainty (active learning shipped to production); reviewer capacity is a hard system constraint that BACKPROPAGATES into the threshold (queue-sizing arithmetic worked); verdicts and appeals flow back as labels with lineage.
6. Operations: prevalence (violating fraction of VIEWS, not posts) measured by sampled human review of unflagged traffic — never by the model's own outputs; per-language/per-format slice monitoring (the cross-lingual Remark); drift here is adversarial — evasion adapts to whatever ships (obfuscated text, cropped/perturbed images), so retraining cadence is a security parameter, and the enforcement action itself perturbs tomorrow's data (takedowns remove tomorrow's positives — a loop to declare).

## Set pieces & gems
- The meme as the early-fusion argument — one image, one sentence, the whole fusion decision.
- Rules #34's deliberate 1% pass-through — counterintuitive, quotable, and the exercise plan derives why it works.
- The queue-sizing arithmetic: flags/day vs reviewer throughput forcing the threshold — the clearest case in the course of an organizational constraint entering a PR curve.
- The zero-rule trap at 99.95% prevalence — problem-framing's baseline ladder returning with teeth.
- The NewsGuard cross-lingual compliance gap — why slices here are languages, and aggregate metrics hide the worst failures.

## Pitfalls
- Not a content-policy lesson: the harm taxonomy is named once (six categories, Llama Guard as vocabulary) and never litigated; the register stays clinical — the subject invites editorializing; do not.
- Class-imbalance techniques: recall only; classical-ml owns SMOTE/weights/focal.
- No CV/NLP backbone zoology — the multimodal encoder is a given component with a cost, not an architecture lecture.
- Fairness/bias auditing of enforcement across demographic slices: one Remark pointing to privacy-and-fairness (extra lesson) — do not duplicate it here.
- Engineering register; no interview dialogue; every rate carries its denominator (posts vs views vs flags).

## FIGURE PLAN
- draw: THE integrity system in one diagram with numbers: post → multimodal backbone (early fusion) → per-class heads → threshold router {block / review queue / pass} → human review → enforcement + appeals, with every label flow (reports, verdicts, appeals, 1% pass-through) drawn back into training. Single <Figure>; original, informed by Aminian Fig 5.1.
- draw: Early vs late fusion on one meme: left, two unimodal classifiers each scoring low and a merge that cannot recover; right, the joint representation scoring high; the fusion point marked in each. From Aminian Fig 5.5.
- draw: FigureSequence (3 frames): the operating point — frame 1 a per-class PR curve; frame 2 the fixed-precision line and the recall it buys per class; frame 3 the reviewer-capacity budget line moving the threshold, with the queue overflowing when capacity is ignored. Original.
- draw: The review-queue triage: flagged items ranked by severity × uncertainty, the capacity cut-line, what falls below routed to the async sweep; verdicts flowing back with lineage tags. Original.
- draw: The adversarial clock: recall decaying over weeks after each ship as evasion adapts (obfuscations sketched), the retrain resetting it — contrasted with benign drift's slower curve on the same axes. Original, informed by failures-and-drift.

## EXERCISE PLAN
1. Warm-up: 500M posts/day, prevalence 0.05%, one class's model at recall 0.90 / precision 0.60 at the chosen threshold — compute true violations caught/day, total flags/day, false positives/day, and reviewer-days at 300 decisions per reviewer-day.
2. Boundary probe: hold precision at 0.99 for the rarest class (50 true positives/day) — trace on a PR curve what recall survives, show why one global threshold across classes is forced into nonsense, and state the degenerate case where human review of EVERY flag is cheaper than modeling.
3. Claim to refute: "the classifier is 99.95% accurate; ship it." The zero-rule baseline IS 99.95% at this prevalence (baseline-ladder recall) — rebuild the evaluation as per-class recall at fixed precision plus prevalence, and state what accuracy would have hidden.
4. Derivation the lesson skipped: show that training only on user-reported content selects on the label's visibility (harms nobody reports are never learned), then derive why Rules #34's 1% uniform pass-through yields an unbiased prevalence estimator for what the filter misses — and compute its 95% CI at 1% of 500M/day with prevalence 0.05%.
5. Research-shaped: design the experiment that proves the joint representation is doing the work on memes — test set of text+image pairs harmful only jointly, with unimodal-scrambled controls (right text, wrong image); state the accuracy pattern that confirms early fusion and the one that indicts it.
6. Mixed/spaced (E3): enforcement feeds back — takedowns remove exactly the content that would have been tomorrow's positives, shifting $P(Y)$ in the training stream. Classify this with M6's shift taxonomy, and name the monitoring signal that distinguishes it from a real prevalence drop (the sampled-review estimate diverging from the flag rate).
7. FORWARD (E7): wrap the same contract around a model's OWN outputs: score every generation against the harm categories at recall-at-fixed-precision before it reaches the user, inside the response's latency budget. What you specified is an output guardrail — a layer of module 8's reference architecture. Solution → Ref ai-application-architecture.

## ARC
- Inherits: evaluation beyond accuracy (PR operating points, slicing) from offline-evaluation; label sources, active learning, and loop length from labels-and-feedback-loops; adversarial drift from failures-and-drift; the gate-vs-sweep split from batch-and-online-prediction.
- Contributes: the integrity shape — asymmetric error pricing, multimodal multi-task classification under extreme imbalance, and the human review loop as a designed system component with its own capacity arithmetic.
- Hands off: the module's synthesis composes the dissected shapes at video scale → design-video-recommendations; the recall-at-fixed-precision contract returns as module 8's output guardrails.
- Spine step: "The standard shapes…" (step 8, The canonical shapes).
