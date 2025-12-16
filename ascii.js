/**
 * ASCII image configuration
 */
const CONFIG = {
  imageUrl: "images/tree.png", 
  cols: 200,                   
  fontPx: 3.2,                   
  charAspect: 1.2,             
  densitySymbols: [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@", "&", "▒", "░"]
  /** 
  [" ", ".", ",", "-", "+", "(", "/", "*", "#", "&", "%", "@", "█", "="]
  */
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

async function renderAscii() {
  const wrapper = document.getElementById("art-wrapper");
  if (!wrapper) return;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = CONFIG.imageUrl;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () =>
      reject(new Error("Failed to load image. Check imageUrl."));
  });

  const isMobile = window.matchMedia("(max-width: 600px)").matches;
  const cols = CONFIG.cols;                 // keep same detail everywhere
  const fontPx = isMobile ? 2.6 : CONFIG.fontPx;  // smaller chars on mobile
  const imgAspect = img.naturalHeight / img.naturalWidth;

  // Correct for non-square characters
  const rows = Math.max(
    1,
    Math.round(cols * imgAspect * (1 / CONFIG.charAspect))
  );

  // Configure grid columns
  wrapper.style.gridTemplateColumns = `repeat(${cols}, ${fontPx}px)`;
  wrapper.innerHTML = "";

  // Draw image to small canvas
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

  // ---- Fit-to-viewport scaling (scale wrapper so container can be translated in CSS) ----
  const container = document.getElementById("container");

  // Reset wrapper transform for accurate measurement
  wrapper.style.transform = "none";
  wrapper.style.transformOrigin = "top left";

  const rect = wrapper.getBoundingClientRect();
  const padding = 24;

  const scaleX = (window.innerWidth - padding * 2) / rect.width;
  const scaleY = (window.innerHeight - padding * 2) / rect.height;

  // Don’t upscale above 1
  const scale = Math.min(scaleX, scaleY, 1);

  // Apply scale to the wrapper (NOT the container)
  wrapper.style.transform = `scale(${scale})`;

  // Shrink container footprint so you don't get unnecessary scrolling
  container.style.width = `${rect.width * scale}px`;
  container.style.height = `${rect.height * scale}px`;
}

let resizeTimer = null;

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    renderAscii().catch(console.error);
  }, 150);
});

/* Start once DOM is ready */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderAscii);
} else {
  renderAscii();
}
