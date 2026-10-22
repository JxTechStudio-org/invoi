# invoi technical documentation

Source of *invoi Technical Documentation* (architecture, data model, API, frontend, Phase 1 extraction design, decision log, analytics, infrastructure, roadmap). From v1.3 the document lives here; earlier versions were PDFs only.

| File | What it is |
|---|---|
| `index.html` | The whole document: content, styles and diagrams (inline SVG) |
| `build.py` | Exports `index.html` to PDF with headless Chrome or Edge |
| `invoi-Technical-Documentation.pdf` | The exported PDF of the current version |

## Making a new version

1. Edit the text in `index.html`. Sections are `<section id="s1">` … `<section id="s14">`; the contents page reads their page numbers automatically.
2. Update the `DOC` object at the bottom of `index.html` (version, date, source commit). It fills the cover, the contents page and every page footer.
3. Add a row at the top of the changelog table in section 14. Mark amended decisions with `class="amended"` on the row.
4. Export: `python docs/technical-documentation/build.py` (Python 3.8+, no packages needed). It finds Chrome or Edge on its own; otherwise pass `--browser PATH` or set `BROWSER`.
5. Open the PDF and check the pages, then commit `index.html` and the PDF together.

To preview while editing, open `index.html` in Chrome or Edge; the print preview (Ctrl+P) shows the real page breaks.

## Notes

- Fonts (IBM Plex Sans, IBM Plex Sans Arabic, IBM Plex Mono) load from Google Fonts, so the build needs internet access; without it the PDF falls back to system fonts.
- Page headers and footers use CSS page-margin boxes, which need Chrome or Edge 131 or later.
- Change this document in the same PR as the code it describes. Where the document and the code disagree, the code wins.
