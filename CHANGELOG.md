# Changelog

All notable changes to LabTrack are documented here. This project uses [Semantic Versioning](https://semver.org/).

## [3.14.0] - 2026-11-25

### Added
- **Replicates:** set **× replicates** under the record name (e.g. ×3) to add one sample as several replicates in one go. Type the name once; the replicates are named *Elephant blood R1, R2, R3*, tubes count up, and a hint shows what will be added.
- **+ rep** on any record adds one more replicate at that step, with the next free tube number. A record that isn't a replicate yet becomes R1, in its linked steps too.
- Replicates show an **R1 / R2 / R3** tag in the log. Each is still its own record, so follow it up, rename it or edit it as usual.
- **Replicates in the journey:** in the app and in the picture, a sample's replicates are grouped into one card or column.
  - Each step shows the **mean ± SD (n)**, every replicate's own value, and a small rack of tubes (filled once each result is in).
  - The trend shows the mean with SD error bars.
  - Pending replicates can be filled in straight from the journey card.
  - Grouping is by name (*<sample> R1*, *rep 2*, *replicate 3*), so it survives CSV/text export and continuing a run.

### Changed
- On narrow phones the separate **rename** button is hidden in record actions (tap the record name to rename) so the actions fit on one line.

## [3.13.0] - 2026-11-25

### Added
- **Journey view in the app:** tap **◎ journey** above the log to see one card per sample, followed through every step.
  - Each step shows its tube (filled once the result is in), step icon, type and result.
  - Each card ends with a trend line of the sample's main reading and its % change.
  - Type pending results straight into the journey; Enter moves to the next one.
  - Tap any step to jump to that record in the log; tap **≡ log** to go back.
  - The view you were last on is remembered on this device.
- **Icons in the log:** section headers, type tags and notes now show the same icons as the picture export.

## [3.12.0] - 2026-11-25

### Added
- **Sample journey picture:** in *export → picture of the run*, switch from **steps** to **sample journey**.
  - Each sample becomes a column. A coloured line runs down through every step it went through, with its tube, result and type at each step.
  - The steps are listed down the left with their icons.
  - A sample that stopped early (e.g. failed QC) shows where its line ends.
  - **Trend:** at the bottom, a small chart of each sample's main reading across the steps (e.g. Qubit ng/µL), with first → last values, % change and the step numbers it was measured at.
  - Samples are matched by their follow-up links, and by records with the same name and tube.
  - Larger runs make a wider picture, which suits slides.
- **More step presets for Illumina and ONT library prep,** each with its own icon:
  - Fragmentation (scissors)
  - End repair & A-tailing (wrench)
  - Adapter ligation (Y-adapter)
  - Index PCR / Barcoding (barcode)
  - Size selection (beads)
  - Flow cell loading (flow cell)

## [3.11.0] - 2026-11-25

### Added
- **Icons in the picture export:**
  - **Sections:** each preset step gets its own icon: Sample receipt (box), Extraction (DNA), Quantification (gauge), PCR (thermocycler), Clean-up (magnet and beads), Library prep (fragments with adapters), Normalisation (balance), Pooling (funnel), QC (magnifier with tick) and Sequencing (read peaks), plus Gel (gel lanes).
  - **Matching by name:** your own section names are matched too, e.g. *Bead clean-up*, *AMPure*, *qPCR*, *TapeStation*, *DNA extraction*.
  - **Measurement types:** each type gets an icon in its tag: Qubit (reader), NanoDrop (droplet), Fragment size (ruler), Molarity (flask), Volume (measuring cylinder), Temperature (thermometer), pH (test strip), Cell count (cells). Custom types are matched by name.
  - **Notes:** notes show a pen writing in a notebook.
  - **Records without a tube:** these show their measurement icon instead of a plain dot.
  - **General and unrecognised names:** left without an icon.

## [3.10.0] - 2026-11-25

### Added
- **Picture export (.png):** *export → picture of the run* draws the run as an image in LabTrack's terminal look, ready to share or present.
  - Each section is a numbered step, joined top to bottom.
  - Records with a tube number get a drawn tube in their type's colour: filled once the result is in, empty while it's pending.
  - Results, units, type tags, volume, "↳ from" links and notes are all shown.
  - Choose light or dark, then download, share (on phones that support it) or press and hold to save.

### Changed
- **Everything flows top to bottom:** a follow-up's new section is placed right below the section it came from, not at the end.
- **General keeps its place:** records without a section no longer always sink to the bottom when new sections are added. General can be moved with drag or ⇅ reorder like any section, and CSV/text exports follow the same order.

## [3.9.1] - 2026-11-24

### Fixed
- Runs saved by older versions with the automatic name **Run <date>** are now renamed **New Record <date>**, matching new runs. Names you typed yourself are not changed.

## [3.9.0] - 2026-11-24

### Added
- **Duplicate a section with its records:** tap **⧉ copy** in a section's header and name the copy (e.g. *Extraction (copy)*).
  - By default each record is copied with its name, tube, type and unit but a blank result, ready for a repeat measurement.
  - Tick **copy the results too** to make an exact copy.
  - Notes are copied unless you untick them.
  - The copy goes right below the original section.

### Changed
- Choosing **no unit** in the result box opens the full keyboard, so you can type text such as *band at 300 bp, faint* as well as numbers. Picking a unit again brings back the number pad. Prepared records with no unit get the full keyboard too, both in the log and in **edit**.

## [3.8.0] - 2026-11-24

### Added
- **Type or pick a section** in the entry form. The section box is now a text box with a list:
  - Type a new name and press Enter (or tap away) to create that section.
  - Or pick from the run's sections, *General*, or **presets**: Sample receipt, Extraction, Quantification, PCR, Clean-up, Library prep, Normalisation, Pooling, QC and Sequencing.
  - Typing filters the list. Typing an existing name, in any case, reuses that section instead of making a duplicate.
- Section names you use are remembered on the device and offered as presets in later runs. The *+ section* and *follow up → new section* boxes suggest them too.

### Changed
- New runs start without the placeholder sections ("Start", "First Section", "2nd Section"). Entries go to *General* until you name a section. Empty placeholder sections are cleared from existing runs.
- Long section names wrap instead of being cut off on phones. The separate *rename* button in the section header is gone: tap the name to rename it.

## [3.7.0] - 2026-11-24

### Added
- **Drag and drop**, with a finger or a mouse. Each record has a **⠿** handle under its time, and each section has one at the left of its header.
  - **Records:** drag one up or down to reorder it, or into another section to move it there. A purple line shows where it will land. Dropping onto a section's header, or onto a collapsed section, adds it to the end of that section.
  - **Sections:** drag one by its handle to reorder the sections.
  - The page scrolls automatically when you drag near the top or bottom of the screen.
  - Only the handles start a drag, so scrolling the log works as before.

## [3.6.0] - 2026-11-24

Tap anything to change it.

### Added
- **Rename sections in place:** tap a section's name, or **rename**, and type the new name. Enter saves and Esc cancels. Tap the ▾ arrow to collapse a section.
- **Tap any value in the log to edit it:** the tube number, result, unit, type tag, note or a standalone note. The edit box opens with that field ready to change.
- **Rename record types and change their units:** in *+ add / edit types…*, tap **edit** on any type, including built-ins like Qubit or NanoDrop. Records already logged pick up the new name, and so do the exports.

## [3.5.0] - 2026-11-24

### Added
- **⇅ reorder** mode in the log header. While it's on:
  - **↑ ↓** buttons move sections up and down the log, and move records up and down within their section.
  - **sort a→z** sorts a section's records by name in natural order (*Record 2* before *Record 10*).
  - **sort tube** sorts a section's records by tube number.
  - Notes stay where they are when you sort.
  - Tap **✓ done** to go back to the normal log.
- CSV and text exports follow the new order.

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
