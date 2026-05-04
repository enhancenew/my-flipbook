const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../pages');
const musicDir = path.join(__dirname, '../music');
const outputFile = path.join(__dirname, '../pages.json');

function generateManifest() {
    if (!fs.existsSync(pagesDir)) {
        console.error('Pages directory not found:', pagesDir);
        return;
    }

    const allFiles = fs.readdirSync(pagesDir)
        .filter(file => /\.(jpg|jpeg|png|webp|svg|gif|bmp|tiff)$/i.test(file));

    const frontCover = allFiles.find(f => f.toLowerCase().startsWith('frontcoverpage'));
    const backCover = allFiles.find(f => f.toLowerCase().startsWith('backcoverpage'));

    let middlePages = allFiles.filter(f => f !== frontCover && f !== backCover)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    const finalSequence = [];
    if (frontCover) finalSequence.push(frontCover);
    finalSequence.push(...middlePages);
    if (backCover) finalSequence.push(backCover);

    const pages = finalSequence.map(file => ({
        name: file,
        src: `pages/${file}`,
        alt: path.parse(file).name.replace(/-/g, ' ')
    }));

    // Music scanning
    let musicFile = null;
    if (fs.existsSync(musicDir)) {
        const musicFiles = fs.readdirSync(musicDir)
            .filter(file => /\.(mp3|wav|ogg|aac)$/i.test(file));
        if (musicFiles.length > 0) {
            musicFile = `music/${musicFiles[0]}`; // Take the first one found
        }
    }

    const manifest = {
        generatedAt: new Date().toISOString(),
        pages: pages,
        music: musicFile
    };

    fs.writeFileSync(outputFile, JSON.stringify(manifest, null, 2));
    console.log(`Successfully generated manifest with ${pages.length} pages.`);
    if (musicFile) console.log(`- Music found: ${musicFile}`);
}

generateManifest();
