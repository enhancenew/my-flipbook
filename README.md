# Custom Flipbook

A static flipbook ready for GitHub Pages. It uses StPageFlip for page-turn animation and a small build script to generate `pages.json` from the images in `pages/`.

The viewer is styled after hosted magazine readers: dark stage, centered book, side page buttons, top utility toolbar, and bottom page scrubber.

Browsers only allow true fullscreen after a user gesture. The app requests fullscreen on launch where permitted, otherwise it opens in a full-window viewer and the fullscreen toolbar button remains available.

The flipbook is configured in book-spread mode: page 1 is treated as the cover, then pages 2 and 3 appear as the first open spread.

## Add Pages

1. Add image files to `pages/`.
2. Name them in reading order, for example `01-cover.jpg`, `02-intro.jpg`, `03-gallery.jpg`.
3. Run:

```sh
npm run build
```

If PowerShell blocks `npm.ps1`, run the script directly:

```sh
node scripts/generate-pages-manifest.js
```

The build script loops through the files in `pages/` and writes `pages.json`, so images do not need to be manually listed in the app.

The frontend uses a local copy of StPageFlip:

```html
<script src="vendor/page-flip.browser.min.js"></script>
```

If the library cannot initialize, the page falls back to a simple image reader so GitHub Pages never shows a blank viewer.

## Publish

In GitHub, open the repository settings and enable GitHub Pages from the main branch root. The flipbook will load from `index.html`.
