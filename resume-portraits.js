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
        mix-blend-mode: screen;
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

        animation:
          paired-portrait-color
          32s
          linear
          infinite;

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

    const offsetX = 20 + Math.random() * 22;
    const offsetY = 14 + Math.random() * 18;
    const colorStart = Math.random() * 32;

    faces.forEach((face, index) => {
      face.image.style.setProperty(
        "--color-delay",
        `${-(colorStart + index * 10)}s`
      );
    });

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let movement = null;
    let exchangeAnimations = [];
    let generation = 0;
    let ready = false;

    let previousWidth = 0;
    let previousHeight = 0;
    let layoutFrame = null;

    function randomBetween(minimum, maximum) {
      return minimum + Math.random() * (maximum - minimum);
    }

    /* ========================================
       DOCUMENT SIZE

       The overlay is sized from the page content,
       not the visible browser window.
    ======================================== */

    function updatePageSize() {
      const container = document.querySelector(".site-container");

      const width = document.documentElement.clientWidth;

      const containerBottom = container
        ? container.getBoundingClientRect().bottom + window.scrollY
        : document.body.offsetHeight;

      const height = Math.ceil(
        Math.max(
          document.documentElement.clientHeight,
          document.body.offsetHeight,
          containerBottom
        )
      );

      layer.style.height = `${height}px`;

      const changed =
        width !== previousWidth ||
        height !== previousHeight;

      previousWidth = width;
      previousHeight = height;

      return changed;
    }

    /* ========================================
       ABSTRACT IMAGE EXCHANGE
    ======================================== */

    function animateExchange() {
      exchangeAnimations.forEach(animation => animation.cancel());
      exchangeAnimations = [];

      const mobile = window.innerWidth <= 600;

      const low = mobile ? 0.30 : 0.34;
      const high = mobile ? 0.44 : 0.48;
      const middle = (low + high) / 2;

      faces.forEach((face, index) => {
        face.wrapper.style.opacity = middle;
        face.wrapper.style.zIndex = index === 0 ? "2" : "1";
        face.wrapper.style.filter = "blur(0.8px)";
      });

      faces[0].wrapper.style.transform = "translate(0, 0)";

      faces[1].wrapper.style.transform =
        `translate(${offsetX}px, ${offsetY}px)`;

      if (reducedMotion.matches) return;

      const timing = {
        duration: 10000,
        iterations: Infinity,
        easing: "linear"
      };

      exchangeAnimations.push(
        faces[0].wrapper.animate(
          [
            { opacity: high, offset: 0 },
            { opacity: middle, offset: 0.25 },
            { opacity: low, offset: 0.5 },
            { opacity: middle, offset: 0.75 },
            { opacity: high, offset: 1 }
          ],
          timing
        ),

        faces[1].wrapper.animate(
          [
            { opacity: low, offset: 0 },
            { opacity: middle, offset: 0.25 },
            { opacity: high, offset: 0.5 },
            { opacity: middle, offset: 0.75 },
            { opacity: low, offset: 1 }
          ],
          timing
        ),

        faces[0].wrapper.animate(
          [
            { zIndex: 2, offset: 0 },
            { zIndex: 2, offset: 0.2499 },
            { zIndex: 1, offset: 0.25 },
            { zIndex: 1, offset: 0.7499 },
            { zIndex: 2, offset: 0.75 },
            { zIndex: 2, offset: 1 }
          ],
          timing
        ),

        faces[1].wrapper.animate(
          [
            { zIndex: 1, offset: 0 },
            { zIndex: 1, offset: 0.2499 },
            { zIndex: 2, offset: 0.25 },
            { zIndex: 2, offset: 0.7499 },
            { zIndex: 1, offset: 0.75 },
            { zIndex: 1, offset: 1 }
          ],
          timing
        ),

        faces[0].wrapper.animate(
          [
            {
              transform: "translate(-4px, 2px)",
              filter: "blur(0.6px)",
              offset: 0
            },
            {
              transform: "translate(5px, -3px)",
              filter: "blur(1.2px)",
              offset: 0.5
            },
            {
              transform: "translate(-4px, 2px)",
              filter: "blur(0.6px)",
              offset: 1
            }
          ],
          timing
        ),

        faces[1].wrapper.animate(
          [
            {
              transform:
                `translate(${offsetX + 5}px, ${offsetY - 3}px)`,
              filter: "blur(1.2px)",
              offset: 0
            },
            {
              transform:
                `translate(${offsetX - 5}px, ${offsetY + 4}px)`,
              filter: "blur(0.6px)",
              offset: 0.5
            },
            {
              transform:
                `translate(${offsetX + 5}px, ${offsetY - 3}px)`,
              filter: "blur(1.2px)",
              offset: 1
            }
          ],
          timing
        )
      );

      const startTime = document.timeline.currentTime;

      exchangeAnimations.forEach(animation => {
        animation.startTime = startTime;
      });
    }

    /* ========================================
       MOVEMENT ACROSS THE FULL PAGE
    ======================================== */

    function transformAt(point, rotation) {
      return (
        `translate3d(${point.x}px, ${point.y}px, 0) ` +
        `rotate(${rotation}deg)`
      );
    }

    function outsidePoint(edge, width, height, imageWidth, imageHeight) {
      const margin = 100;

      switch (edge) {
        case 0:
          return {
            x: randomBetween(-imageWidth * 0.5, width),
            y: -imageHeight - margin
          };

        case 1:
          return {
            x: width + margin,
            y: randomBetween(0, Math.max(0, height - imageHeight))
          };

        case 2:
          return {
            x: randomBetween(-imageWidth * 0.5, width),
            y: height + margin
          };

        default:
          return {
            x: -imageWidth - margin,
            y: randomBetween(0, Math.max(0, height - imageHeight))
          };
      }
    }

    function sizePair() {
      const imageWidth = pair.clientWidth;

      const heights = faces.map(face =>
        imageWidth *
        face.image.naturalHeight /
        face.image.naturalWidth
      );

      pair.style.height =
        `${Math.max(heights[0], heights[1] + offsetY) + 10}px`;
    }

    function distance(a, b) {
      return Math.hypot(b.x - a.x, b.y - a.y);
    }

    async function startDrifting() {
      if (!ready) return;

      const currentGeneration = ++generation;

      movement?.cancel();

      updatePageSize();
      sizePair();

      const width = layer.clientWidth;
      const height = layer.clientHeight;

      const imageWidth = pair.offsetWidth + offsetX + 10;
      const imageHeight = pair.offsetHeight;

      if (reducedMotion.matches) {
        pair.style.transform = transformAt(
          {
            x: width * 0.6 - imageWidth * 0.5,
            y: Math.min(
              height - imageHeight,
              window.innerHeight * 0.4
            )
          },
          -4
        );

        pair.style.visibility = "visible";
        return;
      }

      let edge = Math.floor(Math.random() * 4);

      let start = outsidePoint(
        edge,
        width,
        height,
        imageWidth,
        imageHeight
      );

      let rotation = randomBetween(-8, 8);
      let firstPass = true;

      pair.style.transform = transformAt(start, rotation);
      pair.style.visibility = "visible";

      while (currentGeneration === generation) {
        const exitEdge = (
          edge + 1 + Math.floor(Math.random() * 3)
        ) % 4;

        const end = outsidePoint(
          exitEdge,
          width,
          height,
          imageWidth,
          imageHeight
        );

        const middle = {
          x: randomBetween(
            width * 0.15 - imageWidth * 0.5,
            width * 0.85 - imageWidth * 0.5
          ),
          y: randomBetween(
            0,
            Math.max(0, height - imageHeight)
          )
        };

        const firstDistance = distance(start, middle);
        const secondDistance = distance(middle, end);
        const totalDistance = firstDistance + secondDistance;

        // Keep a similar drifting speed even on a long résumé.
        const speed = randomBetween(30, 42);
        const duration = Math.max(
          24000,
          totalDistance / speed * 1000
        );

        const middleOffset = totalDistance > 0
          ? Math.max(
              0.01,
              Math.min(0.99, firstDistance / totalDistance)
            )
          : 0.5;

        const endRotation = randomBetween(-8, 8);

        movement = pair.animate(
          [
            {
              transform: transformAt(start, rotation),
              offset: 0
            },
            {
              transform: transformAt(
                middle,
                rotation +
                  (endRotation - rotation) * middleOffset
              ),
              offset: middleOffset
            },
            {
              transform: transformAt(end, endRotation),
              offset: 1
            }
          ],
          {
            duration,
            delay: firstPass
              ? randomBetween(0, 4000)
              : randomBetween(1000, 3000),
            easing: "linear",
            fill: "both"
          }
        );

        try {
          await movement.finished;
        } catch {
          return;
        }

        if (currentGeneration !== generation) return;

        start = end;
        edge = exitEdge;
        rotation = endRotation;
        firstPass = false;
      }
    }

    /* ========================================
       LOAD BOTH PORTRAITS
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
      animateExchange();
      startDrifting();
    });

    /* Update only when document dimensions change.
       Scrolling does not move or restart the portraits. */

    function scheduleLayoutCheck() {
      if (layoutFrame !== null) {
        cancelAnimationFrame(layoutFrame);
      }

      layoutFrame = requestAnimationFrame(() => {
        layoutFrame = null;

        const changed = updatePageSize();

        if (changed && ready) {
          startDrifting();
        }
      });
    }

    window.addEventListener("resize", scheduleLayoutCheck);

    const container = document.querySelector(".site-container");

    if (container && "ResizeObserver" in window) {
      const observer = new ResizeObserver(scheduleLayoutCheck);
      observer.observe(container);
    }

    if (document.fonts) {
      document.fonts.ready.then(scheduleLayoutCheck);
    }

    reducedMotion.addEventListener("change", () => {
      if (!ready) return;

      animateExchange();
      startDrifting();
    });

    updatePageSize();
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