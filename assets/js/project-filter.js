/* ==============================
    Filter Projects by Category
   ============================== */
document.addEventListener("DOMContentLoaded", () => {
  const filtersEl = document.getElementById("projectFilters");
  const toggle = document.getElementById("projectFiltersToggle");
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

      // 2. SMART EXPAND LOGIC
      // If the menu is currently collapsed (showing "More")...
      if (toggle && filtersEl) {
        const isExpanded = toggle.getAttribute("aria-expanded") === "true";
      
        if (!isExpanded) {
          const containerTop = filter.offsetTop;
          const buttonTop = control.offsetTop;
          
          if (buttonTop - containerTop > 50) {
            toggle.click(); 
          }
        }
      }

      // 3. Re-calculate layout
      if (typeof resize === "function") {
        resize();
      }
    });
  });
});

/* ==============================
   Collapsible filter bar logic
   ============================== */

document.addEventListener("DOMContentLoaded", () => {
  const filters = document.getElementById("projectFilters");
  const toggle = document.getElementById("projectFiltersToggle");
  const divider = document.getElementById("projectFiltersDivider");

  if (!filters || !toggle || !divider) return;

  function getFirstRowHeight() {
    const buttons = Array.from(filters.querySelectorAll(".filter-btn"));
    if (!buttons.length) return 0;

    // We need the position of the container itself to normalize coordinates
    const containerTop = filters.offsetTop;
    const firstBtnTop = buttons[0].offsetTop;
    
    let maxBottomRelative = 0;

    for (const btn of buttons) {
      if (Math.abs(btn.offsetTop - firstBtnTop) < 15) {
        
        const bottomRelative = (btn.offsetTop - containerTop) + btn.offsetHeight;
        
        if (bottomRelative > maxBottomRelative) {
          maxBottomRelative = bottomRelative;
        }
      } else {
        break; // Stop once we hit a new row
      }
    }
    return maxBottomRelative;
  }

  function resize() {
    const buttons = filters.querySelectorAll(".filter-btn");
    if (buttons.length === 0) return;

    // 1. Reset to natural height for measurement
    filters.style.maxHeight = "none";
    
    // 2. Measure wrapping
    const firstBtn = buttons[0];
    const lastBtn = buttons[buttons.length - 1];
    const isWrapping = lastBtn.offsetTop > (firstBtn.offsetTop + 10);

    if (isWrapping) {
      toggle.classList.remove("d-none");
      divider.classList.remove("d-none");

      const isExpanded = toggle.getAttribute("aria-expanded") === "true";

      if (isExpanded) {
        filters.style.maxHeight = filters.scrollHeight + "px";
        
        toggle.innerHTML = '<i class="bi bi-chevron-up"></i> less';
        
      } else {
        const rowHeight = getFirstRowHeight();
        filters.style.overflow = "hidden"; 
        filters.style.maxHeight = (rowHeight + 10) + "px";
        
        toggle.innerHTML = 'more <i class="bi bi-chevron-down"></i>';
      }
    } else {
      // Single row mode
      toggle.classList.add("d-none");
      divider.classList.add("d-none");
      filters.style.maxHeight = "none";
      filters.style.overflow = "visible"; 
    }
  }

  toggle.addEventListener("click", () => {
    const isExpanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", !isExpanded);
    resize();
  });

  window.addEventListener("resize", resize);
  window.addEventListener("load", () => setTimeout(resize, 100));
  
  // Initial run
  resize();
});