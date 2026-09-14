/**
 * MemeCraft — Fast, Clean Meme Creator
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
  fontSize: 38,
  isAllCaps: true
};

// DOM references
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const templateList = document.getElementById('templateList');
const imageInput = document.getElementById('imageInput');

const modeOverlay = document.getElementById('modeOverlay');
const modeHeader = document.getElementById('modeHeader');
const classicInputs = document.getElementById('classicInputs');
const modernInputs = document.getElementById('modernInputs');

const topTextInput = document.getElementById('topText');
const bottomTextInput = document.getElementById('bottomText');
const captionTextInput = document.getElementById('captionText');

const fontSizeRange = document.getElementById('fontSizeRange');
const fontSizeVal = document.getElementById('fontSizeVal');
const capsCheckbox = document.getElementById('capsCheckbox');

const btnCopy = document.getElementById('btnCopy');
const btnDownload = document.getElementById('btnDownload');
const btnClear = document.getElementById('btnClear');
const btnShareApp = document.getElementById('btnShareApp');

const canvasContainer = document.getElementById('canvasContainer');
const dropZone = document.getElementById('dropZone');
const toast = document.getElementById('toast');

function init() {
  renderTemplates();
  bindEvents();
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

function bindEvents() {
  // Layout toggles
  modeOverlay.addEventListener('click', () => setLayout('classic'));
  modeHeader.addEventListener('click', () => setLayout('modern'));

  // Live input
  topTextInput.addEventListener('input', render);
  bottomTextInput.addEventListener('input', render);
  captionTextInput.addEventListener('input', render);

  // File upload
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => loadCustomImage(evt.target.result);
      reader.readAsDataURL(file);
    }
  });

  // Font size
  fontSizeRange.addEventListener('input', (e) => {
    state.fontSize = parseInt(e.target.value, 10);
    fontSizeVal.textContent = `${state.fontSize}px`;
    render();
  });

  // Caps
  capsCheckbox.addEventListener('change', (e) => {
    state.isAllCaps = e.target.checked;
    render();
  });

  // Actions
  btnCopy.addEventListener('click', copyImage);
  btnDownload.addEventListener('click', downloadImage);
  btnClear.addEventListener('click', () => {
    topTextInput.value = '';
    bottomTextInput.value = '';
    captionTextInput.value = '';
    render();
  });

  // Share App link
  if (btnShareApp) {
    btnShareApp.addEventListener('click', shareApp);
  }

  // Clipboard paste (Ctrl+V / Cmd+V)
  window.addEventListener('paste', (e) => {
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
  });

  // Drag and drop
  dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    canvasContainer.classList.add('drag-over');
  });
  dropZone.addEventListener('dragover', (e) => e.preventDefault());
  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    canvasContainer.classList.remove('drag-over');
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

function setLayout(layout) {
  state.layout = layout;
  if (layout === 'classic') {
    modeOverlay.classList.add('active');
    modeHeader.classList.remove('active');
    classicInputs.classList.remove('hidden');
    modernInputs.classList.add('hidden');
  } else {
    modeHeader.classList.add('active');
    modeOverlay.classList.remove('active');
    modernInputs.classList.remove('hidden');
    classicInputs.classList.add('hidden');
    if (!captionTextInput.value.trim() && (topTextInput.value.trim() || bottomTextInput.value.trim())) {
      captionTextInput.value = [topTextInput.value.trim(), bottomTextInput.value.trim()].filter(Boolean).join('\n');
    }
  }
  render();
}

function render() {
  if (!state.activeImage) return;

  const img = state.activeImage;
  const targetWidth = 680;
  const aspectRatio = img.naturalWidth / img.naturalHeight;
  const imgHeight = Math.round(targetWidth / aspectRatio);

  if (state.layout === 'modern') {
    let text = captionTextInput.value;
    if (state.isAllCaps) text = text.toUpperCase();

    const fontSize = state.fontSize;
    const lineHeight = Math.round(fontSize * 1.3);
    const padX = 24;
    const padY = 20;
    const maxTextWidth = targetWidth - (padX * 2);

    ctx.font = `600 ${fontSize}px Inter, -apple-system, BlinkMacSystemFont, sans-serif`;
    const lines = text ? wrapText(ctx, text, maxTextWidth) : [];
    const textHeight = lines.length ? lines.length * lineHeight : 0;
    const headerHeight = lines.length ? textHeight + (padY * 2) : 0;

    canvas.width = targetWidth;
    canvas.height = headerHeight + imgHeight;

    if (headerHeight > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, headerHeight);

      ctx.fillStyle = '#111827';
      ctx.font = `600 ${fontSize}px Inter, -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      let y = padY;
      lines.forEach((line) => {
        ctx.fillText(line, padX, y);
        y += lineHeight;
      });
    }

    ctx.drawImage(img, 0, headerHeight, targetWidth, imgHeight);

  } else {
    canvas.width = targetWidth;
    canvas.height = imgHeight;

    ctx.drawImage(img, 0, 0, targetWidth, imgHeight);

    let topText = topTextInput.value;
    let bottomText = bottomTextInput.value;

    if (state.isAllCaps) {
      topText = topText.toUpperCase();
      bottomText = bottomText.toUpperCase();
    }

    const fontSize = state.fontSize;
    const lineHeight = Math.round(fontSize * 1.15);
    const strokeWidth = Math.max(3, Math.round(fontSize / 8));

    ctx.font = `900 ${fontSize}px Impact, -apple-system, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.textAlign = 'center';

    const maxWidth = targetWidth - 32;
    const centerX = targetWidth / 2;

    if (topText.trim()) {
      ctx.textBaseline = 'top';
      const topLines = wrapText(ctx, topText, maxWidth);
      let topY = 16;
      topLines.forEach((line) => {
        ctx.strokeText(line, centerX, topY);
        ctx.fillText(line, centerX, topY);
        topY += lineHeight;
      });
    }

    if (bottomText.trim()) {
      ctx.textBaseline = 'bottom';
      const bottomLines = wrapText(ctx, bottomText, maxWidth);
      let bottomY = imgHeight - 16;
      for (let i = bottomLines.length - 1; i >= 0; i--) {
        ctx.strokeText(bottomLines[i], centerX, bottomY);
        ctx.fillText(bottomLines[i], centerX, bottomY);
        bottomY -= lineHeight;
      }
    }
  }
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
    if (currentLine) {
      lines.push(currentLine);
    }
  });

  return lines;
}

async function copyImage() {
  try {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        showToast('Could not create image');
        return;
      }
      if (navigator.clipboard?.write && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          showToast('Image copied to clipboard');
          return;
        } catch {
          // Fall through
        }
      }
      downloadImage();
      showToast('Downloaded to device');
    }, 'image/png');
  } catch {
    downloadImage();
  }
}

function downloadImage() {
  const link = document.createElement('a');
  link.download = 'meme.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
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
    } catch {
      // User cancelled or share failed
    }
  }

  // Fallback to clipboard
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('App link copied to clipboard');
      return;
    } catch {}
  }
  showToast('Link: ' + window.location.href);
}

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