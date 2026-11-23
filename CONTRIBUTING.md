# Contributing to LabTrack

Thanks for your interest in improving LabTrack.

## Reporting bugs / requesting features
Open an [issue](https://github.com/AKMARTIAN/labtrack/issues/new/choose) and pick the matching template. For bugs, include your device, browser and the steps to reproduce.

## Making changes
1. Fork the repo and create a branch: `git checkout -b my-change`
2. The app is entirely in `index.html`. Serve it locally with `python3 -m http.server` and open <http://localhost:8000>.
3. Check it at phone width (≈375 px) as well as desktop.
4. If you change cached files, bump `CACHE` in `sw.js` so users receive the update.
5. Add a line to `CHANGELOG.md`, then open a pull request.
