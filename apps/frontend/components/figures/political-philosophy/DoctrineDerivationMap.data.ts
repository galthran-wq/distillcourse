/**
 * The doctrine's derivation as data: postulates and theses as the-doctrine
 * states them (statement, grade, grounds, overturnedBy), the verdicts that
 * ground them from the brief's edge table (research/the-doctrine.md, FIGURE
 * PLAN 1), and every "rests on" line in one table, EDGES — the lesson's
 * `from` props are its source, and the one place to change it.
 */

export type Grade = "established" | "strong" | "on balance" | "open" | "argued";

export interface Postulate {
  id: string;
  short: string;
  statement: string;
  grade: Grade;
  grounds: string;
  overturnedBy: string;
}

export interface Cluster {
  label: string;
  postulates: Postulate[];
}

export interface Thesis {
  id: string;
  short: string;
  statement: string;
  grade: Grade;
  weakest: string;
}

export interface Verdict {
  id: string;
  label: string;
  grade: Grade;
  lesson: string;
  title: string;
}

export interface ModuleGroup {
  n: number;
  verdicts: Verdict[];
}

export const CLUSTERS: Cluster[] = [
  {
    label: "Human nature",
    postulates: [
      {
        id: "P1",
        short: "unequal in ability, equal in standing",
        statement:
          "People are unequal in ability, partly by birth, and equal in standing under law.",
        grade: "strong",
        grounds:
          "capacity to lead differs partly by birth (strong); measured ability predicts adult outcomes within families (strong); every argument from unequal ability to ownership failed (established and strong).",
        overturnedBy:
          "a criterion, stated in advance, that separates natural subordinates from free men and does not reduce to whoever was captured or whoever was born where.",
      },
      {
        id: "P2",
        short: "social by nature; the state lowers violence",
        statement:
          "People are social by nature, and the state lowers violence; there was never a peaceful solitary stage.",
        grade: "strong",
        grounds:
          "no solitary, pre-social stage of human life (established); states have lower rates of lethal violence than bands, tribes and chiefdoms (strong).",
        overturnedBy:
          "a consistent finding that states have higher rates of violent death than non-state societies.",
      },
      {
        id: "P3",
        short: "envy real, decides nothing",
        statement: "Envy is a real political motive, though it decides no question of justice.",
        grade: "on balance",
        grounds:
          "envy is a measured motive for supporting redistribution, the weakest of three (on balance); a motive neither proves nor refutes the justice of what is demanded (strong).",
        overturnedBy:
          "for the motive, failure of the envy effect to replicate in representative samples; for the logical half, nothing.",
      },
    ],
  },
  {
    label: "Rule",
    postulates: [
      {
        id: "P4",
        short: "a few rule; selection and removal decide",
        statement: "A few always rule; what matters is how they are selected and checked.",
        grade: "on balance",
        grounds:
          "an organised minority holds office, as a strong tendency rather than an iron law (strong); the minority stays capable only where office is contested and removable (on balance).",
        overturnedBy:
          "closed, hereditary or co-opting rulers who kept their capacity across generations.",
      },
      {
        id: "P5",
        short: "a settled last word, which law can bind",
        statement:
          "Every order needs a settled last word; undecided sovereignty means war; the last word can be held by a composite body bound by law.",
        grade: "strong",
        grounds:
          "1642: king and Parliament each claimed the last word, and the result was civil war (strong); 1660 and 1689: a limited crown under Parliament lasted for centuries (strong).",
        overturnedBy: "showing that the limits of 1660 and 1689 were nominal.",
      },
      {
        id: "P6",
        short: "power grows unless checked",
        statement: "Power tends to grow unless it is checked by bodies it does not control.",
        grade: "on balance",
        grounds:
          "the state's share of output grew greatly across the democratising era (established); as a law of near-uninterrupted growth the thesis failed after 1990 (on balance); where the checks were removed, power grew (on balance to strong).",
        overturnedBy: "power that stayed limited where the named checks were absent.",
      },
    ],
  },
  {
    label: "Belonging",
    postulates: [
      {
        id: "P7",
        short: "belonging received before chosen",
        statement:
          "Belonging is inherited before it is chosen; the contract fails as an account of origins.",
        grade: "strong",
        grounds:
          "membership is received rather than chosen (strong); no government surveyed began in consent, and tacit consent by residence fails (strong); no one consents to being born into a polity.",
        overturnedBy: "a body of states founded and kept by consent that individuals actually gave.",
      },
      {
        id: "P8",
        short: "a free state lives on a solidarity it does not produce",
        statement: "A free state lives on a solidarity its procedures do not produce.",
        grade: "on balance",
        grounds:
          "the premise, whose motivational half its strongest liberal critic grants (on balance); Rome held together by a public worship (strong); integration by itself failed for the second generation of non-EU origin (strong).",
        overturnedBy:
          "a cross-national series showing that trust and willingness to fund transfers to strangers do not fall where shared identity or religion weakens.",
      },
      {
        id: "P9",
        short: "culture persists, not blood, not on demand",
        statement:
          "Culture persists across generations; it is not carried by blood and not acquired on demand.",
        grade: "strong",
        grounds:
          "culture persists across generations and is not put on at will (strong); the same ancestry lived under opposite regimes within a lifetime (strong); racial accounts of civilization fail (established).",
        overturnedBy:
          "genetic divergence on relevant traits within the periods in which regimes changed, or values that change within a generation on demand.",
      },
      {
        id: "P10",
        short: "religion a bond where held",
        statement:
          "Religion is a bond that has held commonwealths and persists across generations where it is held.",
        grade: "strong",
        grounds:
          "a commonwealth was held by a public worship, and both sides acted on it (strong); Muslim-origin Europeans kept their religion into the second generation while Christian-origin Europeans converged on secular practice (strong).",
        overturnedBy: "the third generation of Muslim-origin Europeans converging as Christians did.",
      },
    ],
  },
  {
    label: "Change, wealth, peoples",
    postulates: [
      {
        id: "P11",
        short: "redesign at one stroke is costly",
        statement:
          "Redesigning a whole society at one stroke is costly; designed institutions can last.",
        grade: "on balance",
        grounds:
          "redesigning a whole society at one stroke paid a heavy price in France after 1789, with war finance as a rival cause (on balance); designed constitutions and institutions have lasted (strong).",
        overturnedBy: "a whole-society redesign at one stroke that paid no heavy price where war was absent.",
      },
      {
        id: "P12",
        short: "decline by mechanism, reversible",
        statement:
          "Civilizations decline through mechanisms, not by fate, and decline can be reversed.",
        grade: "strong",
        grounds:
          "every law of decline tested failed (strong, Gobineau's established); named mechanisms held; parliaments were restored across Europe against the forecast of their death (strong); Europe recovered after Rome's collapse (on balance).",
        overturnedBy: "a law of decline stated in advance that predicts a dated fall.",
      },
      {
        id: "P13",
        short: "progress real, not a law",
        statement: "Material progress is real but not a law of history.",
        grade: "strong",
        grounds:
          "Condorcet's material forecasts of 1795, longer lives, literacy, abolition, held (strong); the forecast that liberal democracy would spread failed from 2006 (strong).",
        overturnedBy: "a sustained world fall in life expectancy and literacy.",
      },
      {
        id: "P14",
        short: "property and markets under law",
        statement: "Property and markets under law produce wealth; planning failed.",
        grade: "established",
        grounds:
          "matched pairs and turns: the two Koreas, the two Germanies, China after 1978, India after 1991 (established); institutions alone can produce gaps as large as any between nations (established).",
        overturnedBy: "a planned economy at parity with a matched market economy over decades.",
      },
      {
        id: "P15",
        short: "power between peoples, peace among republics",
        statement:
          "Without a common authority, power decides between peoples; among free republics, peace has held.",
        grade: "on balance",
        grounds:
          "(a) where no common authority exists, cities at war acted as the strong could (on balance); (b) no war between established democracies or between members of the European Union since 1950 (strong).",
        overturnedBy:
          "for (a), a period of stable restraint among unequal powers with no common authority and no balance; for (b), a war between two established democracies.",
      },
    ],
  },
  {
    label: "Values",
    postulates: [
      {
        id: "P16",
        short: "freedom among citizens",
        statement: "Freedom among citizens is a good worth keeping.",
        grade: "argued",
        grounds:
          "every alternative needs someone entitled to decide others' good; no criterion for choosing that someone survived its test; where freedom was kept it did not cost what its critics forecast.",
        overturnedBy:
          "an argument, not evidence: a criterion, fixed in advance, for who may decide others' good that survives its own test.",
      },
      {
        id: "P17",
        short: "the West's achievement, worth conserving",
        statement: "The West's achievement is real and worth conserving.",
        grade: "argued",
        grounds:
          "philosophy and political theory arose with the Greeks; the lead in recorded science after 1400 is overwhelmingly European (strong); the lead in wealth opened in late-medieval Italy (on balance); self-government as the limited crown and the wide franchise (strong); the cause is open.",
        overturnedBy:
          "for the factual half, a documented list of omitted non-European achievements after 1400 at a scale that changes the shares; for the value half, an argument that an achievement whose cause is unknown can be reproduced without the institutions it arose with.",
      },
    ],
  },
  {
    label: "Common ground (§0)",
    postulates: [
      {
        id: "A1",
        short: "offices to the capable",
        statement: "Offices should go to the capable.",
        grade: "argued",
        grounds:
          "one of two aims no side disputes: Plato, Aristotle, the elite theorists and the meritocratic liberals all hold it, and dispute only who the capable are and how they are found.",
        overturnedBy: "a side that holds offices should go to the incapable; none has been found.",
      },
      {
        id: "A2",
        short: "peace over war",
        statement: "Peace is better than war.",
        grade: "argued",
        grounds: "one of two aims no side disputes, stated once in section 0 and named wherever a thesis uses it.",
        overturnedBy: "a side that prefers war to peace as such; none has been found.",
      },
    ],
  },
];

export const THESES: Thesis[] = [
  {
    id: "T1",
    short: "mixed, limited regime",
    statement:
      "A mixed, limited regime: a settled last word held under law, and an elite that can be removed.",
    grade: "on balance",
    weakest: "P4 and P6, each on balance; the settled last word under law alone is strong (P5).",
  },
  {
    id: "T2",
    short: "freedom does not found itself",
    statement:
      "Liberal freedom does not found itself: it lives on a nation, an elite held under law, an inherited culture it cannot produce on demand, and an economy of property and markets.",
    grade: "on balance",
    weakest: "P4, P6 and P8, each on balance.",
  },
  {
    id: "T3",
    short: "control of membership, within duties",
    statement:
      "A people may decide who joins and how many, and select by capacity to integrate, within duties of rescue, fair terms, and full inclusion of those it admits.",
    grade: "on balance",
    weakest: "P8 and Miller over Carens, each on balance.",
  },
  {
    id: "T4",
    short: "membership cultural, not racial",
    statement:
      "Membership is cultural, not racial: open in principle, slow, and demanded rather than assumed.",
    grade: "strong",
    weakest: "none below strong for the evidence: P9 and P1's equal-standing half; the forbidding of status by descent rests on P16, argued.",
  },
  {
    id: "T5",
    short: "market with a floor",
    statement:
      "A market economy with a guaranteed minimum, not redistribution aimed at equal outcomes.",
    grade: "on balance",
    weakest: "P6 and the floor as common ground, each on balance; the refusal of equal outcomes rests on P16, argued. P3 is listed and does no work.",
  },
  {
    id: "T6",
    short: "public precedence, religious liberty",
    statement:
      "A free state may favour in public life the religion and culture it historically lives on, while protecting religious liberty.",
    grade: "on balance",
    weakest: "P8, on balance; conserving the culture rests on P17, argued.",
  },
  {
    id: "T7",
    short: "no inherited guilt; repair to the living",
    statement:
      "No inherited guilt; liability only through institutions that persist; repair owed to people now alive.",
    grade: "strong",
    weakest: "none below strong: P7 and the inherited-guilt verdicts (a) to (d).",
  },
  {
    id: "T8",
    short: "power between peoples, cooperation among free states",
    statement:
      "Between peoples, interest and power where no common authority exists; cooperation among free states.",
    grade: "on balance",
    weakest: "P15's first half, the Melos description, on balance.",
  },
  {
    id: "T9",
    short: "radical alternatives excluded",
    statement:
      "The radical alternatives are excluded: the decider, the racial nation, the conservative revolution, conquest as a right, ownership of people.",
    grade: "on balance",
    weakest: "the decider, on balance; each other part at its own grade.",
  },
];

const v = (
  id: string,
  label: string,
  grade: Grade,
  lesson: string,
  title: string,
): Verdict => ({ id, label, grade, lesson, title });

export const MODULES: ModuleGroup[] = [
  {
    n: 1,
    verdicts: [
      v("V1a", "leading capacity partly inherited", "strong", "aristotle-political-animal-and-natural-slavery", "Aristotle on the household"),
      v("V1b", "natural slavery fails", "established", "aristotle-political-animal-and-natural-slavery", "Aristotle on the household"),
      v("V1c", "Melos: the strong do as they can", "on balance", "thucydides-power-and-justice", "Thucydides: Mytilene and Melos"),
      v("V1d", "political theory began in Greece", "on balance", "greek-miracle", "The Greek miracle"),
    ],
  },
  {
    n: 2,
    verdicts: [
      v("V2a", "Rome held by its public worship", "strong", "altar-of-victory", "The Altar of Victory, 384"),
    ],
  },
  {
    n: 3,
    verdicts: [
      v("V3a", "1642 and 1689", "strong", "english-revolution-as-test", "The English Revolution read against Hobbes"),
    ],
  },
  {
    n: 4,
    verdicts: [
      v("V4a", "no solitary stage; states safer", "strong", "rousseau-inequality-and-general-will", "Rousseau: the origin of inequality"),
      v("V4b", "the original contract fails", "strong", "hume-against-the-original-contract", "Hume against the original contract"),
      v("V4c", "Burke's assignat forecast held", "on balance", "assignats", "The assignats"),
      v("V4d", "designed institutions last", "strong", "maistre-and-bonald", "Maistre and Bonald"),
    ],
  },
  {
    n: 5,
    verdicts: [
      v("V5a", "the hero not known in advance", "strong", "carlyle-heroes", "Carlyle: hero-worship"),
      v("V5b", "the wise minority is disputed", "strong", "stephen-liberty-equality-fraternity", "Stephen against Mill"),
      v("V5c", "franchise widened, liberty kept", "strong", "british-franchise", "The British franchise 1832–1928"),
    ],
  },
  {
    n: 6,
    verdicts: [
      v("V6a", "membership is received", "strong", "barres-and-maurras-integral-nationalism", "Barrès and Maurras"),
      v("V6b", "received membership, no rank", "strong", "barres-and-maurras-integral-nationalism", "Barrès and Maurras"),
      v("V6c", "racial accounts fail", "established", "gobineau-inequality-of-races", "Gobineau's Essay on the Inequality of Races"),
    ],
  },
  {
    n: 7,
    verdicts: [
      v("V7a", "a few rule, as a tendency", "strong", "michels-and-pareto-oligarchy-and-elites", "Michels and Pareto"),
      v("V7b", "capable only if removable", "on balance", "michels-and-pareto-oligarchy-and-elites", "Michels and Pareto"),
      v("V7c", "Weimar: decree rule, no end set", "on balance", "article-48-weimar", "Article 48 and the end of the Weimar Reichstag"),
      v("V7d", "parliaments outlived Spengler", "strong", "spengler-decline-of-the-west", "Spengler's Decline of the West"),
    ],
  },
  {
    n: 8,
    verdicts: [
      v("V8a", "the decider has no check", "on balance", "the-right-in-1933", "1933: Schmitt, Heidegger and Spengler choose"),
      v("V8b", "revolution without a programme", "strong", "moeller-van-den-bruck-third-reich", "Moeller van den Bruck's Third Reich"),
    ],
  },
  {
    n: 9,
    verdicts: [
      v("V9a", "the state's share grew", "established", "jouvenel-on-power", "Jouvenel's On Power"),
      v("V9b", "growth as a law fails", "on balance", "jouvenel-on-power", "Jouvenel's On Power"),
      v("V9c", "Condorcet's forecasts held", "strong", "voegelin-gnosticism", "Voegelin"),
      v("V9d", "markets beat planning", "established", "burnham-managers-and-the-suicide-of-the-west", "Burnham"),
      v("V9e", "civil rights enforceable", "strong", "udhr-read-against-the-right", "The Universal Declaration read against the right"),
    ],
  },
  {
    n: 10,
    verdicts: [
      v("V10a", "ability predicts within families", "strong", "the-cognitive-elite", "The cognitive elite"),
      v("V10b", "envy a motive, the weakest", "on balance", "ressentiment-and-envy", "Ressentiment and envy"),
      v("V10c", "a motive decides nothing", "strong", "ressentiment-and-envy", "Ressentiment and envy"),
      v("V10d", "the floor is common ground", "on balance", "the-cognitive-elite", "The cognitive elite"),
      v("V10e", "strict equality fails", "strong", "the-cognitive-elite", "The cognitive elite"),
    ],
  },
  {
    n: 11,
    verdicts: [
      v("V11a", "every law of decline fails", "strong", "toynbee-challenge-and-response", "Toynbee: challenge and response"),
      v("V11b", "democracy's spread reversed", "strong", "huntington-clash-of-civilizations", "Huntington's clash of civilizations"),
      v("V11c", "the republican peace", "strong", "testing-the-clash", "Testing the clash"),
    ],
  },
  {
    n: 12,
    verdicts: [
      v("V12a", "Europe recovered after Rome", "on balance", "the-borrowing-ledger", "The borrowing ledger"),
      v("V12b", "science after 1400 European", "strong", "murray-human-accomplishment", "Human Accomplishment"),
      v("V12c", "wealth lead from Italy, c. 1300", "on balance", "the-borrowing-ledger", "The borrowing ledger"),
      v("V12d", "no continuous Western lead", "strong", "the-borrowing-ledger", "The borrowing ledger"),
      v("V12e", "the cause of the rise", "open", "the-borrowing-ledger", "The borrowing ledger"),
    ],
  },
  {
    n: 13,
    verdicts: [
      v("V13a", "culture persists", "strong", "national-data-audited", "Datasets audited"),
      v("V13b", "regimes not explained by genes", "strong", "national-data-audited", "Datasets audited"),
      v("V13d", "heritability splits no gap", "established", "heritability-within-and-between-groups", "Heritability within and between groups"),
      v("V13e", "heredity settles no policy", "strong", "gould-and-harden-on-heredity", "Gould and Harden on heredity"),
      v("V13c", "institutions alone make gaps", "established", "geography-or-institutions", "Geography or institutions"),
    ],
  },
  {
    n: 14,
    verdicts: [
      v("V14a", "slavery a positive good: fails", "strong", "locke-and-mill-on-empire", "Locke and Mill on empire"),
      v("V14b", "power gives no title", "strong", "vitoria-right-to-the-americas", "Vitoria on the right to the Americas"),
      v("V14c", "no inherited guilt, (a) to (d)", "strong", "inherited-guilt-and-reparations", "Inherited guilt"),
    ],
  },
  {
    n: 15,
    verdicts: [
      v("V15a", "integration did not follow", "strong", "murray-strange-death-of-europe", "Murray's Strange Death of Europe"),
      v("V15b", "Muslim-origin faith persisted", "strong", "murray-strange-death-of-europe", "Murray's Strange Death of Europe"),
      v("V15c", "Miller over Carens", "on balance", "miller-strangers-in-our-midst", "Miller: controlled borders"),
      v("V15f", "labour pays, asylum costs", "strong", "murray-strange-death-of-europe", "Murray's Strange Death of Europe"),
    ],
  },
  {
    n: 16,
    verdicts: [
      v("V16a", "the Böckenförde premise", "on balance", "hungarys-fundamental-law", "Hungary's Fundamental Law"),
      v("V16b", "court overridden, 2013", "strong", "hungarys-fundamental-law", "Hungary's Fundamental Law"),
      v("V16c", "the common good has no check", "on balance", "vermeule-common-good-constitutionalism", "Vermeule's common-good constitutionalism"),
      v("V16d", "2026: the majority voted out", "strong", "hungarys-fundamental-law", "Hungary's Fundamental Law"),
      v("V16e", "no neutral civic state", "strong", "hazony-virtue-of-nationalism", "Hazony's Virtue of Nationalism"),
      v("V16f", "the EU: no empire by consent", "strong", "hazony-virtue-of-nationalism", "Hazony's Virtue of Nationalism"),
      v("V16g", "liberal principles not enough", "on balance", "the-argument-assembled", "The argument assembled"),
    ],
  },
];

/**
 * Every "rests on" line, [ground, what rests on it]. A thesis's premises
 * are its postulate rows; a verdict row ends at a postulate or, where the
 * lesson names it in a thesis's `from`, at the thesis directly.
 */
export const EDGES: [string, string][] = [
  // theses on their premises (postulates and the two common-ground aims)
  ["P1", "T1"], ["P2", "T1"], ["P4", "T1"], ["P5", "T1"], ["P6", "T1"], ["P16", "T1"], ["A1", "T1"],
  ["P4", "T2"], ["P6", "T2"], ["P7", "T2"], ["P8", "T2"], ["P9", "T2"], ["P14", "T2"], ["P16", "T2"],
  ["P7", "T3"], ["P8", "T3"], ["P9", "T3"], ["P16", "T3"],
  ["P1", "T4"], ["P9", "T4"], ["P16", "T4"],
  ["P1", "T5"], ["P3", "T5"], ["P6", "T5"], ["P14", "T5"], ["P16", "T5"],
  ["P8", "T6"], ["P9", "T6"], ["P10", "T6"], ["P16", "T6"], ["P17", "T6"],
  ["P7", "T7"],
  ["P5", "T8"], ["P15", "T8"], ["A2", "T8"],
  ["P1", "T9"], ["P4", "T9"], ["P6", "T9"], ["P9", "T9"], ["P11", "T9"], ["P12", "T9"], ["P15", "T9"],
  // verdicts on what they ground
  ["V1a", "P1"],
  ["V1b", "P1"], ["V1b", "T9"],
  ["V1c", "P15"], ["V1c", "T8"],
  ["V1d", "P17"],
  ["V2a", "P8"], ["V2a", "P10"], ["V2a", "T6"],
  ["V3a", "P5"], ["V3a", "P17"], ["V3a", "T1"],
  ["V4a", "P2"],
  ["V4b", "P7"],
  ["V4c", "P11"],
  ["V4d", "P11"],
  ["V5a", "P16"],
  ["V5b", "P16"],
  ["V5c", "P16"], ["V5c", "P17"],
  ["V6a", "P7"],
  ["V6b", "T4"],
  ["V6c", "P9"], ["V6c", "P12"], ["V6c", "T4"], ["V6c", "T9"],
  ["V7a", "P4"],
  ["V7b", "P4"], ["V7b", "T1"],
  ["V7c", "P6"], ["V7c", "P16"], ["V7c", "T1"],
  ["V7d", "P12"],
  ["V8a", "T9"],
  ["V8b", "T9"],
  ["V9a", "P6"],
  ["V9b", "P6"],
  ["V9c", "P13"],
  ["V9d", "P14"],
  ["V9e", "P16"], ["V9e", "T6"],
  ["V10a", "P1"],
  ["V10b", "P3"],
  ["V10c", "P3"],
  ["V10d", "T5"],
  ["V10e", "T5"],
  ["V11a", "P12"],
  ["V11b", "P13"],
  ["V11c", "P15"], ["V11c", "T8"],
  ["V12a", "P12"],
  ["V12b", "P17"],
  ["V12c", "P17"],
  ["V12d", "P17"],
  ["V12e", "P17"],
  ["V13a", "P9"],
  ["V13b", "P9"], ["V13b", "T4"],
  ["V13c", "P14"],
  ["V13d", "T4"],
  ["V13e", "T4"],
  ["V14a", "P1"], ["V14a", "T9"],
  ["V14b", "P15"], ["V14b", "T8"], ["V14b", "T9"],
  ["V14c", "T7"],
  ["V15a", "P8"], ["V15a", "P9"], ["V15a", "T3"],
  ["V15b", "P10"],
  ["V15c", "T3"],
  ["V15f", "T3"],
  ["V16a", "P8"],
  ["V16b", "P6"], ["V16b", "T1"],
  ["V16c", "P6"], ["V16c", "P16"],
  ["V16d", "P16"],
  ["V16e", "T6"],
  ["V16f", "T8"],
  ["V16g", "T2"],
];
