(() => {
  "use strict";

  function initializePortraits() {
    if (!document.getElementById("tab-resume")) return;
    if (document.getElementById("floating-portraits")) return;

    document.querySelector(".resume-intro")?.remove();

    const style = document.createElement("style");

    style.textContent = `
      #floating-portraits {
        position: fixed;
        inset: 0;
        z-index: 10;

        overflow: hidden;
        pointer-events: none;
      }

      .portrait-pair {
        position: absolute;
        top: 0;
        left: 0;

        width: clamp(85px, 13.5vw, 205px);
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
          width: clamp(80px, 24vw, 120px);
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

    const faces = sources.map((source, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "portrait-face";

      const image = document.createElement("img");

      image.alt = "";
      image.draggable = false;
      image.decoding = "async";

      wrapper.appendChild(image);
      pair.appendChild(wrapper);

      return { wrapper, image, source, index };
    });

    layer.appendChild(pair);
    document.body.appendChild(layer);

    const offsetX = 18 + Math.random() * 24;
    const offsetY = 12 + Math.random() * 20;

    faces[1].wrapper.style.transform =
      `translate(${offsetX}px, ${offsetY}px)`;

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
    let resizeTimer = null;

    function randomBetween(minimum, maximum) {
      return minimum + Math.random() * (maximum - minimum);
    }

    /* ========================================
       GRADUALLY EXCHANGE THE FRONT PORTRAIT
    ======================================== */

    function animateExchange() {
      exchangeAnimations.forEach(animation => animation.cancel());
      exchangeAnimations = [];

      const mobile = window.innerWidth <= 600;

      const strongOpacity = mobile ? 0.54 : 0.62;
      const softOpacity = mobile ? 0.24 : 0.28;

      faces[0].wrapper.style.opacity = strongOpacity;
      faces[0].wrapper.style.zIndex = "2";

      faces[1].wrapper.style.opacity = softOpacity;
      faces[1].wrapper.style.zIndex = "1";

      if (reducedMotion.matches) return;

      const firstOpacity = faces[0].wrapper.animate(
        [
          { opacity: strongOpacity, offset: 0 },
          { opacity: strongOpacity, offset: 0.18 },
          { opacity: 0, offset: 0.42 },
          { opacity: 0, offset: 0.48 },
          { opacity: softOpacity, offset: 0.62 },
          { opacity: softOpacity, offset: 0.78 },
          { opacity: strongOpacity, offset: 1 }
        ],
        {
          duration: 24000,
          iterations: Infinity,
          easing: "linear"
        }
      );

      const secondOpacity = faces[1].wrapper.animate(
        [
          { opacity: softOpacity, offset: 0 },
          { opacity: softOpacity, offset: 0.18 },
          { opacity: strongOpacity, offset: 0.42 },
          { opacity: strongOpacity, offset: 0.62 },
          { opacity: 0, offset: 0.84 },
          { opacity: 0, offset: 0.9 },
          { opacity: softOpacity, offset: 1 }
        ],
        {
          duration: 24000,
          iterations: Infinity,
          easing: "linear"
        }
      );

      const firstStack = faces[0].wrapper.animate(
        [
          { zIndex: 2, offset: 0 },
          { zIndex: 2, offset: 0.4499 },
          { zIndex: 1, offset: 0.45 },
          { zIndex: 1, offset: 0.8699 },
          { zIndex: 2, offset: 0.87 },
          { zIndex: 2, offset: 1 }
        ],
        {
          duration: 24000,
          iterations: Infinity,
          easing: "linear"
        }
      );

      const secondStack = faces[1].wrapper.animate(
        [
          { zIndex: 1, offset: 0 },
          { zIndex: 1, offset: 0.4499 },
          { zIndex: 2, offset: 0.45 },
          { zIndex: 2, offset: 0.8699 },
          { zIndex: 1, offset: 0.87 },
          { zIndex: 1, offset: 1 }
        ],
        {
          duration: 24000,
          iterations: Infinity,
          easing: "linear"
        }
      );

      exchangeAnimations = [
        firstOpacity,
        secondOpacity,
        firstStack,
        secondStack
      ];

      const startTime = document.timeline.currentTime;

      exchangeAnimations.forEach(animation => {
        animation.startTime = startTime;
      });
    }

    /* ========================================
       PAIR MOVEMENT
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
            y: randomBetween(-imageHeight * 0.5, height)
          };

        case 2:
          return {
            x: randomBetween(-imageWidth * 0.5, width),
            y: height + margin
          };

        default:
          return {
            x: -imageWidth - margin,
            y: randomBetween(-imageHeight * 0.5, height)
          };
      }
    }

    function sizePair() {
      const imageWidth = pair.clientWidth;

      const heights = faces.map(face => {
        const image = face.image;

        return image.naturalWidth
          ? imageWidth * image.naturalHeight / image.naturalWidth
          : 0;
      });

      pair.style.height =
        `${Math.max(heights[0], heights[1] + offsetY)}px`;
    }

    async function startDrifting() {
      if (!ready) return;

      const currentGeneration = ++generation;

      movement?.cancel();
      sizePair();

      const width = layer.clientWidth;
      const height = layer.clientHeight;

      const imageWidth = pair.offsetWidth + offsetX;
      const imageHeight = pair.offsetHeight;

      if (reducedMotion.matches) {
        pair.style.transform = transformAt(
          {
            x: width * 0.6 - imageWidth * 0.5,
            y: height * 0.4 - imageHeight * 0.5
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
            height * 0.2 - imageHeight * 0.5,
            height * 0.8 - imageHeight * 0.5
          )
        };

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
                (rotation + endRotation) / 2
              ),
              offset: 0.5
            },
            {
              transform: transformAt(end, endRotation),
              offset: 1
            }
          ],
          {
            duration: randomBetween(42000, 65000),
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

      animateExchange();
      startDrifting();
    });

    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {
        if (!ready) return;

        animateExchange();
        startDrifting();
      }, 180);
    });

    reducedMotion.addEventListener("change", () => {
      if (!ready) return;

      animateExchange();
      startDrifting();
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