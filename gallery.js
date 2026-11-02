(() => {
  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    return items;
  }

  function loadImage(source) {
    return new Promise(resolve => {
      const image = new Image();
      let finished = false;

      // Move on if a file takes too long to respond.
      const timer = setTimeout(() => finish(null), 10000);

      function finish(result) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        image.onload = null;
        image.onerror = null;
        resolve(result);
      }

      image.onload = () => {
        finish(image.naturalWidth > 0 ? image : null);
      };

      image.onerror = () => finish(null);
      image.decoding = "async";
      image.src = source;
    });
  }

  async function fillGallery(gallery) {
    const total = Number(gallery.dataset.total);
    const prefix = gallery.dataset.prefix || "";
    const extension = gallery.dataset.extension || "png";
    const positions = ["start", "center", "end"];

    const numbers = shuffle(
      Array.from({ length: total }, (_, index) => index + 1)
    );

    // Reserve three positions so loading does not rearrange the page.
    const frames = Array.from({ length: 3 }, () => {
      const frame = document.createElement("figure");
      frame.className = "photo-frame";

      frame.style.setProperty(
        "--photo-width",
        `${85 + Math.floor(Math.random() * 16)}%`
      );

      frame.style.setProperty(
        "--photo-height",
        `${75 + Math.floor(Math.random() * 21)}%`
      );

      frame.style.setProperty(
        "--horizontal",
        positions[Math.floor(Math.random() * positions.length)]
      );

      frame.style.setProperty(
        "--vertical",
        positions[Math.floor(Math.random() * positions.length)]
      );

      gallery.appendChild(frame);
      return frame;
    });

    let nextNumber = 0;
    let loadedCount = 0;

    // Each position keeps trying unused numbers until one loads.
    async function fillFrame(frame) {
      while (nextNumber < numbers.length) {
        const number = numbers[nextNumber++];
        const source = `${prefix}${number}.${extension}`;
        const image = await loadImage(source);

        if (!image) continue;

        image.alt = prefix
          ? `Marra project photograph ${number}`
          : `Selected work, image ${number}`;

        frame.appendChild(image);
        loadedCount++;
        return;
      }

      frame.remove();
    }

    await Promise.all(frames.map(fillFrame));
    gallery.setAttribute("aria-busy", "false");

    if (loadedCount === 0) {
      const message = document.createElement("p");
      message.className = "gallery-message";
      message.textContent =
        "Photos could not be loaded. Please check the image filenames and folder.";
      gallery.appendChild(message);
    }
  }

  document.querySelectorAll("[data-gallery]").forEach(fillGallery);
})();