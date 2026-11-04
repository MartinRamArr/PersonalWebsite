(() => {
  "use strict";

  function initializeSectionTheme() {
    const section = document.querySelector(
      "#tab-portfolio, #tab-resume, #tab-images"
    );

    if (!section) return;

    document.body.classList.add("section-theme");

    /* ========================================
       BACKGROUND
    ======================================== */

    const backdrop = document.createElement("div");

    backdrop.className = "section-backdrop";
    backdrop.setAttribute("aria-hidden", "true");

    document.body.prepend(backdrop);

    /* ========================================
       FULL-WIDTH CROPPED NAME
    ======================================== */

    const container = document.querySelector(".site-container");

    let header = document.querySelector(".site-header");

    if (!header) {
      header = document.createElement("header");
      header.className = "site-header";
      container.appendChild(header);
    }

    const link = document.createElement("a");

    link.className = "site-title";
    link.href = "index.html";

    link.setAttribute(
      "aria-label",
      "Mario Martin Ramirez-Arrazola"
    );

    const namespace = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(namespace, "svg");

    svg.classList.add("section-name-svg");
    svg.setAttribute("viewBox", "0 0 1000 120");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");

    const lettering = document.createElementNS(
      namespace,
      "text"
    );

    lettering.textContent = "Mario Martin Ramirez-Arrazola";
    lettering.setAttribute("x", "0");
    lettering.setAttribute("y", "90");
    lettering.setAttribute("textLength", "1000");
    lettering.setAttribute("lengthAdjust", "spacingAndGlyphs");

    svg.appendChild(lettering);
    link.appendChild(svg);
    header.replaceChildren(link);

    function fitName() {
      lettering.setAttribute("x", "0");
      lettering.setAttribute("textLength", "1000");

      const bounds = lettering.getBBox();

      if (bounds.width <= 0) return;

      lettering.setAttribute(
        "textLength",
        String(1000 * (1004 / bounds.width))
      );

      const stretchedBounds = lettering.getBBox();

      lettering.setAttribute(
        "x",
        String(-stretchedBounds.x - 2)
      );
    }

    /* ========================================
       RANDOM SHAPE MODE
    ======================================== */

    const shapeLayer = document.createElement("div");

    shapeLayer.className = "section-shapes";
    shapeLayer.setAttribute("aria-hidden", "true");

    document.body.appendChild(shapeLayer);

    // 70% fewer large shapes, 30% many small shapes.
    const dense = Math.random() < 0.30;

    const families = [
      ["square"],
      ["circle"],
      ["plus"],
      ["circle", "square"],
      ["circle", "square", "plus"]
    ];

    const types = families[
      Math.floor(Math.random() * families.length)
    ];

    const seed = Math.floor(Math.random() * 4294967296);

    function randomGenerator(initialSeed) {
      let value = initialSeed >>> 0;

      return () => {
        value = (value + 0x6D2B79F5) >>> 0;

        let result = value;

        result = Math.imul(
          result ^ (result >>> 15),
          result | 1
        );

        result ^= result + Math.imul(
          result ^ (result >>> 7),
          result | 61
        );

        return (
          ((result ^ (result >>> 14)) >>> 0) /
          4294967296
        );
      };
    }

    function intersects(a, b) {
      return (
        a.left < b.right + 12 &&
        a.right > b.left - 12 &&
        a.top < b.bottom + 12 &&
        a.bottom > b.top - 12
      );
    }

    /* ========================================
       DRAW SHAPES
    ======================================== */

    function renderShapes() {
      shapeLayer.replaceChildren();

      const random = randomGenerator(seed);

      const width = document.documentElement.clientWidth;
      const height = window.innerHeight;
      const mobile = width <= 600;

      const protectedRectangles = [
        ...document.querySelectorAll(
          ".top-nav, .site-header, #tab-resume .cv-row"
        )
      ]
        .map(element => element.getBoundingClientRect())
        .filter(rectangle =>
          rectangle.bottom > 0 &&
          rectangle.top < height
        );

      const clusters = Array.from({ length: 5 }, () => ({
        x: random() * width,
        y: random() * height
      }));

      const count = dense
        ? Math.min(
            1000,
            Math.max(
              150,
              Math.round(width * height / 2000)
            )
          )
        : mobile ? 6 : 10;

      const fragment = document.createDocumentFragment();

      for (let index = 0; index < count; index++) {
        const size = Math.min(
          dense
            ? 4 + Math.pow(random(), 1.8) * 18
            : mobile
              ? 35 + random() * 70
              : 55 + random() * 170,
          width,
          height
        );

        const type = types[index % types.length];

        for (let attempt = 0; attempt < 60; attempt++) {
          let left;
          let top;

          if (dense && random() < 0.60) {
            const cluster = clusters[
              Math.floor(random() * clusters.length)
            ];

            left =
              cluster.x +
              (random() + random() - 1) * width * 0.30;

            top =
              cluster.y +
              (random() + random() - 1) * height * 0.30;
          } else {
            left = random() * (width - size);
            top = random() * (height - size);
          }

          if (
            left < 0 ||
            top < 0 ||
            left + size > width ||
            top + size > height
          ) {
            continue;
          }

          const rectangle = {
            left,
            top,
            right: left + size,
            bottom: top + size
          };

          if (
            protectedRectangles.some(protectedRectangle =>
              intersects(rectangle, protectedRectangle)
            )
          ) {
            continue;
          }

          const mark = document.createElement("span");

          mark.className = "section-mark";

          mark.style.width = `${size}px`;
          mark.style.height = `${size}px`;
          mark.style.left = `${left}px`;
          mark.style.top = `${top}px`;

          if (type === "circle") {
            mark.style.borderRadius = "50%";
          }

          if (type === "plus") {
            mark.style.clipPath = `
              polygon(
                36% 0%,
                64% 0%,
                64% 36%,
                100% 36%,
                100% 64%,
                64% 64%,
                64% 100%,
                36% 100%,
                36% 64%,
                0% 64%,
                0% 36%,
                36% 36%
              )
            `;
          }

          // No collision check between shapes:
          // overlapping shapes are allowed.
          fragment.appendChild(mark);
          break;
        }
      }

      shapeLayer.appendChild(fragment);
    }

    /* ========================================
       UPDATE ON RESIZE / SCROLL
    ======================================== */

    let frame = null;
    let lastWidth = 0;

    function scheduleRender() {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }

      frame = requestAnimationFrame(() => {
        frame = null;

        const currentWidth =
          document.documentElement.clientWidth;

        if (currentWidth !== lastWidth) {
          fitName();
          lastWidth = currentWidth;
        }

        renderShapes();
      });
    }

    scheduleRender();

    window.addEventListener("resize", scheduleRender);

    window.addEventListener("scroll", scheduleRender, {
      passive: true
    });

    if (document.fonts) {
      document.fonts.ready.then(() => {
        lastWidth = 0;
        scheduleRender();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeSectionTheme,
      { once: true }
    );
  } else {
    initializeSectionTheme();
  }
})();