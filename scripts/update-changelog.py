#!/usr/bin/env python3
"""Sync changelog.json from the App Store.

Polls the public iTunes Lookup API for the current live version of Atlas and,
if that version isn't already recorded, prepends it to changelog.json. The
GitHub Action commits the file only when it actually changed, so each new build
that goes live on the App Store shows up on the site automatically.
"""
import json
import pathlib
import sys
import urllib.request

APP_ID = "6783143182"
LOOKUP = f"https://itunes.apple.com/lookup?id={APP_ID}&country=us"
CHANGELOG = pathlib.Path(__file__).resolve().parent.parent / "changelog.json"


def main() -> int:
    with urllib.request.urlopen(LOOKUP, timeout=30) as resp:
        results = json.load(resp).get("results", [])
    if not results:
        print("iTunes lookup returned no results; leaving changelog unchanged.")
        return 0

    app = results[0]
    version = str(app.get("version", "")).strip()
    date = str(app.get("currentVersionReleaseDate", ""))[:10]
    notes = (app.get("releaseNotes") or "").strip()
    if not version:
        print("No version in lookup response; nothing to do.")
        return 0

    data = json.loads(CHANGELOG.read_text(encoding="utf-8"))
    entries = data.setdefault("entries", [])
    if any(e.get("version") == version for e in entries):
        print(f"Version {version} already present; no update.")
        return 0

    entries.insert(0, {"version": version, "date": date, "notes": notes})
    CHANGELOG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Added version {version} ({date}) to changelog.json.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
