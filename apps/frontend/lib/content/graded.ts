import { stringAttr, type MdxJsxNode } from "./mdx-jsx";

/**
 * The graded environments: <Verdict>, the answer to a dispute a lesson
 * staged, and <Postulate>/<Thesis>, a doctrine set out as a derivation
 * (docs/pedagogy.md L17). They differ only in counter, label and the props
 * below; the page, the Markdown twin, the search index and the validator all
 * read them from here.
 */
export const VERDICT_GRADES = ["established", "strong", "on balance", "open"] as const;

/** A postulate may also be a value premise, which is argued for rather than measured. */
export const POSTULATE_GRADES = [...VERDICT_GRADES, "argued"] as const;

export type Grade = (typeof POSTULATE_GRADES)[number];

/** The labelled lines set under the statement, by prop. */
export const TEST_LABELS = {
  decidedBy: "Decided by:",
  grounds: "Grounds:",
  overturnedBy: "Would be overturned by:",
} as const;

export type Tests = Partial<Record<keyof typeof TEST_LABELS, string>>;

export interface GradedProps extends Tests {
  grade?: Grade;
  /** What a thesis follows from: "P3, P4; Verdicts 15.2, 15.4". */
  from?: string;
}

export const GRADED = {
  Verdict: { grades: VERDICT_GRADES, gradeRequired: true, tests: ["decidedBy", "overturnedBy"] },
  Postulate: { grades: POSTULATE_GRADES, gradeRequired: true, tests: ["grounds", "overturnedBy"] },
  Thesis: { grades: POSTULATE_GRADES, gradeRequired: false, tests: [] },
} as const satisfies Record<
  string,
  { grades: readonly Grade[]; gradeRequired: boolean; tests: readonly (keyof Tests)[] }
>;

export type GradedName = keyof typeof GRADED;

/** The graded props of an MDX node, for the readers that see the source rather than the page. */
export function gradedAttrs(node: MdxJsxNode): GradedProps {
  const names = ["grade", "from", ...Object.keys(TEST_LABELS)];
  return Object.fromEntries(
    names.flatMap((name) => {
      const value = stringAttr(node, name);
      return value === undefined ? [] : [[name, value]];
    }),
  );
}

export function isGraded(name: string): name is GradedName {
  return Object.hasOwn(GRADED, name);
}

/** The parenthetical after the label: "strong", "from P3, P4", "on balance; from P3". */
export function gradedNote({ grade, from }: GradedProps): string | undefined {
  const parts = [grade, from !== undefined ? `from ${from}` : undefined].filter(
    (p) => p !== undefined,
  );
  return parts.length > 0 ? parts.join("; ") : undefined;
}

/** The [label, value] lines a graded environment sets under its statement. */
export function gradedTests(name: GradedName, props: Tests): [string, string][] {
  return GRADED[name].tests.flatMap((prop: keyof Tests) => {
    const value = props[prop];
    return value === undefined ? [] : [[TEST_LABELS[prop], value]];
  });
}
