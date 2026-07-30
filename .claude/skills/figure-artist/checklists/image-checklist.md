# Sourced-image checklist

Run every line against the image you are LOOKING at (Read the file), not
against the code, the URL, or your memory of it. Answer each one out loud in
your report.

## Is it the right image?

1. **Subject** — is this the thing the lesson's sentence needs? (A portrait of
   the wrong person, a different apparatus, a related-but-other plot.)
2. **Claim** — does anything in the image contradict the prose (different
   units, different axis, a later revision of the data)?
3. **Provenance** — do the page's caption and author actually correspond to
   this file, or did the search engine pair them up?

## Is it a usable picture?

4. **Complete** — nothing cut off: no half labels, no chopped axis, no lost
   legend, no missing panel the caption refers to.
5. **Legible at size** — figures render ~700px wide centered, ~380px floated.
   Read the smallest label at that size. If you cannot, crop tighter to the
   part that matters or drop the image.
6. **Not a decoy** — not a watermarked stock preview, not a "photo
   unavailable" placeholder, not a login wall screenshot, not a thumbnail
   upscaled by the source.
7. **Orientation and framing** — right way up, not mirrored, no stray
   neighbouring figure or page furniture (page numbers, running heads,
   another caption) riding along in the crop.
8. **Foreign captions** — burned-in caption text ("Figure 3: …") is usually
   crop bait; cut it and say the same thing in our caption.

## Will it survive the site?

9. **Both themes** — white-background line art on the dark theme, and dark
   scans on the light theme: set `background: light` in credits.yaml when the
   image needs a card behind it. Check the rendered page, not the file.
10. **Weight** — under 2.5 MB after `image fit`; a photograph over ~400 KB is
    usually over-resolved for a 1400px render.
11. **Sequence frames** — same dimensions and same framing across
    `<name>-1`, `<name>-2`, …; the eye must track one change per step.
12. **Credit** — `credits.yaml` entry exists (one `*` entry for a sequence),
    `source_url` opens the page you actually read, the licence line says what
    you verified, and the entry reads as a citation in the lesson's
    References — not as a wall of text.
