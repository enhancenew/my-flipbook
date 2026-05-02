const flipbookEl = document.getElementById("flipbook");

const pageFlip = new St.PageFlip(flipbookEl, {
  width: 800,
  height: 600,
  size: "stretch",
  minWidth: 315,
  minHeight: 420,
  maxWidth: 1000,
  maxHeight: 1350,
  drawShadow: true,
  flippingTime: 1000,
  useMouseEvents: true,
  showCover: true
});

// Load images automatically
const totalPages = 10; // adjust to your image count
for (let i = 1; i <= totalPages; i++) {
  pageFlip.loadFromHTML(`
    <div class="page">
      <img src="images/${i}_try.svg" style="width:100%;height:100%;object-fit:cover;">
    </div>
  `);
}

// Toolbar controls
document.getElementById("prev").addEventListener("click", () => pageFlip.flipPrev());
document.getElementById("next").addEventListener("click", () => pageFlip.flipNext());

let zoom = 1;
document.getElementById("zoomIn").addEventListener("click", () => {
  zoom += 0.1;
  flipbookEl.style.transform = `scale(${zoom})`;
});
document.getElementById("zoomOut").addEventListener("click", () => {
  zoom = Math.max(1, zoom - 0.1);
  flipbookEl.style.transform = `scale(${zoom})`;
});

document.getElementById("fullscreen").addEventListener("click", () => {
  if (!document.fullscreenElement) {
    flipbookEl.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Thumbnails
const thumbnailsEl = document.getElementById("thumbnails");
for (let i = 1; i <= totalPages; i++) {
  const thumb = document.createElement("img");
  thumb.src = `images/${i}_try.jpg`;
  thumb.addEventListener("click", () => pageFlip.flip(i));
  thumbnailsEl.appendChild(thumb);
}
