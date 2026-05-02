const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const pagesDir = path.join(root, "pages");
const outputFile = path.join(root, "pages.json");
const allowedExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp", ".svg"]);

function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function toTitle(filename) {
  return path
    .basename(filename, path.extname(filename))
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readPages() {
  if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir);
  }

  return fs
    .readdirSync(pagesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => allowedExtensions.has(path.extname(name).toLowerCase()))
    .sort(naturalCompare)
    .map((name) => ({
      name,
      src: `pages/${encodeURIComponent(name)}`,
      alt: toTitle(name)
    }));
}

const manifest = {
  generatedAt: new Date().toISOString(),
  pages: readPages()
};

fs.writeFileSync(outputFile, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${manifest.pages.length} page(s) to ${path.relative(root, outputFile)}`);
