/**
 * Hands the answer to `keep` unless whatever asked for it has since gone away —
 * the answer to a request the reader has navigated past is not theirs to be
 * shown. A failure arrives as `null`, so a caller that has to tell "went wrong"
 * from "not asked yet" can.
 *
 * Returns the cleanup an effect returns; one copy of the rule, because every
 * load on this site is one `useEffect` away from showing a stale answer.
 */
export function answered<T>(
  work: Promise<T>,
  keep: (value: T | null) => void,
): () => void {
  let current = true;
  const settle = (value: T | null) => {
    if (current) keep(value);
  };
  work.then(settle, () => settle(null));
  return () => {
    current = false;
  };
}
