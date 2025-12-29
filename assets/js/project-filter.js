// assets/js/project-filter.js
document.addEventListener("DOMContentLoaded", () => {
  const controls = document.querySelectorAll("[data-filter]");
  const items = Array.from(document.querySelectorAll(".project-item"));
  const grid = document.querySelector(".projects-grid");

  if (!controls.length || !items.length) return;

  // Let the grid host absolutely-positioned "leaving" clones
  if (grid && !grid.style.position) grid.style.position = "relative";

  const DURATION_MS = 300;

  function setActive(clicked) {
    controls.forEach((c) => c.classList.remove("active"));
    clicked.classList.add("active");
  }

  function getTags(el) {
    return (el.getAttribute("data-tags") || "")
      .toLowerCase()
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function isHighlight(el) {
    return (el.getAttribute("data-highlight") || "").toLowerCase() === "true";
  }

  function shouldShow(el, filter) {
    if (filter === "all") return true;
    if (filter === "highlights") return isHighlight(el);
    return getTags(el).includes(filter.toLowerCase());
  }

  function rectMap(els) {
    const map = new Map();
    els.forEach((el) => map.set(el, el.getBoundingClientRect()));
    return map;
  }

  function makeLeavingClone(el) {
    if (!grid) return;

    const gridRect = grid.getBoundingClientRect();
    const r = el.getBoundingClientRect();

    const clone = el.cloneNode(true);
    clone.classList.add("leaving-clone");
    clone.style.position = "absolute";
    clone.style.margin = "0";
    clone.style.left = `${r.left - gridRect.left}px`;
    clone.style.top = `${r.top - gridRect.top}px`;
    clone.style.width = `${r.width}px`;
    clone.style.height = `${r.height}px`;
    clone.style.pointerEvents = "none";
    clone.style.zIndex = "5";

    grid.appendChild(clone);

    requestAnimationFrame(() => clone.classList.add("leaving"));
    window.setTimeout(() => clone.remove(), DURATION_MS + 60);
  }

  function filterTo(filter) {
    const currentlyVisible = items.filter((el) => el.style.display !== "none");
    const first = rectMap(currentlyVisible);

    // Hide: remove from flow immediately, animate a clone out
    items.forEach((el) => {
      const show = shouldShow(el, filter);
      const isVisible = el.style.display !== "none";
      if (!show && isVisible) {
        makeLeavingClone(el);
        el.style.display = "none";
      }
    });

    // Show: add to flow, animate in
    items.forEach((el) => {
      const show = shouldShow(el, filter);
      const isVisible = el.style.display !== "none";
      if (show && !isVisible) {
        el.classList.add("entering");
        el.style.display = "";
      }
    });

    const nowVisible = items.filter((el) => el.style.display !== "none");
    const last = rectMap(nowVisible);

    // FLIP: animate moved items
    nowVisible.forEach((el) => {
      const a = first.get(el);
      const b = last.get(el);
      if (!a || !b) return;

      const dx = a.left - b.left;
      const dy = a.top - b.top;

      if (dx || dy) {
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.style.transition = "transform 0s";
        requestAnimationFrame(() => {
          el.style.transition = `transform ${DURATION_MS}ms ease`;
          el.style.transform = "";
        });
      }
    });

    // Finish enter animation
    requestAnimationFrame(() => {
      nowVisible.forEach((el) => el.classList.remove("entering"));
    });
  }

  controls.forEach((control) => {
    control.addEventListener("click", () => {
      const filter = control.getAttribute("data-filter") || "all";
      setActive(control);
      filterTo(filter);
    });
  });

  const defaultBtn = document.querySelector('[data-filter="highlights"]');
  if (defaultBtn) defaultBtn.click();
});