# Audit of the verdict register: rightward shading

What this checks: whether any verdict in `01-04.md`, `05-08.md`, `09-12.md` or `13-16.md` is harder on a left or liberal claim, or softer on a right-leaning one, than its evidence supports. Each verdict was checked four ways: whether the grade is earned by the evidence cited; whether strong counter-evidence for the left or liberal reading is left out; framing and word choice; and whether the left or liberal author was tested in his strongest form. A verdict is flagged only on evidence, argument or framing, never just because it goes against the left.

Sources fetched for this audit are saved in `research/texts/audit-right-shading/`, each with a `.meta.yaml`. Anything I did not read in the original is marked [secondary] or [UNVERIFIED].

Summary: 16 flags. Five change a verdict's substance or grade materially: Rawls with the module-10 verdict that rests on it, Marx, the module-5 mechanism of extension, Rousseau, and Burke's forecasts. Six correct an omission or a misstatement that shades the result: Jouvenel, Murray's "never chosen", Miller against Carens, Pomeranz with module 12, the UDHR social-rights half, and Taine. Five are wording or framing fixes: the colonial balance sheet with module 14, the Böckenförde module verdict, Stephen against Mill, the envy finding, and Gould–Harden (a).

---

## Flagged verdicts

### 1. `09-12.md` — `rawls-theory-of-justice`, and the module-10 verdict in `the-cognitive-elite`

**Current:** "Rational parties behind the veil would choose the difference principle (maximin) → **fails as a derivation**. Grade: on balance." The module verdict builds on it: "The difference principle is not what the original position yields … strict maximin over the worst-off is not established."

**Problem:** The verdict tests a weaker argument than the one Rawls rests on (selection), and the evidence it adds cannot decide the question (grade).
- The verdict equates the difference principle with the maximin rule. But Rawls uses maximin mainly against average utility and for the first principle. He states in the *Restatement* that maximin alone cannot justify the difference principle against a "mixed conception": average utility subject to a guaranteed minimum.
- His case for the difference principle against that rival rests on other grounds: reciprocity, publicity, stability, the strains of commitment and the social bases of self-respect (TJ §29, §49; JF §§34–38). The verdict does not test any of these.
- The Frohlich–Oppenheimer–Eavey groups chose exactly the mixed conception. So the experiments show that real choosers, given information about the distributions, prefer the rival Rawls concedes is harder to beat. They do not show that his reciprocity and stability arguments fail.
- The brief already says Rawls conceded the maximin joint (1986, via Höffe, l.49). So "fails as a derivation" scores against Rawls a point he gave up himself, and treats his remaining argument as if it had been refuted.

**Evidence:**
- SEP, "Original Position", §6.2: "Rawls relies upon the maximin argument mainly to argue for the first principle of justice and fair equality of opportunity. Other arguments are needed to support his claim that justice requires the social minimum be determined by the difference principle." (`audit-right-shading/sep-original-position.txt`)
- SEP supplement on the difference principle: Rawls "later says that in fact the maximin rule alone cannot be used to justify the difference principle (JF, 43n, 94–95)". Rawls "concedes that 'mixed conceptions are much more difficult to argue against than the principle of utility'" (TJ 316/278 rev.). His grounds against them are "primarily publicity, stability, and reciprocity" (JF §§34–38, §42.3). (`audit-right-shading/sep-original-position-difference-principle-supplement.txt`)

**Proposed verdict:**
- (a) Maximin alone does not yield the difference principle. Grade: **established**, because Rawls concedes it (JF 43n, 94–95).
- (b) Whether the parties would choose the difference principle over average utility with a guaranteed floor is **open** on the course's evidence. Rawls's case there rests on reciprocity, stability and self-respect, which the brief should stage at full strength. The experiments are evidence about what actual people prefer, not about what those arguments establish.
- What would settle (b): an argument that the "discouraged and depressed underclass" Rawls predicts under restricted utility (JF §42.3) does or does not form under floor-plus-average arrangements. That is an empirical question about welfare-state capitalism the course could test.

**Module 10 knock-on:** keep "a guaranteed social minimum is common ground" (**on balance**). Replace "the difference principle is not what the original position yields" with "the decision-theoretic route to it fails; the reciprocity route is untested here — open".

Also correct a framing slip in the same verdict. "The natural lottery is a real force … neither a hypothesis (Rawls) nor a legitimating story (Lasch)" reads the AFQT as natural endowment. Sibling fixed effects remove shared family background. They do not remove non-shared environment or the effect of schooling on the score itself, and the register concedes the AFQT "absorbs schooling". Say "a measured ability that predicts outcomes within families", and leave how much of it is native endowment undecided.

### 2. `05-08.md` — `marx-manifesto`

**Current:** "The predictions failed; the description of capitalism's dynamism held. Grade: strong."

**Problem:** The verdict sorts its evidence so that every hit counts as description and every miss counts as prediction.
- The Manifesto made structural predictions as well as revolutionary ones: the concentration of capital, the spread of a world market, recurring crises of over-production, and the absorption of the old middle class into wage-labour. Its text: "the small tradespeople, shopkeepers … handicraftsmen and peasants — all these sink gradually into the proletariat" (staged `thecommunist-.txt` l.373–375).
- Those came largely true. Self-employment and small proprietorship collapsed across the industrial countries, and wage employment became the condition of the great majority.
- The evidence offered for "polarisation failed" (Schumpeter's family mobility, the growth of salaried middle strata) answers a different question. It bears on whether classes are closed and incomes polarise, not on whether wage dependence became general.
- The real-wage series the verdict needs to call immiseration failed is listed by the register itself as not bound, yet the grade is "strong". (Feinstein's series is generally read as stagnant real wages to the 1830s and rises after mid-century. That fits Marx's description of 1848 and contradicts the forecast from the 1850s on [UNVERIFIED; not re-read].)

**Evidence:**
- NBER w7182 (1999): the self-employed share of non-agricultural white male workers in the US fell "from one in six in 1910 to one in ten in 1970". That excludes farmers, whose decline was larger. (`audit-right-shading/fairlie-meyer-1999-nber-w7182-self-employment.txt`)
- The register's own module-5 record: the ten measures arrived by statute (graduated income tax), and Labour took office by election.

**Proposed verdict:**
- The **revolutionary** predictions failed: no proletarian revolution in an advanced country, and power was reached by the ballot. Grade: **strong**.
- **Absolute immiseration** failed after c. 1850. Grade: **strong** once the wage series is bound; until then, **on balance**.
- The **structural** predictions largely held: concentration, the world market, recurring crises, and the old middle class absorbed into wage employment. Grade: **strong**.
- **Polarisation** is half right. Wage dependence became general; income and consciousness did not polarise, because a salaried middle grew. Grade: **strong** on each half.
- The headline should read "the political forecast failed; the economic forecast largely held", not "the predictions failed".

### 3. `05-08.md` — module 5 verdict in `british-franchise` (the mechanism of extension)

**Current:** "Aristocratic and Conservative ministries widened the vote in party competition. Pressure from below did not do it. That fits Lecky's mechanism … better than his main rule or Marx's class struggle." The balance check counts this as a finding "against Marx's and Tocqueville's mechanism". The module grade is "strong".

**Problem:** This leaves out the best-identified causal evidence on the first extension, and it overstates what the brief itself allows. The brief says "the pressure of 1866 was real but the timing and the terms were the parties'" (exercise 4). Its causal-ranking exercise lists the Reform League and Hyde Park as candidate causes. Its Acts-against-agitations timeline puts the Birmingham Political Union, Chartism, the Reform League, the suffrage societies and the war beside each Act.

**Evidence:** Aidt & Franck, *Econometrica* 83 (2015): "We find that the Swing riots induced voters to vote for pro-reform politicians after experiencing first-hand the violence of the riots." The measure is riots within 10 km of each of 244 English constituencies, set against the pro-reform seat share in 1831. The paper is built as a test of Acemoglu and Robinson's theory that the franchise is extended as a concession under threat of revolution. (`audit-right-shading/aidt-franck-2015-great-reform-act.txt`)

**Proposed verdict:**
- The critics' forecast of breakdown failed for Britain. Grade: **strong** (unchanged).
- On the mechanism, both accounts are partly borne out. Pressure from below moved the decision in 1832 (Aidt & Franck) and made reform unavoidable in 1866–67. Party competition set the timing and the terms in 1867 and 1884.
- "Pressure from below did not do it" becomes "pressure from below forced the question; party competition answered it". Grade on the mechanism: **on balance**.
- In the balance check, the item "against Marx's and Tocqueville's mechanism" becomes "mixed".

### 4. `01-04.md` — `rousseau-inequality-and-general-will`

**Current:** "The solitary natural man fails … On violence the evidence leans towards Hobbes and away from Rousseau." Grade: established (solitary man); strong (that lethal violence is common without a state).

**Problem:** The test does not separate the two authors, and it leaves out the evidence that bears most directly on Rousseau's thesis.
- **Wrong test.** Rousseau does not say pre-state societies were peaceful. He puts the war of all in *nascent society*, after property and before the contract: "The new-born state of society thus gave rise to a horrible state of war" (Second Discourse, Part II, staged `texts/rousseau/d2-inequality-part2-appendix.txt` l.468). So high violence in settled, stratified societies without a state is what Rousseau's sequence predicts, not a point against him.
- **Omitted evidence.** Rousseau's core claim is that inequality and domination grow with property, storage and settlement. The comparative record supports it, and the verdict does not cite it.
- **What Gómez et al. actually show.** The verdict's own source is more mixed than "leans towards Hobbes". Prehistoric bands and tribes sit at the phylogenetic baseline (~2% of deaths). The highest levels are in chiefdoms. States are lower.

**Evidence:**
- Gómez et al., *Nature* 538 (2016): "Levels of lethal violence in prehistoric bands and tribes did not differ from the phylogenetic inferences … The level of lethal violence in chiefdoms was also higher … the level of lethal violence in state societies was lower". The paper also reports that "lethal violence is common in present-day bands and tribes", possibly because of better data or contact. That point helps Hobbes and must be stated too. (`audit-right-shading/gomez-2016-phylogenetic-roots-lethal-violence.txt`)
- Fry & Söderberg, *Science* 341 (2013), 21 mobile forager societies: "most incidents of lethal aggression … may be classified as homicides, a few others as feuds, and a minority as war." (`…/fry-soderberg-2013-abstract.txt`)
- Borgerhoff Mulder et al., *Science* 326 (2009), 21 populations: wealth transmission and inequality are "substantial" among pastoral and agricultural societies ("on a par with or even exceeding the most unequal modern industrial economies") but "limited among horticultural and foraging peoples". (`…/borgerhoff-mulder-2009-wealth-transmission.txt`)

**Proposed verdict:**
- (a) The solitary, pre-social natural man fails. Grade: **established** (unchanged).
- (b) The state lowers lethal violence. Grade: **strong**. This is Hobbes's point and it holds.
- (c) Inequality and organised violence rise with property, storage and settlement. Grade: **strong** for inequality, **on balance** for war. This is Rousseau's sequence and it holds.
- Drop "the evidence leans towards Hobbes and away from Rousseau". On the question the lesson stages, each author is right about a different stage.

### 5. `01-04.md` — module 4 verdict in `assignats` (Burke's forecasts)

**Current:** "Burke's forecasts for the 1790s came true in outline … His argument that no single generation can redesign a whole society at once is borne out by that record." Grade: **strong**.

**Problem:** Selection. The verdict counts Burke's hits (the assignat, the Terror, the general) and one miss (the departments). It leaves out his best-known dated forecast about France's power, which failed completely. It also leaves the reader to attribute the Terror to design, which the register's own objection partly withdraws: the assignat failed "by a route Burke did not name: war finance and price controls after 1792".

**Evidence:** Burke, Speech on the Army Estimates, 9 February 1790. "France was, at this time, in a political light, to be considered, as expunged out of the system of Europe. Whether she ever could appear in it again, as a leading power, was not easy to determine … most assuredly it would take up much time to restore her to her former active existence." The French had "done their business for us as rivals, in a way in which twenty Ramilies or Blenheims could never have done it." (`audit-right-shading/burke-army-estimates-1790.txt`, l.10, l.38) Within four years French armies were beating the coalition, and they dominated the Continent until 1814.

**Proposed verdict:**
- Burke's forecasts of 1790 were mixed. The collapse of paper money and rule by a general came true. Grade: **strong**.
- France "expunged" as a power, and the departments disobeying Paris, both failed. Grade: **strong**.
- The general thesis, that wholesale redesign in one generation exacts a heavy price, is supported. But the record also holds the war of 1792 as a rival cause of the worst of that price. Grade: **on balance**.
- Maistre's half stands as written. The module grade should fall from **strong** to **on balance** for the Burke half.

### 6. `09-12.md` — `jouvenel-on-power`

**Current:** "Power has grown in extent almost without interruption … → **holds as description**; the objection ('it was demanded') confirms the mechanism rather than refuting it." Grade: strong (description). "Would be overturned by: a sustained democratic period in which the state's extent shrank without external shock."

**Problem:**
- **(i) The falsifier has already been met.** The register sets its own test, and the record meets it: several democracies cut government spending as a share of output for a decade or more after c. 1990, with no war.
- **(ii) "It was demanded confirms the mechanism" breaks the course's own rule.** It counts the rival explanation as confirmation. That move is the one this register condemns in Carlyle ("no outcome could refute it") and Spengler. Voters' demand for transfers, on Lindert's account, and Power's own drive, on Jouvenel's, both predict the same growth, so the series cannot decide between them.

**Evidence:** IMF *Public Finances in Modern History*, via Our World in Data; government expenditure as % of GDP (`audit-right-shading/imf-pfmh-gov-spending-gdp-selected.csv`):

| Country | Rise (start) | Peak | Later level |
|---|---|---|---|
| United Kingdom | 7.0% (1870) | 47.6% (1980) | 38.8% (2019) |
| Canada | 4.9% (1870) | 53.3% (1992) | 38.5% (2007) |
| Sweden | 6.0% (1870) | 69.4% (1993) | 49.3% (2007) |
| New Zealand | — | 53.0% (1991) | 36.2% (2004) |
| Netherlands | — | 56.4% (1995) | 44.2% (2000) |

Caveats to state:
- Coverage switches between central and general government in some early years.
- A share of GDP can fall because GDP grows.
- Sweden's fall followed a domestic banking crisis.
- Spending is one measure of "extent", not the only one (regulation is another).

**Proposed verdict:**
- The state's extent grew enormously across the democratising era, 1870–1980. Grade: **established**.
- As a law of near-uninterrupted growth, the thesis fails after c. 1990 in several democracies. Grade: **on balance**.
- Whether Power's appetite or voters' demand drove the growth is **open**. The series cannot distinguish them. What would: cases where the franchise widened and spending did not follow, or the reverse.
- Delete "the objection confirms the mechanism".

### 7. `13-16.md` — `murray-strange-death-of-europe` ("never chosen")

**Current:** "Post-war mass immigration to Western Europe was never chosen … Verdict: holds. Grade: strong." Would be overturned by "evidence that the inflows were planned and endorsed in advance by the legislatures that received them".

**Problem:** The verdict runs together two claims: "the scale was not forecast or intended" and "no one decided". The evidence supports the first. It contradicts the second.
- Governments signed the recruitment agreements; the brief itself dates Germany–Turkey to 1961.
- In 2004 Britain chose not to use the transitional restrictions the accession treaty allowed. The report the verdict cites as the failed forecast sets out those transitional rules.
- That report also carried an explicit caveat about diversion if Germany restricted for longer. It still underestimated badly, so the miss stands, but "wrong forecast" and "not chosen" are different charges.
- Grading "never chosen" as "strong" adopts Murray's framing in place of the record. The same register uses the claim as evidence of "drift" against Camus, which makes the precision matter.

**Evidence:**
- Dustmann, Casanova, Fertig, Preston & Schmidt, Home Office Online Report 25/03 (2003): "Estimates for the UK range between 5,000 and 13,000 net immigrants per year … In the case that Germany restricts free movement of workers for a longer period than the UK, some of those immigrants to Germany may use the UK as a destination. However, even in the worst case scenario, migration to the UK … is not likely to be overly large." The report also sets out the 2+3+2-year transitional regime open to every existing member. (`audit-right-shading/dustmann-et-al-2003-home-office-25-03.txt`, l.305–316, l.127–145)
- That the UK, Ireland and Sweden alone opened their labour markets in May 2004 is standard history; I did not re-check it in a primary text [UNVERIFIED].

**Proposed verdict:**
- The scale and permanence of post-war immigration were neither intended nor forecast, and majorities opposed it throughout the period Murray covers. Grade: **strong**.
- "Never chosen", meaning no one decided, fails. The instruments were chosen by governments and legislatures: recruitment agreements, Commonwealth citizenship (British Nationality Act 1948 [UNVERIFIED: not re-read]), the 2004 decision to open at once. Grade: **strong**.
- Short form: chosen in its instruments, not in its scale.

### 8. `13-16.md` — `miller-strangers-in-our-midst` (decides `carens-open-borders`)

**Current:** Equal moral worth does not entail a right to cross borders freely. Grade: **on balance**. Among the reasons given: "Abizadeh's coercion argument would equally give every person affected by a state's law a vote in it, which no one defends."

**Problem:** The clause misstates the strongest left-liberal objector, and on a point of fact.
- Abizadeh's thesis is that "the demos of democratic theory is in principle unbounded". He affirms the conclusion the register treats as a reductio.
- His principle concerns people *subjected to coercion*, not everyone *affected*.
- Goodin (*Philosophy & Public Affairs* 35, 2007) argues that the all-affected principle, taken seriously, extends the vote very widely and treats that as a real result. So "no one defends" is false [Goodin from the published title and secondary descriptions; the article was not read].
- What carries Miller's case against Abizadeh is the coercion/prevention distinction. Abizadeh contested that in *Political Theory* 38 (2010), which I did not read.
- On the cantilever, Miller's adequacy reply ("the options available in each state are easily sufficient for living a decent human life", Miller ch. 3, staged l.2079–2082) holds where the home state is adequate. Miller himself extends refuge-type claims to those whose human rights cannot be protected at home (ch. 5). The remaining dispute concerns people above that floor who face a large place premium. That is a value question, and the verdict should say so.

**Evidence:**
- Abizadeh, *Political Theory* 36:1 (2008), abstract: "because the demos of democratic theory is in principle unbounded, the regime of boundary control must be justified to foreigners as well as to citizens". (`audit-right-shading/abizadeh-2008-border-coercion.txt`, l.58, l.463)
- Clemens, Montenegro & Pritchett (HKS RWP09-004, 2009): wage ratios for observably identical workers inside and outside the US, with selection on unobservables "significant, but … typically modest". The median ratio of about 4 (8.4 for Nigeria) comes from secondary snippets. (`…/clemens-montenegro-pritchett-2009-place-premium-abstract.txt`)

**Proposed verdict:**
- Equal moral worth does not by itself entail a right to cross into a particular state. A people keeps a qualified right to control membership, bounded by rescue, fair terms and inclusion. Grade: **on balance** (unchanged).
- How far duties of admission, or of effective aid as the alternative, extend to people above Miller's floor but far below the options open in rich states is **open**. It is a value question that the place-premium data sharpen but cannot settle.
- Strike "which no one defends". State Abizadeh's unbounded-demos thesis and Miller's coercion/prevention reply as the point actually in dispute.

### 9. `09-12.md` — `pomeranz-and-goody-the-rival-thesis`, and the module-12 verdict in `the-borrowing-ledger`

**Current:** (Pomeranz) "fails for China as a whole; contested for the richest regions. Grade: on balance." Also: "It fails as an account of why the lead existed at all: Spain had the New World and China had coal." The module verdict says the "late luck" thesis "fails on timing for China as a whole".

**Problem:** The downgrade to "on balance" was right, but two shading moves remain.
- **(i) Testing a claim he did not make.** Pomeranz claimed parity for the core regions (the Yangzi delta against England and the Netherlands). He did not claim it for China as a whole. Leading with "fails for China as a whole" scores against him a claim he never made. On his actual claim, the register itself shows the evidence is open: Broadberry et al. allow regional parity, and the Li & van Zanden gap is measured in the 1820s.
- **(ii) The rebuttal misstates his argument.** "Spain had the New World and China had coal" does not touch it. His argument is about *conjunction and location*: coal "sited beside British industry" (brief l.31) and beside navigable water, artisans and a firewood-short market (brief l.181), together with New World land relieving an economy already near its land constraint. China's coal lay far from the delta, and Spain lacked the coal. The rebuttal attacks a version of the thesis he did not hold.

**Evidence:** the brief's own reconstruction (`pomeranz-and-goody-the-rival-thesis.md` l.31, l.60, l.181, l.189), and the register's own statement of Broadberry, Guan & Li and of Li & van Zanden.

**Proposed verdict:**
- (Pomeranz, regional parity c. 1750) **open**, with the register's own settler: like-for-like output estimates for the delta in 1750.
- North-western Europe led China as a whole before 1800. Grade: **strong**. This is a finding against the broad "late luck" view, not against Pomeranz.
- The windfall argument as an account of why industrialisation came in Britain, and so fast: **on balance** (survives).
- Strike the Spain/coal sentence.
- In module 12, write "the broad late-luck view fails on timing; Pomeranz's regional claim is open". The module's grades stand.

### 10. `09-12.md` — module 9 verdict in `udhr-read-against-the-right`

**Current:** The critics "hit the social claims of Arts. 22–27 … nobody is named". The 1966 split is "the decisive evidence": the social claims "became … an aim rather than a claim on a named party". So "the conservative critique is right about the kind of thing the social rights are". Grade: on balance.

**Problem:**
- **(i) Omitted counter-evidence.** The post-1966 record goes the other way. A 2008 Optional Protocol gives individuals a complaint procedure under the ICESCR, and it has been in force since 5 May 2013. The register treats the 1966 position as final.
- **(ii) The strongest liberal reply is missing.** It is that the civil core is not a set of costless abstentions. Arts. 8 and 10, the register's own examples, require tax-funded tribunals, police and legal aid. So the difference between civil and social rights in "who bears the duty" and "subject to resources" is one of degree, not of kind.
- **(iii) The duty-bearer.** Art. 22 itself names "national effort and international co-operation", which puts the duty on the state.

**Evidence:**
- OP-ICESCR, GA Res. 63/117 (10 Dec 2008), in force 5 May 2013: individual communications, inter-state communications and an inquiry procedure. (`audit-right-shading/opicescr-wikipedia.txt` [secondary]; `…/icj-2013-opicescr-statement.txt`)
- Holmes & Sunstein, *The Cost of Rights* (Norton 1999), ch. 1 "All Rights Are Positive": even negative rights "must be supervised and maintained by tax-funded courtrooms, police". (`…/holmes-sunstein-1999-publishers-weekly-review.txt` [secondary; the book not read])

**Proposed verdict:**
- The critics are right that the social articles depend on resources more than the civil core does, and the 1966 split recorded that judgment. Grade: **on balance**.
- They are wrong that the social claims name no duty-bearer and cannot be made claims. They name the state, and since 2013 they carry an individual complaint, within resource limits. Grade: **strong**.
- The difference is one of degree. The module grade stays **on balance**, but "right about the kind of thing the social rights are" should be cut.

### 11. `05-08.md` — `taine-and-le-bon-revolution-and-crowd`

**Current:** "Le Bon's law fails … Taine's minority thesis survives." Grades: Le Bon, strong; Taine's minority thesis, on balance. Decided by Rudé: settled artisans and shopkeepers, choosing targets.

**Problem:** The same evidence is used against Le Bon and left out for Taine. Taine made the same claim about who was in the crowd, and Le Bon took it from him. Rudé's book was aimed at Taine's picture.

**Evidence:**
- Taine, *The Revolution* vol. 1: the band "composed of those who are most destitute, most wildly enthusiastic, and most inclined to destructiveness", each man descending "even to … the savagery of the dregs of society" (staged `texts/taine/v2-revolution1-s2.txt` l.56–61). See also "vagabonds and criminals" (same file, l.329).
- Sutherland (H-France forum on Rudé, 2019) says Rudé's "most persuasive argument" was that the crowds of 1789–95 "were not the ne'er-do-wells, vagabonds and criminals that Taine and others insisted they were". Sutherland also warns that "the crowd was much more independent than many historians have allowed" and that the Palais-Royal's direction "deserves more skepticism". That weakens the directing-minority picture as well. (`audit-right-shading/sutherland-2019-rude-forum.txt`)

**Proposed verdict:**
- Taine's account of who acted, the destitute and criminal "dregs", fails on the same record as Le Bon's law. Grade: **strong**.
- His organised-minority thesis survives in a narrower form: an organised club network captured the institutions; it did not make the crowds. Grade: **on balance**.
- In the 05-08 balance check, Taine's item moves from "for" to "split".

### 12. `13-16.md` — `colonial-balance-sheet` (a), and the module-14 verdict

**Current:**
- (a) "'The critics never ran a cost–benefit against a counterfactual' → **holds** (strong)."
- Module 14: "The slave trades left a real, **modest**, lasting effect on trust."

**Problem:**
- **(a) is too broad.** It holds against the catalogue literature. It is false of the critical literature as a whole, which has run counterfactual designs since 2001. The register itself relies on one: Heldring & Robinson, a study the Case concedes meets scientific standards and which finds harm. The Case's own note 4 cites Acemoglu, Johnson & Robinson.
- **"Modest" takes the Case's framing.** It comes from Gilley's "between one and two percent [of explained variation] … a rounding error" (brief `auditing-the-case-for-colonialism.md` l.100–107). A small share of explained variance does not show a small effect. The brief itself flags this computation as something the lesson must explain.
- The one causal estimate on income is large.

**Evidence:** Nunn, "The Long-Term Effects of Africa's Slave Trades" (MPRA WP 2007; *QJE* 2008). "A one standard deviation increase in ln(exports/area) is associated with between .36 to .62 standard deviation decrease in log income". Read as causal (illustrative OLS), a one-SD smaller slave export would raise mean income from $1,249 to $1,864, a 50% increase. The IV estimates are larger. (`audit-right-shading/nunn-2007-slave-trades-mpra-wp.txt` l.780–789, l.1054)

**Proposed verdict:**
- (a) Holds against the polemical catalogues. Grade: **strong**. Fails as a description of the critical literature, which estimates counterfactuals. Grade: **strong**.
- Module 14: replace "modest" with "real and lasting: large on income in the one causal estimate; on trust, an effect whose size the explained-variance share does not give". The ledger grade stays **on balance**.

### 13. `13-16.md` — module 16 verdict in `hungarys-fundamental-law` (Böckenförde)

**Current:** "No. A free state does not live on liberal principles alone … no lesson refutes it." Overturned only by "a free state that kept its cohesion over generations on procedure alone, with no shared language, history or faith". Grade: on balance.

**Problem:** The conclusion, that liberal principles are necessary but not sufficient, is defensible. Habermas, Böckenförde's best-known liberal interlocutor, grants that "liberal societal structures are dependent on the solidarity of their citizens". But three framing faults soften the test of the right-coded premise.
- **(i) The falsifier cannot be met.** No state has no shared language, history or faith, so the premise is protected from any test. That is the defect the register condemns in Spengler and Toynbee.
- **(ii) "No lesson refutes it" is an argument from silence.** The course never stages the liberal reply. Habermas's reply in the 2004 exchange is that the democratic state can secure a secular justification of its own authority, and his "postsecular" reading gives Böckenförde's theorem a "harmless meaning".
- **(iii) The closing sentence is unargued.** "The liberal states of 2015 corrected themselves only once their publics spoke" is asserted in this module, not shown.
- A further point, which cuts both ways: "cannot command [the presuppositions] without ceasing to be free" is too strong as stated. The Third Republic made "peasants into Frenchmen" through schools, roads and conscription and stayed a parliamentary republic (E. Weber, *Peasants into Frenchmen*, Stanford 1976 [secondary: publisher's description only]).

**Evidence:** Habermas–Ratzinger exchange, 19 January 2004: Habermas asks "whether the democratic constitutional state can renew from its own resources the normative presuppositions of its existence", grants the motivational dependence on solidarity, and proposes to "give Böckenförde's theory a harmless meaning". (`audit-right-shading/habermas-ratzinger-2004-exchange-excerpt.txt`; Habermas's sections 2–3 are elided in that edition and were not read.)

**Proposed verdict:**
- The premise, that a free state depends on a solidarity its procedures do not supply, stays **on balance**.
- Restate the falsifier as something testable: trust and willingness to fund transfers to strangers show no fall where shared identity or religion weakens. The cross-national diversity-and-trust literature is the evidence to bind [not fetched here].
- State Habermas's reply as the strongest objection.
- "Cannot command without ceasing to be free" fails in its strong form (Third Republic). Grade: **on balance**.
- Cut the 2015 sentence, or move it to module 15 where the record is held.

### 14. `05-08.md` — `stephen-liberty-equality-fraternity` (a)

**Current:** Stephen refutes the harm principle as "one very simple principle". "Mill gives cases, not a criterion, for when 'natural penalties' become social tyranny. Mill's *Utilitarianism* defines wrong as what opinion may punish, which contradicts *On Liberty*." Grade: strong.

**Problem:** Two of the three supports misstate Mill.
- Mill does state a criterion. Penalties are legitimate "only in so far as they are the natural, and, as it were, the spontaneous consequences of the faults themselves, not because they are purposely inflicted on him for the sake of punishment" (*On Liberty* ch. 4, staged `texts/mill/on-liberty-body.txt` l.2822–2826).
- There is no contradiction with *Utilitarianism* ch. V. Mill classes self-regarding faults as "not properly immoralities" (l.2857–2859), so they are not "wrong" in the ch. V sense, and ch. V's punishment clause does not reach them.
- What survives is Stephen's real point. The criterion turns on the motive of the person who avoids or warns, which no one can observe, so the principle cannot apply itself.

**Proposed verdict:** Stephen shows that the harm principle cannot apply itself, because its line between spontaneous consequence and punishment depends on unobservable motive. Grade: **on balance**. Drop the "cases, not a criterion" and "contradiction" supports. Part (b) stands.

### 15. `09-12.md` — `ressentiment-and-envy` (empirical half): framing only

**Current:** Dispositional envy predicts support for redistribution "alongside compassion and self-interest … That supports Schoeck's empirical claim about motives." Grade: on balance.

**Problem:** The verdict omits relative size and the replication record.
- In Sznycer et al., envy is the *smallest* of the three motives, envy did not differ by party, and compassion alone predicted personally aiding the poor.
- The close replication found dispositional envy non-significant until envy was split into benign and malicious forms.
- "Supports Schoeck's claim" overreaches. Schoeck's thesis is that egalitarianism *is* envy, not that envy is one minor motive among three.

**Evidence:**
- Sznycer et al., *PNAS* 114 (2017): β compassion 0.28–0.39; envy 0.10–0.14; self-interest 0.18–0.30. (`audit-right-shading/sznycer-2017-redistribution-compassion-envy.txt`)
- Lin & Bates, *Evolution and Human Behavior* 42 (2021). Study 1: compassion β = 0.37, dispositional envy β = 0.06, non-significant. Studies 2–3: malicious envy β = 0.13–0.15, compassion 0.40. (`…/lin-bates-2020-abstract.txt`)

**Proposed verdict:** Envy (malicious envy) is a real but the weakest of three measured motives, and compassion is two to three times stronger. That supports "envy is one motive" and does not support "egalitarianism is envy". Grade: **on balance** (unchanged); the wording changes.

### 16. `13-16.md` — `gould-and-harden-on-heredity` (a): framing only

**Current:** "Treating individuals the same will not produce equal group outcomes, so an unequal outcome is not by itself proof of discrimination." Grade: strong.

**Problem:** The verdict is correct, but it needs a scope limit. As written, a reader can take it to cover discrimination before the point of selection. The same module establishes that the gap "as it stands is not wholly genetic" and is partly environmental.

**Proposed verdict:** Unchanged in grade (**strong**). Add: "at the point of selection; it says nothing about earlier causes of the difference in scores, which this module finds partly environmental."

---

## Checked: no rightward shading, but a selection note

- `09-12.md` `weber-only-in-the-west` — the verdict tests "Protestantism caused capitalism", which Weber disclaimed ("such a foolish and doctrinaire thesis", staged `texts/weber/protestant-ethic-parsons-routledge.txt` l.2782). The Pacioli evidence also misses his distinction between capitalism and the rational ethic. This is a weak-form test, but Weber's thesis is not a left-coded claim, so it is not rightward shading. Restate the claim as "an elective affinity that accelerated rational capitalism". Cantoni, and Becker & Woessmann's literacy channel, still bear on it. Grade: on balance.

## Checked, fair

**Modules 1–4**
- Module 1 (`sparta-as-test-case`) — goes against natural hierarchy and Plato. The mixed constitution is credited on Aristotle's own text, and the grade is modest.
- `greek-miracle` — tests a right-coded "special people" claim on the lesson's own cases. On balance is right.
- `thucydides-power-and-justice` — credits both the realist description and the Melians' prudence. On balance, with the Xenophon source flagged.
- `decline-of-regimes` — the Athenian record (411, 404) decides it.
- `aristotle-political-animal-and-natural-slavery` — an internal, textual failure. Established is earned.
- Module 2 (`altar-of-victory`) — rests on the 384 documents; no left/right tilt.
- `polybius-anacyclosis-and-rome` — both halves rest on the record.
- `augustine-two-cities` — the eastern empire's survival decides (a); the equivocation decides (b).
- `hellenization-of-christianity` — the consensus on the eschatological Jesus is stated with its minority.
- Module 3 (`english-revolution-as-test`) — goes against the absolutist claim on the 1660 and 1689 record.
- `machiavelli-discourses-republic` — splits on Machiavelli's own concession (I.37).
- `filmer-patriarcha` — the heir cannot be identified, and Filmer's best point is kept.
- `hume-against-the-original-contract` — the strongest consent form (hypothetical) is preserved and carried to Rawls. Tacit-consent failure is the standard result. Strong is earned.
- `maistre-and-bonald` — rejects the "source of fascism" charge on the brief's scholarly sources, and keeps the narrower affinity and the war passages.
- `herder-and-fichte-volk-and-nation` — goes against Fichte's ranking; the unverified clause is marked to drop.
- Module 4, Maistre half — the departments, the metric system and the Code are dated records.

**Modules 5–8**
- `carlyle-heroes` — unfalsifiability is shown from the text.
- `stephen-liberty-equality-fraternity` (b) — goes for Mill on free discussion; the reasons are textual.
- Module 5, the forecast of breakdown — failed for Britain on dated forecasts (the mechanism is flag 3).
- Module 6 (`dreyfus-affair-as-test`) — the outcome was decided by documents and courts. The "price" question is left open, not dismissed.
- `gobineau-inequality-of-races` and `chamberlain-and-grant` — established on the record (Boas, the reanalyses, ancient DNA).
- `barres-and-maurras-integral-nationalism` — the grant to the right (membership is received) is trivially true and is conceded by Renan.
- Module 7 (`article-48-weimar`) — the "helped produce" half is held at on balance because of the arithmetic of 1932.
- `michels-and-pareto-oligarchy-and-elites` — the ITU counter-case and the competitive reply both stated.
- `spengler-decline-of-the-west` — dated forecast against the record.
- Module 8 (`the-right-in-1933`), `sorel-reflections-on-violence`, `moeller-van-den-bruck-third-reich`, `evola-revolt-against-the-modern-world` — internal objections and the dated record. Sorel, a figure claimed by both extremes, gets the same treatment.

**Modules 9–12**
- `the-right-after-1945` — on balance for the right at the level of argument, with the words-and-persons continuity kept. It notes the Burke side has no text.
- `strauss-natural-right-and-history` — self-exemption argued; moderate historicism is conceded to escape it.
- `voegelin-gnosticism` — Voegelin's own 1974 recantation.
- `burnham-managers-and-the-suicide-of-the-west` — Burnham's own stated test, against 1989–91.
- Module 11 (`testing-the-clash`) — not a rightward-shading question. Whether it is too firm against Huntington is the other audit's question.
- `toynbee-challenge-and-response` — unfalsifiable golden mean; Gobineau refuted by his own pledge.
- `murray-human-accomplishment` — the sciences after 1400 rest on checkable firsts, and the DSB was edited with non-Western specialists (brief l.247–250). The arts are held at on balance and causes are left undecided. The module-12 phrase "lead in recorded science opens from about 1400 (Murray's count)" is the one place where source bias would bite (pre-1400 Islamic and Chinese work). Keep it at Murray's date with that caveat.
- Module 12, the "ancient, unique inheritance" half and the open cause — fair (the late-luck half is flag 9).

**Modules 13–16**
- Module 13 (`national-data-audited`) and its lessons:
  - `what-intelligence-tests-measure` — fair.
  - `heritability-within-and-between-groups` — fair.
  - `us-gap-size-trend-and-environment` — fair.
  - `adoption-studies-across-groups` — fair.
  - `admixture-and-polygenic-scores` — fair.
  - `reich-ancient-dna-and-the-indo-europeans` — fair.
  - `geography-or-institutions` — fair.
  - `national-data-audited` (a)–(c) — fair.
  - All stay inside the dossier's status: not wholly genetic, no genetic share excluded, genetic share open. Each goes against both sides' overstatements.
- `gould-and-harden-on-heredity` (b), (c) — Lewis et al. 2011 and Brigham's 1930 retraction.
- Module 14:
  - Title — every standard the course holds.
  - Ledger graded on balance, with the burden of proof stated.
  - `vitoria-right-to-the-americas` — fair.
  - `locke-and-mill-on-empire` — textual: *On Liberty* ch. 1 holds the exclusion.
  - `burke-against-hastings` — fair.
  - `inherited-guilt-and-reparations` — repair for wrongs to the living is affirmed, a left-coded result on argument.
- Module 15 (`the-2015-crisis-read-three-ways`) — on rightward shading, fair. The employment record is reported, Murray's paralysis prediction fails on the dated instruments, and the crime overrepresentation is reported with its age, sex and location caveats. Whether the verdict is too lenient leftward ("capacity, not principle") is outside this audit.
- `albions-seed-and-who-are-we` — fair.
- `america-and-the-english-decline` — fair.
- `powell-raspail-and-camus` — Powell's numbers are credited (4.6 million in 2001 against his 5–7 million) and his bloodshed forecast is failed. Camus's intentional claim is refuted on his own text.
- `hazony-virtue-of-nationalism` — (a) Article 50 used in 2020; (b) the liberal-nationalist concession.
- `vermeule-common-good-constitutionalism` — Madison's argument plus the Fourth Amendment record.
- `de-benoist-european-new-right` — on balance, not stronger.

## Effect on the balance checks

If the proposals are taken:
- Several items move from "against the left" or "for the right" to "split" or "for the left":
  - Rawls's derivation: becomes established against maximin and open on the difference principle.
  - Marx: the structural predictions now count for him.
  - The module-5 mechanism: mixed.
  - Rousseau: the inequality sequence is for him.
  - Jouvenel: the law fails after 1990.
  - "Never chosen": split.
  - Taine's crowd: against.
  - Colonial (a) and "modest".
  - UDHR social rights: split.
- Burke's forecasts move from strong to on balance.
- No verdict against the left was found unsupported outright. The pattern is narrower: verdicts that fault the left are graded on the left's weaker forms (maximin, revolution, "China as a whole", the peaceful savage), and verdicts that credit the right leave out the counter-record (Burke's "expunged", the 1990s spending falls, the Swing riots, Rudé against Taine).
