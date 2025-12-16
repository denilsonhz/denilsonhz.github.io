/**
 * ASCII image configuration
 */
const CONFIG = {
  imageUrl: "images/tree.png",
  cols: 200,
  fontPx: 3.2,
  charAspect: 1.2,
  densitySymbols: [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@", "&", "▒", "░"]
};

/**
 * Brightness → density symbol
 */
function getSymbolIndex(brightness) {
  return Math.round(
    (1 - brightness / 255) * (CONFIG.densitySymbols.length - 1)
  );
}

function createSymbol(char, fontPx) {
  const div = document.createElement("div");
  div.className = "symbol";
  div.textContent = char;
  div.style.fontSize = fontPx + "px";
  return div;
}

/**
 * Render an image as ASCII into a specific wrapper/container.
 */
async function renderAsciiTo({
  wrapperId,
  containerId,
  imageUrl,
  extraScale = 1,
  colsOverride = null
}) {
  const wrapper = document.getElementById(wrapperId);
  const container = document.getElementById(containerId);
  if (!wrapper || !container) return;

  container.classList.remove("is-ready");

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl;

  await new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = resolve;
  });

  if (!img.naturalWidth) {
    container.classList.add("is-ready");
    console.error("Failed to load:", imageUrl);
    return;
  }

  const isMobile = window.matchMedia("(max-width: 600px)").matches;

  const cols = colsOverride ?? CONFIG.cols;
  const fontPx = isMobile ? 2.6 : CONFIG.fontPx;
  const imgAspect = img.naturalHeight / img.naturalWidth;

  const rows = Math.max(
    1,
    Math.round(cols * imgAspect * (1 / CONFIG.charAspect))
  );

  wrapper.style.gridTemplateColumns = `repeat(${cols}, ${fontPx}px)`;
  wrapper.innerHTML = "";

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  canvas.width = cols;
  canvas.height = rows;
  ctx.drawImage(img, 0, 0, cols, rows);

  const data = ctx.getImageData(0, 0, cols, rows).data;
  const frag = document.createDocumentFragment();

  for (let i = 0; i < rows * cols; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const brightness = (r + g + b) / 3;
    const char = CONFIG.densitySymbols[getSymbolIndex(brightness)];
    frag.appendChild(createSymbol(char, fontPx));
  }

  wrapper.appendChild(frag);

  wrapper.style.transform = "none";
  wrapper.style.transformOrigin = "top left";

  const rect = wrapper.getBoundingClientRect();
  const padding = 24;

  const scaleX = (window.innerWidth - padding * 2) / rect.width;
  const scaleY = (window.innerHeight - padding * 2) / rect.height;

  const baseScale = Math.min(scaleX, scaleY, 1);
  const scale = baseScale * extraScale;

  wrapper.style.transform = `scale(${scale})`;

  container.style.width = `${rect.width * scale}px`;
  container.style.height = `${rect.height * scale}px`;

  requestAnimationFrame(() => {
    container.classList.add("is-ready");
  });
}

/**
 * Render BOTH images
 */
function renderAll() {
  const isMobile = window.matchMedia("(max-width: 600px)").matches;

  return Promise.allSettled([
    // Tree (original resolution)
    renderAsciiTo({
      wrapperId: "art-wrapper",
      containerId: "container",
      imageUrl: CONFIG.imageUrl
    }),

    // Second image (higher detail, mobile-safe)
    renderAsciiTo({
      wrapperId: "art-wrapper-2",
      containerId: "container-2",
      imageUrl: "images/mountain.png",
      extraScale: isMobile ? 1 : 1,
      colsOverride: isMobile ? 300 : 350
    })
  ]);
}

let resizeTimer = null;

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    renderAll().catch(console.error);
  }, 150);
});

/* Start once DOM is ready */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    renderAll().catch(console.error);
  });
} else {
  renderAll().catch(console.error);
}
