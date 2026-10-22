"""Export the invoi technical documentation to PDF.

Usage:
    python docs/technical-documentation/build.py [--browser PATH] [--out FILE]

Prints index.html with headless Chrome or Edge, reads the page each section
starts on from the PDF's named destinations, and prints again with those page
numbers filled into the contents page. Standard library only.
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "index.html"
DEFAULT_OUT = HERE / "invoi-Technical-Documentation.pdf"

BROWSER_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
    "microsoft-edge",
]


def find_browser(explicit: str | None) -> str:
    for candidate in [explicit, os.environ.get("BROWSER"), *BROWSER_CANDIDATES]:
        if not candidate:
            continue
        resolved = candidate if Path(candidate).is_file() else shutil.which(candidate)
        if resolved:
            return resolved
    sys.exit("No Chrome or Edge found. Pass --browser PATH or set BROWSER.")


def render(browser: str, url: str, out: Path) -> None:
    with tempfile.TemporaryDirectory() as profile:
        result = subprocess.run(
            [
                browser,
                "--headless=new",
                "--disable-gpu",
                "--no-first-run",
                f"--user-data-dir={profile}",
                "--no-pdf-header-footer",
                "--run-all-compositor-stages-before-draw",
                # Gives web fonts time to load before printing.
                "--virtual-time-budget=15000",
                f"--print-to-pdf={out}",
                url,
            ],
            capture_output=True,
            text=True,
        )
    if not out.is_file() or out.stat().st_size == 0:
        sys.exit(f"Browser did not write a PDF.\n{result.stderr}")


def section_pages(pdf: bytes) -> dict[str, int]:
    """Maps each named destination (section id) to its 1-based page number."""
    objects = {
        int(number): body
        for number, body in re.findall(rb"(?m)^(\d+) 0 obj\s*(.*?)endobj", pdf, re.S)
    }

    def ref(body: bytes, key: bytes) -> int:
        match = re.search(rb"/" + key + rb" (\d+) 0 R", body)
        if not match:
            raise ValueError(f"/{key.decode()} not found")
        return int(match.group(1))

    catalog = next(body for body in objects.values() if b"/Type /Catalog" in body)

    order: list[int] = []

    def walk(number: int) -> None:
        body = objects[number]
        if b"/Type /Pages" in body:
            kids = re.search(rb"/Kids \[(.*?)\]", body, re.S).group(1)
            for kid in re.findall(rb"(\d+) 0 R", kids):
                walk(int(kid))
        else:
            order.append(number)

    walk(ref(catalog, b"Pages"))
    page_number = {obj: index + 1 for index, obj in enumerate(order)}

    dests = objects[ref(catalog, b"Dests")]
    return {
        name.decode(): page_number[int(obj)]
        for name, obj in re.findall(rb"/([\w-]+) \[(\d+) 0 R", dests)
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--browser", help="path to Chrome or Edge")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="output PDF")
    args = parser.parse_args()

    browser = find_browser(args.browser)
    base_url = SOURCE.as_uri()
    out = args.out.resolve()

    with tempfile.TemporaryDirectory() as tmp:
        first = Path(tmp) / "pass1.pdf"
        render(browser, base_url, first)
        pages = section_pages(first.read_bytes())

    query = ",".join(f"{name}:{page}" for name, page in pages.items())
    render(browser, f"{base_url}?pages={query}", out)

    # Filling in the numbers must not move any section.
    if section_pages(out.read_bytes()) != pages:
        sys.exit("Section pages changed between passes; run the build again.")
    total = len(re.findall(rb"/Type /Page\b(?!s)", out.read_bytes()))
    print(f"Wrote {out} ({total} pages)")
    for name, page in pages.items():
        print(f"  {name:>4}  page {page}")


if __name__ == "__main__":
    main()
