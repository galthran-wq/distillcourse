import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";
import { loadCourse } from "@/lib/content/load";
import {
  courseMarkdown,
  lessonMarkdown,
  llmsTxt,
  mdxToMarkdown,
} from "@/lib/content/markdown-export";
import { getCourses, getLessonView, SITE_URL } from "@/lib/content/site";
import { isReadable } from "@/lib/content/visibility";
import { wantedAssets } from "@/lib/content/assets";
import { GET as lessonRoute } from "@/app/md/courses/[course]/lessons/[lesson]/route";

const COURSE_DIR = fileURLToPath(new URL("./fixtures/lint-course", import.meta.url));
const LESSON_DIR = join(COURSE_DIR, "lessons", "intro-surprise");
const PAGE = "/courses/lint-course/lessons/intro-surprise";
const HTML = `${SITE_URL}${PAGE}`;

beforeEach(() => vi.stubEnv("CONTENT_PREVIEW", "1"));
afterEach(() => vi.unstubAllEnvs());

function md(source: string): string {
  return mdxToMarkdown(source, { course: loadCourse(COURSE_DIR), dir: LESSON_DIR, page: PAGE });
}

describe("mdxToMarkdown", () => {
  it("heads a numbered environment with its section, counter and title", () => {
    const out = md(
      [
        '<Definition title="surprisal">A definition.</Definition>',
        "## One",
        '<Theorem title="range">Statement.</Theorem>',
        "<Lemma>Helper.</Lemma>",
        "<Proposition>Prop.</Proposition>",
        "<Corollary>Then.</Corollary>",
        "<Remark>Note.</Remark>",
        "## Two",
        "<Definition>Again.</Definition>",
        "<Example>Worked.</Example>",
      ].join("\n\n"),
    );
    expect(out).toContain("**Definition 0.1 (surprisal).** A definition.");
    expect(out).toContain("**Theorem 1.1 (range).** Statement.");
    // Lemma, Proposition and Corollary share Theorem's counter.
    expect(out).toContain("**Lemma 1.2.** Helper.");
    expect(out).toContain("**Proposition 1.3.** Prop.");
    expect(out).toContain("**Corollary 1.4.** Then.");
    expect(out).toContain("**Remark 1.1.** Note.");
    // An h2 resets the environment counters.
    expect(out).toContain("**Definition 2.1.** Again.");
    expect(out).toContain("**Example 2.1.** Worked. ◇");
  });

  it("writes a proof as a run-in italic head closed by a tombstone", () => {
    expect(md("<Proof>\n\nIt holds.\n\n</Proof>")).toBe("*Proof.* It holds. ∎");
  });

  it("numbers exercises across the lesson and prints solutions in full", () => {
    const out = md(
      [
        "<Exercise>\n\nFirst.\n\n<Solution>\n\nOne.\n\n</Solution>\n\n</Exercise>",
        "## Later",
        "<Exercise>\n\nSecond.\n\n<Solution>\n\nTwo.\n\n</Solution>\n\n</Exercise>",
      ].join("\n\n"),
    );
    expect(out).toContain("**Exercise 1.** First.\n\n*Solution.* One.");
    expect(out).toContain("**Exercise 2.** Second.\n\n*Solution.* Two.");
  });

  it.each([
    ["KeyFact", "Key fact"],
    ["Task", "Task"],
    ["Aside", "Aside"],
  ])("sets <%s> as a labelled blockquote", (name, label) => {
    expect(md(`<${name}>\n\nBody text.\n\n</${name}>`)).toBe(`> **${label}.** Body text.`);
  });

  it("quotes the passage with its source, then the original as a second blockquote", () => {
    const out = md(
      [
        '<Quote source="GS §125">',
        "",
        "God is dead.",
        "",
        '<Original lang="de">',
        "",
        "Gott ist todt.",
        "",
        "</Original>",
        "",
        "</Quote>",
      ].join("\n"),
    );
    expect(out).toBe("> God is dead.\n>\n> — GS §125\n\n> *Original:* Gott ist todt.");
  });

  it("links a file figure's served asset and numbers only captioned figures", () => {
    const out = md(
      [
        '<Figure src="./figures/rarity.svg" alt="Bars" caption="Rare is surprising." />',
        '<Figure src="figures/photo.jpg" alt="Uncaptioned" />',
        '<Figure src="figures/b.png" alt="B" caption="Second." />',
      ].join("\n\n"),
    );
    const assets = `${SITE_URL}/course-assets/lint-course/intro-surprise`;
    expect(out).toContain(`![Bars](${assets}/rarity.svg)\n*Figure 1. Rare is surprising.*`);
    expect(out).toContain(`![Uncaptioned](${assets}/photo.jpg)\n\n`);
    expect(out).toContain(`![B](${assets}/b.png)\n*Figure 2. Second.*`);
  });

  it("points a component figure and a sequence at the section of the page they sit in", () => {
    const out = md(
      [
        "## Where it lives",
        '<Figure name="Bars" alt="a" caption="Drawn." />',
        '<FigureSequence name="steps" alt="b" caption="Stepped." />',
      ].join("\n\n"),
    );
    const at = `${HTML}#where-it-lives`;
    expect(out).toContain(`*Figure 1. Drawn.* (interactive figure — <${at}>)`);
    expect(out).toContain(`*Figure 2. Stepped.* (interactive figure — <${at}>)`);
  });

  it("names a demo and counts a captioned one as the page's figure", () => {
    const out = md(['<Demo name="Slider" />', '<Demo name="Dial" caption="Turn it." />'].join("\n\n"));
    expect(out).toContain(`*Interactive demo: Slider — <${HTML}>*`);
    expect(out).toContain(`*Interactive demo: Figure 1. Turn it. — <${HTML}>*`);
  });

  it("links a reference to the target's twin, and leaves an unreadable one as text", () => {
    const out = md(
      [
        'See <Ref lesson="surprisal-lab" id="setup" />.',
        'Or <Ref lesson="intro-surprise">this one</Ref>.',
        'Not <Ref lesson="next-steps" /> yet.',
      ].join("\n\n"),
    );
    const twin = `${SITE_URL}/courses/lint-course/lessons`;
    expect(out).toContain(`See [Lab: surprisal from scratch](${twin}/surprisal-lab.md#setup).`);
    expect(out).toContain(`Or [this one](${twin}/intro-surprise.md).`);
    expect(out).toContain("Not Where surprisal leads yet.");
  });

  it("opens References and Conclusion as sections, the conclusion with its own anchor", () => {
    const out = md(
      [
        "## Body",
        '<Conclusion>\n\nDone.\n\n<Figure name="X" alt="x" caption="End." />\n\n</Conclusion>',
        "<References>\n\n1. A book.\n\n</References>",
      ].join("\n\n"),
    );
    expect(out).toContain("## Conclusion\n\nDone.");
    expect(out).toContain(`(interactive figure — <${HTML}#conclusion>)`);
    expect(out).toContain("## References\n\n1. A book.");
  });

  it("makes a root-relative link absolute, to the twin when it names a lesson", () => {
    const out = md("[here](/courses/lint-course/lessons/intro-surprise#a) and [there](/settings)");
    expect(out).toBe(
      `[here](${SITE_URL}/courses/lint-course/lessons/intro-surprise.md#a) and [there](${SITE_URL}/settings)`,
    );
  });

  it("keeps math as LaTeX", () => {
    expect(md("Inline $H(X)$.\n\n$$\nH = 1\n$$")).toBe("Inline $H(X)$.\n\n$$\nH = 1\n$$");
  });

  it("throws on a component it has no mapping for", () => {
    expect(() => md("<Mystery>x</Mystery>")).toThrow(/<Mystery> has no Markdown mapping/);
  });
});

describe("visibility", () => {
  it("leaves unreadable lessons out of the index and the course outline", () => {
    const course = loadCourse(COURSE_DIR);
    for (const out of [llmsTxt([course]), courseMarkdown(course)]) {
      expect(out).toContain("Measuring surprise");
      expect(out).not.toContain("Where surprisal leads");
      expect(out).not.toMatch(/\b(planned|drafted|reviewed|published)\b/i);
    }
  });

  it("drops a course with no readable lesson from the index", () => {
    vi.unstubAllEnvs();
    expect(llmsTxt([loadCourse(COURSE_DIR)])).not.toContain("Lint fixture course");
  });

  it("answers 404 for a lesson the site does not render", async () => {
    const planned = getCourses()
      .flatMap((c) => c.lessons.map((l) => ({ course: c.course.slug, entry: l })))
      .find(({ entry }) => !isReadable(entry));
    expect(planned).toBeDefined();
    const response = await lessonRoute(new Request("http://x"), {
      params: Promise.resolve({ course: planned!.course, lesson: planned!.entry.lesson.slug }),
    });
    expect(response.status).toBe(404);
  });
});

const outputParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);

describe("every readable lesson", () => {
  it("converts, with no JSX left and every image a served asset", () => {
    const served = new Set(
      [...wantedAssets(join(process.cwd(), "..", "..", "content"), "/public").keys()].map(
        (path) => `${SITE_URL}${path.replace(/^\/public/, "/course-assets")}`,
      ),
    );
    const courses = getCourses();
    let lessons = 0;
    for (const course of courses) {
      const outputs = [courseMarkdown(course)];
      for (const entry of course.lessons.filter(isReadable)) {
        outputs.push(lessonMarkdown(getLessonView(course.course.slug, entry.lesson.slug)!));
        lessons++;
      }
      for (const out of outputs) {
        visit(outputParser.parse(out), (node) => {
          if (node.type === "html") expect(node.value).not.toMatch(/^<[A-Z]/);
          if (node.type === "image") expect(served).toContain(node.url);
        });
      }
    }
    expect(lessons).toBeGreaterThan(100);
  }, 300_000);
});
