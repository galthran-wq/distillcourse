/** The h2 the element sits under — the same anchor the content index records. */
export function sectionAnchor(element: Element): string {
  for (let node: Element | null = element; node; node = node.parentElement) {
    for (
      let previous = node.previousElementSibling;
      previous;
      previous = previous.previousElementSibling
    ) {
      if (previous.tagName === "H2" && previous.id) return previous.id;
    }
  }
  // Material above the first h2 has no anchor of its own, so its targets are
  // the bare `/proof1` form.
  return "";
}
