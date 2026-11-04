(() => {
  "use strict";

  /* ========================================
     EVENLY SPACED MOBILE NAVIGATION
     Applies to every page using site.js.
  ======================================== */

  const navigationStyle = document.createElement("style");

  navigationStyle.textContent = `
    @media (max-width: 768px) {
      html body .site-container nav.top-nav {
        display: grid !important;
        grid-template-columns:
          minmax(0, 0.8fr)
          minmax(0, 1.35fr)
          minmax(0, 1.05fr)
          minmax(0, 1fr)
          minmax(0, 0.8fr) !important;
        align-items: start !important;
        justify-content: stretch !important;
        gap: 0 !important;

        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
      }

      html body .site-container nav.top-nav .nav-tab {
        display: block !important;
        justify-self: stretch !important;

        min-width: 0;
        margin: 0 !important;
        padding: 0 !important;

        font-size: clamp(8px, 2.5vw, 12px) !important;
        line-height: 1.3 !important;
        letter-spacing: 0 !important;

        text-align: center !important;
        white-space: nowrap !important;
      }

      html body .site-container nav.top-nav .nav-tab:first-child {
        text-align: left !important;
      }

      html body .site-container nav.top-nav .nav-tab:last-child {
        text-align: right !important;
      }
    }
  `;

  document.head.appendChild(navigationStyle);

  /* ========================================
     HEADER
     Individual pages can replace this with
     their cropped wordmark after loading.
  ======================================== */

  const container = document.querySelector(".site-container");
  const navigation = document.querySelector(".top-nav");

  let header = document.querySelector(".site-header");

  if (container && navigation) {
    if (!header) {
      header = document.createElement("header");
    }

    header.className = "site-header";

    const title = document.createElement("a");

    title.className = "site-title";
    title.href = "index.html";
    title.textContent = "Mario Martin Ramirez-Arrazola";

    header.replaceChildren(title);
    container.insertBefore(header, navigation);
  }

  /* ========================================
     IMAGE POOLS
  ======================================== */

  function createNumberedPool() {
    return [
      ...Array.from(
        { length: 353 },
        (_, index) => `${index + 1}.jpg`
      ),
      ...Array.from(
        { length: 85 },
        (_, index) => `${index + 1}.png`
      )
    ];
  }

  function shuffle(items) {
    const result = [...items];

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  /* ========================================
     MARRA PHOTOGRAPHS
  ======================================== */

  function createComposition(containerId, sources, description) {
    const target = document.getElementById(containerId);

    if (!target) return;

    const arrangements = [
      [
        [1, 3, 1, 3],
        [5, 2, 2, 2],
        [3, 4, 5, 2]
      ],
      [
        [2, 4, 1, 2],
        [1, 3, 4, 3],
        [5, 2, 4, 2]
      ],
      [
        [1, 2, 2, 3],
        [4, 3, 1, 3],
        [3, 3, 5, 2]
      ],
      [
        [1, 3, 1, 2],
        [5, 2, 3, 3],
        [1, 3, 4, 3]
      ]
    ];

    const arrangement = arrangements[
      Math.floor(Math.random() * arrangements.length)
    ];

    target.replaceChildren();

    shuffle(sources).slice(0, 3).forEach((source, index) => {
      const [column, columnSpan, row, rowSpan] = arrangement[index];

      const frame = document.createElement("div");

      frame.className = "composition-image";
      frame.style.gridColumn = `${column} / span ${columnSpan}`;
      frame.style.gridRow = `${row} / span ${rowSpan}`;

      const image = document.createElement("img");

      image.alt = `${description} — ${source}`;
      image.decoding = "async";
      image.src = source;

      frame.appendChild(image);
      target.appendChild(frame);
    });
  }

  createComposition(
    "marra-composition",
    Array.from(
      { length: 14 },
      (_, index) => `marra${index + 1}.jpg`
    ),
    "Marra project photograph"
  );

  /* ========================================
     IMAGES ARCHIVE
  ======================================== */

  const canvas = document.getElementById("images-canvas");
  const loadMoreButton = document.getElementById("load-more-btn");

  if (!canvas) return;

  const imagePool = shuffle(createNumberedPool());

  let currentTop = 50;
  let topLayer = 10;

  function makeDraggable(element) {
    let previousX = 0;
    let previousY = 0;
    let activePointer = null;

    element.addEventListener("pointerdown", event => {
      if (!event.isPrimary) return;

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      activePointer = event.pointerId;
      previousX = event.clientX;
      previousY = event.clientY;

      element.setPointerCapture(activePointer);
      element.style.zIndex = String(++topLayer);
    });

    element.addEventListener("pointermove", event => {
      if (event.pointerId !== activePointer) return;

      const deltaX = event.clientX - previousX;
      const deltaY = event.clientY - previousY;

      element.style.left = `${element.offsetLeft + deltaX}px`;
      element.style.top = `${element.offsetTop + deltaY}px`;

      previousX = event.clientX;
      previousY = event.clientY;
    });

    function stopDragging(event) {
      if (event.pointerId === activePointer) {
        activePointer = null;
      }
    }

    element.addEventListener("pointerup", stopDragging);
    element.addEventListener("pointercancel", stopDragging);
    element.addEventListener("lostpointercapture", stopDragging);
  }

  function renderBatch(batchSize = 20) {
    const count = Math.min(batchSize, imagePool.length);

    for (let i = 0; i < count; i++) {
      const wrapper = document.createElement("div");

      wrapper.className = "floating-image-wrapper";

      const width = 180 + Math.floor(Math.random() * 100);

      wrapper.style.width = `${width}px`;
      wrapper.style.left = `${Math.random() * 65}%`;
      wrapper.style.top = `${currentTop}px`;

      wrapper.style.setProperty(
        "--rot",
        `${Math.random() * 16 - 8}deg`
      );

      wrapper.style.setProperty(
        "--drift-x",
        `${Math.random() * 20 - 10}px`
      );

      wrapper.style.setProperty(
        "--drift-y",
        `${Math.random() * 20 - 10}px`
      );

      wrapper.style.setProperty(
        "--drift-rot",
        `${Math.random() * 4 - 2}deg`
      );

      wrapper.style.setProperty(
        "--drift-duration",
        `${5 + Math.random() * 5}s`
      );

      const source = imagePool.pop();
      const image = document.createElement("img");

      image.loading = "lazy";
      image.decoding = "async";
      image.alt = `Archive image ${source}`;
      image.draggable = false;
      image.src = source;

      wrapper.appendChild(image);
      canvas.appendChild(wrapper);

      makeDraggable(wrapper);

      currentTop += width * 0.75 + Math.random() * 60;
    }

    canvas.style.height = `${currentTop + 300}px`;

    if (loadMoreButton) {
      const finished = imagePool.length === 0;

      loadMoreButton.hidden = finished;
      loadMoreButton.style.display = finished ? "none" : "";
    }
  }

  if (loadMoreButton) {
    loadMoreButton.addEventListener("click", () => {
      renderBatch(15);
    });
  }

  renderBatch(20);
})();