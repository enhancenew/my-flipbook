const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../pages');
const outputFile = path.join(__dirname, '../pages.json');

function generateManifest() {
    if (!fs.existsSync(pagesDir)) {
        console.error('Pages directory not found:', pagesDir);
        return;
    }

    const allFiles = fs.readdirSync(pagesDir)
        .filter(file => /\.(jpg|jpeg|png|webp|svg|gif|bmp|tiff)$/i.test(file));

    // Identify covers (case-insensitive)
    const frontCover = allFiles.find(f => f.toLowerCase().startsWith('frontcoverpage'));
    const backCover = allFiles.find(f => f.toLowerCase().startsWith('backcoverpage'));

    // Filter out covers for middle pages sorting
    let middlePages = allFiles.filter(f => f !== frontCover && f !== backCover)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    // Reconstruct final sequence
    const finalSequence = [];
    if (frontCover) finalSequence.push(frontCover);
    finalSequence.push(...middlePages);
    if (backCover) finalSequence.push(backCover);

    const pages = finalSequence.map(file => ({
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
    if (frontCover) console.log(`- Front cover: ${frontCover}`);
    if (backCover) console.log(`- Back cover: ${backCover}`);
}

generateManifest();
