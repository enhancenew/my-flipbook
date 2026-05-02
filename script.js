(function () {
  const state = {
    pages: [],
    spread: 0,
    isMobile: window.matchMedia("(max-width: 760px)").matches
  };

  const els = {
    book: document.getElementById("book"),
    leftImage: document.getElementById("leftImage"),
    rightImage: document.getElementById("rightImage"),
    pageCurrent: document.getElementById("pageCurrent"),
    pageTotal: document.getElementById("pageTotal"),
    prevPage: document.getElementById("prevPage"),
    nextPage: document.getElementById("nextPage"),
    firstPage: document.getElementById("firstPage"),
    lastPage: document.getElementById("lastPage"),
    fullscreen: document.getElementById("fullscreen")
  };

  async function loadPages() {
    try {
      const response = await fetch("pages.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Missing pages.json");
      }

      const manifest = await response.json();
      state.pages = Array.isArray(manifest.pages) ? manifest.pages : [];
    } catch (error) {
      state.pages = [];
    }

    render();
  }

  function currentIndex() {
    return state.isMobile ? state.spread : state.spread * 2;
  }

  function maxSpread() {
    if (state.pages.length === 0) {
      return 0;
    }

    return state.isMobile ? state.pages.length - 1 : Math.ceil(state.pages.length / 2) - 1;
  }

  function render() {
    const pageCount = state.pages.length;
    const index = Math.min(currentIndex(), Math.max(0, pageCount - 1));
    const left = state.pages[index];
    const right = state.isMobile ? left : state.pages[index + 1];

    els.book.classList.toggle("is-empty", pageCount === 0);
    setImage(els.leftImage, left);
    setImage(els.rightImage, right);

    els.pageCurrent.textContent = pageCount === 0 ? "0" : String(index + 1);
    els.pageTotal.textContent = String(pageCount);

    const atStart = state.spread <= 0;
    const atEnd = state.spread >= maxSpread();
    els.prevPage.disabled = atStart || pageCount === 0;
    els.firstPage.disabled = atStart || pageCount === 0;
    els.nextPage.disabled = atEnd || pageCount === 0;
    els.lastPage.disabled = atEnd || pageCount === 0;
  }

  function setImage(img, page) {
    if (!page) {
      img.removeAttribute("src");
      img.alt = "";
      return;
    }

    img.src = page.src;
    img.alt = page.alt || page.name || "Flipbook page";
  }

  function goTo(spread, animate) {
    state.spread = Math.max(0, Math.min(spread, maxSpread()));
    render();

    if (animate) {
      els.book.classList.remove("is-turning");
      window.requestAnimationFrame(() => els.book.classList.add("is-turning"));
    }
  }

  function next() {
    goTo(state.spread + 1, true);
  }

  function previous() {
    goTo(state.spread - 1, true);
  }

  els.nextPage.addEventListener("click", next);
  els.prevPage.addEventListener("click", previous);
  els.firstPage.addEventListener("click", () => goTo(0, true));
  els.lastPage.addEventListener("click", () => goTo(maxSpread(), true));

  els.fullscreen.addEventListener("click", () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }

    els.book.requestFullscreen();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      next();
    }

    if (event.key === "ArrowLeft") {
      previous();
    }
  });

  window.addEventListener("resize", () => {
    const wasMobile = state.isMobile;
    const oldPageIndex = wasMobile ? state.spread : state.spread * 2;
    state.isMobile = window.matchMedia("(max-width: 760px)").matches;

    if (wasMobile !== state.isMobile) {
      state.spread = state.isMobile ? oldPageIndex : Math.floor(oldPageIndex / 2);
      goTo(state.spread, false);
    }
  });

  loadPages();
})();
