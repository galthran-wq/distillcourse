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

const FLASH = "anchor-flash";
const FLASH_MS = 2000;
// A reference to another lesson is followed by a client-side navigation, so
// the heading does not exist yet when the click happens; it appears once the
// page it lives on has rendered.
const WAIT_MS = 4000;

let flashing: ReturnType<typeof setTimeout> | undefined;

function flash(heading: HTMLElement): void {
  clearTimeout(flashing);
  document.querySelectorAll(`.${FLASH}`).forEach((old) => old.classList.remove(FLASH));
  heading.scrollIntoView({ behavior: "smooth", block: "start" });
  heading.classList.add(FLASH);
  flashing = setTimeout(() => heading.classList.remove(FLASH), FLASH_MS);
}

/** Scroll to a heading and mark it, so a reference lands somewhere visible. */
export function reveal(anchor: string | null): void {
  if (anchor === null) return;
  const deadline = Date.now() + WAIT_MS;
  const attempt = (): void => {
    const heading = document.getElementById(anchor);
    if (heading !== null) return flash(heading);
    if (Date.now() < deadline) requestAnimationFrame(attempt);
  };
  requestAnimationFrame(attempt);
}
