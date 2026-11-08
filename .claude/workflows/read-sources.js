export const meta = {
  name: 'read-sources',
  description: 'Read only the sources passed in args — scope → read → merge, as course-factory reads — and return their summaries and access log (no canon, no synthesis)',
  whenToUse: 'After a structure run, when a batch of sources must be (re)read without re-running the whole swarm: the human staged new books, the canon missed primary texts, or a planned extension needs its own reading. Args: {slug, root, sources: [{title, author?, kind, url?}], brief?}.',
  phases: [
    { title: 'Read', detail: 'scope → readers (big books shard by ToC) → merge, per source', model: 'sonnet' },
  ],
}
const SUMMARY_SCHEMA = {
  type: 'object',
  required: ['title', 'topics', 'key_results', 'chapter_map'],
  properties: {
    title: { type: 'string' },
    access: { type: 'string', description: 'full | partial | toc-only | summary-based — full ONLY if every line of your range was read' },
    chars_total: { type: 'integer', description: 'characters of extracted text in your range' },
    chars_read: { type: 'integer', description: 'characters of that text you actually read — sampled, grepped or truncated text does not count' },
    topics: { type: 'array', items: { type: 'string' }, description: 'ToC-order topic list, chapter/section granularity' },
    key_results: { type: 'array', items: { type: 'string' }, description: 'central theorems/definitions with chapter pointers' },
    pedagogy: { type: 'string', description: 'proof style, exercise style, assumed prerequisites' },
    figures: { type: 'array', items: { type: 'string' }, description: 'notable/canonical visualizations and where — ideas to recreate in house style' },
    image_candidates: {
      type: 'array',
      description: 'at most 8, ranked: images that would have to be the REAL artefact (photo, scan, apparatus, published data plot) rather than a redrawing — each already captured to disk',
      items: {
        type: 'object',
        required: ['id', 'capture', 'shows', 'located', 'why_real'],
        properties: {
          id: { type: 'string', description: 'kebab-case id, unique within the source' },
          capture: { type: 'string', description: 'path of the captured file (whole page or downloaded image)' },
          shows: { type: 'string', description: 'what the image shows, one line' },
          located: { type: 'string', description: 'exact position: page, figure/plate number' },
          why_real: { type: 'string', description: 'why a house-style redrawing would destroy its point' },
          url: { type: 'string', description: 'direct URL, or the PDF + page it lives in' },
          license: { type: 'string', description: 'as the source page states it: public domain | CC-BY-… | publisher © (teaching use) | unknown' },
          quality: { type: 'string', description: 'scan legibility, resolution, colour — anything visible' },
        },
      },
    },
    gems: { type: 'array', items: { type: 'string' }, description: 'memorable worked examples, striking numbers, analogies, case studies — with chapter pointers' },
    assignments: {
      type: 'array',
      items: { type: 'string' },
      description: 'what the source makes students BUILD by hand (homeworks, problem sets with code, projects, labs), one line each: name + pointer, what the student produces, how the work is cut into steps, what scaffold is given, how it is verified. Empty when the source assigns nothing — never invent one',
    },
    chapter_map: { type: 'array', items: { type: 'string' }, description: '"topic -> chapter/section" lines' },
  },
}

const SCOPE_SCHEMA = {
  type: 'object',
  required: ['access', 'where', 'shards'],
  properties: {
    access: { type: 'string', description: 'full | toc-only | summary-based | not-found' },
    where: { type: 'string', description: 'best reading location found: URL(s), archive.org id, mirror — enough that a reader needs no re-hunting; for not-found, what you tried' },
    shards: {
      type: 'array',
      description: '1 entry = no split; otherwise one entry per ~150 KB of extracted text, split on chapter (or, for a legal act, title/chapter) boundaries; a source bundling several documents shards per document first',
      items: {
        type: 'object',
        required: ['range'],
        properties: {
          range: { type: 'string', description: 'explicit document and chapter/page range, e.g. "chs. 1-9 (pp. 1-310)" or "AMLR Arts. 1-49"' },
          note: { type: 'string', description: 'what this stretch of the book covers, one line' },
        },
      },
    },
  },
}

const argv = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const slug = argv.slug
if (!slug) throw new Error('args.slug is required')

// Subagents inherit the SESSION's launch directory, not the orchestrator's
// current worktree — so the orchestrating skill passes args.root (absolute
// path of the course worktree) and every agent prompt is prefixed with it.
const root = argv.root
const at = root
  ? `Repo root for ALL file reads and writes: ${root} (a git worktree). Use absolute paths under it; never touch any other checkout of this repo.\n\n`
  : ''

// Optional human design intent (format, audience, angle) — binding for both
// canon selection and structure synthesis when the course is not a plain
// "teach subject X" (e.g. interview prep, a workshop, an exam crammer).
const brief = argv.brief
  ? `\n\nCourse design intent from the human (binding — shape source choice and structure around it): ${argv.brief}`
  : ''

// agent() returns null once the runtime's own retries are exhausted — which
// a sustained 529 storm does within a minute. Without this, that null used to
// ride the pipeline all the way down: figure scans on a lesson never written,
// QA on nothing, the next lesson drafted against a missing prerequisite. A
// distinct label per attempt keeps each try its own line in the progress tree.
const RETRIES = 2
const run = async (prompt, opts = {}) => {
  let out = await agent(prompt, opts)
  for (let i = 1; out === null && i <= RETRIES; i++) {
    log(`${opts.label ?? 'agent'}: no result, retry ${i}/${RETRIES}`)
    out = await agent(prompt, { ...opts, label: `${opts.label ?? 'agent'} (retry ${i})` })
  }
  return out
}

const sources = argv.sources ?? []
if (!sources.length) throw new Error('args.sources is required')
const rereadNote = () => ''
{
  phase('Read')
  // Big fully-accessible books are sharded across readers by a deterministic
  // ToC split: one context window per ~10-15 chapters instead of one per
  // book, so the long tail of a 900-page source stops evaporating. A scoper
  // finds the source and proposes the split; shard readers see ONLY their
  // range; a merger folds shard summaries back into one per-source summary
  // (same shape, so synthesis downstream is unchanged). pipeline(): each
  // source flows scope -> read -> merge without waiting for the others.
  // Access is tracked per source so that anything short of a full read is
  // REPORTED to the human at the end, never silently omitted — the human can
  // obtain missing books from the publishers and re-run the read for them.
  const accessLog = []
  const capNote = `Capture directory for image candidates: content/courses/${slug}/research/images/ — create it if missing, and prefix every id with a short source tag so the swarm's ids never collide. Texts cache for the raw material you fetch (PDFs, extracted text, flattened chapters — each with its .meta.yaml sidecar, per your briefing): content/courses/${slug}/research/texts/ — create it if missing; lesson writers will read from it instead of re-fetching.`
  const summaries = (
    await pipeline(
      sources,
      (s) =>
        run(
          `${at}Scope ONE source for a reading swarm: "${s.title}"${s.author ? ` by ${s.author}` : ''} (${s.kind})${s.url ? `, URL: ${s.url}` : ' — locate it yourself (WebSearch), prefer official/legal copies'}. Before searching the web, list content/courses/${slug}/research/texts/: if a file there IS this source (confirm against the PDF’s own first pages, not just the filename), that is your answer — access "full", \`where\` = that file’s absolute path, and say in \`where\` that the human staged it. Only hunt online when nothing on disk matches. Otherwise, find where it can actually be read, fetch its table of contents, and decide the split. The split is by SIZE OF TEXT, never by page or chapter count: extract the full text (pdftotext, or the flattened HTML) into the texts cache and measure it with \`wc -c\`. A source bundling several documents (three regulations, a book plus its notebooks) shards per document first. Then any document over ~150 KB of text is cut into shards of at most ~150 KB each along chapter/section boundaries (titles/chapters for a legal act), however many that takes; a document under that is one shard. State each shard's size in its \`note\`. Report access honestly (full | toc-only | summary-based | not-found) and pass on the best reading location you found so readers do not re-hunt. If you cannot find the source at all, do NOT invent a location and do NOT quietly settle for second-hand descriptions of it — return access "not-found" with \`where\` describing what you tried; the human will obtain a copy from the publisher.${rereadNote(s)}`,
          { label: `scope: ${s.title.slice(0, 28)}`, phase: 'Read', model: 'sonnet', schema: SCOPE_SCHEMA },
        ).then((scope) => {
          accessLog.push({ title: s.title, access: scope ? scope.access : 'scope-failed', where: scope ? scope.where : '' })
          return scope
        }),
      (scope, s) =>
        scope &&
        scope.access !== 'not-found' &&
        parallel(
          scope.shards.map((shard, i) => () =>
            run(
              `${at}Source to summarize: "${s.title}"${s.author ? ` by ${s.author}` : ''} (${s.kind}). Reason it is canon: ${s.why}. Access per the scoper: ${scope.access}; read it at: ${scope.where}. ${scope.shards.length > 1 ? `YOUR SHARD (${i + 1}/${scope.shards.length}): ${shard.range} — read ONLY this range, report ONLY from it, and stay silent about the rest of the book; the swarm covers it.` : 'You cover the whole source.'} Follow your source-reader briefing.\n\nREAD EVERY LINE of your range, in order, in consecutive windows (Read with offset/limit, or \`sed -n\` ranges that tile the file with no gaps). Never \`cut -c\`, \`head -c\`, \`head -n\` or \`grep\` your way through it in place of reading: sampling is not reading, and what the course is built from is what you actually saw. Measure your range with \`wc -c\` and report chars_total, and chars_read as the text you really read. access is "full" only when chars_read covers the whole range; anything less is "partial" — say what you skipped and why, and the human will see it.\n\n${capNote} For this source use the tag \`${(s.title.match(/[A-Za-z0-9]+/g) || ['src']).slice(0, 2).join('').toLowerCase().slice(0, 12)}${scope.shards.length > 1 ? `-s${i + 1}` : ''}-\`.`,
              { label: `read: ${s.title.slice(0, 22)}${scope.shards.length > 1 ? ` [${i + 1}/${scope.shards.length}]` : ''}`, phase: 'Read', agentType: 'source-reader', schema: SUMMARY_SCHEMA },
            ),
          ),
        ),
      (parts, s) => {
        const kept = (parts || []).filter(Boolean)
        const short = kept.filter((p) => !String(p.access ?? '').startsWith('full') || (p.chars_total && (p.chars_read ?? 0) < 0.9 * p.chars_total))
        if (short.length) accessLog.push({ title: s.title, access: 'partial', where: short.map((p) => `${p.access ?? '?'} — read ${p.chars_read ?? '?'} of ${p.chars_total ?? '?'} chars`).join('; ') })
        if (kept.length === 0) return null
        if (kept.length === 1) return kept[0]
        return run(
          `${at}Merge these shard summaries of ONE source — "${s.title}"${s.author ? ` by ${s.author}` : ''} — into a single source summary of the same shape (chars_total and chars_read are the shard sums; access is "full" only if every shard's is). Concatenate topics, chapter_map and assignments in book order; keep EVERY key_result, gem, assignment and figure idea with its chapter pointer (dedupe only true duplicates); rank image_candidates across shards and keep at most 8 (do NOT delete the losing captures from disk — just omit them from the list); synthesize one pedagogy note. Shard summaries (JSON): ${JSON.stringify(kept)}`,
          { label: `merge: ${s.title.slice(0, 28)}`, phase: 'Read', model: 'sonnet', schema: SUMMARY_SCHEMA },
        )
      },
    )
  ).filter(Boolean)
  log(`read: ${summaries.length}/${sources.length} sources summarized`)
  if (summaries.length === 0) throw new Error('no source could be read — aborting before synthesis')
  const degraded = accessLog.filter((a) => a.access !== 'full')
  if (degraded.length) log(`ATTENTION — sources NOT fully read (report to the human, never silently omit; they can obtain copies from the publishers): ${degraded.map((d) => `"${d.title}" [${d.access}]`).join('; ')}`)
  // A halt here lets the human refine the brief against what the canon
  // actually says; resuming the run without `until` serves the reads from cache.
  return { sources: sources.length, read: summaries.length, not_fully_read: degraded, accessLog, summaries }
}
