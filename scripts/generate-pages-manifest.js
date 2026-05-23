import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const booksDir = path.join(__dirname, "../books");
const outputFile = path.join(__dirname, "../manifest.json");

function scanBook(bookPath, bookId) {
    const pagesDir = path.join(bookPath, "pages");
    const musicDir = path.join(bookPath, "music");

    if (!fs.existsSync(pagesDir)) {
        return null;
    }

    const allFiles = fs.readdirSync(pagesDir)
        .filter(file => /\.(jpg|jpeg|png|webp|svg|gif|bmp|tiff)$/i.test(file));

    if (allFiles.length === 0) return null;

    const frontCover = allFiles.find(f => f.toLowerCase().startsWith("frontcoverpage"));
    const backCover = allFiles.find(f => f.toLowerCase().startsWith("backcoverpage"));

    let middlePages = allFiles.filter(f => f !== frontCover && f !== backCover)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

    const finalSequence = [];
    if (frontCover) finalSequence.push(frontCover);
    finalSequence.push(...middlePages);
    if (backCover) finalSequence.push(backCover);

    const pages = finalSequence.map(file => ({
        name: file,
        src: "books/" + bookId + "/pages/" + file,
        alt: path.parse(file).name.replace(/-/g, " ")
    }));

    let musicFile = null;
    if (fs.existsSync(musicDir)) {
        const musicFiles = fs.readdirSync(musicDir)
            .filter(file => /\.(mp3|wav|ogg|aac)$/i.test(file));
        if (musicFiles.length > 0) {
            musicFile = "books/" + bookId + "/music/" + musicFiles[0];
        }
    }

    return {
        id: bookId,
        title: bookId.replace(/^book/, "Book "),
        cover: frontCover ? "books/" + bookId + "/pages/" + frontCover : null,
        pages: pages,
        music: musicFile
    };
}

function generateManifest() {
    if (!fs.existsSync(booksDir)) {
        console.error("Books directory not found:", booksDir);
        return;
    }

    const bookDirs = fs.readdirSync(booksDir)
        .filter(file => fs.statSync(path.join(booksDir, file)).isDirectory());

    const books = [];
    bookDirs.forEach(dir => {
        const bookData = scanBook(path.join(booksDir, dir), dir);
        if (bookData) {
            books.push(bookData);
        }
    });

    const manifest = {
        generatedAt: new Date().toISOString(),
        books: books
    };

    fs.writeFileSync(outputFile, JSON.stringify(manifest, null, 2));
    console.log("Successfully generated manifest with " + books.length + " books.");
    books.forEach(b => {
        console.log("- " + b.id + ": " + b.pages.length + " pages");
    });
}

generateManifest();
