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

        width: clamp(170px, 27vw, 410px);
        margin: 0;
        padding: 0;

        background: transparent;
        pointer-events: none;

        visibility: hidden;
        will-change: transform;
      }

      .portrait-pair img {
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
          var(--color-duration, 32s)
          linear
          infinite;

        animation-delay: var(--color-delay, 0s);
      }

      .portrait-pair .portrait-shadow {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 0;

        opacity: 0.3;

        transform:
          translate(
            var(--shadow-x, 24px),
            var(--shadow-y, 18px)
          );
      }

      .portrait-pair .portrait-main {
        position: relative;
        z-index: 1;

        opacity: 0.62;
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

        .portrait-pair .portrait-main {
          opacity: 0.54;
        }

        .portrait-pair .portrait-shadow {
          opacity: 0.27;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .portrait-pair img {
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

    const main = document.createElement("img");
    main.className = "portrait-main";
    main.alt = "";
    main.draggable = false;
    main.decoding = "async";

    const shadow = document.createElement("img");
    shadow.className = "portrait-shadow";
    shadow.alt = "";
    shadow.draggable = false;
    shadow.decoding = "async";

    pair.style.setProperty(
      "--shadow-x",
      `${18 + Math.random() * 24}px`
    );

    pair.style.setProperty(
      "--shadow-y",
      `${12 + Math.random() * 20}px`
    );

    const colorStart = Math.random() * 32;

    main.style.setProperty("--color-duration", "32s");
    shadow.style.setProperty("--color-duration", "32s");

    main.style.setProperty(
      "--color-delay",
      `${-colorStart}s`
    );

    // A different tint, moving at the same rate.
    shadow.style.setProperty(
      "--color-delay",
      `${-(colorStart + 10)}s`
    );

    pair.append(shadow, main);
    layer.appendChild(pair);
    document.body.appendChild(layer);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let animation = null;
    let generation = 0;
    let ready = false;
    let resizeTimer = null;

    function randomBetween(minimum, maximum) {
      return minimum + Math.random() * (maximum - minimum);
    }

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

    async function startDrifting() {
      if (!ready) return;

      const currentGeneration = ++generation;

      animation?.cancel();

      const width = layer.clientWidth;
      const height = layer.clientHeight;

      const imageWidth = pair.offsetWidth;
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
        // Exit through another edge.
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

        animation = pair.animate(
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
            duration: randomBetween(55000, 85000),
            delay: firstPass
              ? randomBetween(0, 7000)
              : randomBetween(1500, 5000),
            easing: "linear",
            fill: "both"
          }
        );

        try {
          await animation.finished;
        } catch {
          return;
        }

        if (currentGeneration !== generation) return;

        // The next pass begins where the pair just left.
        start = end;
        edge = exitEdge;
        rotation = endRotation;
        firstPass = false;
      }
    }

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

    Promise.all([
      loadImage(main, sources[0]),
      loadImage(shadow, sources[1])
    ]).then(results => {
      if (!results[0]) {
        layer.remove();
        return;
      }

      if (!results[1]) {
        shadow.remove();
      }

      ready = true;
      startDrifting();
    });

    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(startDrifting, 180);
    });

    reducedMotion.addEventListener("change", startDrifting);
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