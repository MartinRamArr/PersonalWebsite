(() => {
  const siteHeader = document.querySelector(".site-header");
  const siteTitle = document.querySelector(".site-title");

  // Preserve the vertically stacked name.
  if (siteTitle) {
    const name = siteTitle.textContent.trim();

    siteTitle.setAttribute("aria-label", name);
    siteTitle.textContent = "";

    for (const character of name) {
      const span = document.createElement("span");
      span.textContent = character === " " ? "\u00A0" : character;
      span.setAttribute("aria-hidden", "true");
      siteTitle.appendChild(span);
    }
  }

  // Preserve the sidebar's scroll effect.
  function updateSidebar() {
    if (siteHeader) {
      siteHeader.classList.toggle("dimmed", window.scrollY > 40);
    }
  }

  window.addEventListener("scroll", updateSidebar, { passive: true });
  window.addEventListener("pageshow", updateSidebar);
  updateSidebar();

  const totalJpgs = 353;
  const totalPngs = 85;

  // Homepage artwork only runs on Home.
  const artImage = document.getElementById("dynamic-artwork");
  const artFrame = document.querySelector(".artwork-frame");

  if (artImage && artFrame) {
    const useJpg = Math.random() > 0.25;
    const total = useJpg ? totalJpgs : totalPngs;
    const extension = useJpg ? "jpg" : "png";
    const number = Math.floor(Math.random() * total) + 1;

    artImage.src = `${number}.${extension}`;

    const effects = [
      "effect-photocopy",
      "effect-risograph",
      "effect-grain",
      "effect-halftone"
    ];

    artFrame.classList.add(
      effects[Math.floor(Math.random() * effects.length)]
    );
  }

  // Archive logic only runs on Images.
  const canvas = document.getElementById("images-canvas");
  const loadMoreButton = document.getElementById("load-more-btn");

  if (!canvas) return;

  const imagePool = [];

  for (let i = 1; i <= totalJpgs; i++) {
    imagePool.push(`${i}.jpg`);
  }

  for (let i = 1; i <= totalPngs; i++) {
    imagePool.push(`${i}.png`);
  }

  for (let i = imagePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [imagePool[i], imagePool[j]] = [imagePool[j], imagePool[i]];
  }

  let currentTop = 50;
  let topLayer = 10;

  function makeDraggable(element) {
    let previousX = 0;
    let previousY = 0;
    let activePointer = null;

    element.addEventListener("pointerdown", event => {
      if (!event.isPrimary) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

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

      wrapper.style.setProperty("--rot", `${Math.random() * 16 - 8}deg`);
      wrapper.style.setProperty("--drift-x", `${Math.random() * 20 - 10}px`);
      wrapper.style.setProperty("--drift-y", `${Math.random() * 20 - 10}px`);
      wrapper.style.setProperty("--drift-rot", `${Math.random() * 4 - 2}deg`);
      wrapper.style.setProperty(
        "--drift-duration",
        `${5 + Math.random() * 5}s`
      );

      const image = document.createElement("img");
      const source = imagePool.pop();

      image.loading = "lazy";
      image.decoding = "async";
      image.alt = `Archive image ${source}`;
      image.src = source;
      image.draggable = false;

      wrapper.appendChild(image);
      canvas.appendChild(wrapper);
      makeDraggable(wrapper);

      currentTop += width * 0.75 + Math.random() * 60;
    }

    canvas.style.height = `${currentTop + 300}px`;

    if (loadMoreButton) {
      loadMoreButton.hidden = imagePool.length === 0;
      loadMoreButton.style.display =
        imagePool.length === 0 ? "none" : "";
    }
  }

  if (loadMoreButton) {
    loadMoreButton.addEventListener("click", () => renderBatch(15));
  }

  renderBatch(20);
})();