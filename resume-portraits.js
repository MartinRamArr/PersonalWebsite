(() => {
  "use strict";

  function initializePortraits() {
    if (!document.getElementById("tab-resume")) return;
    if (document.getElementById("floating-portraits")) return;

    document.querySelector(".resume-intro")?.remove();

    const style = document.createElement("style");

    style.textContent = `
      body.section-theme {
        position: relative;
      }

      #floating-portraits {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 10;

        width: 100%;
        overflow: hidden;

        pointer-events: none;
      }

      .portrait-pair {
        position: absolute;
        top: 0;
        left: 0;

        width: clamp(170px, 27vw, 410px);
        margin: 0;
        padding: 0;

        isolation: isolate;
        background: transparent;
        pointer-events: none;

        visibility: hidden;
        will-change: transform;
      }

      .portrait-face {
        position: absolute;
        inset: 0 auto auto 0;

        width: 100%;
        margin: 0;
        padding: 0;

        background: transparent;

        /* Normal blending makes the front/back exchange visible. */
        mix-blend-mode: normal;
        pointer-events: none;
      }

      .portrait-face img {
        display: block;
        width: 100%;
        height: auto;

        margin: 0;
        padding: 0;

        background: transparent !important;
        border: 0;
        box-shadow: none;

        pointer-events: none;

        animation: paired-portrait-color 24s linear infinite;
        animation-delay: var(--color-delay, 0s);
      }

      @keyframes paired-portrait-color {
        from {
          filter:
            grayscale(1)
            sepia(1)
            saturate(4)
            hue-rotate(0deg);
        }

        to {
          filter:
            grayscale(1)
            sepia(1)
            saturate(4)
            hue-rotate(360deg);
        }
      }

      @media (max-width: 600px) {
        .portrait-pair {
          width: clamp(160px, 48vw, 240px);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .portrait-face img {
          animation: none;
        }
      }
    `;

    document.head.appendChild(style);

    const layer = document.createElement("div");

    layer.id = "floating-portraits";
    layer.setAttribute("aria-hidden", "true");

    const pair = document.createElement("div");
    pair.className = "portrait-pair";

    const sources = Math.random() < 0.5
      ? ["MarioHeadshot1.png", "MarioHeadshot2.png"]
      : ["MarioHeadshot2.png", "MarioHeadshot1.png"];

    const faces = sources.map(source => {
      const wrapper = document.createElement("div");
      wrapper.className = "portrait-face";

      const image = document.createElement("img");

      image.alt = "";
      image.draggable = false;
      image.decoding = "async";

      wrapper.appendChild(image);
      pair.appendChild(wrapper);

      return { wrapper, image, source };
    });

    layer.appendChild(pair);
    document.body.appendChild(layer);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const offsetX = 22 + Math.random() * 20;
    const offsetY = 14 + Math.random() * 18;
    const colorStart = Math.random() * 24;

    faces.forEach((face, index) => {
      face.image.style.setProperty(
        "--color-delay",
        `${-(colorStart + index * 8)}s`
      );
    });

    let ready = false;
    let frame = null;
    let previousTime = null;
    let exchangeTime = Math.random() * 6;

    let pageWidth = 0;
    let pageHeight = 0;
    let portraitWidth = 0;
    let portraitHeight = 0;

    let position = null;
    let target = null;
    let angle = 0;
    let targetAngle = 0;

    let layoutFrame = null;

    function randomBetween(minimum, maximum) {
      return minimum + Math.random() * (maximum - minimum);
    }

    /* ========================================
       FULL DOCUMENT DIMENSIONS
    ======================================== */

    function measurePage() {
      const container = document.querySelector(".site-container");

      pageWidth = document.documentElement.clientWidth;

      const contentBottom = container
        ? container.getBoundingClientRect().bottom + window.scrollY
        : document.body.offsetHeight;

      pageHeight = Math.ceil(
        Math.max(
          document.documentElement.clientHeight,
          document.body.offsetHeight,
          contentBottom
        )
      );

      layer.style.height = `${pageHeight}px`;

      const imageWidth = pair.clientWidth;

      const heights = faces.map(face => {
        const image = face.image;

        return image.naturalWidth > 0
          ? imageWidth * image.naturalHeight / image.naturalWidth
          : 0;
      });

      portraitWidth = imageWidth + offsetX + 16;
      portraitHeight =
        Math.max(heights[0], heights[1] + offsetY) + 16;

      pair.style.height = `${portraitHeight}px`;
    }

    /* ========================================
       PORTRAIT EXCHANGE

       One becomes stronger as the other recedes.
       Neither disappears or holds a clear pose.

       Layer order switches through a brief blur
       while their opacities are equal.
    ======================================== */

    function updateExchange(delta) {
      exchangeTime += delta;

      const phase = exchangeTime / 6 * Math.PI * 2;
      const wave = Math.sin(phase);
      const dominance = (wave + 1) / 2;

      const lowOpacity = 0.24;
      const highOpacity = window.innerWidth <= 600 ? 0.54 : 0.60;

      faces[0].wrapper.style.opacity =
        lowOpacity + dominance * (highOpacity - lowOpacity);

      faces[1].wrapper.style.opacity =
        lowOpacity + (1 - dominance) * (highOpacity - lowOpacity);

      faces[0].wrapper.style.zIndex = wave >= 0 ? "2" : "1";
      faces[1].wrapper.style.zIndex = wave >= 0 ? "1" : "2";

      // Briefly soften the precise moment of the stacking change.
      const exchangeBlur =
        0.8 + 2 * Math.exp(-Math.pow(wave / 0.22, 2));

      faces[0].wrapper.style.filter =
        `blur(${exchangeBlur}px)`;

      faces[1].wrapper.style.filter =
        `blur(${exchangeBlur + 0.3}px)`;

      // Keep the two images connected, but slightly unsettled.
      const shiftX = Math.sin(phase * 0.5) * 7;
      const shiftY = Math.cos(phase * 0.5) * 5;

      faces[0].wrapper.style.transform =
        `translate(${shiftX}px, ${shiftY}px)`;

      faces[1].wrapper.style.transform =
        `translate(${offsetX - shiftX}px, ${offsetY - shiftY}px)`;
    }

    /* ========================================
       MOVEMENT THROUGH THE PAGE

       Alternates between distant left/right
       destinations at different document heights.
    ======================================== */

    function chooseTarget() {
      const currentCenterX = position.x + portraitWidth / 2;
      const headingRight = currentCenterX < pageWidth / 2;

      const targetX = headingRight
        ? randomBetween(pageWidth * 0.7, pageWidth + 50)
        : randomBetween(-portraitWidth - 50, pageWidth * 0.15);

      const maxY = Math.max(0, pageHeight - portraitHeight);

      // Choose a noticeably different vertical position.
      let targetY = randomBetween(0, maxY);

      for (let attempt = 0; attempt < 12; attempt++) {
        if (Math.abs(targetY - position.y) > maxY * 0.25) {
          break;
        }

        targetY = randomBetween(0, maxY);
      }

      target = {
        x: targetX,
        y: targetY
      };

      targetAngle = randomBetween(-12, 12);
    }

    function startingPosition() {
      const maxY = Math.max(0, pageHeight - portraitHeight);

      // Start near the upper portion of the document,
      // entering from either side.
      const initialY = randomBetween(
        60,
        Math.max(
          60,
          Math.min(maxY, window.innerHeight * 0.65)
        )
      );

      position = {
        x: Math.random() < 0.5
          ? -portraitWidth - 30
          : pageWidth + 30,
        y: Math.min(initialY, maxY)
      };

      angle = randomBetween(-8, 8);
      chooseTarget();
    }

    function paintPosition() {
      pair.style.transform =
        `translate3d(${position.x}px, ${position.y}px, 0) ` +
        `rotate(${angle}deg)`;
    }

    function animate(time) {
      frame = null;

      if (!ready || reducedMotion.matches) return;

      const delta = previousTime === null
        ? 0
        : Math.min((time - previousTime) / 1000, 0.05);

      previousTime = time;

      updateExchange(delta);

      const dx = target.x - position.x;
      const dy = target.y - position.y;
      const distance = Math.hypot(dx, dy);

      // Faster on a longer page so the pair covers more ground.
      const speed = Math.min(
        210,
        Math.max(100, pageHeight / 24)
      );

      const travel = speed * delta;

      if (distance <= travel || distance < 1) {
        position.x = target.x;
        position.y = target.y;

        chooseTarget();
      } else {
        position.x += dx / distance * travel;
        position.y += dy / distance * travel;
      }

      angle += (targetAngle - angle) * Math.min(1, delta * 0.7);

      paintPosition();

      frame = requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (!ready) return;

      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }

      previousTime = null;
      measurePage();

      if (!position) {
        startingPosition();
      }

      if (reducedMotion.matches) {
        faces[0].wrapper.style.opacity = "0.42";
        faces[1].wrapper.style.opacity = "0.36";

        faces[0].wrapper.style.zIndex = "2";
        faces[1].wrapper.style.zIndex = "1";

        faces[0].wrapper.style.filter = "blur(0.8px)";
        faces[1].wrapper.style.filter = "blur(1px)";

        faces[0].wrapper.style.transform = "translate(0, 0)";
        faces[1].wrapper.style.transform =
          `translate(${offsetX}px, ${offsetY}px)`;

        position = {
          x: Math.max(0, pageWidth * 0.6 - portraitWidth / 2),
          y: Math.max(50, window.innerHeight * 0.3)
        };

        angle = -4;
        paintPosition();
      } else {
        chooseTarget();
        frame = requestAnimationFrame(animate);
      }

      pair.style.visibility = "visible";
    }

    /* ========================================
       IMAGE LOADING
    ======================================== */

    function loadImage(image, source) {
      return new Promise(resolve => {
        image.addEventListener(
          "load",
          () => resolve(true),
          { once: true }
        );

        image.addEventListener(
          "error",
          () => resolve(false),
          { once: true }
        );

        image.src = source;
      });
    }

    Promise.all(
      faces.map(face => loadImage(face.image, face.source))
    ).then(results => {
      if (!results.every(Boolean)) {
        layer.remove();
        return;
      }

      ready = true;
      startAnimation();
    });

    /* ========================================
       LAYOUT CHANGES

       Scrolling does not reposition the pair.
    ======================================== */

    function scheduleMeasurement() {
      if (layoutFrame !== null) {
        cancelAnimationFrame(layoutFrame);
      }

      layoutFrame = requestAnimationFrame(() => {
        layoutFrame = null;

        if (!ready) return;

        const oldWidth = pageWidth;
        const oldHeight = pageHeight;

        measurePage();

        if (
          oldWidth !== pageWidth ||
          oldHeight !== pageHeight
        ) {
          chooseTarget();
        }
      });
    }

    window.addEventListener("resize", scheduleMeasurement);

    const container = document.querySelector(".site-container");

    if (container && "ResizeObserver" in window) {
      const observer = new ResizeObserver(scheduleMeasurement);
      observer.observe(container);
    }

    if (document.fonts) {
      document.fonts.ready.then(scheduleMeasurement);
    }

    reducedMotion.addEventListener("change", startAnimation);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (frame !== null) {
          cancelAnimationFrame(frame);
          frame = null;
        }

        previousTime = null;
      } else if (ready && !reducedMotion.matches && frame === null) {
        frame = requestAnimationFrame(animate);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializePortraits,
      { once: true }
    );
  } else {
    initializePortraits();
  }
})();