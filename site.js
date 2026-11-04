(() => {
  "use strict";

  /* ========================================
     VERTICAL NAME
  ======================================== */

  const siteHeader = document.querySelector(".site-header");
  const siteTitle = document.querySelector(".site-title");

  if (siteTitle) {
    const name = siteTitle.textContent.trim();

    siteTitle.setAttribute("aria-label", name);
    siteTitle.replaceChildren();

    for (const character of name) {
      const span = document.createElement("span");

      span.textContent = character === " " ? "\u00A0" : character;
      span.setAttribute("aria-hidden", "true");

      siteTitle.appendChild(span);
    }
  }

  /* ========================================
     SIDEBAR SCROLL EFFECT
  ======================================== */

  function updateSidebar() {
    if (siteHeader) {
      siteHeader.classList.toggle("dimmed", window.scrollY > 40);
    }
  }

  window.addEventListener("scroll", updateSidebar, {
    passive: true
  });

  window.addEventListener("pageshow", updateSidebar);

  updateSidebar();

  /* ========================================
     IMAGE POOLS
  ======================================== */

  const totalJpgs = 353;
  const totalPngs = 85;

  function createNumberedPool() {
    return [
      ...Array.from(
        { length: totalJpgs },
        (_, index) => `${index + 1}.jpg`
      ),
      ...Array.from(
        { length: totalPngs },
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
     HOME / MARRA COMPOSITIONS
  ======================================== */

  function createComposition(containerId, sources, description) {
    const container = document.getElementById(containerId);

    if (!container) return;

    const selectedImages = shuffle(sources).slice(0, 3);

    // Each rectangle uses:
    // column start, column span, row start, row span.
    // Rectangles remain orthogonal and do not overlap.
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

    const arrangement =
      arrangements[Math.floor(Math.random() * arrangements.length)];

    container.replaceChildren();

    selectedImages.forEach((source, index) => {
      const [column, columnSpan, row, rowSpan] = arrangement[index];

      const frame = document.createElement("div");
      frame.className = "composition-image";

      frame.style.gridColumn = `${column} / span ${columnSpan}`;
      frame.style.gridRow = `${row} / span ${rowSpan}`;

      const image = document.createElement("img");

      image.alt = `${description} — ${source}`;
      image.decoding = "async";
      image.loading = "eager";
      image.src = source;

      frame.appendChild(image);
      container.appendChild(frame);
    });
  }

  if (document.getElementById("home-composition")) {
    createComposition(
      "home-composition",
      createNumberedPool(),
      "Selected artwork"
    );
  }

  if (document.getElementById("marra-composition")) {
    const marraSources = Array.from(
      { length: 14 },
      (_, index) => `marra${index + 1}.jpg`
    );

    createComposition(
      "marra-composition",
      marraSources,
      "Marra project photograph"
    );
  }

  /* ========================================
     IMAGES ARCHIVE
     Runs only on images.html.
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
      if (event.pointerId !== activePointer) return;

      activePointer = null;
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