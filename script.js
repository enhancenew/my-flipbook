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
  let fallbackPages = [];
  let fallbackPageIndex = 0;
  let isFlipping = false;
  let flipGuardTimer = null;
  let audioContext = null;

  async function loadPages() {
    try {
      const response = await fetch(new URL("pages.json", document.baseURI), { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Missing pages.json");
      }

      const manifest = await response.json();
      const pages = Array.isArray(manifest.pages) ? manifest.pages : [];
      const imagePaths = pages.map((page) => new URL(page.src, document.baseURI).href);
      await preloadImages(imagePaths);
      initFlipbook(imagePaths);
      requestLaunchFullscreen();
    } catch (error) {
      initFlipbook([]);
    }
  }

  function preloadImages(imagePaths) {
    return Promise.all(
      imagePaths.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = async () => {
              if (img.decode) {
                try {
                  await img.decode();
                } catch (error) {
                  // The image has already loaded; decode failures should not block the viewer.
                }
              }
              resolve();
            };
            img.onerror = resolve;
            img.src = src;
          })
      )
    );
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
      initFallback(imagePaths);
      return;
    }

    try {
      pageFlip = new window.St.PageFlip(els.book, {
        width: 560,
        height: 760,
        size: "stretch",
        minWidth: 280,
        maxWidth: 620,
        minHeight: 380,
        maxHeight: 840,
        drawShadow: false,
        flippingTime: 700,
        usePortrait: false,
        startZIndex: 2,
        autoSize: true,
        maxShadowOpacity: 0.22,
        showCover: true,
        mobileScrollSupport: true,
        swipeDistance: 36,
        showPageCorners: false
      });

      pageFlip.on("init", (event) => updateCounter(event.data.page));
      pageFlip.on("flip", (event) => updateCounter(event.data));
      pageFlip.on("changeState", (event) => {
        isFlipping = event.data !== "read";
        if (!isFlipping && flipGuardTimer) {
          window.clearTimeout(flipGuardTimer);
          flipGuardTimer = null;
        }
      });
      pageFlip.on("changeOrientation", () => updateCounter(pageFlip.getCurrentPageIndex()));
      pageFlip.loadFromImages(imagePaths);
    } catch (error) {
      pageFlip = null;
      initFallback(imagePaths);
    }
  }

  function initFallback(imagePaths) {
    fallbackPages = imagePaths;
    fallbackPageIndex = 0;
    els.book.innerHTML = '<img class="fallback-page" alt="Flipbook page">';
    renderFallback();
  }

  function renderFallback() {
    const img = els.book.querySelector(".fallback-page");
    if (!img || fallbackPages.length === 0) {
      return;
    }

    img.src = fallbackPages[fallbackPageIndex];
    img.alt = `Flipbook page ${fallbackPageIndex + 1}`;
    updateCounter(fallbackPageIndex);
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
    if (isFlipping) {
      return;
    }

    if (pageFlip) {
      beginFlip();
      playPageTurnSound();
      pageFlip.flipNext("top");
    } else if (fallbackPageIndex < pageCount - 1) {
      playPageTurnSound();
      fallbackPageIndex += 1;
      renderFallback();
    }
  }

  function flipPrev() {
    if (isFlipping) {
      return;
    }

    if (pageFlip) {
      beginFlip();
      playPageTurnSound();
      pageFlip.flipPrev("top");
    } else if (fallbackPageIndex > 0) {
      playPageTurnSound();
      fallbackPageIndex -= 1;
      renderFallback();
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

  function beginFlip() {
    isFlipping = true;
    if (flipGuardTimer) {
      window.clearTimeout(flipGuardTimer);
    }
    flipGuardTimer = window.setTimeout(() => {
      isFlipping = false;
      flipGuardTimer = null;
    }, 900);
  }

  function getAudioContext() {
    if (!window.AudioContext && !window.webkitAudioContext) {
      return null;
    }

    if (!audioContext) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContextCtor();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    return audioContext;
  }

  function playPageTurnSound() {
    const context = getAudioContext();
    if (!context) {
      return;
    }

    const duration = 0.24;
    const sampleRate = context.sampleRate;
    const frameCount = Math.floor(sampleRate * duration);
    const buffer = context.createBuffer(1, frameCount, sampleRate);
    const samples = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i += 1) {
      const progress = i / frameCount;
      const decay = Math.pow(1 - progress, 2.4);
      const flutter = Math.sin(progress * Math.PI * 34) * 0.16;
      samples[i] = (Math.random() * 2 - 1) * decay * (0.34 + flutter);
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const now = context.currentTime;

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1300, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + duration);
    filter.Q.setValueAtTime(0.72, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start(now);
    source.stop(now + duration);
  }

  els.nextPage.addEventListener("click", flipNext);
  els.nextDock.addEventListener("click", flipNext);
  els.prevPage.addEventListener("click", flipPrev);
  els.prevDock.addEventListener("click", flipPrev);
  els.firstPage.addEventListener("click", () => {
    if (isFlipping) {
      return;
    }

    if (pageFlip) {
      beginFlip();
      playPageTurnSound();
      pageFlip.flip(0, "top");
    } else {
      playPageTurnSound();
      fallbackPageIndex = 0;
      renderFallback();
    }
  });
  els.lastPage.addEventListener("click", () => {
    if (isFlipping) {
      return;
    }

    if (pageFlip) {
      beginFlip();
      playPageTurnSound();
      pageFlip.flip(pageCount - 1, "top");
    } else {
      playPageTurnSound();
      fallbackPageIndex = pageCount - 1;
      renderFallback();
    }
  });
  els.zoomOut.addEventListener("click", () => setZoom(zoom - 0.1));
  els.zoomIn.addEventListener("click", () => setZoom(zoom + 0.1));

  els.pageSlider.addEventListener("input", () => {
    if (isFlipping) {
      els.pageSlider.value = String(pageFlip ? pageFlip.getCurrentPageIndex() + 1 : fallbackPageIndex + 1);
      return;
    }

    if (pageFlip) {
      playPageTurnSound();
      pageFlip.turnToPage(Number(els.pageSlider.value) - 1);
      updateCounter(pageFlip.getCurrentPageIndex());
    } else {
      playPageTurnSound();
      fallbackPageIndex = Number(els.pageSlider.value) - 1;
      renderFallback();
    }
  });

  els.fullscreen.addEventListener("click", () => {
    toggleFullscreen();
  });

  function toggleFullscreen() {
    if (!document.fullscreenEnabled) {
      return;
    }

    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }

    document.documentElement.requestFullscreen().catch(() => {});
  }

  function requestLaunchFullscreen() {
    if (!document.fullscreenEnabled || document.fullscreenElement) {
      return;
    }

    document.documentElement.requestFullscreen().catch(() => {
      document.body.classList.add("fullscreen-blocked");
    });
  }

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
