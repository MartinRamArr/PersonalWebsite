(() => {
  "use strict";

  function initializePortraits() {
    if (!document.getElementById("tab-resume")) return;
    if (document.getElementById("floating-portraits")) return;

    // Remove the previous single-portrait layout.
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

      .floating-portrait {
        position: absolute;
        top: 0;
        left: 0;

        width: clamp(150px, 25vw, 380px);
        margin: 0;
        padding: 0;

        background: transparent !important;
        border: 0;
        box-shadow: none;

        opacity: 0.56;
        mix-blend-mode: screen;
        pointer-events: none;

        will-change: transform;
      }

      .floating-portrait img {
        display: block;
        width: 100%;
        height: auto;

        background: transparent !important;
        border: 0;
        box-shadow: none;

        animation:
          floating-portrait-color
          var(--color-duration, 30s)
          linear
          infinite;

        animation-delay: var(--color-delay, 0s);
      }

      @keyframes floating-portrait-color {
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
        .floating-portrait {
          width: clamp(130px, 44vw, 210px);
          opacity: 0.48;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .floating-portrait img {
          animation: none;
        }
      }
    `;

    document.head.appendChild(style);

    const layer = document.createElement("div");

    layer.id = "floating-portraits";
    layer.setAttribute("aria-hidden", "true");

    document.body.appendChild(layer);

    const sources = [
      "MarioHeadshot1.png",
      "MarioHeadshot2.png"
    ];

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const portraits = sources.map((source, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "floating-portrait";

      const image = document.createElement("img");

      image.alt = "";
      image.decoding = "async";
      image.draggable = false;

      wrapper.style.setProperty(
        "--color-duration",
        index === 0 ? "28s" : "36s"
      );

      wrapper.style.setProperty(
        "--color-delay",
        `${-Math.random() * 30}s`
      );

      wrapper.appendChild(image);
      layer.appendChild(wrapper);

      const portrait = {
        wrapper,
        animation: null,
        index
      };

      image.addEventListener("load", () => {
        animatePortrait(portrait);
      });

      image.src = source;

      return portrait;
    });

    function animatePortrait(portrait) {
      const { wrapper, index } = portrait;

      portrait.animation?.cancel();

      const width = layer.clientWidth;
      const height = layer.clientHeight;

      const portraitWidth = wrapper.offsetWidth;
      const portraitHeight = wrapper.offsetHeight;

      const navigation = document.querySelector(".top-nav");
      const navBottom = navigation
        ? navigation.getBoundingClientRect().bottom
        : 0;

      // Keep the portraits below the navigation when possible.
      const minY = Math.max(10, navBottom + 15);
      const maxX = Math.max(0, width - portraitWidth);
      const maxY = Math.max(0, height - portraitHeight);

      const startY = Math.min(minY, maxY);

      function position(xFraction, yFraction, rotation) {
        const x = xFraction * maxX;
        const y = startY + yFraction * (maxY - startY);

        return {
          transform:
            `translate3d(${x}px, ${y}px, 0) ` +
            `rotate(${rotation}deg)`
        };
      }

      if (reducedMotion.matches) {
        wrapper.style.transform = position(
          index === 0 ? 0.45 : 0.62,
          index === 0 ? 0.3 : 0.45,
          index === 0 ? -5 : 6
        ).transform;

        return;
      }

      const random = () => Math.random();

      // Both paths pass through the middle, allowing overlap.
      const points = [
        position(
          index === 0 ? 0.08 : 0.88,
          index === 0 ? 0.12 : 0.7,
          index === 0 ? -8 : 8
        ),

        position(0.35 + random() * 0.2, 0.3, -4),

        position(0.45 + random() * 0.15, 0.45, 5),

        position(
          index === 0 ? 0.9 : 0.12,
          0.65 + random() * 0.2,
          index === 0 ? 10 : -10
        ),

        position(0.35 + random() * 0.3, 0.5, -5),

        position(
          index === 0 ? 0.08 : 0.88,
          index === 0 ? 0.12 : 0.7,
          index === 0 ? -8 : 8
        )
      ];

      portrait.animation = wrapper.animate(points, {
        duration: index === 0 ? 52000 : 61000,
        iterations: Infinity,
        easing: "linear"
      });
    }

    let resizeFrame = null;

    function updatePortraits() {
      if (resizeFrame !== null) {
        cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;

        portraits.forEach(portrait => {
          const image = portrait.wrapper.querySelector("img");

          if (image.complete && image.naturalWidth > 0) {
            animatePortrait(portrait);
          }
        });
      });
    }

    window.addEventListener("resize", updatePortraits);

    reducedMotion.addEventListener("change", updatePortraits);

    if (document.fonts) {
      document.fonts.ready.then(updatePortraits);
    }
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