const state = {
  images: [],
  watermarkMode: "text",
  watermarkImage: null,
  watermarkImagePosition: {
    xRatio: 0.78,
    yRatio: 0.78,
  },
  watermarkTextPosition: {
    xRatio: 0.78,
    yRatio: 0.78,
  },
  watermarkRects: [],
  draggingWatermark: null,
  rendered: false,
};

const els = {
  fileInput: document.querySelector("#fileInput"),
  dropzone: document.querySelector("#dropzone"),
  imageList: document.querySelector("#imageList"),
  clearBtn: document.querySelector("#clearBtn"),
  renderBtn: document.querySelector("#renderBtn"),
  downloadBtn: document.querySelector("#downloadBtn"),
  canvas: document.querySelector("#previewCanvas"),
  emptyPreview: document.querySelector("#emptyPreview"),
  canvasInfo: document.querySelector("#canvasInfo"),
  widthMode: document.querySelector("#widthMode"),
  customWidthField: document.querySelector("#customWidthField"),
  customWidth: document.querySelector("#customWidth"),
  borderStyle: document.querySelector("#borderStyle"),
  borderWidth: document.querySelector("#borderWidth"),
  borderColor: document.querySelector("#borderColor"),
  watermarkEnabled: document.querySelector("#watermarkEnabled"),
  textModeBtn: document.querySelector("#textModeBtn"),
  imageModeBtn: document.querySelector("#imageModeBtn"),
  textWatermarkFields: document.querySelector("#textWatermarkFields"),
  imageWatermarkFields: document.querySelector("#imageWatermarkFields"),
  watermarkText: document.querySelector("#watermarkText"),
  fontSize: document.querySelector("#fontSize"),
  textColor: document.querySelector("#textColor"),
  textAngle: document.querySelector("#textAngle"),
  watermarkImage: document.querySelector("#watermarkImage"),
  watermarkPreview: document.querySelector("#watermarkPreview"),
  watermarkPreviewImg: document.querySelector("#watermarkPreviewImg"),
  watermarkPreviewInfo: document.querySelector("#watermarkPreviewInfo"),
  watermarkWidth: document.querySelector("#watermarkWidth"),
  watermarkCount: document.querySelector("#watermarkCount"),
  watermarkPosition: document.querySelector("#watermarkPosition"),
  opacity: document.querySelector("#opacity"),
  opacityValue: document.querySelector("#opacityValue"),
  margin: document.querySelector("#margin"),
};

const ctx = els.canvas.getContext("2d");

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        id: crypto.randomUUID(),
        file,
        url,
        img,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`无法读取图片：${file.name}`));
    };
    img.src = url;
  });
}

async function addFiles(fileList) {
  const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;

  const loaded = await Promise.all(files.map(loadImageFile));
  state.images.push(...loaded);
  state.rendered = false;
  renderQueue();
  updateButtons();
}

function renderQueue() {
  els.imageList.innerHTML = "";

  state.images.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "image-item";
    li.innerHTML = `
      <img class="thumb" src="${item.url}" alt="" />
      <div class="item-meta">
        <div class="item-name" title="${item.file.name}">${item.file.name}</div>
        <div class="item-size">${item.width} x ${item.height}px · ${formatBytes(item.file.size)}</div>
        <div class="item-tools">
          <button type="button" data-action="up" data-index="${index}" ${index === 0 ? "disabled" : ""} title="上移">↑</button>
          <button type="button" data-action="down" data-index="${index}" ${index === state.images.length - 1 ? "disabled" : ""} title="下移">↓</button>
          <button type="button" data-action="remove" data-index="${index}" title="删除">删除</button>
        </div>
      </div>
    `;
    els.imageList.appendChild(li);
  });
}

function updateButtons() {
  const hasImages = state.images.length > 0;
  els.clearBtn.disabled = !hasImages;
  els.renderBtn.disabled = !hasImages;
  els.downloadBtn.disabled = !state.rendered;
}

function refreshPreviewIfReady() {
  state.rendered = false;
  if (state.images.length) {
    renderLongImage();
    return;
  }
  updateButtons();
}

function swapImages(from, to) {
  const moving = state.images[from];
  state.images.splice(from, 1);
  state.images.splice(to, 0, moving);
  state.rendered = false;
  renderQueue();
  updateButtons();
}

function clearImages() {
  state.images.forEach((item) => URL.revokeObjectURL(item.url));
  state.images = [];
  state.rendered = false;
  ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
  els.canvas.removeAttribute("width");
  els.canvas.removeAttribute("height");
  els.emptyPreview.classList.remove("hidden");
  els.canvasInfo.textContent = "未生成";
  renderQueue();
  updateButtons();
}

function getWatermarkSettings() {
  return {
    enabled: els.watermarkEnabled.checked,
    mode: state.watermarkMode,
    text: els.watermarkText.value.trim() || "Watermark",
    fontSize: Number(els.fontSize.value) || 56,
    textColor: els.textColor.value,
    textAngle: clamp(Number(els.textAngle.value) || 0, -180, 180),
    imageWidth: Number(els.watermarkWidth.value) || 240,
    count: clamp(Number(els.watermarkCount.value) || 1, 1, 200),
    position: els.watermarkPosition.value,
    opacity: Number(els.opacity.value) / 100,
    margin: Number(els.margin.value) || 0,
  };
}

function getBorderSettings() {
  const style = els.borderStyle.value;
  return {
    style,
    width: style === "none" ? 0 : clamp(Number(els.borderWidth.value) || 0, 0, 240),
    color: els.borderColor.value,
  };
}

function getPlacement(contentWidth, contentHeight, settings, canvasWidth, canvasHeight) {
  const margin = settings.margin;
  const placements = {
    "top-left": [margin, margin],
    "top-right": [canvasWidth - contentWidth - margin, margin],
    "bottom-left": [margin, canvasHeight - contentHeight - margin],
    "bottom-right": [canvasWidth - contentWidth - margin, canvasHeight - contentHeight - margin],
    center: [(canvasWidth - contentWidth) / 2, (canvasHeight - contentHeight) / 2],
  };
  return placements[settings.position] || placements["bottom-right"];
}

function drawSolidBorder(border, width, height) {
  ctx.fillStyle = border.color;
  ctx.fillRect(0, 0, width, height);
}

function drawRainbowBorder(width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#f26b8a");
  gradient.addColorStop(0.22, "#f6c453");
  gradient.addColorStop(0.46, "#4fc3a1");
  gradient.addColorStop(0.7, "#4f86f7");
  gradient.addColorStop(1, "#a66cff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawDotsBorder(border, width, height) {
  drawRainbowBorder(width, height);
  const colors = ["#ffffff", "#ffe66d", "#ff7aa2", "#7bdff2", "#b2f7b8"];
  const radius = Math.max(4, Math.min(18, border.width / 4));
  const step = Math.max(radius * 3, border.width * 0.75);
  ctx.save();
  for (let x = border.width / 2; x < width; x += step) {
    [border.width / 2, height - border.width / 2].forEach((y, offset) => {
      ctx.fillStyle = colors[(Math.floor(x / step) + offset) % colors.length];
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  for (let y = border.width / 2; y < height; y += step) {
    [border.width / 2, width - border.width / 2].forEach((x, offset) => {
      ctx.fillStyle = colors[(Math.floor(y / step) + offset + 2) % colors.length];
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();
}

function drawCandyBorder(border, width, height) {
  ctx.fillStyle = "#fff7fb";
  ctx.fillRect(0, 0, width, height);

  const colors = ["#f26b8a", "#f6c453", "#4fc3a1", "#4f86f7"];
  const stripe = Math.max(14, border.width / 2);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, border.width);
  ctx.rect(0, height - border.width, width, border.width);
  ctx.rect(0, 0, border.width, height);
  ctx.rect(width - border.width, 0, border.width, height);
  ctx.clip();
  ctx.rotate((-18 * Math.PI) / 180);
  for (let x = -height; x < width + height; x += stripe) {
    ctx.fillStyle = colors[Math.abs(Math.floor(x / stripe)) % colors.length];
    ctx.fillRect(x, -height, stripe / 2, width + height * 2);
  }
  ctx.restore();
}

function drawBorder(border, width, height) {
  if (!border.width) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (border.style === "solid") drawSolidBorder(border, width, height);
  if (border.style === "rainbow") drawRainbowBorder(width, height);
  if (border.style === "dots") drawDotsBorder(border, width, height);
  if (border.style === "candy") drawCandyBorder(border, width, height);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(border.width, border.width, width - border.width * 2, height - border.width * 2);
}

function drawTextWatermark(settings) {
  const font = `${settings.fontSize}px "Microsoft YaHei", "PingFang SC", Arial, sans-serif`;
  ctx.font = font;
  ctx.textBaseline = "top";
  ctx.fillStyle = settings.textColor;
  ctx.globalAlpha = settings.opacity;

  const metrics = ctx.measureText(settings.text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(settings.fontSize * 1.25);
  const angle = (settings.textAngle * Math.PI) / 180;
  const boundsWidth = Math.ceil(
    Math.abs(Math.cos(angle)) * textWidth + Math.abs(Math.sin(angle)) * textHeight,
  );
  const boundsHeight = Math.ceil(
    Math.abs(Math.sin(angle)) * textWidth + Math.abs(Math.cos(angle)) * textHeight,
  );

  function drawAt(x, y) {
    const centerX = x + boundsWidth / 2;
    const centerY = y + boundsHeight / 2;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.fillText(settings.text, -textWidth / 2, -textHeight / 2);
    ctx.restore();
  }

  if (settings.position === "tile") {
    const gapX = Math.max(boundsWidth * 2.2, 320);
    const gapY = Math.max(boundsHeight * 3, 220);
    for (let y = -boundsHeight; y < els.canvas.height + boundsHeight; y += gapY) {
      for (let x = -boundsWidth; x < els.canvas.width + boundsWidth; x += gapX) {
        drawAt(x, y);
      }
    }
    return;
  }

  const maxX = Math.max(0, els.canvas.width - boundsWidth);
  const maxY = Math.max(0, els.canvas.height - boundsHeight);
  let x;
  let y;

  if (settings.position === "custom") {
    x = Math.round(maxX * state.watermarkTextPosition.xRatio);
    y = Math.round(maxY * state.watermarkTextPosition.yRatio);
  } else {
    [x, y] = getPlacement(boundsWidth, boundsHeight, settings, els.canvas.width, els.canvas.height);
    x = clamp(x, 0, maxX);
    y = clamp(y, 0, maxY);
  }

  if (settings.count === 1) {
    drawAt(x, y);
    state.watermarkRects.push({ x, y, width: boundsWidth, height: boundsHeight });
    return;
  }

  const startY = settings.position === "custom" ? y : clamp(settings.margin, 0, maxY);
  const availableY = Math.max(0, maxY - startY);
  const stepY = settings.count > 1 ? availableY / (settings.count - 1) : 0;

  for (let index = 0; index < settings.count; index += 1) {
    const rectY = Math.round(startY + stepY * index);
    drawAt(x, rectY);
    state.watermarkRects.push({ x, y: rectY, width: boundsWidth, height: boundsHeight });
  }
}

function drawImageWatermark(settings) {
  if (!state.watermarkImage) return;

  const source = state.watermarkImage;
  const width = Math.min(settings.imageWidth, els.canvas.width);
  const height = Math.round((width / source.naturalWidth) * source.naturalHeight);
  ctx.globalAlpha = settings.opacity;

  if (settings.position === "tile") {
    const gapX = Math.max(width * 1.8, 320);
    const gapY = Math.max(height * 2.2, 240);
    for (let y = settings.margin; y < els.canvas.height; y += gapY) {
      for (let x = settings.margin; x < els.canvas.width; x += gapX) {
        ctx.drawImage(source, x, y, width, height);
      }
    }
    return;
  }

  const count = settings.count;
  const maxX = Math.max(0, els.canvas.width - width);
  const maxY = Math.max(0, els.canvas.height - height);
  let x;
  let y;

  if (settings.position === "custom") {
    x = Math.round(maxX * state.watermarkImagePosition.xRatio);
    y = Math.round(maxY * state.watermarkImagePosition.yRatio);
  } else {
    [x, y] = getPlacement(width, height, settings, els.canvas.width, els.canvas.height);
    x = clamp(x, 0, maxX);
    y = clamp(y, 0, maxY);
  }

  if (count === 1) {
    ctx.drawImage(source, x, y, width, height);
    state.watermarkRects.push({ x, y, width, height });
    return;
  }

  const startY = settings.position === "custom" ? y : clamp(settings.margin, 0, maxY);
  const availableY = Math.max(0, maxY - startY);
  const stepY = count > 1 ? availableY / (count - 1) : 0;

  for (let index = 0; index < count; index += 1) {
    const rectY = Math.round(startY + stepY * index);
    ctx.drawImage(source, x, rectY, width, height);
    state.watermarkRects.push({ x, y: rectY, width, height });
  }
}

function drawWatermark() {
  state.watermarkRects = [];
  const settings = getWatermarkSettings();
  if (!settings.enabled) return;

  ctx.save();
  if (settings.mode === "image") {
    drawImageWatermark(settings);
  } else {
    drawTextWatermark(settings);
  }
  ctx.restore();
}

function getLayout() {
  const widths = state.images.map((item) => item.width);
  const mode = els.widthMode.value;
  let canvasWidth = Math.max(...widths);

  if (mode === "fit-min") {
    canvasWidth = Math.min(...widths);
  }

  if (mode === "custom") {
    canvasWidth = Math.max(100, Number(els.customWidth.value) || Math.min(...widths));
  }

  const items = state.images.map((item) => {
    let drawWidth = item.width;

    if (mode === "fit-min" || mode === "fit-max" || mode === "custom") {
      drawWidth = canvasWidth;
    }

    const scale = drawWidth / item.width;
    const drawHeight = Math.round(item.height * scale);

    return {
      item,
      drawWidth,
      drawHeight,
      scale,
      x: Math.floor((canvasWidth - drawWidth) / 2),
    };
  });

  return {
    width: canvasWidth,
    height: items.reduce((sum, entry) => sum + entry.drawHeight, 0),
    items,
  };
}

function renderLongImage() {
  if (!state.images.length) return;

  const border = getBorderSettings();
  const layout = getLayout();
  const width = layout.width + border.width * 2;
  const height = layout.height + border.width * 2;
  const items = layout.items;
  els.canvas.width = width;
  els.canvas.height = height;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.clearRect(0, 0, width, height);
  drawBorder(border, width, height);

  let y = border.width;
  items.forEach(({ item, drawWidth, drawHeight, x }) => {
    ctx.drawImage(item.img, x + border.width, y, drawWidth, drawHeight);
    y += drawHeight;
  });

  drawWatermark();
  state.rendered = true;
  els.emptyPreview.classList.add("hidden");
  els.canvasInfo.textContent = `${width} x ${height}px · ${state.images.length} 张`;
  updateButtons();
}

function downloadCanvas() {
  if (!state.rendered) return;

  els.canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `long-image-${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function getCanvasPoint(event) {
  const rect = els.canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * els.canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * els.canvas.height,
  };
}

function findWatermarkRect(point) {
  for (let index = state.watermarkRects.length - 1; index >= 0; index -= 1) {
    const rect = state.watermarkRects[index];
    const insideX = point.x >= rect.x && point.x <= rect.x + rect.width;
    const insideY = point.y >= rect.y && point.y <= rect.y + rect.height;
    if (insideX && insideY) return rect;
  }
  return null;
}

function startWatermarkDrag(event) {
  if (
    !els.watermarkEnabled.checked ||
    (state.watermarkMode === "image" && !state.watermarkImage) ||
    !state.watermarkRects.length
  ) {
    return;
  }

  const point = getCanvasPoint(event);
  const rect = findWatermarkRect(point);
  if (!rect) return;

  els.watermarkPosition.value = "custom";
  state.draggingWatermark = {
    mode: state.watermarkMode,
    offsetX: point.x - rect.x,
    offsetY: point.y - rect.y,
    width: rect.width,
    height: rect.height,
  };
  els.canvas.setPointerCapture(event.pointerId);
  els.canvas.classList.add("dragging-watermark");
  event.preventDefault();
}

function moveWatermarkDrag(event) {
  if (!state.draggingWatermark) return;

  const point = getCanvasPoint(event);
  const drag = state.draggingWatermark;
  const maxX = Math.max(0, els.canvas.width - drag.width);
  const maxY = Math.max(0, els.canvas.height - drag.height);
  const x = clamp(point.x - drag.offsetX, 0, maxX);
  const y = clamp(point.y - drag.offsetY, 0, maxY);

  const position =
    state.draggingWatermark.mode === "text"
      ? state.watermarkTextPosition
      : state.watermarkImagePosition;
  position.xRatio = maxX ? x / maxX : 0;
  position.yRatio = maxY ? y / maxY : 0;
  renderLongImage();
}

function stopWatermarkDrag(event) {
  if (!state.draggingWatermark) return;
  state.draggingWatermark = null;
  els.canvas.classList.remove("dragging-watermark");
  if (els.canvas.hasPointerCapture(event.pointerId)) {
    els.canvas.releasePointerCapture(event.pointerId);
  }
}

function setWatermarkMode(mode) {
  state.watermarkMode = mode;
  els.textModeBtn.classList.toggle("active", mode === "text");
  els.imageModeBtn.classList.toggle("active", mode === "image");
  els.textWatermarkFields.classList.toggle("hidden", mode !== "text");
  els.imageWatermarkFields.classList.toggle("hidden", mode !== "image");
  refreshPreviewIfReady();
}

function updateWidthMode() {
  els.customWidthField.classList.toggle("hidden", els.widthMode.value !== "custom");
  refreshPreviewIfReady();
}

els.fileInput.addEventListener("change", (event) => {
  addFiles(event.target.files);
  event.target.value = "";
});

els.dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  els.dropzone.classList.add("dragover");
});

els.dropzone.addEventListener("dragleave", () => {
  els.dropzone.classList.remove("dragover");
});

els.dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  els.dropzone.classList.remove("dragover");
  addFiles(event.dataTransfer.files);
});

els.imageList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const index = Number(button.dataset.index);
  if (button.dataset.action === "up" && index > 0) swapImages(index, index - 1);
  if (button.dataset.action === "down" && index < state.images.length - 1) {
    swapImages(index, index + 1);
  }
  if (button.dataset.action === "remove") {
    URL.revokeObjectURL(state.images[index].url);
    state.images.splice(index, 1);
    state.rendered = false;
    renderQueue();
    updateButtons();
  }
});

els.clearBtn.addEventListener("click", clearImages);
els.renderBtn.addEventListener("click", renderLongImage);
els.downloadBtn.addEventListener("click", downloadCanvas);
els.canvas.addEventListener("pointerdown", startWatermarkDrag);
els.canvas.addEventListener("pointermove", moveWatermarkDrag);
els.canvas.addEventListener("pointerup", stopWatermarkDrag);
els.canvas.addEventListener("pointercancel", stopWatermarkDrag);
els.widthMode.addEventListener("change", updateWidthMode);
els.textModeBtn.addEventListener("click", () => setWatermarkMode("text"));
els.imageModeBtn.addEventListener("click", () => setWatermarkMode("image"));

els.watermarkImage.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const loaded = await loadImageFile(file);
  if (state.watermarkImage?.src?.startsWith("blob:")) {
    URL.revokeObjectURL(state.watermarkImage.src);
  }
  state.watermarkImage = loaded.img;
  state.watermarkMode = "image";
  els.watermarkEnabled.checked = true;
  els.textModeBtn.classList.remove("active");
  els.imageModeBtn.classList.add("active");
  els.textWatermarkFields.classList.add("hidden");
  els.imageWatermarkFields.classList.remove("hidden");
  els.watermarkPreviewImg.src = loaded.url;
  els.watermarkPreviewInfo.textContent = `${loaded.width} x ${loaded.height}px · ${formatBytes(file.size)}`;
  els.watermarkPreview.classList.remove("hidden");
  refreshPreviewIfReady();
});

els.opacity.addEventListener("input", () => {
  els.opacityValue.textContent = `${els.opacity.value}%`;
});

document.querySelectorAll(".settings input, .settings select").forEach((control) => {
  control.addEventListener("input", () => {
    refreshPreviewIfReady();
  });
});

updateButtons();
updateWidthMode();
