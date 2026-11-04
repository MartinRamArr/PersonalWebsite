(() => {
  "use strict";

  /* ========================================
     FULL-PAGE HOME IMAGE
  ======================================== */

  const background = document.querySelector(".home-background");
  const backgroundImage = document.getElementById(
    "home-background-image"
  );

  if (background && backgroundImage) {
    // Same numbered image pool as your previous homepage.
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
      previousEffect = sessionStorage.getItem("home-artwork-effect");
    } catch {}

    const available = effects.filter(
      effect => effect !== previousEffect
    );

    const chosenEffect = available[
      Math.floor(Math.random() * available.length)
    ];

    background.classList.add(chosenEffect);

    // Slightly vary the crop on each refresh.
    background.style.setProperty(
      "--image-position",
      `${35 + Math.random() * 30}% ${35 + Math.random() * 30}%`
    );

    backgroundImage.src = `${number}.${extension}`;

    try {
      sessionStorage.setItem("home-artwork-effect", chosenEffect);
    } catch {}
  }

  /* ========================================
     RANDOM WHITE SHAPES
  ======================================== */

  const layer = document.getElementById("shape-layer");

  if (!layer) return;

  const isMarra = document.body.classList.contains(
    "experimental-marra"
  );

  // Retain the same random arrangement when the window is resized.
  const specifications = Array.from({ length: 9 }, (_, index) => ({
    circle: index % 2 === 0,
    scale: Math.random(),
    positions: Array.from({ length: 100 }, () => ({
      x: Math.random(),
      y: Math.random()
    }))
  }));

  function intersects(a, b, spacing = 0) {
    return (
      a.left < b.right + spacing &&
      a.right > b.left - spacing &&
      a.top < b.bottom + spacing &&
      a.bottom > b.top - spacing
    );
  }

  function pageRectangle(element) {
    const rectangle = element.getBoundingClientRect();

    return {
      left: rectangle.left + window.scrollX,
      right: rectangle.right + window.scrollX,
      top: rectangle.top + window.scrollY,
      bottom: rectangle.bottom + window.scrollY
    };
  }

  function renderShapes() {
    layer.replaceChildren();

    const pageWidth = document.documentElement.clientWidth;
    const pageHeight = Math.max(
      document.documentElement.clientHeight,
      document.body.scrollHeight
    );

    const sidebar = document.querySelector(".site-header");
    const nav = document.querySelector(".top-nav");

    const leftBoundary = sidebar
      ? sidebar.getBoundingClientRect().right + 12
      : 12;

    const topBoundary = nav
      ? pageRectangle(nav).bottom + 12
      : 20;

    const rightBoundary = pageWidth - 12;
    const bottomBoundary = pageHeight - 12;

    // Shapes never cover the navigation, biography, or Marra text.
    const protectedRectangles = [
      ...document.querySelectorAll(
        ".top-nav, .about-text, #tab-marra > .text-block"
      )
    ].map(pageRectangle);

    const occupiedRectangles = [];

    const mobile = pageWidth <= 768;
    const minimumSize = mobile ? 30 : 45;
    const maximumSize = mobile ? 110 : 220;

    for (const specification of specifications) {
      const size = Math.round(
        minimumSize +
        specification.scale * (maximumSize - minimumSize)
      );

      const availableWidth =
        rightBoundary - leftBoundary - size;

      const availableHeight =
        bottomBoundary - topBoundary - size;

      if (availableWidth < 0 || availableHeight < 0) continue;

      let placement = null;

      for (const position of specification.positions) {
        const left = leftBoundary + position.x * availableWidth;
        const top = topBoundary + position.y * availableHeight;

        const candidate = {
          left,
          top,
          right: left + size,
          bottom: top + size
        };

        const coversText = protectedRectangles.some(rectangle =>
          intersects(candidate, rectangle, 12)
        );

        const coversShape = occupiedRectangles.some(rectangle =>
          intersects(candidate, rectangle, 10)
        );

        if (!coversText && !coversShape) {
          placement = candidate;
          break;
        }
      }

      // On tight screens, show fewer shapes rather than cover text.
      if (!placement) continue;

      const shape = document.createElement(isMarra ? "a" : "div");

      shape.className = specification.circle
        ? "page-shape is-circle"
        : "page-shape is-square";

      shape.style.setProperty("--shape-size", `${size}px`);
      shape.style.left = `${placement.left}px`;
      shape.style.top = `${placement.top}px`;

      if (isMarra) {
        shape.href = "mailto:marraroofing@gmail.com";
        shape.setAttribute("aria-label", "Email Marra");
        shape.title = "Email marraroofing@gmail.com";
      } else {
        shape.setAttribute("aria-hidden", "true");
      }

      layer.appendChild(shape);
      occupiedRectangles.push(placement);
    }
  }

  let resizeFrame = null;

  function scheduleShapes() {
    if (resizeFrame !== null) {
      cancelAnimationFrame(resizeFrame);
    }

    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = null;
      renderShapes();
    });
  }

  scheduleShapes();

  window.addEventListener("load", scheduleShapes);
  window.addEventListener("resize", scheduleShapes);

  if (document.fonts) {
    document.fonts.ready.then(scheduleShapes);
  }
})();