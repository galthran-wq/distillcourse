# one-class-and-reconstruction — ledger

**Problem.** With one class only, how is a boundary fitted (no second class) and how is a reproducing network kept from copying; what are their scores worth on the simulator with and without labels; does such a score help a supervised network? Answer: Gaussian kernel puts every payment on one patch of the unit sphere, the origin plays the anomalous class (one-class SVM; ν bounds share outside / support vectors; SVDD same region for constant k(x,x)); shape set by kernel width and by the training sample (dense fraud gets enclosed); autoencoder 15-100-20-100-15 is accurate where training payments were (code of 20 > 15 inputs, so not a width bottleneck, but a ReLU code copies only where its hinges are active: copying 15 signed inputs everywhere needs ≈30 units); on the simulator no label-free score beats the squared distance from the training mean; larger numbers lean on label-built inputs or label-cleaned samples; fusion moved only AUC.

## Explained
- Obvious attempts fail: SVM needs a second class; a 15→15 network copies — intro only (the AE section opens instead on: not copying is not enough, the network must fail on the right payments)
- Evaluation stream stated up front (Ref isolation-forest#the-setup): lab run seed 0, train days 42–48 (68,898, labels unused), test days 56–62 after known-card removal (60,212 / 440, 0.73%); 15 inputs vs 12 label-free (minus the three label-built delayed terminal rates) — intro
- SVM recalled from classical-ml (margin, slack, kernel) in one sentence — §A boundary with only one class
- Gaussian kernel k = exp(−γ‖x−x'‖²): k(x,x)=1 ⇒ unit sphere; k>0 ⇒ angles < 90° (squared difference of two standardised values averages 2 = variance of a difference of two independent unit-variance values; γ = 1/p because standardised pairs sit at squared distance ≈ 2p, so typical k ≈ e^-2 = 0.14; also the library default; γ = 1/15: distance 1 → 21°, distance 5 → 79°); separability: mean image m = (1/n)Σφ(x_j) has m·φ(x_i) = mean_j k(x_i,x_j) > 0, so a hyperplane normal to m, shifted slightly, separates all images from the origin ⇒ origin = second class (figure origin.svg) — ### Every payment lands on one patch of a sphere
- Definition one-class SVM (primal with ½‖w‖² − ρ + (1/νn)Σξ_i; inside iff w·φ(x) ≥ ρ); reading of terms — same ###
- Dual: ∂/∂w = 0 ⇒ w = Σα_iφ(x_i) (no y_i: every constraint has the same sign) ⇒ w·φ(x) = Σα_i k(x_i,x); ∂/∂ρ of the Lagrangian = 0 ⇒ Σα_i = 1; slack price 1/(νn) becomes the cap on α_i (as C in the two-class dual); f(x) = Σα_i k(x_i,x) − ρ; KKT (outside ⇒ α at cap) — ### What ν controls
- Theorem (with counting proof): fraction outside ≤ ν ≤ fraction of SVs; measured on 10,000 payments of days 42–48, γ = 1/15: ν 0.01/0.05/0.2 → outside 1.3/5.0/20.0%, SVs 2.1/5.3/20.1% (0.01 excess = solver tolerance on boundary SVs) — same ###
- f as a sum of Gaussian bumps on support vectors (527 of 10,000 at ν = 0.05); verdict too coarse: test week 4.7% outside = 68% of frauds + 4.3% of genuine ≈ 400/day; score = −f(x) — ### A sum of bumps
- SVDD defined; derivation ‖φ−a‖² ≤ R² ⇔ a·φ ≥ ½(1 + ‖a‖² − R²) for unit-norm images ⇒ same regions as OC-SVM for Gaussian (constant k(x,x)) kernels — ### The smallest sphere
- KeyFact: origin works as second class only because k(x,x) constant and k > 0 (Gaussian); ν bounds the count outside (at most ν); which payments fall outside and the shape depend on γ and the training sample as well as on ν
- Width: framing panel (b) revisited (Ref three-planar-experiments); ring toy 8 clouds × 40 pts + 3 central anomalies, ν = 0.05: γ = 0.05 one disc (centre inside, 4.7% out), γ = 2 eight islands (centre outside, 5.3% out); width unidentifiable without anomalies; on payments γ = 1: 64% SVs, 65% of the test week's genuine outside, ranking AP 0.27 vs 0.32 at γ = 1/15 (figure ring-width.svg) — ### The width decides between a ring and islands
- Regimes for the boundary (Ref framing label regimes): fitted to all vs genuine rows (needs training labels); AP 15 inputs 0.32 → 0.53, 12 label-free 0.13 → 0.14; dense compromised-terminal frauds (high delayed terminal rate) earn their own SVs and get enclosed = panel (c) for a boundary; labels used twice on 15 inputs — ### Fraud inside the training sample is enclosed
- Cost: quadratic fit (0.47 s for 10,000, 1.9 s for 20,000; ~20 s for a 68,898-row week; 12M out of reach without sub-sampling); scoring ∝ #SV — ### What the boundary costs
- Replicator network / autoencoder: encoder, code, decoder; Definition reconstruction error ε(x) = (1/p)Σ(x_j − o_j)² (ε, not δ: δ is the label delay); standardise first (Ref density scale section, neural-tabular scaler) — ### What stops the copying
- 15-100-20-100-15 (ReLU, linear output); Example: one training payment (night flag 2.18), squared differences 24.0e-5 and 15.9e-5 largest, sum 70.9e-5, ε = 4.7e-5 (figure funnel.svg, key image); code 20 > 15 inputs so the bottleneck argument does not apply, yet a ReLU unit passes nothing on its flat side: x = max(0,x) − max(0,−x) needs two hinges per signed input, ≈30 units to copy 15 inputs everywhere; 20 units copy only where their hinges are active, and training places that region on the training payments ⇒ accurate only there; training data, not code width, decides — ### The network used on the simulator
- Training: MSE, Adam 1e-4, batch 64, early stopping patience 2 on a held-out tenth's reconstruction loss (no labels); last-epoch weights kept, not best: weights 3 epochs past the best (patience 2), no better on held-out loss; 49 epochs, 45 s; mean error 0.96 → 0.00007; FigureSequence recon-1..3 + Task: untrained medians 0.71 vs 7.5 (≈10×), trained 1.3e-5 vs 6.4e-4 (≈50×), daily top-100 cut ≈7e-4 keeps 215 frauds + 485 genuine over the week — ### Training it
- Untrained error ≈ mean square of standardised inputs = squared distance from training mean; that no-model score AP 0.31 vs trained AE 0.21–0.29 (3 seeds); KeyFact: AE no better than distance to the mean; genuine-only AE AP 0.52 — same ###
- Models compared (stream already given in intro): AE 3 seeds; OC-SVM γ = 1/p, ν = 0.05, 10,000 rows; IF 100 trees ψ 256; distance to mean; labelled net 500 units, dropout 0.2, Adam 1e-3, batch 64, 20 epochs, 5 seeds — §What the scores are worth / ### The models compared
- Table (AUC/AP/CP@100): 12 inputs all rows — IF 0.60/0.03/0.05, AE 0.61/0.05/0.06, OC-SVM 0.64/0.13/0.07, distance 0.61/0.13/0.07; genuine rows — AE 0.64/0.15/0.07, OC-SVM 0.64/0.14/0.07; 15 inputs all rows — IF 0.84/0.26/0.27, AE 0.86/0.26/0.28, OC-SVM 0.87/0.32/0.30, distance 0.85/0.31/0.31; genuine — AE 0.88/0.52/0.31, OC-SVM 0.87/0.53/0.31; labelled net 0.89/0.70/0.34 (figure scores.svg) — same §
- Three readings: label-free ≈7 compromised cards/day vs 34; OC-SVM and distance tie at AP 0.13, IF 0.03 and AE 0.05 trail; 15-input rows read labels (AE top-100: 195 of 215 frauds compromised-terminal; 91% of honest top payments at terminals with nonzero delayed rate vs 10% of stream); cleaning the sample is the biggest effect and needs labels; AUC near supervised, AP a third (Ref isolation-forest a-decent-ranking-a-poor-top) — ### Three readings of the table
- 2018 file run (setup: train 11–17 Jul 2018, scored 25–31 Jul with removal = neural-tabular hold-out geometry; AE early-stopped on scored week's reconstruction loss, no labels, last-epoch weights; stated that the two AE runs stop on different signals): error 0.93 → 0.00008, fraud/genuine mean 27× (1.8e-3 vs 6.9e-5); AE 0.836/0.18/0.217, IF 10 trees, ψ 256 (library default), fitted on the 15 inputs of 11–17 Jul without labels, 0.808/0.164/0.19, labelled net (1,000 units, dropout 0.2, stopped on the scored week's labelled loss → slightly optimistic) 0.859/0.646/0.28 — ### The same comparison on the 2018 simulator file
- 2-D code: motivated as "error says how unusual, not in which way; does the code separate kinds of fraud?"; 15-100-2-100-15 loss 0.36; genuine in a dense corner, frauds along rays (figure code2d.svg); 10 k-means on training codes: three of five far clusters mostly fraud (35/36, 68/124, 92/176), the other two 25/139 and 17/160; all five ≥ 11% vs base rate 0.73%; steep ray = 35 leaked-card (×5 amount) frauds, mean std amount 10.7, card 1-day avg 8.8; shallow rays (4 clusters) = 202 compromised-terminal frauds, largest delayed terminal rate 3–14 sd above training mean, genuine payments there are honest payments at the same terminals; the 26 amount>220 frauds reach no ray — §The code as a picture
- "Semi-supervised" second meaning (unlabelled + labelled combined) disambiguated from framing's normal-only meaning; three arrangements (rank average; error as 16th input; shared code with decoder + fraud head) (figure fusion.svg) — §Does an unlike-normal score help…
- 2018-file 16th-input result 0.859/0.646/0.28 → 0.861/0.651/0.276 confounded (1,000 vs 100 hidden units); lab run setup per arrangement (seeds 0–4; every simulator training row labelled; error = seed-0 AE on all rows; 500-unit net, dropout 0.2, Adam 1e-3, batch 64, fixed 20 epochs; 16th input = log error standardised on training week; two heads = encoder 15-100-20 + decoder 20-100-15 + one sigmoid unit on the code, loss MSE + BCE equal weight, Adam 1e-3, batch 64, fixed 20 epochs, no early stopping): labelled 0.894±0.004/0.699±0.014/0.343±0.006; rank average 0.891/0.548/0.312; 16th input 0.901/0.704/0.343 (AUC +0.004…0.009 every seed); shared code 0.895/0.689/0.339; error is a function of the same inputs → no new information; KeyFact: helps only for fraud the labels lack or far more unlabelled than labelled data; the simulator (all scripts labelled, every row labelled) has neither — ### What the sixteenth input added

## Notation
- φ feature map, k kernel, γ Gaussian width (γ = 1/p for p standardised inputs), w, ρ hyperplane, ξ_i slack, ν, n training size, α_i dual weights, f(x) decision function (score −f)
- a, R SVDD centre and radius
- o reconstruction, ε(x) reconstruction error, p number of inputs, code
- A, B (exercise 4) linear AE matrices, q code size; y_i, λ_i principal coordinates (from density lesson)

## Running cases
- Lab simulator run (seed 0), IF-lesson geometry; all tables above
- Ring toy (seed 0, 8 clouds at radius 3, sd 0.15, 40 each, anomalies (0.2,−0.1), (−0.3,0.25), (0.1,0.4))
- Handbook row and its reconstruction (funnel example), ε = 4.7e-5
- 2-D code clusters on test week: A 36/35, B 124/68, C 176/92, D 139/25, E 160/17, rest 59,577/203 (exercise: A alone 0.97 precision, 5/day, 8% of frauds; A–C 0.58, 48/day, 44%; A–E 0.37, 91/day, 54%)
- Exercises: one-hinge toy o(x) = max(0, x+2) − 2 (errors 0, 0, 9); ν edges (ν = 1 → α = 1/n, kernel density; ν → 0 encloses all); refutation of "AE on all rows reconstructs fraud" (50×, 27×; partly true: 0.26 → 0.52); linear AE = PCA subspace, error = unweighted minor-component score; 16th-input confound design; calibration of the error (Platt/isotonic on labelled hold-out, AP/CP unchanged); polynomial-kernel SVDD threshold depends on k(x,x)

## Assumed
- classical-ml: SVM margin, slack, kernel trick, dual/KKT (named in plain text), PCA optimality, Platt/isotonic
- isolation-forest: setup, label-free vs 15-input tables, which frauds reach the top, decent-AUC/poor-top argument, PCA exercise
- anomaly-detection-framing: label regimes, rarity assumption, planar panels (b), (c)
- density-and-distance-scores: shared scale, quadratic cost, minor-component score
- neural-tabular-detectors: scaler, Adam, early stopping, hold-out geometry, grid's dropout/epoch slice
- point-in-time-features: delayed terminal fraud rate (label-built)
- alert-budget-metrics: CP@100, five-model weeks of the 2018 file
- worldline-model-comparison (exercise 5): weeks differ more than seeds
- undersampling-calibration (exercise 7): β correction does not apply

## Left open
- Real card data (ULB), the cluster rule's 71% cluster → ulb-unsupervised-scores (forward exercise 6)
- numpy autoencoder / isolation forest from scratch → anomaly-scorers-lab
- Representation learning of sequences → sequence-models-for-transactions
- Not taught: variational autoencoders, robust SVMs, kernel Fisher discriminant, choosing γ/ν on prequential folds (named only by analogy to ψ)

## Notes for the syllabus owner
- course.yaml key_ideas say the AE was "trained on genuine rows"; in the source run it is trained on all rows of the training week (unsupervised regime). The lesson states this and reports both regimes.
- The 2018-file numbers are on the hold-out week (25–31 Jul), not the 8–14 Aug test week.
