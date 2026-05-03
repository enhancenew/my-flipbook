(function () {
  const els = {
    book: document.getElementById("book"),
    bookViewport: document.getElementById("bookViewport"),
    closedCover: document.getElementById("closedCover"),
    closedCoverImage: document.getElementById("closedCoverImage"),
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
    fullscreen: document.getElementById("fullscreen"),
    shareBtn: document.getElementById("shareBtn"),
    downloadBtn: document.getElementById("downloadBtn")
  };

  let pageFlip = null;
  let pageCount = 0;
  let zoom = 1;
  let fallbackPages = [];
  let fallbackPageIndex = 0;
  let isFlipping = false;
  let flipGuardTimer = null;
  let audioContext = null;
  let imagePaths = [];
  let isCoverMode = false;

  async function loadPages() {
    try {
      const response = await fetch(new URL("pages.json", document.baseURI), { cache: "no-store" });
      if (!response.ok) throw new Error("Missing pages.json");

      const manifest = await response.json();
      const pages = Array.isArray(manifest.pages) ? manifest.pages : [];
      imagePaths = pages.map((page) => new URL(page.src, document.baseURI).href);
      await preloadImages(imagePaths);
      initViewer(imagePaths);
    } catch (error) {
      initViewer([]);
    }
  }

  function preloadImages(imagePaths) {
    return Promise.all(
      imagePaths.map((src) => new Promise((resolve) => {
        const img = new Image();
        img.onload = async () => {
          if (img.decode) {
            try { await img.decode(); } catch (e) {}
          }
          resolve();
        };
        img.onerror = resolve;
        img.src = src;
      }))
    );
  }

  function initViewer(paths) {
    pageCount = paths.length;
    els.emptyState.style.display = pageCount > 0 ? "none" : "block";
    els.closedCover.style.display = pageCount === 0 ? "none" : "block";
    els.book.style.display = "none";
    els.pageSlider.max = String(Math.max(pageCount, 1));

    if (pageCount === 0) {
      updateCounter(0);
      return;
    }

    isCoverMode = true;
    els.bookViewport.classList.add("is-cover-mode");
    els.closedCoverImage.src = paths[0];
    updateCounter(0);
  }

  function openBookAtFirstSpread() {
    if (!isCoverMode || pageCount <= 1) return;

    isCoverMode = false;
    els.bookViewport.classList.remove("is-cover-mode");
    els.closedCover.style.display = "none";
    els.book.style.display = "block";

    if (!pageFlip) {
      initFlipbook(imagePaths, Math.min(1, pageCount - 1));
      return;
    }

    beginFlip();
    pageFlip.flip(Math.min(1, pageCount - 1), "top");
  }

  function initFlipbook(paths, startPageIndex) {
    if (!window.St || !window.St.PageFlip) {
      initFallback(paths, startPageIndex);
      return;
    }

    try {
      els.book.innerHTML = "";
      pageFlip = new window.St.PageFlip(els.book, {
        startPage: startPageIndex,
        width: 560,
        height: 760,
        size: "stretch",
        minWidth: 280,
        maxWidth: 620,
        minHeight: 380,
        maxHeight: 840,
        drawShadow: true,
        flippingTime: 700,
        usePortrait: false,
        startZIndex: 2,
        autoSize: true,
        maxShadowOpacity: 0.25,
        showCover: true,
        mobileScrollSupport: true,
        swipeDistance: 36,
        showPageCorners: false
      });

      pageFlip.on("init", (e) => updateCounter(e.data.page));
      pageFlip.on("flip", (e) => {
        syncCoverMode(e.data);
        updateCounter(e.data);
      });
      pageFlip.on("changeState", (e) => {
        isFlipping = e.data !== "read";
        if (!isFlipping && flipGuardTimer) {
          clearTimeout(flipGuardTimer);
          flipGuardTimer = null;
        }
      });
      pageFlip.on("changeOrientation", () => updateCounter(pageFlip.getCurrentPageIndex()));
      pageFlip.loadFromImages(paths);
    } catch (error) {
      initFallback(paths, startPageIndex);
    }
  }

  function initFallback(paths, startPageIndex) {
    fallbackPages = paths;
    fallbackPageIndex = startPageIndex;
    els.book.innerHTML = '<img class="fallback-page" style="max-width:100%; max-height:100%; object-fit:contain;">';
    renderFallback();
  }

  function renderFallback() {
    const img = els.book.querySelector("img");
    if (!img || fallbackPages.length === 0) return;
    img.src = fallbackPages[fallbackPageIndex];
    updateCounter(fallbackPageIndex);
  }

  function updateCounter(pageIndex) {
    const current = pageCount === 0 ? 0 : Math.min(pageIndex + 1, pageCount);
    els.pageCurrent.textContent = String(current);
    els.pageTotal.textContent = String(pageCount);
    els.pageSlider.value = String(Math.max(current, 1));

    const atStart = pageCount === 0 || current <= 1;
    const atEnd = pageCount === 0 || current >= pageCount;
    [els.prevPage, els.prevDock, els.firstPage].forEach(b => b && (b.disabled = atStart));
    [els.nextPage, els.nextDock, els.lastPage].forEach(b => b && (b.disabled = atEnd));
  }

  function syncCoverMode(pageIndex) {
    isCoverMode = pageIndex === 0;
    els.bookViewport.classList.toggle("is-cover-mode", isCoverMode);
  }

  function flipNext() {
    if (isFlipping) return;
    if (isCoverMode) {
      playPageTurnSound();
      openBookAtFirstSpread();
      return;
    }
    if (pageFlip) {
      beginFlip();
      playPageTurnSound();
      pageFlip.flipNext("top");
    } else if (fallbackPageIndex < pageCount - 1) {
      playPageTurnSound();
      fallbackPageIndex++;
      renderFallback();
    }
  }

  function flipPrev() {
    if (isFlipping) return;
    if (isCoverMode) return;
    if (pageFlip) {
      beginFlip();
      playPageTurnSound();
      pageFlip.flipPrev("top");
    } else if (fallbackPageIndex > 0) {
      playPageTurnSound();
      fallbackPageIndex--;
      renderFallback();
    }
  }

  function setZoom(nextZoom) {
    zoom = Math.max(0.8, Math.min(nextZoom, 1.8));
    els.bookViewport.style.setProperty("--book-scale", String(zoom));
    els.zoomOut.disabled = zoom <= 0.8;
    els.zoomIn.disabled = zoom >= 1.8;
    if (pageFlip) setTimeout(() => pageFlip.update(), 100);
  }

  function beginFlip() {
    isFlipping = true;
    if (flipGuardTimer) clearTimeout(flipGuardTimer);
    flipGuardTimer = setTimeout(() => {
      isFlipping = false;
      flipGuardTimer = null;
    }, 800);
  }

  function playPageTurnSound() {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    if (!audioContext) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      audioContext = new Ctor();
    }
    if (audioContext.state === "suspended") audioContext.resume();

    const duration = 0.2;
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i/data.length, 2);
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.05, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    source.connect(gain);
    gain.connect(audioContext.destination);
    source.start();
  }

  // Event Listeners
  els.nextPage.onclick = flipNext;
  els.nextDock.onclick = flipNext;
  els.prevPage.onclick = flipPrev;
  els.prevDock.onclick = flipPrev;
  
  els.firstPage.onclick = () => {
    if (isFlipping) return;
    playPageTurnSound();
    if (pageFlip) pageFlip.flip(0);
    else { fallbackPageIndex = 0; renderFallback(); }
  };

  els.lastPage.onclick = () => {
    if (isFlipping) return;
    playPageTurnSound();
    if (pageFlip) pageFlip.flip(pageCount - 1);
    else { fallbackPageIndex = pageCount - 1; renderFallback(); }
  };

  els.closedCover.onclick = () => {
    if (!isFlipping) { playPageTurnSound(); openBookAtFirstSpread(); }
  };

  els.zoomOut.onclick = () => setZoom(zoom - 0.2);
  els.zoomIn.onclick = () => setZoom(zoom + 0.2);

  els.pageSlider.oninput = () => {
    if (isFlipping) return;
    const target = Number(els.pageSlider.value) - 1;
    playPageTurnSound();
    if (pageFlip) pageFlip.turnToPage(target);
    else { fallbackPageIndex = target; renderFallback(); }
  };

  els.fullscreen.onclick = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };

  if (els.shareBtn) els.shareBtn.onclick = () => {
    if (navigator.share) {
      navigator.share({ title: 'Flipbook', url: window.location.href });
    } else {
      alert("Copy link: " + window.location.href);
    }
  };

  if (els.downloadBtn) els.downloadBtn.onclick = () => {
    alert("Downloading PDF...");
  };

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") flipNext();
    if (e.key === "ArrowLeft") flipPrev();
  });

  window.onresize = () => pageFlip && pageFlip.update();

  loadPages();
})();
