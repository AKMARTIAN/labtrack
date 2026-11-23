# Changelog

All notable changes to LabTrack are documented here. This project uses [Semantic Versioning](https://semver.org/).

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

[1.1.0]: https://github.com/AKMARTIAN/labtrack/releases/tag/v1.1.0
[1.0.0]: https://github.com/AKMARTIAN/labtrack/releases/tag/v1.0.0
