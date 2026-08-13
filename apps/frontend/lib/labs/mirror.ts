/**
 * The public artifact mirror: where a learner's notebook is opened from and
 * downloads its data. The repo holds nothing but build output (generated
 * notebooks, data files, a copy of the client), force-pushed by CI.
 *
 * A stale open notebook is safe to leave pointing at `main`: the checkpoint
 * API keys everything by `content_version`, so an outdated one is rejected
 * rather than silently graded against the wrong reference.
 */
const REPO = "galthran-wq/distillcourse-labs";
const BRANCH = "main";

export const CLIENT_INSTALL = `git+https://github.com/${REPO}#subdirectory=client`;

export function colabUrl(lab: string): string {
  return `https://colab.research.google.com/github/${REPO}/blob/${BRANCH}/labs/${lab}/lab.ipynb`;
}

export function rawUrlBase(lab: string): string {
  return `https://raw.githubusercontent.com/${REPO}/${BRANCH}/labs/${lab}`;
}
