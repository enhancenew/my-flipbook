const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../pages');
const outputFile = path.join(__dirname, '../pages.json');

function generateManifest() {
    if (!fs.existsSync(pagesDir)) {
        console.error('Pages directory not found:', pagesDir);
        return;
    }

    const files = fs.readdirSync(pagesDir)
        .filter(file => /\.(jpg|jpeg|png|webp|svg)$/i.test(file))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    const pages = files.map(file => ({
        name: file,
        src: `pages/${file}`,
        alt: path.parse(file).name.replace(/-/g, ' ')
    }));

    const manifest = {
        generatedAt: new Date().toISOString(),
        pages: pages
    };

    fs.writeFileSync(outputFile, JSON.stringify(manifest, null, 2));
    console.log(`Successfully generated manifest with ${pages.length} pages.`);
}

generateManifest();
