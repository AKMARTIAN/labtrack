# LabTrack examples and screenshots

Example pictures exported from LabTrack and screenshots of the app at phone size. All the data is made up for demonstration. Use them to show someone what LabTrack does, or on the GitHub page.

## Picture export (export → picture of the run)

| File | What it shows |
|---|---|
| `01_picture_steps_light.png`, `01_picture_steps_dark.png` | **Steps** layout. Three blood samples go through Extraction → PCR → Clean-up, with a drawn tube per record (filled = result in, empty = pending), "↳ from" links and notes. |
| `02_picture_steps_all_icons_light.png`, `02_picture_steps_all_icons_dark.png` | Every preset step and measurement type with its icon: sample receipt, extraction, quantification, PCR, bead clean-up, gel, library prep, normalisation, pooling, QC and sequencing. |
| `03_picture_journey_light.png`, `03_picture_journey_dark.png` | **Sample journey** layout. Three samples followed from extraction through Illumina library prep to pooling, with a trend chart of the main reading. One sample stops at QC. |
| `04_picture_journey_12_samples.jpg` | A 12-sample journey. Larger runs make a wide picture that suits slides. |
| `05_picture_journey_replicates_light.png`, `05_picture_journey_replicates_dark.png` | **Replicates.** Elephant blood ×3 and Rhino blood ×3 show mean ± SD at each step with every replicate's value, next to a negative control. |
| `06_picture_journey_readings_light.png`, `06_picture_journey_readings_dark.png` | **Several readings per step.** After the bead clean-up each replicate's tube is read twice on the Qubit. The re-reads are averaged within each replicate (R1 29.8 · 30.2 → 30.0), then mean ± SD is taken across replicates. A TapeStation reading and a single sample's re-reads (*mean of 2 reads*) are also shown, plus a Bioanalyzer reading. |
| `07_picture_journey_tapestation_light.png`, `07_picture_journey_tapestation_dark.png` | **TapeStation results in a journey.** Three samples go through Illumina library prep. Blood 1 has a TapeStation genomic DNA result at extraction, imported from the instrument's CSV export: DIN 8.7, 158 ng/µL, peak 56,938 bp, average fragment size ≈ 53,100 bp, the instrument's warnings and the redrawn electropherogram. Its column widens to fit. Notes show where they were written: a step note at bead clean-up (left column) and a note on Blood 3's reading. (The TapeStation values and trace are real, from a Lambda DNA run; the rest is demo data.) |

## The app (phone size)

| File | What it shows |
|---|---|
| `10_app_entry_form_replicates.jpg` | The entry form with **× replicates** set to 3. Type the sample name once to get R1–R3, with tubes counting up. |
| `11_app_log_replicates_and_readings.jpg` | The log. A Bead clean-up step with replicate tags (R1, R2…), type icons, "↳ from" links and a TapeStation **reading 2** under each Qubit reading. |
| `12_app_add_reading_window.jpg` | The **+ reading** window: re-read, pick a type such as TapeStation, or type your own measurement. |
| `13_app_journey_view_light.jpg` | The in-app **journey view**. A replicate group card with mean ± SD, each replicate's value and a trend line. |
| `14_app_journey_view_dark.jpg` | The journey view in dark mode, with a pending result ready to fill in. |
| `15_app_export_options_dark.jpg` | The export menu: CSV, picture, text report, copy summary and backups. |
| `16_app_picture_window_journey.jpg` | The picture window with the steps/journey and light/dark switches and a live preview. |
| `17_app_log_dark.jpg` | The log in dark mode: section icon, tubes, replicates and record actions. |

## Help guide screenshots (`help_guide/`)

The annotated screenshots used by the in-app help guide (**?** in LabTrack, or [help.html](https://akmartian.github.io/labtrack/help.html)). The orange numbered rings show where to tap, in order. If you rename or move these files, update `help.html` too.

| File | What it shows |
|---|---|
| `00_top_bar.jpg` | The top bar: help, light/dark, open, new, export. |
| `01_log_a_result.jpg` | Logging a result: type, section, tube, record, result, add. |
| `02_record_actions.jpg` | A record: tap the name or result to change it, the action row, the drag handle. |
| `03_fill_later.jpg` | A prepared record waiting for its result. |
| `04_replicates.jpg` | Adding a sample as ×3 replicates. |
| `05_add_reading.jpg` | The **+ reading** window. |
| `06_section_header.jpg` | A section header: drag, rename, next step, copy, remove. |
| `07_next_step.jpg` | Carrying every sample on to the next step. |
| `08_log_tools.jpg` | journey, reorder and + section. |
| `09_journey.jpg` | A replicate group in the journey view. |
| `10_export.jpg` | The export menu. |
| `11_picture.jpg` | The picture window. |
| `12_open.jpg` | The open menu: continue a run or add instrument results. |
| `13_tapestation_match.jpg` | Matching TapeStation wells to samples. |
| `14_tapestation_result.jpg` | A TapeStation result in the log: DIN, trace, average size, warnings. |
