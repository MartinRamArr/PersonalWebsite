(() => {
  "use strict";

  function initializeSectionTheme() {
    const section = document.querySelector(
      "#tab-portfolio, #tab-resume, #tab-images"
    );

    if (!section) return;

    document.body.classList.add("section-theme");

    // Remove the name and any elements from the previous theme.
    document.querySelectorAll(
      ".site-header, .section-backdrop, .section-shapes"
    ).forEach(element => {
      element.remove();
    });

    // Keep the current navigation item consistent.
    const currentPages = {
      "tab-portfolio": "portfolio.html",
      "tab-resume": "resume.html",
      "tab-images": "images.html"
    };

    const currentPage = currentPages[section.id];

    document.querySelectorAll(".top-nav .nav-tab").forEach(link => {
      const destination = new URL(
        link.getAttribute("href"),
        window.location.href
      );

      const filename = destination.pathname.split("/").pop();
      const active = filename === currentPage;

      link.classList.toggle("active", active);

      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeSectionTheme,
      { once: true }
    );
  } else {
    initializeSectionTheme();
  }
})();