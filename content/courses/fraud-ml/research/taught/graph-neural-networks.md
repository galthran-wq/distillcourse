# graph-neural-networks — ledger

**Problem.** Hand-built neighbour aggregates (max drifts with degree, mean
hides the outlier; Elliptic's 72 guessed columns) and the exposure walk
(shares α, 1−α and the graph's parts fixed before any label; pushes
suspicion onto auction accomplices; stated in words in the intro) are
summaries chosen in advance: can a network learn the summary, as a
convolution does for pixels, and what does one layer compute? Answer: a
graph has no positions, so a layer may only aggregate over sets; one GCN
layer is H' = σ(ÂHW), Â = D̃^{-1/2}(A+I)D̃^{-1/2}; the graph fixes how
neighbours are combined, W (learned) fixes what is combined; the skip term
X W̃ makes logistic regression on the node's own features one setting;
two layers = two hops, more layers smooth toward degree; trained with a
loss on labelled (core) nodes, inductive, on sampled neighbourhoods. On
Elliptic the forest on hand-built aggregates (illicit F1 0.788) beats
Skip-GCN 0.705 and GCN 0.628 (below the no-graph network 0.649/0.653);
on AMLworld PNA without hand features is below XGBoost + graph features
on all four worlds, below LightGBM on HI-Small and LI-Small, level with it
on HI-Medium and above it on LI-Medium, at ~1,000 GPU hours.

## Explained
- Convolution explained from scratch (3×3 filter = nine position-indexed weights, same at every pixel, set by training); 1-D version Ref'd to worldline three-rows — intro
- Image as graph: 5×5 grid, inner pixel 8 neighbours in fixed positions, banded adjacency (pixel 13 ↔ 7, 8, 9, 12, 14, 17, 18, 19) (figure grid.svg) — §A convolution needs positions; a graph has none / ### An image is a graph…
- Adjacency matrix as input fails: n² size (Ref fraud-as-a-graph 10^12 vs 30M lines) and order: 4-node graph (1–2, 1–4, 2–4, 3–4) has 24 numberings, 12 distinct matrices (1↔2 automorphism), up to n! (figure orderings.svg) — ### Why the adjacency matrix cannot be the input
- Definition: permutation-invariant aggregation (sum, mean, coordinate-wise max; repeats allowed); table on RAW values {0.9}, {0.9,0.9,0.9}, {0.9,0.1}, {0.5,0.5}: mean/max blind to count, sum/mean blind to concentration, max loses count; in-body exercise ({0.4} vs {0.8,0.0}; 3,000×0.01 = 30 vs 30×0.5 = 15 under sum) — ### Functions of a set: sum, mean and maximum
- Learned per-neighbour transform before aggregating: f(h) = max(0, h−0.7)/0.2 summed counts suspects (1 for {0.9,0.1}, 0 for {0.5,0.5}, 3 for {0.9,0.9,0.9}); sums of 1, h, …, h^m separate any neighbourhood of ≤ m (shown for two neighbours: count, a+b, a²+b² → ab = ((a+b)²−(a²+b²))/2, a, b roots of t²−(a+b)t+ab; m power sums fix the polynomial whose roots are the values); mean blind to multiplicity under ANY transform ({a} = {a,a}; {0.9,0.1} = {0.9,0.9,0.1,0.1}); max blind to how often under any transform (can report which values occur), only the top on raw values; a nonlinear transform before the sum matters, weights after cannot unmerge. KeyFact: only a nonlinear transform counts as "before" — W linear, Σ h_u W = (Σ h_u) W for any weighted sum — ### A learned transform before the aggregation
- Simplest graph network = per-node MLP = network chapter's model (the baseline) — §Message passing / ### The network that ignores the graph
- Message passing: gather, aggregate, update; graph layer puts learned weights on vectors, not positions; FigureSequence passing-1..4 on the 20-node toy around G (frame 2 = plain mean of the four neighbours, 1/4 each, m_G beside h_G; frame 3 combines h_G with m_G, ×W, ReLU; two-hop ball 12 of 20, three-hop 18, R and S out) + Task (key image passing-4.svg) — ### One layer of message passing
- Receptive field defined; L layers = ball of radius L; contrast with recursive aggregates (fixed max/mean per round vs learned transform) — ### Each layer reaches one hop further
- AH = sum aggregation, one pass over the edges; A(AH) = walks of length 2; defects: no self (fix Ã = A+I), sum scales with degree (Ref network chapter scaling) — §One GCN layer in matrix form / ### Sum aggregation is a sparse matrix product
- Mean D̃^{-1}ÃH = row division (Ref relational neighbour rule, why-g-outranks-i); mean ignores the sender's degree (busy merchant / café IP Ref communities) → discount by sender's degree too (the walk's column division) — ### Dividing by degree, at both ends of the edge
- Star test (merchant + 3,000 one-edge cardholders carrying x; d̃ 3,001 / 2), table of five edge weights: sum 3,000x / hears 1; mean ≈x / 1/2; sender-only 1,500x / 1/3,001; both fully ≈x/2 / 1/6,002 (loses the count: 3 leaves 0.38x vs 3,000 leaves 0.50x); square root ≈39x (38.7x) / 0.013 (3 leaves 1.06x → thousandfold degree = ~36-fold size). Square root = compromise between count and scale, "nothing forces exactly it". Definition normalised adjacency Â and GCN layer H' = σ(ÂHW) — ### Five ways to weight an edge, tried on one hub
- Symmetry Â_vu = Â_uv → real eigenvalues (needed for [−1,1]); Proposition (proved): eigenvalues of Â in [−1, 1], √d̃ eigenvector with eigenvalue 1 (via similarity to row-stochastic P = D̃^{-1}Ã); powers neither blow up (A) nor die out (full division D̃^{-1}ÃD̃^{-1}: rows sum ≤ 1/2 once every node has a neighbour, halves per layer) — ### What the square root does to repeated layers
- Example: four accounts (features x₁ forwarding share, x₂ age, standardised), W = [[1,0],[−1,1]]: d̃ = (3,3,2,4); Â rows (.333,.333,0,.289), (same), (0,0,.5,.354), (.289,.289,.354,.25); XW rows (−1.5,1.0), (−1.0,0.5), (3.5,−1.5), (1.0,−0.5); output ReLU(ÂXW): (0,0.356), (0,0.356), (2.10,0), (0.77,0); hub's 0.77 = own 0.25 + account 3's 1.24 − accounts 1,2's 0.72 (figure layer-grids.svg); in-body exercise: accounts 1 and 2 identical (same closed neighbourhood) → own features diluted — ### One layer on four accounts
- Two-layer GCN softmax(Â ReLU(ÂXW⁰) W¹); only W⁰, W¹ learned; parameter count independent of graph (166×100 + 100×2 = 16,800). KeyFact: graph fixes how, training fixes what; Â(HW) = (ÂH)W so one layer is on the "after" side, a count of suspicious neighbours only once a ReLU precedes the next layer's sum. Attention right after: learned per-pair weight (score of (h_v, h_u), softmax over v's neighbours) makes the "how" learned, still order-free; a weighted mean (blind to count, like the mean); reaches no further than one hop — ### What is learned, and what is fixed
- Skip-GCN softmax(Â ReLU(ÂXW⁰)W¹ + XW̃); W⁰ = W¹ = 0 → logistic regression (two-class softmax = sigmoid of difference, Ref network chapter ★); bypass is linear, so it contains logistic regression, NOT the hidden-layer baseline network (a nonlinear bypass would); representability claim, not a score guarantee — training starts from random W⁰, W¹, W̃, not at the LR; walk step ξ ← Qξα + e(1−α) (Q walk matrix, e restart vector) = graph term + own-input term with weights frozen at α, 1−α — the lesson's ONLY statement of the walk-as-layer correspondence; learned weights can be negative (inverse homophily, Ref when-fraud-avoids-fraud) (figure skip-gcn.svg) — §Logistic regression as one setting: the skip connection
- Over-smoothing: Â^L X → √d̃ √d̃ᵀX / Σd̃ (other eigenvalues < 1 in size on connected graph with self-loops, stated without proof); only degree left; four accounts second eigenvalue 0.56; channel 1 per √d̃ converges to 0.175 by ~L = 12 (figure smoothing.svg); with weights/ReLUs a tendency, not an outcome; start at two layers, add only if folds say so (no empirical sweep quoted) — §How deep / ### Repeated averaging forgets the node
- Global node only: joined to all, gives every node one graph-wide aggregate within two layers, the same for all, no structure; a six-hop cycle arrives only as averaged-in accounts, not as a cycle (shapes need counting, cf. AMLworld cycle counts) — ### Reaching further without more layers
- Training: loss only on labelled nodes (Elliptic 23% labelled; unknown aggregated, never scored); weighted cross-entropy 0.3/0.7 (≈2.3, mild; Ref network ★, imbalance ratio section); point-in-time graph (Ref) — §Training on a graph / ### Which nodes carry a loss
- Inductive (weights apply to any node of any graph; Elliptic steps are separate graphs) vs transductive (per-node rows, Ref embedding/unknown row) — ### A model that transfers to graphs it has not seen
- Neighbourhood sampling: core nodes, fixed fan-out per hop, loss masked to core; hub cost capped (figure sampling.svg); in-body exercise fan-out 10, batch 512 → ≤ 111 per core, ≤ 56,832; 50,000-customer merchant; why no loss on first-hop nodes — ### Mini-batches of sampled neighbourhoods
- Elliptic comparison SET UP here (train 1–34 / test 35–49, labelled nodes only; LR defaults, RF 50 trees, MLP 1×50 Adam 0.001 200 epochs, each on 94 local and 166; GCN 2 layers width 100, 1,000 epochs, Adam 0.001, 0.3/0.7; illicit-class F1 at default decision; threshold metric Ref; no spread reported); EvolveGCN defined in the setup (one weight matrix per time step, a second network computes each step's weights from the previous step's) and in the table at 0.720; table and figure elliptic-f1.svg; reading as L10b reversal: GCN 0.628 < MLP 0.649/0.653, "consistent with" (not proof of) the dilution of accounts 1–2 (precision 0.812 both, recall 0.512 vs 0.623), Skip 0.705 > MLPs and RF-local 0.694, RF on aggregates 0.788 wins (thresholds on summaries already built; Ref network chapter verdict); embeddings as extra columns LR 0.481 → 0.533, RF 0.788 → 0.796; EvolveGCN 0.720 vs Skip 0.705, gap not established (no spread) — §When a graph network beats hand-built neighbour features / ### The Elliptic comparison, ### Reading the table
- AMLworld: edge classification, 60/20/20 temporal, laundering-class F1; boosted trees + preprocessor graph features (account statistics, cycle/shape counts) vs GNNs without hand features (2 layers width 64, up to 100 sampled per hop); PNA = several aggregators (sum, mean, max, spread) scaled by degree, handing the next layer counts, proportions and extremes rather than relying on a learned transform before one sum; F1 % PNA / LightGBM / XGBoost: HI-Small 56.8/62.9/63.2, LI-Small 16.5/20.8/27.3, HI-Medium 59.7/59.5/65.7, LI-Medium 27.7/20.9/28.2; ~1,000 GPU hours, no GNN on Large; synthesis KeyFact: best trees on built neighbourhood features are the bar; GNN earns its place where those features do not exist yet; embeddings as columns — ### A synthetic world with complete labels

## Notation
- H node representation matrix (rows h_v; NOT heterophilicity — stated in body), X = H⁽⁰⁾ feature matrix, n nodes
- A adjacency, Ã = A + I, d̃_v = degree + 1, D̃ = diag(d̃_v) (NOT dyadicity, NOT toy node D — stated), Â = D̃^{-1/2}ÃD̃^{-1/2}, P = D̃^{-1}Ã (proof only)
- W, W⁽⁰⁾, W⁽¹⁾ learned weights; W̃ skip weights; σ nonlinearity (ReLU); L number of layers (k avoided: alert budget)
- N(v) neighbours (from guilt-by-association); Q the walk's column-normalised matrix and e the restart vector (from guilt-by-association, skip section only); m_G mean of G's neighbours (figure only)

## Running cases
- Four-account graph (edges 1–2, 1–4, 2–4, 3–4, reused from neighbourhood walk counts) with X, W, Â, outputs as above; Â² row 3 (0.102, 0.102, 0.375, 0.265), Â²X row 3 (0.781, −0.542); per-√d̃ channel 1 at L = 0/2/4: (−0.29, −0.29, 1.41, 0.25) / (0.02, 0.02, 0.55, 0.22) / (0.13, 0.13, 0.29, 0.19), limit 0.175
- 20-node toy around G: d̃ G 5, A 7, D 5, F 4, I 5
- Elliptic table (LR 0.457/0.481, MLP 0.649/0.653, RF 0.694/0.788, GCN 0.628, Skip 0.705, EvolveGCN 0.720; LR LF+NE 0.543, AF+NE 0.533; RF AF+NE 0.796; micro-F1 0.92–0.99 in exercise only)
- AMLworld F1 table as above
- Exercises: isolated node (d̃ = 1, σ(x_v W)); busy merchant (3,000 cardholders, 30 scored 1) vs small merchant (3, all scored 1): sum 30 vs 3, mean 0.010 vs 0.75, Â 0.39 vs 1.06; refutation of "deeper is better" (lead 1.70 → 0.53 → 0.17); linear two-layer = LR on Â²X, 332 effective parameters (166 for two classes); auction-graph sign (D = 0, H = 1.06, n₁ = 2: D(n₁−1) = 0 vs Hn₁ = 2.12 → negative weight on aggregated score; walk cannot; flips if accomplices labelled); embedding-reproduction design; FORWARD micro-F1 = accuracy (all-licit on 1-in-10: accuracy 0.9, illicit F1 0)

## Assumed
- neighbourhood-and-centrality: recursive aggregates and max drift (0.85 / 2.51), walk counts A^k and the 4-node graph, homophily gate D(n₁−1) vs Hn₁, auction exercise, when-fraud-avoids-fraud
- guilt-by-association: walk step ξ ← αQξ + (1−α)e and its second-to-last exercise (walk as a fixed-weight layer; recalled only in the skip section, without the H'/X form, since X here is the feature matrix; Q column-normalised walk matrix, kept as Q here), S^{-1}W vs WS^{-1} (why-g-outranks-i Remark), walk cannot learn negative weights
- neural-tabular-detectors: MLP, BCE/softmax-sigmoid identity, weighted cross-entropy (★), scaling argument, embeddings and unknown row, trees beat networks on engineered tables
- fraud-as-a-graph: matrix vs list costs, laundering shapes; communities-and-components: café IP high-degree identifier
- canonical-datasets: Elliptic (steps, 94 + 72, 2/21/77%, step 43), AMLworld
- alert-budget-metrics: threshold metrics judge one cut; imbalance-techniques-revisited: mild ratios; point-in-time-features; worldline-model-comparison: 1-D CNN row
- prerequisites: MLP, backprop, Adam, softmax, eigenvalues, F1

## Left open
- Micro-F1 vs illicit F1, why the forest wins, step-43 collapse, label-permutation/time structure → elliptic-illicit-nodes (conclusion + forward exercise)
- numpy GCN forward/backward with finite-difference referee, training on a time split → graph-propagation-lab
- Representation learning of sequences instead of hand features → sequence-models-for-transactions
- Not taught: spectral derivation of the GCN, GIN/GraphSAGE layer forms, attention equations (attention named in words only), EvolveGCN internals, edge readout details, Cluster-GCN/GraphSAINT
