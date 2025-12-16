/**
 * ASCII image configuration
 */
const CONFIG = {
  imageUrl: "images/tree.png", 
  cols: 180,                   
  fontPx: 4,                   
  charAspect: 1.4,             
  densitySymbols: [" ", ".", ",", "-", "+", "(", "/", "*", "#", "&", "%", "@", "█", "="]
};

/**
 * Brightness → density symbol
 */
function getSymbolIndex(brightness) {
  return Math.round(
    (1 - brightness / 255) * (CONFIG.densitySymbols.length - 1)
  );
}

function createSymbol(char) {
  const div = document.createElement("div");
  div.className = "symbol";
  div.textContent = char;
  div.style.fontSize = CONFIG.fontPx + "px";
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

  const cols = CONFIG.cols;
  const imgAspect = img.naturalHeight / img.naturalWidth;

  // Correct for non-square characters
  const rows = Math.max(
    1,
    Math.round(cols * imgAspect * (1 / CONFIG.charAspect))
  );

  // Configure grid columns
  wrapper.style.gridTemplateColumns = `repeat(${cols}, ${CONFIG.fontPx}px)`;
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
    frag.appendChild(createSymbol(char));
  }

  wrapper.appendChild(frag);
}

/* Start once DOM is ready */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderAscii);
} else {
  renderAscii();
}
