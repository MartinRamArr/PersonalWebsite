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
       CHOOSE OVERLAY
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
       RANDOM PATTERN MODE

       Eight possibilities:
       - Large squares
       - Large circles
       - Large plus signs
       - Large mixed shapes
       - Tiny squares
       - Tiny circles
       - Tiny plus signs
       - Tiny mixed shapes
    ======================================== */

    const modes = [
      { dense: false, types: ["square"] },
      { dense: false, types: ["circle"] },
      { dense: false, types: ["plus"] },
      { dense: false, types: ["square", "circle", "plus"] },

      { dense: true, types: ["square"] },
      { dense: true, types: ["circle"] },
      { dense: true, types: ["plus"] },
      { dense: true, types: ["square", "circle", "plus"] }
    ];

    let previousMode = null;

    const storageKey = isMarra
      ? "marra-shape-mode"
      : "home-shape-mode";

    try {
      const stored = sessionStorage.getItem(storageKey);

      if (stored !== null) {
        previousMode = Number(stored);
      }
    } catch {}

    const availableModes = modes
      .map((mode, index) => ({ ...mode, index }))
      .filter(mode => mode.index !== previousMode);

    const mode = availableModes[
      Math.floor(Math.random() * availableModes.length)
    ];

    try {
      sessionStorage.setItem(storageKey, String(mode.index));
    } catch {}

    /* Stable random values keep resizing from
       generating a completely different composition. */

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

    function createMark(type, size, left, top) {
      const mark = document.createElement(
        isMarra ? "a" : "span"
      );

      mark.className = "geometric-mark";

      mark.style.width = `${size}px`;
      mark.style.height = `${size}px`;
      mark.style.left = `${left}px`;
      mark.style.top = `${top}px`;

      if (type === "circle") {
        mark.style.borderRadius = "50%";
      }

      if (type === "plus") {
        // A geometric plus sign with equal-width arms.
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

        // Keep dense patterns from creating hundreds
        // of keyboard tab stops. The first mark remains focusable.
        if (mode.dense) {
          mark.tabIndex = -1;
        }
      } else {
        mark.setAttribute("aria-hidden", "true");
      }

      return mark;
    }

    /* ========================================
       DRAW PATTERN
    ======================================== */

    function renderShapes() {
      layer.replaceChildren();

      const random = randomGenerator(seed);
      const mobile = document.documentElement.clientWidth <= 768;

      let width;
      let height;

      if (marraLayer) {
        // Marra shapes stay over the existing image area.
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

      function allowed(left, top, size, spacing = 8) {
        const rectangle = {
          left,
          top,
          right: left + size,
          bottom: top + size
        };

        return !protectedRectangles.some(protectedRectangle =>
          intersects(rectangle, protectedRectangle, spacing)
        );
      }

      const fragment = document.createDocumentFragment();

      if (mode.dense) {
        /* Dense regular field, like a white halftone. */

        let pitch = mobile
          ? 18 + random() * 8
          : 22 + random() * 12;

        // Bound element count on unusually large pages.
        pitch = Math.max(
          pitch,
          Math.sqrt((width * height) / 2200)
        );

        const size = pitch * (0.28 + random() * 0.16);
        const offsetX = random() * pitch;
        const offsetY = random() * pitch;

        for (
          let top = offsetY;
          top + size <= height;
          top += pitch
        ) {
          for (
            let left = offsetX;
            left + size <= width;
            left += pitch
          ) {
            if (!allowed(left, top, size, 6)) continue;

            const type = mode.types[
              Math.floor(random() * mode.types.length)
            ];

            fragment.appendChild(
              createMark(type, size, left, top)
            );
          }
        }
      } else {
        /* Larger scattered shapes with varied dimensions. */

        const count = mobile ? 6 : 10;
        const occupied = [];

        for (let index = 0; index < count; index++) {
          const size = Math.min(
            mobile
              ? 35 + random() * 80
              : 55 + random() * 170,
            width,
            height
          );

          const type = mode.types[index % mode.types.length];

          for (let attempt = 0; attempt < 120; attempt++) {
            const left = random() * (width - size);
            const top = random() * (height - size);

            if (!allowed(left, top, size, 12)) continue;

            const rectangle = {
              left,
              top,
              right: left + size,
              bottom: top + size
            };

            if (
              occupied.some(other =>
                intersects(rectangle, other, 12)
              )
            ) {
              continue;
            }

            fragment.appendChild(
              createMark(type, size, left, top)
            );

            occupied.push(rectangle);
            break;
          }
        }
      }

      layer.appendChild(fragment);

      if (isMarra && mode.dense) {
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