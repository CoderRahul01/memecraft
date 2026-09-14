/**
 * MemeCraft — Fast, Clean Meme Creator
 * Features:
 * - Freeform draggable multi-text
 * - Image & logo overlays (draggable, resizable, flippable)
 * - Red marker / annotation drawing
 * - Lossless PNG and compact JPEG export with live size preview
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
  activeTab: 'text', // 'text' | 'overlay' | 'draw' | 'export'

  // Text layers
  texts: [
    { id: 't_1', text: 'TOP TEXT', x: 340, y: 24, fontSize: 38, isAllCaps: true, isTop: true },
    { id: 't_2', text: 'BOTTOM TEXT', x: 340, y: 440, fontSize: 38, isAllCaps: true, isBottom: true }
  ],
  selectedTextId: 't_1',
  headerCaption: '',
  headerFontSize: 32,

  // Image overlays
  imageOverlays: [],
  selectedOverlayId: null,

  // Drawing tool
  drawMode: false,
  penColor: '#ef4444',
  penSize: 6,
  strokes: [],

  // Styling & Transforms
  fontFamily: 'Impact', // 'Impact' | 'Inter' | 'Comic Neue' | 'Courier New'
  textColorStyle: 'white', // 'white' | 'yellow' | 'black'
  isBaseFlipped: false,
  aspectRatio: 'original', // 'original' | '1:1' | '16:9' | '9:16'

  // Export
  exportFormat: 'png', // 'png' | 'jpeg'
  jpegQuality: 0.85,

  // Video & Animation
  videoStyle: 'sitcom', // 'sitcom' | 'bruh' | 'deepfry' | 'drift'
  videoSpeech: true,
  videoVoice: 'auto',
  videoSfx: 'laugh-track',
  videoBgm: true,
  videoReaction: 'laugh',
  videoDuration: 6, // 6s or 10s
  currentVideoBlob: null,
  currentVideoUrl: null
};

// Interaction tracking
let isDraggingText = false;
let isDraggingOverlay = false;
let dragOffset = { x: 0, y: 0 };
let isDrawing = false;
let currentStroke = null;
let textBoundingBoxes = [];
let overlayBoundingBoxes = [];

// DOM Elements
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const templateList = document.getElementById('templateList');
const imageInput = document.getElementById('imageInput');
const btnFlipBase = document.getElementById('btnFlipBase');

// Tool Tabs
const tabText = document.getElementById('tabText');
const tabOverlay = document.getElementById('tabOverlay');
const tabDraw = document.getElementById('tabDraw');
const tabExport = document.getElementById('tabExport');
const paneText = document.getElementById('paneText');
const paneOverlay = document.getElementById('paneOverlay');
const paneDraw = document.getElementById('paneDraw');
const paneExport = document.getElementById('paneExport');

// Text Layout Elements
const modeOverlay = document.getElementById('modeOverlay');
const modeHeader = document.getElementById('modeHeader');
const classicInputs = document.getElementById('classicInputs');
const modernInputs = document.getElementById('modernInputs');
const textLayersList = document.getElementById('textLayersList');
const btnAddText = document.getElementById('btnAddText');
const fontFamilySelect = document.getElementById('fontFamilySelect');
const fontSizeRange = document.getElementById('fontSizeRange');
const fontSizeVal = document.getElementById('fontSizeVal');
const capsCheckbox = document.getElementById('capsCheckbox');
const captionText = document.getElementById('captionText');
const headerFontSizeRange = document.getElementById('headerFontSizeRange');
const headerFontSizeVal = document.getElementById('headerFontSizeVal');

// Overlay Elements
const overlayInput = document.getElementById('overlayInput');
const overlayList = document.getElementById('overlayList');
const selectedOverlayControls = document.getElementById('selectedOverlayControls');
const overlaySizeRange = document.getElementById('overlaySizeRange');
const overlaySizeVal = document.getElementById('overlaySizeVal');
const btnFlipOverlay = document.getElementById('btnFlipOverlay');
const btnDeleteOverlay = document.getElementById('btnDeleteOverlay');

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

// Video Tab & Modal Elements
const tabVideo = document.getElementById('tabVideo');
const paneVideo = document.getElementById('paneVideo');
const btnGenerateVideo = document.getElementById('btnGenerateVideo');
const videoProgressBox = document.getElementById('videoProgressBox');
const videoProgressBarFill = document.getElementById('videoProgressBarFill');
const videoProgressLabel = document.getElementById('videoProgressLabel');
const videoVoiceSelect = document.getElementById('videoVoiceSelect');
const videoSpeechToggle = document.getElementById('videoSpeechToggle');
const videoSfxSelect = document.getElementById('videoSfxSelect');
const videoBgmToggle = document.getElementById('videoBgmToggle');
const videoReactionSelect = document.getElementById('videoReactionSelect');
const btnDurShort = document.getElementById('btnDurShort');
const btnDurStory = document.getElementById('btnDurStory');
const videoModal = document.getElementById('videoModal');
const btnCloseVideoModal = document.getElementById('btnCloseVideoModal');
const btnCloseModalBtn = document.getElementById('btnCloseModalBtn');
const previewVideoPlayer = document.getElementById('previewVideoPlayer');
const btnDownloadVideoModal = document.getElementById('btnDownloadVideoModal');
const btnDownloadGifModal = document.getElementById('btnDownloadGifModal');

// Global Actions
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

function getEffectiveCanvasHeight(img) {
  const targetWidth = 680;
  if (!img) return 400;
  if (state.aspectRatio === '1:1') return targetWidth;
  if (state.aspectRatio === '16:9') return Math.round(targetWidth / (16 / 9));
  if (state.aspectRatio === '9:16') return Math.round(targetWidth / (9 / 16));
  return Math.round(targetWidth / (img.naturalWidth / img.naturalHeight));
}

function setAspectRatio(ratio) {
  state.aspectRatio = ratio;
  document.querySelectorAll('.btn-ratio').forEach((b) => {
    b.classList.toggle('active', b.dataset.ratio === ratio);
  });
  if (state.activeImage) {
    const canvasH = getEffectiveCanvasHeight(state.activeImage);
    const bottomItem = state.texts.find((t) => t.isBottom);
    if (bottomItem) {
      bottomItem.y = canvasH - 24;
    }
  }
  render();
  showToast(`Ratio: ${ratio}`);
}

function loadTemplate(tmpl) {
  state.currentTemplate = tmpl;
  updateTemplateSelection();

  const img = new Image();
  img.src = tmpl.src;
  img.onload = () => {
    state.activeImage = img;
    const targetWidth = 680;
    const canvasH = getEffectiveCanvasHeight(img);
    const bottomItem = state.texts.find((t) => t.isBottom);
    if (bottomItem) {
      bottomItem.y = canvasH - 24;
      bottomItem.x = targetWidth / 2;
    }
    const topItem = state.texts.find((t) => t.isTop);
    if (topItem) {
      topItem.x = targetWidth / 2;
    }
    renderTextLayersList();
    renderOverlayList();
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
    const canvasH = getEffectiveCanvasHeight(img);
    const bottomItem = state.texts.find((t) => t.isBottom);
    if (bottomItem) {
      bottomItem.y = canvasH - 24;
    }
    renderTextLayersList();
    renderOverlayList();
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
  // Tabs
  tabText.addEventListener('click', () => switchTab('text'));
  tabOverlay.addEventListener('click', () => switchTab('overlay'));
  tabDraw.addEventListener('click', () => switchTab('draw'));
  if (tabVideo) tabVideo.addEventListener('click', () => switchTab('video'));
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

  // Font family selector
  if (fontFamilySelect) {
    fontFamilySelect.addEventListener('change', (e) => {
      state.fontFamily = e.target.value;
      render();
    });
  }

  // Text color presets
  document.querySelectorAll('.btn-text-color').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-text-color').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.textColorStyle = btn.dataset.color;
      render();
    });
  });

  // Template flip button
  if (btnFlipBase) {
    btnFlipBase.addEventListener('click', () => {
      state.isBaseFlipped = !state.isBaseFlipped;
      btnFlipBase.classList.toggle('active', state.isBaseFlipped);
      render();
      showToast(state.isBaseFlipped ? 'Template flipped' : 'Template normal');
    });
  }

  // Aspect ratio toggles
  document.querySelectorAll('.btn-ratio').forEach((btn) => {
    btn.addEventListener('click', () => {
      setAspectRatio(btn.dataset.ratio);
    });
  });

  // Image Overlays
  overlayInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => addOverlayImage(evt.target.result);
      reader.readAsDataURL(file);
      overlayInput.value = '';
    }
  });

  overlaySizeRange.addEventListener('input', (e) => {
    const width = parseInt(e.target.value, 10);
    overlaySizeVal.textContent = `${width}px`;
    const ov = state.imageOverlays.find((o) => o.id === state.selectedOverlayId);
    if (ov) {
      ov.width = width;
      ov.height = Math.round(width / ov.aspectRatio);
      render();
    }
  });

  btnFlipOverlay.addEventListener('click', flipSelectedOverlay);
  btnDeleteOverlay.addEventListener('click', () => {
    if (state.selectedOverlayId) {
      deleteOverlay(state.selectedOverlayId);
    }
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

  // Canvas interactions
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

  // Video & Sound Engine
  initVideoEvents();
}

function switchTab(tab) {
  state.activeTab = tab;
  [tabText, tabOverlay, tabDraw, tabVideo, tabExport].forEach((t) => {
    if (t) t.classList.remove('active');
  });
  [paneText, paneOverlay, paneDraw, paneVideo, paneExport].forEach((p) => {
    if (p) p.classList.add('hidden');
  });

  if (tab === 'text') {
    tabText.classList.add('active');
    paneText.classList.remove('hidden');
    setDrawMode(false);
  } else if (tab === 'overlay') {
    tabOverlay.classList.add('active');
    paneOverlay.classList.remove('hidden');
    setDrawMode(false);
    renderOverlayList();
  } else if (tab === 'draw') {
    tabDraw.classList.add('active');
    paneDraw.classList.remove('hidden');
    setDrawMode(true);
  } else if (tab === 'video') {
    if (tabVideo) tabVideo.classList.add('active');
    if (paneVideo) paneVideo.classList.remove('hidden');
    setDrawMode(false);
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
  state.selectedOverlayId = null;
  if (selectedOverlayControls) selectedOverlayControls.classList.add('hidden');

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
  state.texts.forEach((item) => {
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

// --- Image Overlay Management ---
function addOverlayImage(src) {
  const img = new Image();
  img.src = src;
  img.onload = () => {
    const targetWidth = 680;
    const imgHeight = canvas.height > 0 ? canvas.height : 400;
    const initialWidth = Math.min(160, Math.round(targetWidth * 0.3));
    const aspect = img.naturalWidth / img.naturalHeight;
    const initialHeight = Math.round(initialWidth / aspect);

    const newOverlay = {
      id: 'ov_' + Date.now(),
      img: img,
      x: Math.round(targetWidth / 2),
      y: Math.round(imgHeight / 2),
      width: initialWidth,
      height: initialHeight,
      aspectRatio: aspect,
      isFlipped: false
    };

    state.imageOverlays.push(newOverlay);
    selectOverlay(newOverlay.id);
    switchTab('overlay');
    renderOverlayList();
    render();
    showToast('Overlay added');
  };
}

function selectOverlay(id) {
  state.selectedOverlayId = id;
  state.selectedTextId = null; // deselect text
  const ov = state.imageOverlays.find((o) => o.id === id);
  if (ov && selectedOverlayControls) {
    selectedOverlayControls.classList.remove('hidden');
    overlaySizeRange.value = ov.width;
    overlaySizeVal.textContent = `${ov.width}px`;
  } else if (selectedOverlayControls) {
    selectedOverlayControls.classList.add('hidden');
  }
  renderTextLayersList();
  renderOverlayList();
  render();
}

function deleteOverlay(id) {
  state.imageOverlays = state.imageOverlays.filter((o) => o.id !== id);
  if (state.selectedOverlayId === id) {
    state.selectedOverlayId = state.imageOverlays[0]?.id || null;
  }
  if (!state.selectedOverlayId && selectedOverlayControls) {
    selectedOverlayControls.classList.add('hidden');
  } else if (state.selectedOverlayId) {
    selectOverlay(state.selectedOverlayId);
  }
  renderOverlayList();
  render();
  showToast('Overlay removed');
}

function flipSelectedOverlay() {
  const ov = state.imageOverlays.find((o) => o.id === state.selectedOverlayId);
  if (ov) {
    ov.isFlipped = !ov.isFlipped;
    render();
    showToast('Overlay flipped');
  }
}

function renderOverlayList() {
  if (!overlayList) return;
  overlayList.innerHTML = '';
  if (state.imageOverlays.length === 0) {
    overlayList.innerHTML = '<div style="font-size:0.8rem;color:var(--text-muted);text-align:center;padding:14px;">No overlays yet. Click "+ Add Image" or paste a copied image.</div>';
    if (selectedOverlayControls) selectedOverlayControls.classList.add('hidden');
    return;
  }

  state.imageOverlays.forEach((ov, index) => {
    const item = document.createElement('div');
    item.className = `overlay-item ${ov.id === state.selectedOverlayId ? 'active' : ''}`;
    item.innerHTML = `
      <img src="${ov.img.src}" class="overlay-thumb" alt="Overlay ${index + 1}">
      <span class="overlay-info">Overlay ${index + 1} (${ov.width}×${ov.height}px)</span>
      <button type="button" class="btn-layer-del" title="Delete overlay" aria-label="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;
    item.addEventListener('click', () => selectOverlay(ov.id));
    const delBtn = item.querySelector('.btn-layer-del');
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteOverlay(ov.id);
    });
    overlayList.appendChild(item);
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

    // 1. Check hit on text bounding boxes first
    const hitText = findHitText(pos.x, pos.y);
    if (hitText) {
      selectText(hitText.id);
      switchTab('text');
      isDraggingText = true;
      dragOffset = { x: pos.x - hitText.x, y: pos.y - hitText.y };
      canvas.classList.add('cursor-moving');
      canvas.focus();
      e.preventDefault();
      return;
    }

    // 2. Check hit on image overlay bounding boxes
    const hitOverlay = findHitOverlay(pos.x, pos.y);
    if (hitOverlay) {
      selectOverlay(hitOverlay.id);
      switchTab('overlay');
      isDraggingOverlay = true;
      dragOffset = { x: pos.x - hitOverlay.x, y: pos.y - hitOverlay.y };
      canvas.classList.add('cursor-moving');
      canvas.focus();
      e.preventDefault();
      return;
    }

    // Clicked empty space: deselect
    state.selectedTextId = null;
    state.selectedOverlayId = null;
    if (selectedOverlayControls) selectedOverlayControls.classList.add('hidden');
    renderTextLayersList();
    renderOverlayList();
    render();
  }

  // Pointer Move
  function onMove(e) {
    if (isDrawing || isDraggingText || isDraggingOverlay) {
      if (e.cancelable) e.preventDefault();
    }
    const pos = getPos(e);

    if (isDrawing && currentStroke) {
      currentStroke.points.push(pos);
      render();
      return;
    }

    if (isDraggingText) {
      const selected = getSelectedText();
      if (selected) {
        selected.x = Math.round(pos.x - dragOffset.x);
        selected.y = Math.round(pos.y - dragOffset.y);
        render();
      }
      return;
    }

    if (isDraggingOverlay) {
      const selectedOv = state.imageOverlays.find((o) => o.id === state.selectedOverlayId);
      if (selectedOv) {
        selectedOv.x = Math.round(pos.x - dragOffset.x);
        selectedOv.y = Math.round(pos.y - dragOffset.y);
        render();
      }
      return;
    }

    // Hover cursor indicator
    if (!state.drawMode && state.layout === 'classic') {
      const hitText = findHitText(pos.x, pos.y);
      const hitOverlay = findHitOverlay(pos.x, pos.y);
      if (hitText || hitOverlay) {
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

    if (isDraggingText) {
      isDraggingText = false;
      canvas.classList.remove('cursor-moving');
    }

    if (isDraggingOverlay) {
      isDraggingOverlay = false;
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
  for (let i = textBoundingBoxes.length - 1; i >= 0; i--) {
    const b = textBoundingBoxes[i];
    const pad = 12;
    if (x >= b.minX - pad && x <= b.maxX + pad && y >= b.minY - pad && y <= b.maxY + pad) {
      return state.texts.find((t) => t.id === b.id);
    }
  }
  return null;
}

function findHitOverlay(x, y) {
  for (let i = overlayBoundingBoxes.length - 1; i >= 0; i--) {
    const b = overlayBoundingBoxes[i];
    const pad = 8;
    if (x >= b.minX - pad && x <= b.maxX + pad && y >= b.minY - pad && y <= b.maxY + pad) {
      return state.imageOverlays.find((o) => o.id === b.id);
    }
  }
  return null;
}

function handleKeydown(e) {
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  const step = e.shiftKey ? 10 : 2;

  // Selected Overlay Keyboard Nudge & Delete
  const selectedOverlay = state.imageOverlays.find((o) => o.id === state.selectedOverlayId);
  if (selectedOverlay) {
    if (e.key === 'ArrowUp') { selectedOverlay.y -= step; render(); e.preventDefault(); return; }
    if (e.key === 'ArrowDown') { selectedOverlay.y += step; render(); e.preventDefault(); return; }
    if (e.key === 'ArrowLeft') { selectedOverlay.x -= step; render(); e.preventDefault(); return; }
    if (e.key === 'ArrowRight') { selectedOverlay.x += step; render(); e.preventDefault(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      deleteOverlay(selectedOverlay.id);
      e.preventDefault();
      return;
    }
  }

  // Selected Text Keyboard Nudge & Delete
  const selectedText = getSelectedText();
  if (selectedText && state.selectedTextId) {
    if (e.key === 'ArrowUp') { selectedText.y -= step; render(); e.preventDefault(); return; }
    if (e.key === 'ArrowDown') { selectedText.y += step; render(); e.preventDefault(); return; }
    if (e.key === 'ArrowLeft') { selectedText.x -= step; render(); e.preventDefault(); return; }
    if (e.key === 'ArrowRight') { selectedText.x += step; render(); e.preventDefault(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (state.texts.length > 1) {
        deleteTextLayer(selectedText.id);
        e.preventDefault();
      }
    }
  }
}

// --- Main Canvas Rendering Engine ---
function render() {
  if (!state.activeImage) return;

  const img = state.activeImage;
  const targetWidth = 680;
  const baseAspect = img.naturalWidth / img.naturalHeight;
  const rawImgHeight = Math.round(targetWidth / baseAspect);

  let canvasW = targetWidth;
  let canvasH = rawImgHeight;
  let drawX = 0;
  let drawY = 0;
  let drawW = targetWidth;
  let drawH = rawImgHeight;

  if (state.aspectRatio !== 'original') {
    let ratioVal = 1;
    if (state.aspectRatio === '1:1') ratioVal = 1;
    else if (state.aspectRatio === '16:9') ratioVal = 16 / 9;
    else if (state.aspectRatio === '9:16') ratioVal = 9 / 16;

    canvasW = targetWidth;
    canvasH = Math.round(targetWidth / ratioVal);

    const scale = Math.min(canvasW / img.naturalWidth, canvasH / img.naturalHeight);
    drawW = Math.round(img.naturalWidth * scale);
    drawH = Math.round(img.naturalHeight * scale);
    drawX = Math.round((canvasW - drawW) / 2);
    drawY = Math.round((canvasH - drawH) / 2);
  }

  textBoundingBoxes = [];
  overlayBoundingBoxes = [];

  if (state.layout === 'modern') {
    // Header Box Mode
    let text = state.headerCaption;
    const fontSize = state.headerFontSize;
    const lineHeight = Math.round(fontSize * 1.3);
    const padX = 24;
    const padY = 20;
    const maxTextWidth = canvasW - (padX * 2);

    let headerFontSpec = `600 ${fontSize}px Inter, -apple-system, sans-serif`;
    if (state.fontFamily === 'Impact') {
      headerFontSpec = `900 ${fontSize}px Impact, -apple-system, sans-serif`;
    } else if (state.fontFamily === 'Comic Neue') {
      headerFontSpec = `700 ${fontSize}px "Comic Neue", cursive, sans-serif`;
    } else if (state.fontFamily === 'Courier New') {
      headerFontSpec = `700 ${fontSize}px "Courier New", monospace`;
    }

    ctx.font = headerFontSpec;
    const lines = text ? wrapText(ctx, text, maxTextWidth) : [];
    const textHeight = lines.length ? lines.length * lineHeight : 0;
    const headerHeight = lines.length ? textHeight + (padY * 2) : 0;

    canvas.width = canvasW;
    canvas.height = headerHeight + canvasH;

    // Fill background for letterbox/pillarbox
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvasW, canvas.height);

    if (headerHeight > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasW, headerHeight);

      ctx.fillStyle = '#111827';
      ctx.font = headerFontSpec;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      let y = padY;
      lines.forEach((line) => {
        ctx.fillText(line, padX, y);
        y += lineHeight;
      });
    }

    // Draw base template image (with flip if enabled)
    ctx.save();
    if (state.isBaseFlipped) {
      ctx.translate(drawX + drawW, headerHeight + drawY);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, drawW, drawH);
    } else {
      ctx.drawImage(img, drawX, headerHeight + drawY, drawW, drawH);
    }
    ctx.restore();

    // Draw Overlays
    drawAllOverlays(headerHeight);

    // Draw Strokes
    drawAllStrokes(headerHeight);

  } else {
    // Overlay Mode (Freeform Draggable Multi-Text)
    canvas.width = canvasW;
    canvas.height = canvasH;

    // Fill background for letterbox/pillarbox
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Draw base template image (with flip if enabled)
    ctx.save();
    if (state.isBaseFlipped) {
      ctx.translate(drawX + drawW, drawY);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, drawW, drawH);
    } else {
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }
    ctx.restore();

    // 1. Draw Image Overlays
    drawAllOverlays(0);

    // 2. Draw Annotation Strokes
    drawAllStrokes(0);

    // 3. Draw Text Layers
    state.texts.forEach((item) => {
      let displayText = item.text;
      if (item.isAllCaps) displayText = displayText.toUpperCase();
      if (!displayText.trim()) return;

      const fontSize = item.fontSize;
      const lineHeight = Math.round(fontSize * 1.15);
      const strokeWidth = Math.max(3, Math.round(fontSize / 7));

      let fontSpec = `900 ${fontSize}px Impact, -apple-system, sans-serif`;
      if (state.fontFamily === 'Inter') {
        fontSpec = `800 ${fontSize}px Inter, -apple-system, sans-serif`;
      } else if (state.fontFamily === 'Comic Neue') {
        fontSpec = `700 ${fontSize}px "Comic Neue", "Comic Sans MS", cursive, sans-serif`;
      } else if (state.fontFamily === 'Courier New') {
        fontSpec = `800 ${fontSize}px "Courier New", monospace`;
      }
      ctx.font = fontSpec;

      if (state.textColorStyle === 'yellow') {
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#000000';
      } else if (state.textColorStyle === 'black') {
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#ffffff';
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
      }

      ctx.lineWidth = strokeWidth;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const maxLineWidth = canvasW - 24;
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

      // Draw dashed selection outline for active text
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

function drawAllOverlays(offsetY = 0) {
  state.imageOverlays.forEach((ov) => {
    ctx.save();
    ctx.translate(ov.x, ov.y + offsetY);
    if (ov.isFlipped) {
      ctx.scale(-1, 1);
    }
    ctx.drawImage(ov.img, -ov.width / 2, -ov.height / 2, ov.width, ov.height);
    ctx.restore();

    const box = {
      id: ov.id,
      minX: ov.x - (ov.width / 2),
      maxX: ov.x + (ov.width / 2),
      minY: ov.y + offsetY - (ov.height / 2),
      maxY: ov.y + offsetY + (ov.height / 2)
    };
    overlayBoundingBoxes.push(box);

    // Draw selection outline if selected
    if (ov.id === state.selectedOverlayId && !state.drawMode) {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 139, 253, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(box.minX - 2, box.minY - 2, ov.width + 4, ov.height + 4);

      // Corner handles
      ctx.fillStyle = '#58a6ff';
      const handleSize = 6;
      [
        [box.minX - 2, box.minY - 2],
        [box.maxX + 2, box.minY - 2],
        [box.minX - 2, box.maxY + 2],
        [box.maxX + 2, box.maxY + 2]
      ].forEach(([hx, hy]) => {
        ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
      });
      ctx.restore();
    }
  });
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
  state.imageOverlays = [];
  state.selectedOverlayId = null;
  state.headerCaption = '';
  captionText.value = '';
  state.fontFamily = 'Impact';
  if (fontFamilySelect) fontFamilySelect.value = 'Impact';
  state.textColorStyle = 'white';
  document.querySelectorAll('.btn-text-color').forEach((b) => {
    b.classList.toggle('active', b.dataset.color === 'white');
  });
  state.isBaseFlipped = false;
  if (btnFlipBase) btnFlipBase.classList.remove('active');
  state.aspectRatio = 'original';
  document.querySelectorAll('.btn-ratio').forEach((b) => {
    b.classList.toggle('active', b.dataset.ratio === 'original');
  });
  renderTextLayersList();
  renderOverlayList();
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
      reader.onload = (evt) => {
        // If template/image is already loaded, add as an overlay!
        if (state.activeImage) {
          addOverlayImage(evt.target.result);
        } else {
          loadCustomImage(evt.target.result);
        }
      };
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
      reader.onload = (evt) => {
        // If a template is already loaded, drop adds overlay!
        if (state.activeImage) {
          addOverlayImage(evt.target.result);
        } else {
          loadCustomImage(evt.target.result);
        }
      };
      reader.readAsDataURL(files[0]);
    }
  });
}

// =============================================================================
// MEMECRAFT VIDEO & SOUND ENGINE
// =============================================================================

const audioBufferCache = {};
let webAudioCtx = null;

function getAudioContext() {
  if (!webAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      webAudioCtx = new AudioContextClass();
    }
  }
  if (webAudioCtx && webAudioCtx.state === 'suspended') {
    webAudioCtx.resume();
  }
  return webAudioCtx;
}

async function loadAudioBuffer(url) {
  if (audioBufferCache[url]) return audioBufferCache[url];
  const aCtx = getAudioContext();
  if (!aCtx) return null;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const arrayBuffer = await resp.arrayBuffer();
    const buffer = await aCtx.decodeAudioData(arrayBuffer);
    audioBufferCache[url] = buffer;
    return buffer;
  } catch (err) {
    console.warn('Audio asset load error:', url, err);
    return null;
  }
}

function synthesizeSoundFallback(type, aCtx, destNode, delayMs = 0) {
  if (!aCtx) return;
  const startTime = aCtx.currentTime + (delayMs / 1000);

  if (type === 'vine-boom') {
    const osc = aCtx.createOscillator();
    const gain = aCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, startTime);
    osc.frequency.exponentialRampToValueAtTime(36, startTime + 1.2);
    gain.gain.setValueAtTime(0.9, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5);
    osc.connect(gain);
    gain.connect(destNode);
    osc.start(startTime);
    osc.stop(startTime + 1.5);
  } else if (type === 'bruh') {
    const osc = aCtx.createOscillator();
    const gain = aCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(135, startTime);
    osc.frequency.exponentialRampToValueAtTime(75, startTime + 0.65);
    gain.gain.setValueAtTime(0.85, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7);
    osc.connect(gain);
    gain.connect(destNode);
    osc.start(startTime);
    osc.stop(startTime + 0.7);
  } else if (type === 'laugh-track') {
    // Staccato laughing burst synthesis
    for (let i = 0; i < 6; i++) {
      const burstTime = startTime + i * 0.18;
      const osc = aCtx.createOscillator();
      const gain = aCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260 + (i % 2 === 0 ? 30 : -20), burstTime);
      gain.gain.setValueAtTime(0.4, burstTime);
      gain.gain.exponentialRampToValueAtTime(0.01, burstTime + 0.14);
      osc.connect(gain);
      gain.connect(destNode);
      osc.start(burstTime);
      osc.stop(burstTime + 0.14);
    }
  } else if (type === 'whoosh') {
    const osc = aCtx.createOscillator();
    const gain = aCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, startTime);
    osc.frequency.linearRampToValueAtTime(1200, startTime + 0.15);
    osc.frequency.linearRampToValueAtTime(250, startTime + 0.35);
    gain.gain.setValueAtTime(0.01, startTime);
    gain.gain.linearRampToValueAtTime(0.6, startTime + 0.15);
    gain.gain.linearRampToValueAtTime(0.001, startTime + 0.35);
    osc.connect(gain);
    gain.connect(destNode);
    osc.start(startTime);
    osc.stop(startTime + 0.35);
  } else if (type === 'record-scratch') {
    const osc = aCtx.createOscillator();
    const gain = aCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, startTime);
    osc.frequency.exponentialRampToValueAtTime(180, startTime + 0.3);
    gain.gain.setValueAtTime(0.5, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
    osc.connect(gain);
    gain.connect(destNode);
    osc.start(startTime);
    osc.stop(startTime + 0.3);
  }
}

async function playAudioBuffer(url, fallbackType, aCtx, destNode, delayMs = 0, volume = 1.0, loop = false) {
  if (!aCtx) return null;
  const startTime = aCtx.currentTime + (delayMs / 1000);
  try {
    const buffer = await loadAudioBuffer(url);
    if (buffer) {
      const source = aCtx.createBufferSource();
      source.buffer = buffer;
      source.loop = loop;
      const gain = aCtx.createGain();
      gain.gain.setValueAtTime(volume, startTime);
      source.connect(gain);
      if (destNode) gain.connect(destNode);
      if (aCtx.destination) {
        try { gain.connect(aCtx.destination); } catch (e) {}
      }
      source.start(startTime);
      return source;
    } else {
      synthesizeSoundFallback(fallbackType, aCtx, destNode, delayMs);
      return null;
    }
  } catch (err) {
    synthesizeSoundFallback(fallbackType, aCtx, destNode, delayMs);
    return null;
  }
}

function scheduleAudioBuffer(buffer, fallbackType, aCtx, destNode, baseTime, delaySec = 0, volume = 1.0, loop = false) {
  if (!aCtx) return null;
  const startTime = Math.max(aCtx.currentTime, baseTime + delaySec);
  if (buffer) {
    const source = aCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    const gain = aCtx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    source.connect(gain);
    if (destNode) gain.connect(destNode);
    if (aCtx.destination) {
      try { gain.connect(aCtx.destination); } catch (e) {}
    }
    source.start(startTime);
    return source;
  } else if (fallbackType) {
    synthesizeSoundFallback(fallbackType, aCtx, destNode, delaySec * 1000);
    return null;
  }
}

function populateSpeechVoices() {
  if (!('speechSynthesis' in window) || !videoVoiceSelect) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return;

  const currentVal = videoVoiceSelect.value;
  videoVoiceSelect.innerHTML = '<option value="auto">Auto (Best Natural English Voice)</option>';

  const enVoices = voices.filter((v) => v.lang.startsWith('en'));
  const otherVoices = voices.filter((v) => !v.lang.startsWith('en'));

  enVoices.forEach((v) => {
    const opt = document.createElement('option');
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})${v.default ? ' [Default]' : ''}`;
    videoVoiceSelect.appendChild(opt);
  });

  if (otherVoices.length > 0) {
    const group = document.createElement('optgroup');
    group.label = 'Other Languages';
    otherVoices.slice(0, 15).forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v.name;
      opt.textContent = `${v.name} (${v.lang})`;
      group.appendChild(opt);
    });
    videoVoiceSelect.appendChild(group);
  }

  if (currentVal && currentVal !== 'auto') {
    videoVoiceSelect.value = currentVal;
  }
}

function speakMemeNarration(text, delayMs = 0) {
  if (!state.videoSpeech || !('speechSynthesis' in window) || !text || !text.trim()) return;

  setTimeout(() => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    if (state.videoVoice && state.videoVoice !== 'auto') {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.name === state.videoVoice);
      if (match) utterance.voice = match;
    }
    window.speechSynthesis.speak(utterance);
  }, delayMs);
}

function initVideoEvents() {
  if ('speechSynthesis' in window) {
    populateSpeechVoices();
    window.speechSynthesis.onvoiceschanged = populateSpeechVoices;
  }

  // Preset style switching
  document.querySelectorAll('.btn-video-style').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-video-style').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.videoStyle = btn.dataset.style;

      if (state.videoStyle === 'sitcom') {
        if (videoSfxSelect) videoSfxSelect.value = 'laugh-track';
        if (videoReactionSelect) videoReactionSelect.value = 'laugh';
      } else if (state.videoStyle === 'bruh') {
        if (videoSfxSelect) videoSfxSelect.value = 'bruh';
        if (videoReactionSelect) videoReactionSelect.value = 'bruh';
      } else if (state.videoStyle === 'deepfry') {
        if (videoSfxSelect) videoSfxSelect.value = 'vine-boom';
        if (videoReactionSelect) videoReactionSelect.value = 'lasers';
      } else if (state.videoStyle === 'drift') {
        if (videoSfxSelect) videoSfxSelect.value = 'none';
        if (videoReactionSelect) videoReactionSelect.value = 'none';
      }
    });
  });

  // Duration toggles
  if (btnDurShort && btnDurStory) {
    btnDurShort.addEventListener('click', () => {
      btnDurShort.classList.add('active');
      btnDurStory.classList.remove('active');
      state.videoDuration = 6;
    });
    btnDurStory.addEventListener('click', () => {
      btnDurStory.classList.add('active');
      btnDurShort.classList.remove('active');
      state.videoDuration = 10;
    });
  }

  if (videoSpeechToggle) {
    videoSpeechToggle.addEventListener('change', (e) => {
      state.videoSpeech = e.target.checked;
    });
  }

  if (videoVoiceSelect) {
    videoVoiceSelect.addEventListener('change', (e) => {
      state.videoVoice = e.target.value;
    });
  }

  if (videoSfxSelect) {
    videoSfxSelect.addEventListener('change', (e) => {
      state.videoSfx = e.target.value;
    });
  }

  if (videoBgmToggle) {
    videoBgmToggle.addEventListener('change', (e) => {
      state.videoBgm = e.target.checked;
    });
  }

  if (videoReactionSelect) {
    videoReactionSelect.addEventListener('change', (e) => {
      state.videoReaction = e.target.value;
    });
  }

  if (btnGenerateVideo) {
    btnGenerateVideo.addEventListener('click', generateMemeVideo);
  }

  if (btnCloseVideoModal) btnCloseVideoModal.addEventListener('click', closeVideoModal);
  if (btnCloseModalBtn) btnCloseModalBtn.addEventListener('click', closeVideoModal);
  if (videoModal) {
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) closeVideoModal();
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && videoModal && !videoModal.classList.contains('hidden')) {
      closeVideoModal();
    }
  });

  if (btnDownloadVideoModal) {
    btnDownloadVideoModal.addEventListener('click', downloadVideoFile);
  }

  if (btnDownloadGifModal) {
    btnDownloadGifModal.addEventListener('click', downloadGifFile);
  }
}

function closeVideoModal() {
  if (videoModal) videoModal.classList.add('hidden');
  if (previewVideoPlayer) {
    previewVideoPlayer.pause();
  }
}

function downloadVideoFile() {
  if (!state.currentVideoBlob) {
    showToast('No video rendered yet');
    return;
  }
  const isMp4 = state.currentVideoBlob.type.includes('mp4');
  const ext = isMp4 ? 'mp4' : 'webm';
  const a = document.createElement('a');
  a.href = state.currentVideoUrl;
  a.download = `memecraft-${state.videoStyle}-${Date.now()}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast(`Video downloaded (${ext.toUpperCase()})`);
}

function downloadGifFile() {
  if (!state.currentVideoBlob) {
    showToast('No video rendered yet');
    return;
  }
  // If browser recorded webm/mp4, download or copy
  downloadVideoFile();
}

// --- Main In-Browser Video Generation Loop ---
async function generateMemeVideo() {
  if (!state.activeImage) {
    showToast('Please select or upload an image first');
    return;
  }

  if (state.isRecordingVideo) return;
  state.isRecordingVideo = true;

  btnGenerateVideo.disabled = true;
  btnGenerateVideo.innerHTML = `
    <svg class="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
    Rendering Video...
  `;
  videoProgressBox.classList.remove('hidden');
  videoProgressBarFill.style.width = '4%';
  videoProgressLabel.textContent = 'Preparing meme canvas snapshot & soundboard...';

  // 1. Ensure current canvas is rendered with all active layers (texts, stickers, drawings, filters)
  render();

  // 2. Snapshot the live canvas with 100% WYSIWYG fidelity
  const memeSnapshot = document.createElement('canvas');
  memeSnapshot.width = canvas.width;
  memeSnapshot.height = canvas.height;
  const snapCtx = memeSnapshot.getContext('2d');
  snapCtx.drawImage(canvas, 0, 0);

  // 3. Audio Context setup & Preloading authentic viral audio clips
  const aCtx = getAudioContext();
  if (aCtx && aCtx.state === 'suspended') {
    try { await aCtx.resume(); } catch (e) {}
  }
  const audioDest = aCtx ? aCtx.createMediaStreamDestination() : null;

  const duration = state.videoDuration || 6;
  const punchTime = duration * 0.48;

  const sfxUrls = {
    'laugh-track': 'assets/audio/laugh-track.wav',
    'vine-boom': 'assets/audio/vine-boom.wav',
    'bruh': 'assets/audio/bruh.wav',
    'record-scratch': 'assets/audio/record-scratch.wav',
    'dramatic-hit': 'assets/audio/dramatic-hit.wav',
    'bell-ping': 'assets/audio/bell-ping.wav'
  };

  let bgmBuffer = null;
  let whooshBuffer = null;
  let punchBuffer = null;

  if (aCtx) {
    videoProgressLabel.textContent = 'Preloading authentic sound assets...';
    try {
      const loads = [
        loadAudioBuffer('assets/audio/whoosh.wav').then((b) => { whooshBuffer = b; }),
        state.videoBgm ? loadAudioBuffer('assets/audio/lofi-beat.wav').then((b) => { bgmBuffer = b; }) : Promise.resolve(),
        (state.videoSfx && state.videoSfx !== 'none' && sfxUrls[state.videoSfx])
          ? loadAudioBuffer(sfxUrls[state.videoSfx]).then((b) => { punchBuffer = b; })
          : Promise.resolve()
      ];
      await Promise.all(loads);
    } catch (e) {
      console.warn('Audio pre-load note:', e);
    }
  }

  // 4. Target offscreen canvas: 720x1280 (Standard 9:16 vertical video for mobile / Shorts / Reels)
  const vWidth = 720;
  const vHeight = 1280;
  const vCanvas = document.createElement('canvas');
  vCanvas.width = vWidth;
  vCanvas.height = vHeight;
  const vCtx = vCanvas.getContext('2d');
  vCtx.imageSmoothingEnabled = true;
  vCtx.imageSmoothingQuality = 'high';

  // 5. MediaRecorder stream setup
  const videoStream = vCanvas.captureStream(30);
  const streamTracks = [...videoStream.getVideoTracks()];
  if (audioDest && audioDest.stream) {
    const aTracks = audioDest.stream.getAudioTracks();
    streamTracks.push(...aTracks);
  }
  const combinedStream = new MediaStream(streamTracks);

  let mimeType = 'video/webm;codecs=vp9';
  if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
    mimeType = 'video/mp4;codecs=avc1';
  } else if (MediaRecorder.isTypeSupported('video/mp4')) {
    mimeType = 'video/mp4';
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
    mimeType = 'video/webm;codecs=vp8';
  } else if (MediaRecorder.isTypeSupported('video/webm')) {
    mimeType = 'video/webm';
  }

  let mediaRecorder;
  try {
    mediaRecorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 4500000 });
  } catch (err) {
    mediaRecorder = new MediaRecorder(combinedStream);
  }

  const recordedChunks = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    state.isRecordingVideo = false;
    btnGenerateVideo.disabled = false;
    btnGenerateVideo.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      Render Meme Video
    `;
    videoProgressBox.classList.add('hidden');

    const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || mimeType });
    state.currentVideoBlob = blob;
    if (state.currentVideoUrl) URL.revokeObjectURL(state.currentVideoUrl);
    state.currentVideoUrl = URL.createObjectURL(blob);

    if (previewVideoPlayer) {
      previewVideoPlayer.src = state.currentVideoUrl;
      previewVideoPlayer.play().catch(() => {});
    }
    if (videoModal) {
      videoModal.classList.remove('hidden');
    }
    showToast('Video ready! 🎬');
  };

  // 6. Schedule Audio Cues Exactly (Pre-loaded buffers guarantee sample accuracy)
  if (aCtx && audioDest) {
    const baseTime = aCtx.currentTime + 0.05;
    if (bgmBuffer) {
      scheduleAudioBuffer(bgmBuffer, 'lofi-beat', aCtx, audioDest, baseTime, 0, 0.22, true);
    }
    if (whooshBuffer) {
      scheduleAudioBuffer(whooshBuffer, 'whoosh', aCtx, audioDest, baseTime, Math.max(0, punchTime - 0.35), 0.65);
    }
    if (punchBuffer) {
      scheduleAudioBuffer(punchBuffer, state.videoSfx, aCtx, audioDest, baseTime, punchTime, 0.95);
    }
  }

  // 7. Natural Speech Narration (if enabled)
  const topTextObj = state.texts.find((t) => t.isTop) || state.texts[0];
  const bottomTextObj = state.texts.find((t) => t.isBottom) || state.texts[1];
  const setupText = (state.layout === 'modern' ? state.headerCaption : topTextObj?.text) || '';
  const punchlineText = (state.layout === 'modern' ? '' : bottomTextObj?.text) || '';

  if (state.videoSpeech) {
    speakMemeNarration(setupText, 250);
    if (punchlineText) {
      speakMemeNarration(punchlineText, (punchTime + 0.2) * 1000);
    }
  }

  // 8. Start recording
  mediaRecorder.start(100);

  // 9. Foreground & Background Dimensions
  // Maintain true aspect ratio of user canvas without stretching or slicing
  const cardMaxWidth = 640;
  const cardMaxHeight = 880;
  const cardScale = Math.min(cardMaxWidth / memeSnapshot.width, cardMaxHeight / memeSnapshot.height);
  const cardW = Math.round(memeSnapshot.width * cardScale);
  const cardH = Math.round(memeSnapshot.height * cardScale);

  const bgScale = Math.max(vWidth / memeSnapshot.width, vHeight / memeSnapshot.height);
  const bgW = memeSnapshot.width * bgScale;
  const bgH = memeSnapshot.height * bgScale;
  const bgX = (vWidth - bgW) / 2;
  const bgY = (vHeight - bgH) / 2;

  const startRecordTime = performance.now();

  function renderVideoFrame(now) {
    const elapsedMs = now - startRecordTime;
    const t = Math.min(elapsedMs / 1000, duration);
    const progress = Math.min(100, Math.round((t / duration) * 100));

    videoProgressBarFill.style.width = `${progress}%`;
    videoProgressLabel.textContent = `Rendering video... ${progress}%`;

    const isPunchline = t >= punchTime;
    const timeSincePunch = Math.max(0, t - punchTime);

    // --- A. Draw Ambient Blurred Background ---
    vCtx.save();
    vCtx.filter = 'blur(28px) brightness(0.42) saturate(135%)';
    vCtx.drawImage(memeSnapshot, bgX, bgY, bgW, bgH);
    vCtx.restore();

    // Dark Radial Vignette
    vCtx.save();
    const vig = vCtx.createRadialGradient(vWidth / 2, vHeight / 2, vWidth * 0.25, vWidth / 2, vHeight / 2, vHeight * 0.72);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0.05)');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.68)');
    vCtx.fillStyle = vig;
    vCtx.fillRect(0, 0, vWidth, vHeight);
    vCtx.restore();

    // --- B. Camera Physics: Ken Burns + Tension Pull + Snap Punch & Shake ---
    let zoom = 1.0;
    let rotation = 0;
    let shakeX = 0;
    let shakeY = 0;

    if (!isPunchline) {
      if (t < punchTime - 0.35) {
        // Slow Ken Burns drift into the setup
        const p1 = t / (punchTime - 0.35);
        zoom = 1.0 + p1 * 0.05;
        rotation = Math.sin(t * 1.8) * 0.005;
      } else {
        // Tension anticipation (pull-back)
        const pWhoosh = (t - (punchTime - 0.35)) / 0.35;
        zoom = 1.05 - pWhoosh * 0.04;
        rotation = 0;
      }
    } else {
      // Punchline Impact: Instant pop to 1.14x, easing to 1.08x
      const punchZoom = 1.08 + 0.08 * Math.exp(-timeSincePunch * 4.5);
      zoom = punchZoom;

      // Realistic damped screen shake
      if (timeSincePunch < 0.65) {
        const decay = Math.exp(-timeSincePunch * 6.0);
        const intensity = (state.videoStyle === 'deepfry' ? 30 : 18) * decay;
        shakeX = Math.sin(timeSincePunch * 54) * intensity;
        shakeY = Math.cos(timeSincePunch * 44) * (intensity * 0.72);
      }
    }

    // --- C. Foreground Meme Card Rendering ---
    const centerX = vWidth / 2 + shakeX;
    const centerY = (vHeight / 2 - 20) + shakeY;
    const halfW = cardW / 2;
    const halfH = cardH / 2;
    const cornerRadius = 20;

    vCtx.save();
    vCtx.translate(centerX, centerY);
    vCtx.rotate(rotation);
    vCtx.scale(zoom, zoom);

    // 1. Drop shadow
    vCtx.save();
    vCtx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    vCtx.shadowBlur = 32;
    vCtx.shadowOffsetX = 0;
    vCtx.shadowOffsetY = 14;
    vCtx.fillStyle = '#000000';
    vCtx.beginPath();
    if (typeof vCtx.roundRect === 'function') {
      vCtx.roundRect(-halfW, -halfH, cardW, cardH, cornerRadius);
    } else {
      vCtx.rect(-halfW, -halfH, cardW, cardH);
    }
    vCtx.fill();
    vCtx.restore();

    // 2. Clipped Meme Artwork
    vCtx.save();
    vCtx.beginPath();
    if (typeof vCtx.roundRect === 'function') {
      vCtx.roundRect(-halfW, -halfH, cardW, cardH, cornerRadius);
    } else {
      vCtx.rect(-halfW, -halfH, cardW, cardH);
    }
    vCtx.clip();

    // Visual mood filter
    if (state.videoStyle === 'deepfry' && isPunchline) {
      vCtx.filter = 'contrast(165%) saturate(220%) brightness(1.1)';
    } else if (state.videoStyle === 'bruh' && isPunchline && timeSincePunch < 1.0) {
      vCtx.filter = 'grayscale(100%) contrast(125%)';
    } else if (state.videoStyle === 'drift') {
      vCtx.filter = 'contrast(106%) saturate(110%)';
    }

    vCtx.drawImage(memeSnapshot, -halfW, -halfH, cardW, cardH);
    vCtx.restore();

    // 3. Crisp subtle border
    vCtx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    vCtx.lineWidth = 2.5;
    vCtx.beginPath();
    if (typeof vCtx.roundRect === 'function') {
      vCtx.roundRect(-halfW, -halfH, cardW, cardH, cornerRadius);
    } else {
      vCtx.rect(-halfW, -halfH, cardW, cardH);
    }
    vCtx.stroke();

    vCtx.restore();

    // --- D. Style-Specific Reaction FX & Overlays ---
    if (isPunchline) {
      if (state.videoStyle === 'sitcom' || state.videoReaction === 'laugh') {
        // Floating emoji laughter stream
        vCtx.save();
        vCtx.font = '50px sans-serif';
        vCtx.textAlign = 'center';
        const emojis = ['😂', '🤣', '💀', '🔥', '👏', '😂', '🤣'];
        emojis.forEach((em, idx) => {
          const p = timeSincePunch + idx * 0.14;
          const y = vHeight - 120 - (p * 190);
          if (y > -50 && y < vHeight) {
            const x = (vWidth * 0.15) + ((idx * 90) % (vWidth * 0.7)) + Math.sin(p * 4.5 + idx) * 22;
            const alpha = Math.max(0, Math.min(1.0, 1.0 - (vHeight - y) / (vHeight * 0.85)));
            vCtx.globalAlpha = alpha;
            vCtx.fillText(em, x, y);
          }
        });
        vCtx.restore();

        // Retro Live Comedy indicator
        vCtx.save();
        vCtx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        if (typeof vCtx.roundRect === 'function') {
          vCtx.beginPath();
          vCtx.roundRect(32, 40, 180, 40, 12);
          vCtx.fill();
        }
        const blink = Math.floor(t * 3) % 2 === 0;
        vCtx.fillStyle = blink ? '#EF4444' : '#7F1D1D';
        vCtx.beginPath();
        vCtx.arc(52, 60, 6, 0, Math.PI * 2);
        vCtx.fill();
        vCtx.fillStyle = '#FFFFFF';
        vCtx.font = '700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        vCtx.textAlign = 'left';
        vCtx.textBaseline = 'middle';
        vCtx.fillText('LIVE COMEDY', 68, 60);
        vCtx.restore();

      } else if (state.videoStyle === 'bruh' || state.videoReaction === 'bruh') {
        // Red Rubber Stamp BRUH with stamp bounce
        vCtx.save();
        vCtx.translate(vWidth / 2, centerY);
        vCtx.rotate(-0.16);
        const stampProg = Math.min(1.0, timeSincePunch / 0.18);
        const stampScale = stampProg < 1.0 
          ? 2.5 - (1.5 * stampProg) + Math.sin(stampProg * Math.PI) * 0.25 
          : 1.0;
        vCtx.scale(stampScale, stampScale);

        vCtx.strokeStyle = 'rgba(239, 68, 68, 0.92)';
        vCtx.lineWidth = 7;
        if (typeof vCtx.roundRect === 'function') {
          vCtx.beginPath();
          vCtx.roundRect(-150, -50, 300, 100, 14);
          vCtx.stroke();
        } else {
          vCtx.strokeRect(-150, -50, 300, 100);
        }
        vCtx.font = '900 68px Impact, sans-serif';
        vCtx.fillStyle = 'rgba(239, 68, 68, 0.92)';
        vCtx.textAlign = 'center';
        vCtx.textBaseline = 'middle';
        vCtx.fillText('BRUH', 0, 0);
        vCtx.restore();

      } else if (state.videoReaction === 'lasers') {
        // Glowing red laser eye effect
        vCtx.save();
        vCtx.fillStyle = '#FF0000';
        vCtx.shadowColor = '#FF0000';
        vCtx.shadowBlur = 35;
        vCtx.beginPath();
        vCtx.arc(centerX - 35, centerY - 25, 12, 0, Math.PI * 2);
        vCtx.arc(centerX + 35, centerY - 25, 12, 0, Math.PI * 2);
        vCtx.fill();
        vCtx.restore();
      }
    }

    // --- E. Subtitle Pill (Only when Narration is spoken, positioned neatly below card) ---
    if (state.videoSpeech) {
      const activeCaption = isPunchline ? (punchlineText || setupText) : setupText;
      if (activeCaption && activeCaption.trim()) {
        vCtx.save();
        const subY = vHeight - 110;
        const font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        vCtx.font = font;
        const textMetrics = vCtx.measureText(activeCaption);
        const pillW = Math.min(vWidth - 80, textMetrics.width + 56);
        const pillH = 48;
        const pillX = (vWidth - pillW) / 2;

        // Subtitle capsule background
        vCtx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        vCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        vCtx.lineWidth = 1.5;
        vCtx.beginPath();
        if (typeof vCtx.roundRect === 'function') {
          vCtx.roundRect(pillX, subY - pillH / 2, pillW, pillH, 24);
        } else {
          vCtx.rect(pillX, subY - pillH / 2, pillW, pillH);
        }
        vCtx.fill();
        vCtx.stroke();

        // Subtitle text
        vCtx.textAlign = 'center';
        vCtx.textBaseline = 'middle';
        vCtx.fillStyle = isPunchline ? '#FFE600' : '#FFFFFF';
        vCtx.fillText(activeCaption.length > 38 ? activeCaption.slice(0, 36) + '...' : activeCaption, vWidth / 2, subY);
        vCtx.restore();
      }
    }

    if (t < duration) {
      requestAnimationFrame(renderVideoFrame);
    } else {
      mediaRecorder.stop();
    }
  }

  requestAnimationFrame(renderVideoFrame);
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