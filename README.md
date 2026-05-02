# Custom Flipbook

A static flipbook ready for GitHub Pages. It uses StPageFlip for page-turn animation and a small build script to generate `pages.json` from the images in `pages/`.

The viewer is styled after hosted magazine readers: dark stage, centered book, side page buttons, top utility toolbar, and bottom page scrubber.

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

The frontend loads StPageFlip from jsDelivr:

```html
<script src="https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.min.js"></script>
```

## Publish

In GitHub, open the repository settings and enable GitHub Pages from the main branch root. The flipbook will load from `index.html`.
