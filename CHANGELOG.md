# Changelog

All notable changes to LabTrack are documented here. This project uses [Semantic Versioning](https://semver.org/).

## [3.4.0] - 2026-11-24

### Added
- **Rename a record** after adding it: tap its name in the log, or tap **rename**. This opens a small box with the tube number and record name. Press Enter or **save**.
- If the sample has follow-up steps, there's an option (on by default) to **rename it in its linked steps too**, so *Blood 1* becomes *Blood 1A* in Extraction, PCR and Clean-up at once. The same option appears in **edit**.

### Changed
- Pressing Enter in an edit box now saves it.
- Tighter action buttons on phones, so they fit on one line.

## [3.3.0] - 2026-11-24

Follow a sample through each step of a workflow.

### Added
- **↳ follow up** on any record carries that sample on to its next step: extraction → PCR → clean-up, and so on. You choose the section, which can be the same section, another section or a new one, and the reading type. A new record with the same name and tube is added, ready for its result, and the original is left as it is.
- **↳ next step** on a section does the same for every sample in that section at once, using each sample's latest reading.
- Follow-up records show where they came from in the log, e.g. *↳ from Extraction: 45.6 ng/µL*.
- Exports keep the link. The CSV has a new **Follows From** column, the text report adds `From: <section>`, and both are restored when you continue a run.

## [3.2.0] - 2026-11-24

### Changed
- The **record** box now shows a greyed-out suggested name instead of pre-filling one. Leave it blank and the record takes the suggestion; start typing to use your own name.
- Suggestions count on from the records already in the run (*Record 1*, *Record 2*… or *Record 4* when there are already 3). If the last record you named ends in a number, the next one continues it (*Blood 7* → *Blood 8*).
- Neither Record nor Result has to be typed any more, so pressing Enter repeatedly prepares *Record 1, Record 2, Record 3*… ready to fill in.

## [3.1.0] - 2026-11-24

### Added
- **Prepare records now, fill in results later.** The Result box can be left blank: the record is added straight away, and the next record and tube number fill in automatically, so pressing Enter repeatedly sets up a whole batch. Blank records show a **result?** box in the log. Type the number and press Enter to jump to the next blank record.
- The run summary counts records still waiting for a result ("2 to fill in").
- A record can have only a tube number with no name. You can add the name later with **edit**.

### Changed
- Blank results are kept in CSV and text exports (the text report shows `(pending)`). They are restored when you continue a run, so you can prepare records on one device and fill them in on another.
- In **edit**, the result can now be cleared.

## [3.0.0] - 2026-11-23

A new look, and tube numbers.

### Added
- **Tube number** field next to Record, for tubes you can't write on (Qubit, TapeStation). It counts up automatically (tube 4 → 5) and is shown in the log as a *tube 4* tag. It's included in the CSV (new **Tube** column) and text exports and is restored when you continue a run.
- **Dark mode**: tap ☾ / ☀ in the top bar. The choice is remembered on each device.

### Changed
- New command-line style design: monospace font, a terminal-style entry window and coloured type tags. **Light** is the default.
- The page no longer loads an external CSS framework, so it starts faster and is more reliable offline.
- The old `/preview/` link now forwards to the main app.

## [2.2.1] - 2026-11-23

### Changed
- The "run already open" prompt now appears only after the app has been unused for 30 minutes or more, not on every reload.

## [2.2.0] - 2026-11-23

### Added
- **Shared-computer safeguard.** When the app opens with a run already in progress, or after 30 minutes away, it shows the run's name, entry count, operator and last entry. You can **continue it**, **start a new run** or **export it first**.

### Changed
- New runs are named **New Record + date** (e.g. *New Record 2026-11-23*) instead of *Run + date*.

## [2.1.0] - 2026-11-23

### Added
- **Record types with automatic units.** Choose a type (Qubit, NanoDrop, Fragment size, Molarity, Volume, Temperature, pH, Cell count) and its unit is added for you, so you only type the number.
- **Custom record types and units**, which are kept between runs.
- The app remembers your last type and the unit you last used for each type.
- **Auto-numbering:** `Sample 1` → `Sample 2`, with the cursor placed in Result.
- **Continue a previous run** by uploading its CSV or text export (or a JSON backup).
- Day headings in the log ("Today", "Yesterday").

### Changed
- "Name / Tube" is now **Record**.
- The CSV has new **Entry**, **Type** and **Unit** columns.
- Redesigned interface: run name as the page title, a cleaner entry form, coloured type tags, icon actions, an empty-log message and a phone-friendly sheet style for dialogs.
- Text report section headings keep their original capitalisation.

## [2.0.0] - 2026-11-23

LabTrack is now a single, simpler Quick Log.

### Added
- **Date on every entry.** Defaults to today, can be changed for back-logging, and is shown on each entry and included in all exports.
- **Notes on entries.** Tap **+ Note** on any result to attach a note.
- **Standalone notes.** Switch the entry box to **Note** to add a note as its own step in the log.
- Run name and operator fields at the top of the page.
- Edit the date and section of any entry.

### Removed
- The **Quant & Dilutions** screen (stocks, dilution steps, recovery and %CV calculations).

### Changed
- The CSV export is now one row per entry, with columns Date, Time, Section, Type, Name / Tube, Result, Volume, Dilution and Note.
- Existing saved Quick Log entries are kept. Entries from before this version get the run's date.

## [1.1.0] - 2026-11-23

### Changed
- The app now opens with a blank run instead of an example run.
- Removed the "Reset to Sample Validation Run" option.
- Browsers that still have the untouched example run saved now start blank automatically. Your own data is never removed.

## [1.0.0] - 2026-11-23

First public release.

### Added
- **Quant & Dilutions** workspace: experiment metadata, stock registry, dilution/serial-dilution/blank/stock-read steps with automatic dilution factor and expected concentration.
- Replicate reads with live mean, SD, %CV and % recovery; Pass/Check/Fail/Pending status and filtering; summary KPIs.
- **Quick Log** for fast name → result entries, grouped into editable sections with optional volume, dilution and notes.
- Export to **CSV** and **plain-text report**, copy to clipboard, and **JSON backup/restore**.
- Mobile-first responsive layout, installable as an app (web manifest + icons), offline support via service worker.
- Auto-save to browser local storage.

### Fixed (pre-release review)
- CSV export now includes a UTF-8 byte-order mark and CRLF line endings so Excel shows `µL` correctly.
- Text report now includes volume, dilution and notes for unsectioned Quick Log entries.
- Deleting a step, stock or Quick Log entry now asks for confirmation.
- Header no longer overflows on narrow phone screens.
- Pinch-to-zoom re-enabled for accessibility.

[3.0.0]: https://github.com/AKMARTIAN/labtrack/releases/tag/v3.0.0
[2.2.1]: https://github.com/AKMARTIAN/labtrack/releases/tag/v2.2.1
[2.2.0]: https://github.com/AKMARTIAN/labtrack/releases/tag/v2.2.0
[2.1.0]: https://github.com/AKMARTIAN/labtrack/releases/tag/v2.1.0
[2.0.0]: https://github.com/AKMARTIAN/labtrack/releases/tag/v2.0.0
[1.1.0]: https://github.com/AKMARTIAN/labtrack/releases/tag/v1.1.0
[1.0.0]: https://github.com/AKMARTIAN/labtrack/releases/tag/v1.0.0
