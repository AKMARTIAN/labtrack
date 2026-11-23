<div align="center">

<img src="assets/icon-192.png" width="96" alt="LabTrack icon" />

# LabTrack

**A simple, mobile-friendly lab log for recording results like Qubit readings, plus notes, each with a date, and one-tap CSV and text export.**

[![Open the app](https://img.shields.io/badge/Open%20the%20app-akmartian.github.io%2Flabtrack-0284c7?style=for-the-badge)](https://akmartian.github.io/labtrack/)

[![Release](https://img.shields.io/github/v/release/AKMARTIAN/labtrack?color=0284c7)](https://github.com/AKMARTIAN/labtrack/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![Works offline](https://img.shields.io/badge/works-offline-success)
![No sign-up](https://img.shields.io/badge/no-sign--up-informational)

</div>

---

## What it is

LabTrack is a single-page web app for logging results at the bench. It runs in any modern browser on a phone, tablet or computer, so there's nothing to install and no account to create. Your data stays on your device.

**Use it now:** <https://akmartian.github.io/labtrack/>

## Features

- **Log results fast:** type a name (e.g. `Tube 1`) and a result (e.g. `45.6 ng/µL`), then tap **Add Result**.
- **Every entry is dated:** the date defaults to today and can be changed to log something from an earlier day. The time is recorded automatically.
- **Notes, two ways:**
  - **Note on an entry:** tap **+ Note** on any result to attach a comment (e.g. *"sample looked cloudy, re-spun"*).
  - **Note as its own step:** switch the entry box to **Note** to add a standalone note to the log (e.g. *"recalibrated Qubit with fresh standards"*).
- **Optional details:** volume/quantity and dilution/source for any result.
- **Sections:** group entries into named stages (add, rename, collapse, remove).
- **Edit or delete** any entry; deleting asks for confirmation.

### Export & backup
| Format | Use it for |
|---|---|
| **CSV (.csv)** | Excel, Google Sheets, R, Python. One row per entry with date, time, section, type, result and note. |
| **Text report (.txt)** | Readable summary for ELNs, emails or printing |
| **Copy to clipboard** | Paste straight into a notebook entry or chat |
| **JSON backup** | Save a full run and restore it later, or move it to another device |

### Works everywhere
- Responsive layout designed for one-handed phone use as well as desktop.
- **Installable:** add it to your home screen (iOS: *Share → Add to Home Screen*; Android/Chrome: *Install app*).
- **Works offline** after the first visit, which helps in labs with patchy Wi-Fi.
- Auto-saves to your browser as you type.

## Quick start

1. Open **<https://akmartian.github.io/labtrack/>**.
2. Give your run a name (optional; it's used for the export file name).
3. Pick a section, type a **Name / Tube** and **Result**, and tap **Add Result**.
4. Need to write something down? Tap **+ Note** on an entry, or switch to **Note** to add a standalone note.
5. Tap the **download** button (top right) → **Download CSV** or **Download Text Report**.
6. To start the next run, tap **New** → **Clear Everything & Start Blank**.

## Data & privacy

- All data is stored **only in your browser** (`localStorage`) on the device you're using. Nothing is uploaded anywhere.
- Data does **not** sync between devices. Use **JSON backup / import** to move a run.
- Clearing your browser's site data, or using private/incognito mode, will erase saved runs, so **export your results when you finish a session**.

## Run it locally

LabTrack is a single static HTML file with no build step:

```bash
git clone https://github.com/AKMARTIAN/labtrack.git
cd labtrack
python3 -m http.server 8000   # then open http://localhost:8000
```

You can also open `index.html` directly in a browser; offline caching then just won't be active.

## Project structure

```
index.html            The whole app (HTML + Tailwind CSS + vanilla JS)
manifest.webmanifest  Install-to-home-screen metadata
sw.js                 Service worker for offline use
assets/               App icons
```

## Roadmap ideas

- Search and filter entries
- Multiple saved runs on one device
- Optional cloud sync

Suggestions are welcome. [Open an issue](https://github.com/AKMARTIAN/labtrack/issues/new/choose).

## Contributing

Bug reports and feature requests are welcome via [Issues](https://github.com/AKMARTIAN/labtrack/issues). See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2026 AKMARTIAN

> **Disclaimer:** LabTrack is a record-keeping aid. Always verify calculations against your lab's SOPs. It is not a validated LIMS/ELN for regulated (GxP) work.
