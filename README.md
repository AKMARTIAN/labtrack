<div align="center">

<img src="assets/icon-192.png" width="96" alt="LabTrack icon" />

# LabTrack

**A simple, mobile-friendly lab log for recording results like Qubit readings, plus notes, each with a date, and one-tap CSV, text and picture export.**

[![Open the app](https://img.shields.io/badge/Open%20the%20app-akmartian.github.io%2Flabtrack-0284c7?style=for-the-badge)](https://akmartian.github.io/labtrack/)

[![Release](https://img.shields.io/github/v/release/AKMARTIAN/labtrack?color=0284c7)](https://github.com/AKMARTIAN/labtrack/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![Works offline](https://img.shields.io/badge/works-offline-success)
![No sign-up](https://img.shields.io/badge/no-sign--up-informational)

</div>

---

## What it is

LabTrack is a single-page web app for logging results at the bench. It runs in any modern browser on a phone, tablet or computer, so there's nothing to install and no account to create. Your data stays on your device.

**Use it now:** <https://akmartian.github.io/labtrack/> · **New here?** Read the [step-by-step guide](https://akmartian.github.io/labtrack/help.html) (also under **?** in the app).

## Screenshots

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="Examples_and_screenshots/00_showcase_dark.png" />
  <img src="Examples_and_screenshots/00_showcase_light.png" alt="LabTrack at a glance: the entry form with replicates, the log with re-reads, the journey view with mean and SD, an exported sample journey picture with a TapeStation result, and an ONT native barcoding run started from a protocol preset" />
</picture>

More examples, in light and dark, are in [`Examples_and_screenshots`](Examples_and_screenshots/README.md).

## Features

- **Log results fast:** enter a **Record** (e.g. `Blood 2`) and a **Result**, then tap **add result**.
- **Tube numbers:** an optional **tube** box next to Record, for when you can't write on the tube (e.g. Qubit or TapeStation tubes). Log *tube 4 → Blood 2 → 45.6 ng/µL*; the tube number counts up automatically with each entry.
- **Record types with automatic units:** pick a type such as **Qubit** and the unit (ng/µL) is filled in for you, so you only type the number (`45.6` → `45.6 ng/µL`).
  - Built-in types: General, Qubit, NanoDrop, Fragment size, Molarity, Volume, Temperature, pH and Cell count.
  - Switch units from the dropdown next to Result, or choose **Custom…** to add your own unit.
  - **Add your own types** (e.g. *Qubit RNA HS* with `ng/µL, ng/mL`) from **＋ Add or edit types…** in the Type menu.
  - Your last type and the unit you last used for each type are remembered.
- **Auto-numbering:** the record box suggests the next name in grey: *Record 1, 2, 3…* (or *Record 4* if the run already has 3), or the next number after the last name you typed (*Blood 2* → *Blood 3*). Leave it blank to use the suggestion. The tube number counts up too.
- **Prepare now, fill in later:** leave Result blank and keep pressing Enter to set up a batch (*tube 1 · Blood 1*, *tube 2 · Blood 2*…). Each record waits in the log with a **result?** box. Type the number and press Enter to move to the next one.
- **Follow a sample through a workflow:** tap **↳ follow up** on a record, or **↳ next step** on a whole section, to carry samples on to their next step (e.g. Extraction → PCR → Clean-up) in the same section or a new one. Each new record shows where it came from (*↳ from Extraction: 45.6 ng/µL*) and is ready for its next reading.
- **Tap anything to change it:** tap a record's name to rename it (optionally in its linked steps too). Tap a section's name to rename the section, or tap a tube, result, unit, type tag or note to edit it. Record types, built-in ones included, can be renamed and given different units in *+ add / edit types…*.
- **Sections your way:** type any section name straight into the section box, or pick a preset (Extraction, PCR, Clean-up, Library prep, QC…). Names you use are remembered for next time.
- **Duplicate a section:** **⧉ copy** in a section header copies it with all its records, either with blank results for a repeat measurement or as an exact copy.
- **Text results:** pick **no unit** and the result box accepts any text (e.g. *band at 300 bp*).
- **Rearrange:** drag the **⠿** handle on a record to reorder it or move it into another section, or drag a section's handle to reorder sections. This works with touch and a mouse. You can also tap **⇅ reorder** for ↑ ↓ buttons and to sort a section by record name or tube number. Exports follow the order you set.
- **Protocol presets:** tap **+ new → start from a protocol**, pick a kit (Illumina *NEBNext Ultra II DNA* or *16S rRNA amplicon V3–V4*; ONT *Ligation Sequencing Kit V14*, *Native Barcoding Kit 24 V14* or *16S Barcoding Kit 24 V14*), and type your sample names. Every step and quantification checkpoint is laid out in order, ready for you to fill in as you go (barcoded samples are pooled after barcoding). Skip, rename, reorder or repeat steps before you start, and change anything afterwards in the log.
- **Instrument results (TapeStation):** tap **↑ open → add instrument results** and choose the CSVs exported from the TapeStation. Pick which sample each well belongs to, and DIN, concentration, main peak, average fragment size and a redrawn electropherogram are added to that sample, in the log, the journey and the picture.
- **Several readings per step:** tap **+ reading** to re-read the same tube or add a different measurement (e.g. Qubit and TapeStation after a clean-up). It sits right under the first reading, and trends average re-reads.
- **Replicates:** set **× replicates** (e.g. ×3) and type the sample name once to add *R1, R2, R3* with tubes counting up, or tap **+ rep** on a record to add another. The journey groups them and shows the mean ± SD at each step, with every replicate's value.
- **Journey view:** tap **◎ journey** to see each sample as a card followed through every step, with tubes, results, step icons and a trend line of its main reading. Fill in pending results there, or tap a step to jump to it in the log.
- **Top-to-bottom flow:** a follow-up's new section appears right below the step it came from, and records with no section (*General*) keep their place instead of dropping to the bottom. Drag or ⇅ reorder to change it, General included.
- **Continue a previous run:** upload a LabTrack `.csv` or `.txt` export (or a `.json` backup) to load that run back in and keep adding to it. Nothing already recorded is lost.
- **Every entry is dated:** the date defaults to today and can be changed if you're logging something from an earlier day. The time is recorded automatically. The log is grouped by day.
- **Notes, two ways:**
  - **Note on an entry:** tap **Add note** on any result.
  - **Note as its own step:** switch the entry box to **Note** to add a standalone note to the log.
- **Optional details:** volume/quantity and dilution/source for any result.
- **Sections:** group entries into named stages (add, rename, collapse, remove).
- **Edit or delete** any entry; deleting asks for confirmation.

### Export & backup
| Format | Use it for |
|---|---|
| **CSV (.csv)** | Excel, Google Sheets, R, Python. One row per entry with date, time, section, type, tube, record, result, unit and note. Can be uploaded again to continue the run. |
| **Picture (.png)** | A shareable image of the run in LabTrack's look: each section is a numbered step, top to bottom, and every record with a tube number gets a drawn tube (filled once its result is in, empty while pending). Known steps and measurement types get icons (DNA for extraction, thermocycler for PCR, magnet and beads for clean-up, thermometer for temperature…), and notes get a pen and notebook. Switch to **sample journey** to show each sample as a column followed through every step, with a trend chart of its main reading (e.g. Qubit ng/µL) at the bottom. Light or dark. |
| **Text report (.txt)** | Readable summary for ELNs, emails or printing. Can be uploaded again to continue the run. |
| **Copy to clipboard** | Paste straight into a notebook entry or chat |
| **JSON backup** | Save a full run and restore it later, or move it to another device |

### Works everywhere
- **Light and dark mode:** a clean command-line look in light by default; tap **☾** in the top bar for dark mode (remembered on each device).
- Responsive layout designed for one-handed phone use as well as desktop.
- **Installable:** add it to your home screen (iOS: *Share → Add to Home Screen*; Android/Chrome: *Install app*).
- **Works offline** after the first visit, which helps in labs with patchy Wi-Fi.
- Auto-saves to your browser as you type.

## Quick start

1. Open **<https://akmartian.github.io/labtrack/>**.
2. Tap the title to name your run (it's used for the export file name).
3. Pick a **Type** (e.g. Qubit), optionally the **tube** number, type the **Record** and the number in **Result**, then tap **add result**.
4. Need to write something down? Tap **Add note** on an entry, or switch to **Note** to add a standalone note.
5. When you're done, tap **export** → **download spreadsheet** or **download text report**.
6. To pick that run up later, tap **open** and choose the exported file.

## Data & privacy

- All data is stored **only in your browser** (`localStorage`) on the device you're using. Nothing is uploaded anywhere.
- **Two people on different devices never see each other's data**, even when using the same link.
- **Shared computers:** if LabTrack hasn't been used for 30 minutes or more and a run is still open, it asks whether to **continue this run** or **start a new one**, so results from different people don't get mixed.
- Data does **not** sync between devices. To move a run, export it and use **Continue run** on the other device.
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
index.html            The whole app (HTML + CSS + vanilla JS, no build step or dependencies)
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
