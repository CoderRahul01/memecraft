/**
 * MemeCraft — Fast, Clean Meme Creator
 * Features: Freeform draggable multi-text, red marker annotations, and export controls.
 * Built by Rahul Pandey
 */

const TEMPLATES = [
  { id: 'drake', name: 'Drake', src: 'templates/drake.jpg' },
  { id: 'woman-cat', name: 'Woman Yelling at Cat', src: 'templates/woman-cat.jpg' },
  { id: 'fine', name: 'This is Fine', src: 'templates/fine.jpg' },
  { id: 'disastergirl', name: 'Disaster Girl', src: 'templates/disastergirl.jpg' },
  { id: 'doge', name: 'Doge', src: 'templates/doge.jpg' },
  { id: 'spongebob', name: 'Mocking Spongebob', src: 'templates/spongebob.jpg' },
  { id: 'rollsafe', name: 'Roll Safe', src: 'templates/rollsafe.jpg' },
  { id: 'fry', name: 'Futurama Fry', src: 'templates/fry.jpg' },
  { id: 'cmm', name: 'Change My Mind', src: 'templates/cmm.jpg' },
  { id: 'buzz', name: 'Buzz Everywhere', src: 'templates/buzz.jpg' }
];

const state = {
  currentTemplate: TEMPLATES[0],
  activeImage: null,
  layout: 'classic', // 'classic' | 'modern'
  activeTab: 'text', // 'text' | 'draw' | 'export'

  // Text layers
  texts: [
    { id: 't_1', text: 'TOP TEXT', x: 340, y: 24, fontSize: 38, isAllCaps: true, isTop: true },
    { id: 't_2', text: 'BOTTOM TEXT', x: 340, y: 440, fontSize: 38, isAllCaps: true, isBottom: true }
  ],
  selectedTextId: 't_1',
  headerCaption: '',
  headerFontSize: 32,

  // Drawing tool
  drawMode: false,
  penColor: '#ef4444',
  penSize: 6,
  strokes: [],

  // Export
  exportFormat: 'png', // 'png' | 'jpeg'
  jpegQuality: 0.85
};

// Interaction tracking
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let isDrawing = false;
let currentStroke = null;
let textBoundingBoxes = []; // Array of { id, minX, maxX, minY, maxY }

// DOM Elements
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const templateList = document.getElementById('templateList');
const imageInput = document.getElementById('imageInput');

// Tabs
const tabText = document.getElementById('tabText');
const tabDraw = document.getElementById('tabDraw');
const tabExport = document.getElementById('tabExport');
const paneText = document.getElementById('paneText');
const paneDraw = document.getElementById('paneDraw');
const paneExport = document.getElementById('paneExport');

// Text Layout Elements
const modeOverlay = document.getElementById('modeOverlay');
const modeHeader = document.getElementById('modeHeader');
const classicInputs = document.getElementById('classicInputs');
const modernInputs = document.getElementById('modernInputs');
const textLayersList = document.getElementById('textLayersList');
const btnAddText = document.getElementById('btnAddText');
const fontSizeRange = document.getElementById('fontSizeRange');
const fontSizeVal = document.getElementById('fontSizeVal');
const capsCheckbox = document.getElementById('capsCheckbox');
const captionText = document.getElementById('captionText');
const headerFontSizeRange = document.getElementById('headerFontSizeRange');
const headerFontSizeVal = document.getElementById('headerFontSizeVal');

// Draw Elements
const btnPenToggle = document.getElementById('btnPenToggle');
const btnPenSelect = document.getElementById('btnPenSelect');
const btnUndoStroke = document.getElementById('btnUndoStroke');
const btnClearStrokes = document.getElementById('btnClearStrokes');

// Export Elements
const fmtPng = document.getElementById('fmtPng');
const fmtJpg = document.getElementById('fmtJpg');
const jpegQualityGroup = document.getElementById('jpegQualityGroup');
const jpgQuality = document.getElementById('jpgQuality');
const jpgQualityVal = document.getElementById('jpgQualityVal');
const fileSizeEstimate = document.getElementById('fileSizeEstimate');

// General Actions
const btnCopy = document.getElementById('btnCopy');
const btnDownload = document.getElementById('btnDownload');
const btnClearAll = document.getElementById('btnClearAll');
const btnShareApp = document.getElementById('btnShareApp');
const canvasContainer = document.getElementById('canvasContainer');
const dropZone = document.getElementById('dropZone');
const toast = document.getElementById('toast');

// --- Initialization ---
function init() {
  renderTemplates();
  setupEvents();
  loadTemplate(TEMPLATES[0]);
}

function renderTemplates() {
  templateList.innerHTML = '';
  TEMPLATES.forEach((tmpl) => {
    const item = document.createElement('div');
    item.className = `template-item ${tmpl.id === state.currentTemplate?.id ? 'active' : ''}`;
    item.setAttribute('data-id', tmpl.id);
    item.setAttribute('title', tmpl.name);
    item.innerHTML = `<img src="${tmpl.src}" alt="${tmpl.name}" loading="lazy">`;
    item.addEventListener('click', () => loadTemplate(tmpl));
    templateList.appendChild(item);
  });
}

function loadTemplate(tmpl) {
  state.currentTemplate = tmpl;
  updateTemplateSelection();

  const img = new Image();
  img.src = tmpl.src;
  img.onload = () => {
    state.activeImage = img;
    // Adjust bottom text position to image aspect ratio
    const targetWidth = 680;
    const imgHeight = Math.round(targetWidth / (img.naturalWidth / img.naturalHeight));
    const bottomItem = state.texts.find((t) => t.isBottom);
    if (bottomItem) {
      bottomItem.y = imgHeight - 24;
      bottomItem.x = targetWidth / 2;
    }
    const topItem = state.texts.find((t) => t.isTop);
    if (topItem) {
      topItem.x = targetWidth / 2;
    }
    renderTextLayersList();
    render();
  };
}

function loadCustomImage(src) {
  const img = new Image();
  img.src = src;
  img.onload = () => {
    state.activeImage = img;
    state.currentTemplate = null;
    updateTemplateSelection();
    const targetWidth = 680;
    const imgHeight = Math.round(targetWidth / (img.naturalWidth / img.naturalHeight));
    const bottomItem = state.texts.find((t) => t.isBottom);
    if (bottomItem) {
      bottomItem.y = imgHeight - 24;
    }
    renderTextLayersList();
    render();
    showToast('Custom image loaded');
  };
}

function updateTemplateSelection() {
  document.querySelectorAll('.template-item').forEach((el) => {
    if (state.currentTemplate && el.dataset.id === state.currentTemplate.id) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
}

// --- Event Binding ---
function setupEvents() {
  // Main tool tabs
  tabText.addEventListener('click', () => switchTab('text'));
  tabDraw.addEventListener('click', () => switchTab('draw'));
  tabExport.addEventListener('click', () => switchTab('export'));

  // Format Switch
  modeOverlay.addEventListener('click', () => setLayout('classic'));
  modeHeader.addEventListener('click', () => setLayout('modern'));

  // Text inputs
  btnAddText.addEventListener('click', addNewTextLayer);
  fontSizeRange.addEventListener('input', (e) => {
    const size = parseInt(e.target.value, 10);
    fontSizeVal.textContent = `${size}px`;
    const selected = getSelectedText();
    if (selected) {
      selected.fontSize = size;
      render();
    }
  });

  capsCheckbox.addEventListener('change', (e) => {
    const selected = getSelectedText();
    if (selected) {
      selected.isAllCaps = e.target.checked;
      render();
    }
  });

  captionText.addEventListener('input', (e) => {
    state.headerCaption = e.target.value;
    render();
  });

  headerFontSizeRange.addEventListener('input', (e) => {
    state.headerFontSize = parseInt(e.target.value, 10);
    headerFontSizeVal.textContent = `${state.headerFontSize}px`;
    render();
  });

  // Pen tool
  btnPenToggle.addEventListener('click', () => setDrawMode(true));
  btnPenSelect.addEventListener('click', () => setDrawMode(false));
  btnUndoStroke.addEventListener('click', () => {
    state.strokes.pop();
    render();
    showToast('Stroke removed');
  });
  btnClearStrokes.addEventListener('click', () => {
    state.strokes = [];
    render();
    showToast('Drawings cleared');
  });

  document.querySelectorAll('.btn-size').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-size').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.penSize = parseInt(btn.dataset.size, 10);
    });
  });

  document.querySelectorAll('.btn-color').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-color').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.penColor = btn.dataset.color;
    });
  });

  // Export format
  fmtPng.addEventListener('click', () => setExportFormat('png'));
  fmtJpg.addEventListener('click', () => setExportFormat('jpeg'));
  jpgQuality.addEventListener('input', (e) => {
    state.jpegQuality = parseInt(e.target.value, 10) / 100;
    jpgQualityVal.textContent = `${e.target.value}%`;
    updateFileSizeEstimate();
  });

  // File upload
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => loadCustomImage(evt.target.result);
      reader.readAsDataURL(file);
    }
  });

  // Canvas pointer events (mouse & touch)
  setupCanvasInteractions();

  // Keyboard navigation
  window.addEventListener('keydown', handleKeydown);

  // Global actions
  btnCopy.addEventListener('click', copyImage);
  btnDownload.addEventListener('click', downloadImage);
  btnClearAll.addEventListener('click', resetAll);
  if (btnShareApp) btnShareApp.addEventListener('click', shareApp);

  // Clipboard paste (<kbd>Ctrl+V</kbd> / <kbd>⌘V</kbd>)
  window.addEventListener('paste', handlePaste);

  // Drag & drop
  setupDragAndDrop();
}

function switchTab(tab) {
  state.activeTab = tab;
  [tabText, tabDraw, tabExport].forEach((t) => t.classList.remove('active'));
  [paneText, paneDraw, paneExport].forEach((p) => p.classList.add('hidden'));

  if (tab === 'text') {
    tabText.classList.add('active');
    paneText.classList.remove('hidden');
    setDrawMode(false);
  } else if (tab === 'draw') {
    tabDraw.classList.add('active');
    paneDraw.classList.remove('hidden');
    setDrawMode(true);
  } else if (tab === 'export') {
    tabExport.classList.add('active');
    paneExport.classList.remove('hidden');
    setDrawMode(false);
    updateFileSizeEstimate();
  }
}

function setDrawMode(enabled) {
  state.drawMode = enabled;
  if (enabled) {
    btnPenToggle.classList.add('active');
    btnPenSelect.classList.remove('active');
    canvas.classList.add('cursor-draw');
    canvas.classList.remove('cursor-move', 'cursor-moving');
  } else {
    btnPenSelect.classList.add('active');
    btnPenToggle.classList.remove('active');
    canvas.classList.remove('cursor-draw');
  }
  render();
}

function setLayout(layout) {
  state.layout = layout;
  if (layout === 'classic') {
    modeOverlay.classList.add('active');
    modeHeader.classList.remove('active');
    classicInputs.classList.remove('hidden');
    modernInputs.classList.add('hidden');
    // If header caption has content, sync to overlay texts
    if (state.headerCaption.trim()) {
      const parts = state.headerCaption.split('\n').map((p) => p.trim()).filter(Boolean);
      if (parts.length === 1) {
        if (state.texts[0]) state.texts[0].text = parts[0];
      } else if (parts.length >= 2) {
        if (state.texts[0]) state.texts[0].text = parts[0];
        if (state.texts[1]) state.texts[1].text = parts.slice(1).join(' ');
      }
      renderTextLayersList();
    }
  } else {
    modeHeader.classList.add('active');
    modeOverlay.classList.remove('active');
    modernInputs.classList.remove('hidden');
    classicInputs.classList.add('hidden');
    if (!state.headerCaption.trim()) {
      state.headerCaption = state.texts.map((t) => t.text.trim()).filter(Boolean).join('\n');
      captionText.value = state.headerCaption;
    }
  }
  render();
}

function setExportFormat(format) {
  state.exportFormat = format;
  if (format === 'png') {
    fmtPng.classList.add('active');
    fmtJpg.classList.remove('active');
    jpegQualityGroup.classList.add('hidden');
  } else {
    fmtJpg.classList.add('active');
    fmtPng.classList.remove('active');
    jpegQualityGroup.classList.remove('hidden');
  }
  updateFileSizeEstimate();
}

// --- Text Layer Management ---
function getSelectedText() {
  return state.texts.find((t) => t.id === state.selectedTextId) || state.texts[0];
}

function selectText(id) {
  state.selectedTextId = id;
  const item = state.texts.find((t) => t.id === id);
  if (item) {
    fontSizeRange.value = item.fontSize;
    fontSizeVal.textContent = `${item.fontSize}px`;
    capsCheckbox.checked = item.isAllCaps;
  }
  renderTextLayersList();
  render();
}

function addNewTextLayer() {
  const targetWidth = 680;
  const imgHeight = canvas.height > 0 ? canvas.height : 400;
  const newId = 't_' + Date.now();
  const newItem = {
    id: newId,
    text: 'NEW CAPTION',
    x: targetWidth / 2,
    y: Math.round(imgHeight / 2),
    fontSize: 34,
    isAllCaps: true
  };
  state.texts.push(newItem);
  selectText(newId);
  showToast('Text layer added');
}

function deleteTextLayer(id, e) {
  if (e) e.stopPropagation();
  if (state.texts.length <= 1) {
    showToast('At least one text layer required');
    return;
  }
  state.texts = state.texts.filter((t) => t.id !== id);
  if (state.selectedTextId === id) {
    state.selectedTextId = state.texts[0]?.id || null;
  }
  renderTextLayersList();
  render();
}

function renderTextLayersList() {
  textLayersList.innerHTML = '';
  state.texts.forEach((item, index) => {
    const el = document.createElement('div');
    el.className = `text-layer-item ${item.id === state.selectedTextId ? 'active' : ''}`;
    el.innerHTML = `
      <span class="layer-handle" title="Click to select">⋮⋮</span>
      <input type="text" class="layer-input" value="${item.text}" placeholder="Enter text..." autocomplete="off">
      <button type="button" class="btn-layer-del" title="Delete layer" aria-label="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    el.addEventListener('click', () => selectText(item.id));

    const input = el.querySelector('.layer-input');
    input.addEventListener('input', (e) => {
      item.text = e.target.value;
      render();
    });
    input.addEventListener('focus', () => selectText(item.id));

    const delBtn = el.querySelector('.btn-layer-del');
    delBtn.addEventListener('click', (e) => deleteTextLayer(item.id, e));

    textLayersList.appendChild(el);
  });
}

// --- Canvas Interactions (Drag & Draw) ---
function setupCanvasInteractions() {
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  // Pointer Down
  function onDown(e) {
    const pos = getPos(e);

    if (state.drawMode) {
      isDrawing = true;
      currentStroke = {
        color: state.penColor,
        size: state.penSize,
        points: [pos]
      };
      return;
    }

    if (state.layout === 'modern') return;

    // Check hit on text bounding boxes (top-to-bottom in render order)
    const hit = findHitText(pos.x, pos.y);
    if (hit) {
      selectText(hit.id);
      isDragging = true;
      dragOffset = { x: pos.x - hit.x, y: pos.y - hit.y };
      canvas.classList.add('cursor-moving');
      canvas.focus();
      e.preventDefault();
    }
  }

  // Pointer Move
  function onMove(e) {
    if (isDrawing || isDragging) {
      if (e.cancelable) e.preventDefault();
    }
    const pos = getPos(e);

    if (isDrawing && currentStroke) {
      currentStroke.points.push(pos);
      render();
      return;
    }

    if (isDragging) {
      const selected = getSelectedText();
      if (selected) {
        selected.x = Math.round(pos.x - dragOffset.x);
        selected.y = Math.round(pos.y - dragOffset.y);
        render();
      }
      return;
    }

    // Hover state for cursor
    if (!state.drawMode && state.layout === 'classic') {
      const hit = findHitText(pos.x, pos.y);
      if (hit) {
        canvas.classList.add('cursor-move');
      } else {
        canvas.classList.remove('cursor-move');
      }
    }
  }

  // Pointer Up
  function onUp() {
    if (isDrawing && currentStroke) {
      if (currentStroke.points.length > 1) {
        state.strokes.push(currentStroke);
      }
      currentStroke = null;
      isDrawing = false;
      render();
    }

    if (isDragging) {
      isDragging = false;
      canvas.classList.remove('cursor-moving');
    }
  }

  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  canvas.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onUp);
}

function findHitText(x, y) {
  // Check in reverse order so uppermost text is selected first
  for (let i = textBoundingBoxes.length - 1; i >= 0; i--) {
    const b = textBoundingBoxes[i];
    const pad = 12;
    if (x >= b.minX - pad && x <= b.maxX + pad && y >= b.minY - pad && y <= b.maxY + pad) {
      return state.texts.find((t) => t.id === b.id);
    }
  }
  return null;
}

function handleKeydown(e) {
  // If user is currently typing in an input or textarea, don't hijack keys
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  const selected = getSelectedText();
  if (!selected) return;

  const step = e.shiftKey ? 10 : 2;

  if (e.key === 'ArrowUp') {
    selected.y -= step;
    render();
    e.preventDefault();
  } else if (e.key === 'ArrowDown') {
    selected.y += step;
    render();
    e.preventDefault();
  } else if (e.key === 'ArrowLeft') {
    selected.x -= step;
    render();
    e.preventDefault();
  } else if (e.key === 'ArrowRight') {
    selected.x += step;
    render();
    e.preventDefault();
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (state.texts.length > 1) {
      deleteTextLayer(selected.id);
      e.preventDefault();
    }
  }
}

// --- Main Canvas Rendering Engine ---
function render() {
  if (!state.activeImage) return;

  const img = state.activeImage;
  const targetWidth = 680;
  const aspectRatio = img.naturalWidth / img.naturalHeight;
  const imgHeight = Math.round(targetWidth / aspectRatio);

  textBoundingBoxes = [];

  if (state.layout === 'modern') {
    // Header Box Mode
    let text = state.headerCaption;
    const fontSize = state.headerFontSize;
    const lineHeight = Math.round(fontSize * 1.3);
    const padX = 24;
    const padY = 20;
    const maxTextWidth = targetWidth - (padX * 2);

    ctx.font = `600 ${fontSize}px Inter, -apple-system, sans-serif`;
    const lines = text ? wrapText(ctx, text, maxTextWidth) : [];
    const textHeight = lines.length ? lines.length * lineHeight : 0;
    const headerHeight = lines.length ? textHeight + (padY * 2) : 0;

    canvas.width = targetWidth;
    canvas.height = headerHeight + imgHeight;

    if (headerHeight > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, headerHeight);

      ctx.fillStyle = '#111827';
      ctx.font = `600 ${fontSize}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      let y = padY;
      lines.forEach((line) => {
        ctx.fillText(line, padX, y);
        y += lineHeight;
      });
    }

    ctx.drawImage(img, 0, headerHeight, targetWidth, imgHeight);

    // Draw strokes over image
    drawAllStrokes(headerHeight);

  } else {
    // Overlay Mode (Freeform Draggable Multi-Text)
    canvas.width = targetWidth;
    canvas.height = imgHeight;

    ctx.drawImage(img, 0, 0, targetWidth, imgHeight);

    // 1. Draw annotation strokes underneath or over image
    drawAllStrokes(0);

    // 2. Draw text layers
    state.texts.forEach((item) => {
      let displayText = item.text;
      if (item.isAllCaps) displayText = displayText.toUpperCase();
      if (!displayText.trim()) return;

      const fontSize = item.fontSize;
      const lineHeight = Math.round(fontSize * 1.15);
      const strokeWidth = Math.max(3, Math.round(fontSize / 7));

      ctx.font = `900 ${fontSize}px Impact, -apple-system, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = strokeWidth;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const maxLineWidth = targetWidth - 24;
      const lines = wrapText(ctx, displayText, maxLineWidth);
      const totalBlockHeight = lines.length * lineHeight;

      let startY = item.y - (totalBlockHeight / 2) + (lineHeight / 2);
      let maxW = 0;

      lines.forEach((line) => {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxW) maxW = metrics.width;
        ctx.strokeText(line, item.x, startY);
        ctx.fillText(line, item.x, startY);
        startY += lineHeight;
      });

      // Calculate Bounding Box
      const box = {
        id: item.id,
        minX: item.x - (maxW / 2),
        maxX: item.x + (maxW / 2),
        minY: item.y - (totalBlockHeight / 2),
        maxY: item.y + (totalBlockHeight / 2)
      };
      textBoundingBoxes.push(box);

      // Draw subtle selection outline for active text
      if (item.id === state.selectedTextId && !state.drawMode) {
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 139, 253, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(box.minX - 6, box.minY - 4, (box.maxX - box.minX) + 12, (box.maxY - box.minY) + 8);
        ctx.restore();
      }
    });
  }

  updateFileSizeEstimate();
}

function drawAllStrokes(offsetY = 0) {
  const all = [...state.strokes];
  if (currentStroke) all.push(currentStroke);

  all.forEach((stroke) => {
    if (stroke.points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y + offsetY);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y + offsetY);
    }
    ctx.stroke();
    ctx.restore();
  });
}

function wrapText(context, text, maxWidth) {
  if (!text) return [];

  const paragraphs = text.split('\n');
  const lines = [];

  paragraphs.forEach((para) => {
    if (!para.trim()) {
      lines.push('');
      return;
    }
    const words = para.split(' ');
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const test = currentLine + ' ' + word;
      if (context.measureText(test).width > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);
  });

  return lines;
}

// --- Export & Size Calculation ---
function updateFileSizeEstimate() {
  if (!canvas.width || !canvas.height) return;

  const mime = state.exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
  const quality = state.exportFormat === 'jpeg' ? state.jpegQuality : undefined;

  canvas.toBlob((blob) => {
    if (!blob) return;
    const kb = (blob.size / 1024).toFixed(1);
    const label = state.exportFormat.toUpperCase();
    const discordNote = blob.size < 8 * 1024 * 1024 ? 'Fits Discord limit' : 'Large file';
    fileSizeEstimate.textContent = `${label} • ${kb} KB (${discordNote})`;
  }, mime, quality);
}

async function copyImage() {
  try {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        showToast('Could not create image blob');
        return;
      }
      if (navigator.clipboard?.write && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          showToast('Image copied to clipboard');
          return;
        } catch {}
      }
      downloadImage();
      showToast('Downloaded to device');
    }, 'image/png');
  } catch {
    downloadImage();
  }
}

function downloadImage() {
  const mime = state.exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
  const ext = state.exportFormat === 'jpeg' ? 'jpg' : 'png';
  const quality = state.exportFormat === 'jpeg' ? state.jpegQuality : undefined;

  canvas.toBlob((blob) => {
    if (!blob) {
      showToast('Could not generate image');
      return;
    }
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `memecraft-${Date.now()}.${ext}`;
    link.href = blobUrl;
    link.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
    showToast(`Downloaded as ${ext.toUpperCase()}`);
  }, mime, quality);
}

function resetAll() {
  state.texts = [
    { id: 't_1', text: 'TOP TEXT', x: 340, y: 24, fontSize: 38, isAllCaps: true, isTop: true },
    { id: 't_2', text: 'BOTTOM TEXT', x: 340, y: 440, fontSize: 38, isAllCaps: true, isBottom: true }
  ];
  state.strokes = [];
  state.headerCaption = '';
  captionText.value = '';
  renderTextLayersList();
  render();
  showToast('Reset to default');
}

async function shareApp() {
  const shareData = {
    title: 'MemeCraft',
    text: 'Check out MemeCraft — a fast, clean meme generator',
    url: window.location.href
  };

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return;
    } catch {}
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('App link copied to clipboard');
      return;
    } catch {}
  }
  showToast('Link: ' + window.location.href);
}

// --- Drag and Drop / Paste Handlers ---
function handlePaste(e) {
  const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
  if (!items) return;
  for (let item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = (evt) => loadCustomImage(evt.target.result);
      reader.readAsDataURL(file);
      e.preventDefault();
      break;
    }
  }
}

function setupDragAndDrop() {
  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      canvasContainer.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      canvasContainer.classList.remove('drag-over');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    canvasContainer.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (evt) => loadCustomImage(evt.target.result);
      reader.readAsDataURL(files[0]);
    }
  });
}

// --- Toast Feedback ---
let toastTimeout = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

document.addEventListener('DOMContentLoaded', init);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}