(() => {
  "use strict";

  function initializeEffects() {
    /* ========================================
       RANDOM HOME BACKGROUND
    ======================================== */

    const background = document.querySelector(".home-background");
    const backgroundImage = document.getElementById(
      "home-background-image"
    );

    if (background && backgroundImage) {
      const useJpg = Math.random() > 0.25;
      const total = useJpg ? 353 : 85;
      const extension = useJpg ? "jpg" : "png";
      const number = Math.floor(Math.random() * total) + 1;

      const effects = [
        "effect-photocopy",
        "effect-risograph",
        "effect-grain",
        "effect-halftone"
      ];

      let previousEffect = null;

      try {
        previousEffect = sessionStorage.getItem(
          "home-artwork-effect"
        );
      } catch {}

      const availableEffects = effects.filter(
        effect => effect !== previousEffect
      );

      const chosenEffect = availableEffects[
        Math.floor(Math.random() * availableEffects.length)
      ];

      background.classList.remove(...effects);
      background.classList.add(chosenEffect);

      background.style.setProperty(
        "--image-position",
        `${35 + Math.random() * 30}% ${35 + Math.random() * 30}%`
      );

      backgroundImage.src = `${number}.${extension}`;

      try {
        sessionStorage.setItem(
          "home-artwork-effect",
          chosenEffect
        );
      } catch {}
    }

    /* ========================================
       SHAPE STYLES
    ======================================== */

    if (!document.getElementById("geometric-mark-styles")) {
      const style = document.createElement("style");

      style.id = "geometric-mark-styles";

      style.textContent = `
        .geometric-mark {
          position: absolute;
          display: block;
          margin: 0;
          padding: 0;
          border: 0 !important;
          outline: none;
          box-shadow: none !important;
          background: #ffffff;
          opacity: 1;
          text-decoration: none;
          pointer-events: none;
        }

        a.geometric-mark {
          pointer-events: auto;
          cursor: pointer;
        }

        a.geometric-mark:hover,
        a.geometric-mark:active,
        a.geometric-mark:visited {
          background: #ffffff;
          border: 0 !important;
          box-shadow: none !important;
          text-decoration: none;
        }

        a.geometric-mark:focus-visible {
          outline: 2px dashed #000000;
          outline-offset: 3px;
        }
      `;

      document.head.appendChild(style);
    }

    /* ========================================
       FIND THE CORRECT OVERLAY
    ======================================== */

    const marraLayer = document.getElementById(
      "marra-shape-overlay"
    );

    const homeLayer = document.getElementById("shape-layer");
    const layer = marraLayer || homeLayer;

    if (!layer) return;

    const isMarra = Boolean(marraLayer) ||
      document.body.classList.contains("experimental-marra");

    layer.style.pointerEvents = "none";
    layer.style.overflow = "hidden";

    /* ========================================
       CHOOSE A COMPOSITION

       70%: fewer, larger shapes
       30%: many small, irregularly scattered shapes

       Either version can contain:
       - squares only
       - circles only
       - plus signs only
       - circles and squares
       - all three
    ======================================== */

    const dense = Math.random() < 0.30;

    const shapeFamilies = [
      ["square"],
      ["circle"],
      ["plus"],
      ["circle", "square"],
      ["circle", "square", "plus"]
    ];

    const types = shapeFamilies[
      Math.floor(Math.random() * shapeFamilies.length)
    ];

    // Preserve the random composition when resizing.
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

    function intersects(a, b, spacing = 0) {
      return (
        a.left < b.right + spacing &&
        a.right > b.left - spacing &&
        a.top < b.bottom + spacing &&
        a.bottom > b.top - spacing
      );
    }

    function createMark(type, size, left, top, index) {
      const mark = document.createElement(
        isMarra ? "a" : "span"
      );

      mark.className = "geometric-mark";

      mark.style.width = `${size}px`;
      mark.style.height = `${size}px`;
      mark.style.left = `${left}px`;
      mark.style.top = `${top}px`;

      // Later shapes can stack above earlier shapes.
      mark.style.zIndex = String(index + 1);

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

      if (isMarra) {
        mark.href = "mailto:marraroofing@gmail.com";
        mark.setAttribute("aria-label", "Email Marra");
        mark.title = "Email marraroofing@gmail.com";

        if (dense) {
          mark.tabIndex = -1;
        }
      } else {
        mark.setAttribute("aria-hidden", "true");
      }

      return mark;
    }

    /* ========================================
       DRAW SHAPES
    ======================================== */

    function renderShapes() {
      layer.replaceChildren();

      const random = randomGenerator(seed);
      const mobile = document.documentElement.clientWidth <= 768;

      let width;
      let height;

      if (marraLayer) {
        // Marra stays within the existing right-hand image area.
        width = layer.clientWidth;
        height = layer.clientHeight;
      } else {
        width = document.documentElement.clientWidth;

        height = Math.max(
          document.documentElement.clientHeight,
          document.body.scrollHeight
        );

        layer.style.height = `${height}px`;
      }

      if (!width || !height) return;

      const layerRectangle = layer.getBoundingClientRect();

      // Keep shapes off the text, sidebar, and navigation.
      const protectedRectangles = marraLayer
        ? []
        : [
            ...document.querySelectorAll(
              ".top-nav, .about-text, " +
              "#tab-marra > .text-block, .site-header"
            )
          ].map(element => {
            const rectangle = element.getBoundingClientRect();

            return {
              left: rectangle.left - layerRectangle.left,
              right: rectangle.right - layerRectangle.left,
              top: rectangle.top - layerRectangle.top,
              bottom: rectangle.bottom - layerRectangle.top
            };
          });

      function allowed(left, top, size) {
        const rectangle = {
          left,
          top,
          right: left + size,
          bottom: top + size
        };

        return !protectedRectangles.some(protectedRectangle =>
          intersects(rectangle, protectedRectangle, 8)
        );
      }

      const fragment = document.createDocumentFragment();

      // Random cluster centers create uneven density.
      const clusters = Array.from({ length: 5 }, () => ({
        x: random() * width,
        y: random() * height
      }));

      const count = dense
        ? Math.min(
            1400,
            Math.max(180, Math.round((width * height) / 1800))
          )
        : mobile
          ? 6 + Math.floor(random() * 3)
          : 8 + Math.floor(random() * 5);

      let placed = 0;

      for (let index = 0; index < count; index++) {
        const size = Math.min(
          dense
            ? mobile
              ? 3 + Math.pow(random(), 1.8) * 12
              : 4 + Math.pow(random(), 1.8) * 20
            : mobile
              ? 35 + random() * 90
              : 55 + random() * 180,
          width,
          height
        );

        const type = types[index % types.length];

        for (let attempt = 0; attempt < 100; attempt++) {
          let left;
          let top;

          if (dense && random() < 0.60) {
            // Cluster some marks; scatter the others freely.
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

          if (!allowed(left, top, size)) continue;

          // No collision check between marks:
          // overlap and stacking are deliberately allowed.
          fragment.appendChild(
            createMark(type, size, left, top, placed)
          );

          placed++;
          break;
        }
      }

      layer.appendChild(fragment);

      if (isMarra && dense) {
        const firstLink = layer.querySelector("a");

        if (firstLink) {
          firstLink.tabIndex = 0;
        }
      }
    }

    let animationFrame = null;

    function scheduleRender() {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }

      animationFrame = requestAnimationFrame(() => {
        animationFrame = null;
        renderShapes();
      });
    }

    scheduleRender();

    window.addEventListener("load", scheduleRender);
    window.addEventListener("resize", scheduleRender);

    if (document.fonts) {
      document.fonts.ready.then(scheduleRender);
    }

    if (marraLayer && "ResizeObserver" in window) {
      const observer = new ResizeObserver(scheduleRender);
      observer.observe(marraLayer);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeEffects,
      { once: true }
    );
  } else {
    initializeEffects();
  }
})();