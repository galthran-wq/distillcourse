# Where sourced images come from

Ordered by how much trouble they save. The first two answer "what is this
image and may we use it" in the same request that finds it.

## Wikimedia Commons — search + licence in one call

Search for files (namespace 6) and get URL, size and licence metadata:

```bash
curl -s -A "distillcourse/1.0" -G "https://commons.wikimedia.org/w/api.php" \
  --data-urlencode "action=query" \
  --data-urlencode "format=json" \
  --data-urlencode "generator=search" \
  --data-urlencode "gsrnamespace=6" \
  --data-urlencode "gsrlimit=10" \
  --data-urlencode "gsrsearch=Claude Shannon" \
  --data-urlencode "prop=imageinfo" \
  --data-urlencode "iiprop=url|size|extmetadata" \
  --data-urlencode "iiurlwidth=1600"
```

Per file the response carries: `imageinfo[0].url` (full original),
`thumburl` (the 1600px rendition — usually what you want),
`width`/`height`, and in `extmetadata`: `LicenseShortName`, `License`,
`Artist` (HTML), `Credit`, `ImageDescription`, `LicenseUrl`,
`DateTimeOriginal`. `descriptionurl` is the page for `source_url`.

Notes: pipe `| python3 -m json.tool | head -120` to read it. The API rejects
requests without a User-Agent. Files that are freely licensed on Commons can
still be non-free in the country of origin — the page says so when it matters.

## Openverse — CC-licensed images across many collections

```bash
curl -s -A "distillcourse/1.0" \
  "https://api.openverse.org/v1/images/?q=oscilloscope&page_size=10"
```
Returns `url`, `foreign_landing_url` (use as `source_url`), `license`,
`license_version`, `creator`, `width`/`height`. No key needed for light use.

## Papers and preprints (real data plots)

- arXiv: abstract page `https://arxiv.org/abs/<id>`, PDF
  `https://arxiv.org/pdf/<id>`. Licence is printed on the abstract page —
  many are CC BY / CC BY-NC; the rest are "arXiv perpetual licence" (not a
  free licence: cite it as the publisher's copyright, teaching use).
- PubMed Central open-access subset: `https://www.ncbi.nlm.nih.gov/pmc/` —
  figures are downloadable individually and state their licence per figure.
- PLOS, eLife, Scientific Reports, MDPI: CC BY, figure download links on the
  article page. Prefer these to a screenshot of a PDF.
- Semantic Scholar / OpenAlex resolve a title to an open-access PDF URL:
  `https://api.openalex.org/works?filter=title.search:<words>`.

## Archives, museums, agencies (historical photographs, scans)

- Internet Archive (`archive.org`) — scanned books and journals; page images
  via `https://archive.org/download/<id>/<file>`.
- Library of Congress (`loc.gov`, `?fo=json` on any search URL), Wellcome
  Collection (`wellcomecollection.org`, CC BY for most), Rijksmuseum,
  Smithsonian Open Access (CC0), Europeana.
- NASA/ESA/NOAA/USGS — US federal works are public domain (ESA is not: it
  has its own terms). NASA image library API:
  `https://images-api.nasa.gov/search?q=<query>`.
- Bell Labs / AT&T, IBM, MIT Museum: historical computing photographs;
  copyrighted, credited to the archive, teaching use.

## Reading the page before you download

`WebFetch` the landing page and pull out: the caption (what the image
actually is — often not what the file name says), the author/holder, the
licence statement, and the date. That is exactly the four fields
`credits.yaml` wants. If the page contradicts the search result, the page
wins.
