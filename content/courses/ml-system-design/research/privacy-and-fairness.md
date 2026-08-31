# Privacy, fairness, and responsible ML — research brief

Lesson: `privacy-and-fairness` (module: operations, EXTRA, planned). Off-path chapter; core path survives skipping it.
Goal: Assess an ML system's privacy and fairness obligations — anonymization limits, differential privacy, federated learning, model cards — against documented failures.

## Sources
- DMLS Ch.11 (pp.339-354): the Strava heatmap (a billion "anonymized" activities exposing military bases); the Ofqual A-level auto-grader post-mortem — three named failure modes (wrong objective: school-fairness over student-accuracy; insufficient fine-grained evaluation; no transparency); sources-of-bias taxonomy; compactness-vs-fairness (pruning disproportionately hurts underrepresented classes — Hooker et al.) and privacy-vs-accuracy (DP costs subgroups — Bagdasaryan & Shmatikov); model cards full schema (Mitchell et al. 2018).
- Burkov Ch.3 §3.2.4: PULSE/Obama (capture available) — selection bias in a generative model; the bias taxonomy (take selection/self-selection/labeling only).
- MLPS Ch.17 (pp.301-314): PII vs sensitive data; the anonymity spectrum (pseudonymization → de-identification → anonymization, Fig 17-1); GDPR Article 17 right-to-be-forgotten and its ML consequences (retrain vs anonymize vs delete; lineage recalled); epsilon-delta DP; randomized response (Fig 17-2 coin-flip protocol); DP-SGD (clip+noise) one paragraph; PATE one Remark; federated learning — protocol, Gboard, criteria; Ch.8 informational/behavioral harms (membership inference, model inversion/extraction; poisoning/evasion — one section with the stop-sign/ostrich captures if wanted... note adversarial images better fit as a Remark here since no dedicated security lesson exists).
- MLDP DP30 Fairness Lens (pp.569-596): naturally-occurring vs problematic bias; the five bias types (esp. proxy bias — removing race/gender makes bias HARDER to catch); demographic parity vs equality of opportunity via classification thresholds; the mortgage worked audit (94.0% vs 85.4% F1 disparity — What-If capture); allow/disallow list fixes (Translate gender — capture); Model Cards.
- Offline-evaluation lesson (invariance tests, slices) — the machinery this lesson turns onto protected attributes.

## Key points
1. Open with Strava: worked-as-designed, leaked state secrets — aggregation ≠ anonymization; the lesson's claim: privacy and fairness are system properties requiring their own evaluations, not good intentions.
2. Three audits as the backbone (each: what was built → what failed → the checkable practice that would have caught it): Strava (re-identification by context; the anonymity spectrum introduced here), Ofqual (three failure modes mapped to course concepts: objective choice = M1 framing; fine-grained evaluation = slices; transparency = model cards), PULSE (training-data selection bias; the capture as evidence).
3. Fairness operationally: metrics from the confusion matrix per group — demographic parity (equal positive rates) vs equality of opportunity (equal TPR) — computed on the mortgage example's real numbers; the threshold-per-group mechanics; the PROXY-BIAS inversion (deleting the sensitive column hides bias in correlates and destroys your ability to measure it) — the lesson's refutation slot (L13: genuine, prevalent misconception).
4. Privacy mechanisms by increasing machinery: the anonymity spectrum; k-anonymity's failure by linkage (Strava recalled); differential privacy via randomized response fully worked (coin-flip protocol; recover the population estimate; epsilon as plausible-deniability budget); DP-SGD in one paragraph; federated learning (Gboard) with its honest limits (updates can leak; DP on top).
5. The tradeoffs made measurable: compression hurts rare classes (ties to model-compression — a fairness reason to re-run slice evals after quantization/pruning); DP hurts subgroups; both are slice-evaluation obligations, closing the loop to offline-evaluation.
6. Operational deliverables: the model card schema (walked on the mortgage model); GDPR deletion as a lineage query (tracking lesson recalled); membership-inference/extraction named as the attack class motivating all of it (one Remark, with the diffusion-memorization capture as optional evidence).

## Set pieces & gems
- Strava heatmap — flagship narrative.
- Ofqual three-failure-mode post-mortem — a ready audit template.
- machinelearn-pulse-obama-bias capture — the un-redrawable evidence.
- Randomized response worked end to end — the one derivation the lesson owns.
- machinelearn-s4-fig7-14-whatif-fairness-tab capture — a real fairness audit's real numbers.
- machinelearn-s4-fig7-16-google-translate-gender capture — a shipped fix.
- The proxy-bias inversion — the counterintuitive keeper claim.

## Pitfalls
- Extra lesson, but must not moralize (L9): every claim rides a documented case or a computable metric.
- Adversarial ML (poisoning/evasion) gets one Remark — no security course smuggled in.
- DP: randomized response fully, DP-SGD at mechanism level, NO epsilon calculus beyond the definition.
- Fairness-metric impossibility results (can't have all parities at once): one honest Remark, not a theorem tour.

## FIGURE PLAN
- source: machinelearn-pulse-obama-bias — the PULSE upscaling result (save as `pulse-obama`); reader must see the pixelated input and the white-passing output — selection bias as evidence; centered in the audits section.
- draw: The anonymity spectrum as a labeled axis (raw → pseudonymized → de-identified → anonymized) with the linkage-attack arrow showing Strava's failure point. Inspired by MLPS Fig 17-1.
- draw: FigureSequence (3 frames): randomized response — frame 1 the coin-flip protocol tree; frame 2 observed yes-rate composed of truth + noise; frame 3 the population estimate recovered with the algebra on-figure. Inspired by MLPS Fig 17-2.
- draw: Fairness metrics from two confusion matrices (group A / group B): demographic parity and equal opportunity computed side by side, with per-group thresholds drawn on score distributions. Inspired by MLDP DP30.
- source: machinelearn-s4-fig7-14-whatif-fairness-tab — the What-If fairness audit (save as `whatif-fairness`); reader must see the real 94.0/85.4 F1 disparity panels; float right in the fairness-audit section.
- draw: The proxy-bias inversion: model with race column (bias visible, measurable) vs column deleted (bias flows through zip/income, now unmeasurable) — two causal-graph panels. Original.

## EXERCISE PLAN
1. Warm-up: compute demographic parity and equal-opportunity gaps from two given per-group confusion matrices; state which metric each stakeholder (regulator, applicant) would cite.
2. Boundary probe: set the two groups' score distributions identical — show all fairness metrics coincide, and derive why any base-rate difference forces a choice between parities (the impossibility Remark made concrete on numbers).
3. Claim to refute: "we removed gender and race from the features, so the model can't discriminate." Use the proxy-bias inversion + the Berkeley-mortgage result (offline-evaluation recall) to name what was lost (measurement) and what remains (correlated signal); prescribe the invariance-test design instead.
4. Derivation the lesson skipped: for randomized response with honest-answer probability 3/4, derive the unbiased estimator of the true rate and its variance inflation vs direct asking; evaluate at observed 40% yes.
5. Audit drill: run the Ofqual template (objective / fine-grained eval / transparency) against the Supermegaretail forecast — write the three findings a responsible-AI review would file (e.g., small-store slice systematically under-forecast = stockouts in poor neighborhoods).
6. Research-shaped: from the What-If capture's numbers, compute the per-group F1 gap and propose the threshold adjustment achieving equal opportunity; state what other metric that adjustment degrades.
7. Mixed/spaced (E3): GDPR deletion request arrives for user U — trace the lineage-graph procedure (experiment-tracking recall) and state where stateful continual training (continual-learning recall) complicates it.

## ARC
- Inherits: slices and invariance tests (offline-evaluation), lineage (tracking), compression tradeoffs (model-compression) — machinery now turned on obligations rather than performance.
- Contributes: the audit templates, fairness metrics, and privacy mechanisms — evidence-first.
- Hands off: nothing on the core path requires this chapter (extra by construction); its slice-audit habits reappear implicitly wherever evaluation does.
- Spine step: "Deployment is the beginning, not the end…" (step 7, Closing the loop) — starred appendix to the step.
