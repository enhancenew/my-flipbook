(function () {
  const els = {
    book: document.getElementById("book"),
    bookViewport: document.getElementById("bookViewport"),
    emptyState: document.getElementById("emptyState"),
    pageCurrent: document.getElementById("pageCurrent"),
    pageTotal: document.getElementById("pageTotal"),
    pageSlider: document.getElementById("pageSlider"),
    prevPage: document.getElementById("prevPage"),
    nextPage: document.getElementById("nextPage"),
    prevDock: document.getElementById("prevDock"),
    nextDock: document.getElementById("nextDock"),
    firstPage: document.getElementById("firstPage"),
    lastPage: document.getElementById("lastPage"),
    zoomOut: document.getElementById("zoomOut"),
    zoomIn: document.getElementById("zoomIn"),
    fullscreen: document.getElementById("fullscreen")
  };

  let pageFlip = null;
  let pageCount = 0;
  let zoom = 1;

  async function loadPages() {
    try {
      const response = await fetch("pages.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Missing pages.json");
      }

      const manifest = await response.json();
      const pages = Array.isArray(manifest.pages) ? manifest.pages : [];
      initFlipbook(pages.map((page) => page.src));
    } catch (error) {
      initFlipbook([]);
    }
  }

  function initFlipbook(imagePaths) {
    pageCount = imagePaths.length;
    els.emptyState.hidden = pageCount > 0;
    els.book.hidden = pageCount === 0;
    els.pageSlider.max = String(Math.max(pageCount, 1));

    if (pageCount === 0) {
      updateCounter(0);
      return;
    }

    if (!window.St || !window.St.PageFlip) {
      els.emptyState.hidden = false;
      els.book.hidden = true;
      els.emptyState.textContent = "The flipbook library could not be loaded.";
      updateCounter(0);
      return;
    }

    pageFlip = new window.St.PageFlip(els.book, {
      width: 560,
      height: 760,
      size: "stretch",
      minWidth: 280,
      maxWidth: 620,
      minHeight: 380,
      maxHeight: 840,
      drawShadow: true,
      flippingTime: 1000,
      usePortrait: true,
      startZIndex: 2,
      autoSize: true,
      maxShadowOpacity: 0.58,
      showCover: true,
      mobileScrollSupport: true,
      swipeDistance: 24
    });

    pageFlip.on("init", (event) => updateCounter(event.data.page));
    pageFlip.on("flip", (event) => updateCounter(event.data));
    pageFlip.on("changeOrientation", () => updateCounter(pageFlip.getCurrentPageIndex()));
    pageFlip.loadFromImages(imagePaths);
  }

  function updateCounter(pageIndex) {
    const current = pageCount === 0 ? 0 : Math.min(pageIndex + 1, pageCount);
    els.pageCurrent.textContent = String(current);
    els.pageTotal.textContent = String(pageCount);
    els.pageSlider.value = String(Math.max(current, 1));

    const atStart = pageCount === 0 || current <= 1;
    const atEnd = pageCount === 0 || current >= pageCount;
    [els.prevPage, els.prevDock, els.firstPage].forEach((button) => {
      button.disabled = atStart;
    });
    [els.nextPage, els.nextDock, els.lastPage].forEach((button) => {
      button.disabled = atEnd;
    });
  }

  function flipNext() {
    if (pageFlip) {
      pageFlip.flipNext("top");
    }
  }

  function flipPrev() {
    if (pageFlip) {
      pageFlip.flipPrev("top");
    }
  }

  function setZoom(nextZoom) {
    zoom = Math.max(0.82, Math.min(nextZoom, 1.22));
    els.bookViewport.style.setProperty("--book-scale", String(zoom));
    els.zoomOut.disabled = zoom <= 0.82;
    els.zoomIn.disabled = zoom >= 1.22;
    if (pageFlip) {
      window.setTimeout(() => pageFlip.update(), 200);
    }
  }

  els.nextPage.addEventListener("click", flipNext);
  els.nextDock.addEventListener("click", flipNext);
  els.prevPage.addEventListener("click", flipPrev);
  els.prevDock.addEventListener("click", flipPrev);
  els.firstPage.addEventListener("click", () => pageFlip && pageFlip.flip(0, "top"));
  els.lastPage.addEventListener("click", () => pageFlip && pageFlip.flip(pageCount - 1, "top"));
  els.zoomOut.addEventListener("click", () => setZoom(zoom - 0.1));
  els.zoomIn.addEventListener("click", () => setZoom(zoom + 0.1));

  els.pageSlider.addEventListener("input", () => {
    if (pageFlip) {
      pageFlip.turnToPage(Number(els.pageSlider.value) - 1);
      updateCounter(pageFlip.getCurrentPageIndex());
    }
  });

  els.fullscreen.addEventListener("click", () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }

    document.documentElement.requestFullscreen();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      flipNext();
    }

    if (event.key === "ArrowLeft") {
      flipPrev();
    }
  });

  window.addEventListener("resize", () => {
    if (pageFlip) {
      pageFlip.update();
    }
  });

  setZoom(1);
  loadPages();
})();
