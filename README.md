# Custom Flipbook

A static flipbook ready for GitHub Pages. Put your page images in `pages/`, generate `pages.json`, and publish the repository.

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

## Publish

In GitHub, open the repository settings and enable GitHub Pages from the main branch root. The flipbook will load from `index.html`.
