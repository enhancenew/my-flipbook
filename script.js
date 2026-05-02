(function () {
  const els = {
    book: document.getElementById("book"),
    emptyState: document.getElementById("emptyState"),
    pageCurrent: document.getElementById("pageCurrent"),
    pageTotal: document.getElementById("pageTotal"),
    prevPage: document.getElementById("prevPage"),
    nextPage: document.getElementById("nextPage"),
    firstPage: document.getElementById("firstPage"),
    lastPage: document.getElementById("lastPage"),
    fullscreen: document.getElementById("fullscreen")
  };

  let pageFlip = null;
  let pageCount = 0;

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
      width: 600,
      height: 800,
      size: "stretch",
      minWidth: 280,
      maxWidth: 620,
      minHeight: 373,
      maxHeight: 826,
      drawShadow: true,
      flippingTime: 850,
      usePortrait: true,
      startZIndex: 0,
      autoSize: true,
      maxShadowOpacity: 0.35,
      showCover: true,
      mobileScrollSupport: true,
      swipeDistance: 28
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

    const atStart = pageCount === 0 || current <= 1;
    const atEnd = pageCount === 0 || current >= pageCount;
    els.prevPage.disabled = atStart;
    els.firstPage.disabled = atStart;
    els.nextPage.disabled = atEnd;
    els.lastPage.disabled = atEnd;
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

  els.nextPage.addEventListener("click", flipNext);
  els.prevPage.addEventListener("click", flipPrev);
  els.firstPage.addEventListener("click", () => pageFlip && pageFlip.flip(0, "top"));
  els.lastPage.addEventListener("click", () => pageFlip && pageFlip.flip(pageCount - 1, "top"));

  els.fullscreen.addEventListener("click", () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }

    els.book.requestFullscreen();
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

  loadPages();
})();
