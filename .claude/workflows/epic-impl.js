export const meta = {
  name: 'epic-impl',
  description: 'Implement a whole epic: dependency waves — implement/review/fix in parallel within a wave (opus), merges serialized with rebase into the epic branch; final multi-lens Fable review over the full epic diff',
  whenToUse: 'Invoked by the /epic-impl skill. Args: {epic: <issue number>, slug: <epic branch slug>, root: <abs repo path>, issues: [{number, deps: [numbers]}]}.',
  phases: [
    { title: 'Implement', detail: 'per wave: build → review×2 → fix in parallel; then a serialized merge queue', model: 'opus' },
    { title: 'Epic review', detail: 'three Fable lenses over the full diff', model: 'fable' },
    { title: 'Finalize', detail: 'apply findings, open epic → master PR (human merges)' },
  ],
}

const { epic, slug, root, issues } = args
const branch = `epic/${slug}`
const SKILL = `${root}/.claude/skills/feature-impl/SKILL.md`
const REVIEW = `${root}/.claude/skills/impl-review/SKILL.md`

// ---- Kahn layers: waves of issues whose deps are all in earlier waves ----
const waves = []
const pend = new Map(issues.map(i => [i.number, new Set(i.deps.filter(d => issues.some(j => j.number === d)))]))
while (pend.size) {
  const ready = [...pend.entries()].filter(([, d]) => d.size === 0).map(([n]) => n).sort((a, b) => a - b)
  if (!ready.length) throw new Error(`dependency cycle among: ${[...pend.keys()].join(', ')}`)
  waves.push(ready)
  for (const n of ready) pend.delete(n)
  for (const d of pend.values()) ready.forEach(n => d.delete(n))
}
log(`waves: ${waves.map(w => `[${w.join(',')}]`).join(' → ')}`)

const FINDINGS = {
  type: 'object', required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object', required: ['severity', 'where', 'summary', 'fix'],
        properties: {
          severity: { type: 'string', description: 'high | med | low' },
          where: { type: 'string', description: 'file:line' },
          summary: { type: 'string' }, fix: { type: 'string' },
        },
      },
    },
  },
}

// ---- Phase 1: waves. Build/review/fix run in parallel inside a wave;
// merges are SERIALIZED (one integration branch) with rebase before CI.
// Merge policy: agents squash-merge ONLY into the epic branch; main
// branches (master/develop) are merged by the human, never here. ----
phase('Implement')
const done = []
let stopped = null

outer:
for (const wave of waves) {
  log(`wave [${wave.join(', ')}]: building in parallel`)
  const prepped = await pipeline(
    wave,
    n => agent(
      `Work in repo ${root}. Read ${SKILL} and follow it for issue #${n}. ` +
      `Context: epic child of #${epic}, epic branch "${branch}" exists on origin — base your branch on it. ` +
      `Do steps 1–3, push branch feat/issue-${n}, open the PR against ${branch} (step 5.1). DO NOT merge. ` +
      `Return: PR number, one-paragraph summary, any Assumptions.`,
      { label: `impl:#${n}`, phase: 'Implement', model: 'opus' }
    ).then(r => { if (r === null) throw new Error(`impl #${n} died`); return r }),
    (implOut, n) => parallel([
      () => agent(`Repo ${root}. Read ${REVIEW}. Run PASS 1 (correctness) only, on the PR for issue #${n} (branch feat/issue-${n}, base ${branch}). Spec: gh issue view ${n}. Return findings.`,
        { label: `review-corr:#${n}`, phase: 'Implement', model: 'opus', schema: FINDINGS }),
      () => agent(`Repo ${root}. Read ${REVIEW}. Run PASS 2 (code quality) only, on the PR for issue #${n} (branch feat/issue-${n}, base ${branch}). Spec: gh issue view ${n}. Return findings.`,
        { label: `review-qual:#${n}`, phase: 'Implement', model: 'opus', schema: FINDINGS }),
    ]).then(rs => rs.filter(Boolean).flatMap(r => r.findings)),
    (findings, n) => agent(
      `Work in repo ${root}, branch feat/issue-${n} (worktree it from origin if needed). ` +
      `Apply these review findings (all high/med; list skipped lows in the PR body):\n` +
      JSON.stringify(findings, null, 1) + `\n` +
      `Push. DO NOT merge, do not wait for CI — a separate merge step handles that. Return: pushed yes/no.`,
      { label: `fix:#${n}`, phase: 'Implement', model: 'opus' }
    ).then(r => { if (r === null) throw new Error(`fix #${n} died`); return n })
  )

  const ready = prepped.filter(v => v !== null)
  const failed = wave.filter(n => !ready.includes(n))

  // serialized merge queue: rebase onto the freshest epic branch, CI, squash
  for (const n of ready) {
    const m = await agent(
      `Work in repo ${root}. Fresh worktree of feat/issue-${n}. ` +
      `git fetch origin && git rebase origin/${branch} — resolve conflicts guided by the specs of #${n} and the already-merged issues; ` +
      `if a conflict is not mechanically resolvable, STOP and return "merged: no (conflict)". ` +
      `Push (force-with-lease). Wait CI on the PR (gh pr checks --watch; no checks configured = green; at most 2 red-CI fix rounds). ` +
      `On green: squash-merge the PR into ${branch} (gh pr merge --squash --delete-branch). Remove the worktree. ` +
      `NEVER touch master/develop. Return: "merged: yes" or "merged: no (<reason>)".`,
      { label: `merge:#${n}`, phase: 'Implement', model: 'opus' })
    if (m === null || /merged:\s*no/i.test(String(m))) { stopped = n; break outer }
    done.push(n)
  }
  if (failed.length) { stopped = failed[0]; log(`wave had failures: ${failed.join(', ')} — stopping epic`); break }
}

if (stopped !== null) return { done, stoppedAt: stopped, epicReview: 'skipped — epic incomplete' }

// ---- Phase 2: Fable lenses over the whole epic ----
phase('Epic review')
const LENSES = [
  ['spec', `every issue's Decisions and Gates versus what actually landed; silent re-decisions; missing gates`],
  ['integration', `seams BETWEEN issues: contracts consumed vs provided, races between components, migration ordering, config drift`],
  ['quality', `cross-cutting simplification: duplicated logic across issues, dead scaffolding, inconsistent idioms, test honesty`],
]
const lensResults = await parallel(LENSES.map(([name, brief]) => () =>
  agent(`Repo ${root}. Review the FULL epic diff: git diff origin/master...origin/${branch}. ` +
    `Epic spec: gh issue view ${epic} (and child issues ${issues.map(i => '#' + i.number).join(', ')}). ` +
    `Lens: ${brief}. Findings only, ranked; concrete failure scenarios; no praise.`,
    { label: `fable:${name}`, phase: 'Epic review', model: 'fable', schema: FINDINGS })))
const epicFindings = lensResults.filter(Boolean).flatMap(r => r.findings)
log(`epic review: ${epicFindings.length} findings`)

// ---- Phase 3: apply + hand off. The epic → master PR is opened, never merged:
// main branches require the human's explicit review. ----
phase('Finalize')
const final = await agent(
  `Work in repo ${root} on branch ${branch} (worktree from origin/${branch}). ` +
  `Apply these epic-review findings (all high/med; commit directly to ${branch}, push):\n` +
  JSON.stringify(epicFindings, null, 1) + `\n` +
  `Run the repo's checks. Then open a PR ${branch} → master titled "Epic #${epic}: <epic title>" ` +
  `with a summary of all merged issues and skipped findings. DO NOT merge it — main branches are merged ` +
  `only by the human after explicit review. Return the PR URL.`,
  { label: 'finalize', phase: 'Finalize', model: 'opus' })

return { done, epicFindings: epicFindings.length, epicPr: final }
