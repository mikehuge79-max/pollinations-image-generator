/**
 * Pollinations Image Generator
 * app.js — API key management + obfuscation
 */

// ── Constants ──────────────────────────────────────────
const STORAGE_KEY = '__pig_k';      // obfuscated localStorage key name
const XOR_SEED    = 0x5A;           // XOR mask byte for basic obfuscation

// ── Key encoding / decoding ────────────────────────────
function encodeKey(rawKey) {
  // XOR each char code with seed and base64-encode the result
  const bytes = Array.from(rawKey).map(c => c.charCodeAt(0) ^ XOR_SEED);
  return btoa(String.fromCharCode(...bytes));
}

function decodeKey(encoded) {
  try {
    const chars = atob(encoded);
    return Array.from(chars).map(c => String.fromCharCode(c.charCodeAt(0) ^ XOR_SEED)).join('');
  } catch {
    return null;
  }
}

function saveApiKey(rawKey) {
  localStorage.setItem(STORAGE_KEY, encodeKey(rawKey));
}

function loadApiKey() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? decodeKey(stored) : null;
}

function clearApiKey() {
  localStorage.removeItem(STORAGE_KEY);
}

function maskKey(key) {
  if (!key || key.length < 8) return '••••••••';
  return key.slice(0, 6) + '••••' + key.slice(-4);
}

// ── DOM references ──────────────────────────────────────
const setupScreen   = document.getElementById('setup-screen');
const mainApp       = document.getElementById('main-app');
const apiKeyInput   = document.getElementById('api-key-input');
const saveKeyBtn    = document.getElementById('save-key-btn');
const resetKeyBtn   = document.getElementById('reset-key-btn');
const keyError      = document.getElementById('key-error');
const keyBadge      = document.getElementById('key-badge');

// ── Screen switching ────────────────────────────────────
function showSetupScreen() {
  setupScreen.classList.remove('hidden');
  mainApp.classList.add('hidden');
  apiKeyInput.value = '';
}

function showMainApp(key) {
  setupScreen.classList.add('hidden');
  mainApp.classList.remove('hidden');
  keyBadge.textContent = '🔑 ' + maskKey(key);
}

// ── Key validation ──────────────────────────────────────
function isValidKey(key) {
  return typeof key === 'string' && key.trim().length >= 6;
}

// ── Save button handler ─────────────────────────────────
saveKeyBtn.addEventListener('click', () => {
  const raw = apiKeyInput.value.trim();
  if (!isValidKey(raw)) {
    keyError.textContent = 'Please enter a valid API key (minimum 6 characters).';
    keyError.style.display = 'block';
    return;
  }
  keyError.style.display = 'none';
  saveApiKey(raw);
  apiKeyInput.value = '';           // clear the input immediately
  showMainApp(raw);
});

// Allow pressing Enter in key input
apiKeyInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveKeyBtn.click();
});

// ── Reset key button ────────────────────────────────────
resetKeyBtn.addEventListener('click', () => {
  clearApiKey();
  showSetupScreen();
});

// ── Init: decide which screen to show ──────────────────
(function init() {
  const key = loadApiKey();
  if (key) {
    showMainApp(key);
  } else {
    showSetupScreen();
  }
})();

// ── DOM: form controls ──────────────────────────────────
const promptInput   = document.getElementById('prompt');
const modelSelect   = document.getElementById('model');
const widthInput    = document.getElementById('width');
const heightInput   = document.getElementById('height');
const seedInput     = document.getElementById('seed');
const enhanceChk = document.getElementById('enhance');
const nologoChk     = document.getElementById('nologo');
const randomizeBtn  = document.getElementById('randomize-seed');
const generateBtn   = document.getElementById('generate-btn');
const btnText       = document.getElementById('btn-text');
const btnLoading    = document.getElementById('btn-loading');

// ── Aspect ratio presets ────────────────────────────────
document.querySelectorAll('.ratio-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const w = parseInt(btn.dataset.w);
    const h = parseInt(btn.dataset.h);

    if (w > 0 && h > 0) {
      widthInput.value  = w;
      heightInput.value = h;
      widthInput.disabled  = true;
      heightInput.disabled = true;
    } else {
      // Custom: enable manual editing
      widthInput.disabled  = false;
      heightInput.disabled = false;
      widthInput.focus();
    }
  });
});

// ── Randomize seed ──────────────────────────────────────
randomizeBtn.addEventListener('click', () => {
  seedInput.value = Math.floor(Math.random() * 2147483647);
});

// ── Set loading state ───────────────────────────────────
function setLoading(active) {
  generateBtn.disabled = active;
  btnText.classList.toggle('hidden', active);
  btnLoading.classList.toggle('hidden', !active);
}

// ── DOM: output panel ───────────────────────────────────
const placeholder   = document.getElementById('placeholder');
const loadingBox    = document.getElementById('loading-box');
const imageResult   = document.getElementById('image-result');
const generatedImg  = document.getElementById('generated-img');
const downloadBtn   = document.getElementById('download-btn');
const regenBtn      = document.getElementById('regen-btn');
const errorBox      = document.getElementById('error-box');
const errorMsg      = document.getElementById('error-msg');

function showOutput(state) {
  // state: 'placeholder' | 'loading' | 'image' | 'error'
  placeholder.classList.toggle('hidden', state !== 'placeholder');
  loadingBox.classList.toggle('hidden',  state !== 'loading');
  imageResult.classList.toggle('hidden', state !== 'image');
  errorBox.classList.toggle('hidden',    state !== 'error');
}

function showError(msg) {
  errorMsg.textContent = msg;
  showOutput('error');
}

// ── Build image URL ─────────────────────────────────────
function getSelectedModelName(preferredModel) {
  const selectedOption = modelSelect && modelSelect.options
    ? modelSelect.options[modelSelect.selectedIndex]
    : null;

  const model =
    preferredModel ||
    (selectedOption && selectedOption.value) ||
    (modelSelect && modelSelect.value) ||
    localStorage.getItem('__pig_model') ||
    'flux';

  return String(model).trim() || 'flux';
}


function buildImageUrl(params) {
  const { prompt, width, height, seed, nologo, enhance, apiKey } = params;
  const model = getSelectedModelName(params.model);
  const encoded = encodeURIComponent(prompt.trim());
  const base = `https://gen.pollinations.ai/image/${encoded}`;

  const qs = new URLSearchParams({
    model,
    width: String(Math.max(64, Math.min(2048, parseInt(width) || 1024))),
    height: String(Math.max(64, Math.min(2048, parseInt(height) || 1024))),
    nologo: nologo ? 'true' : 'false',
    enhance: enhance ? 'true' : 'false',
    key: apiKey
  });

  if (seed && seed.toString().trim() !== '') {
    qs.set('seed', String(parseInt(seed)));
  }

  const url = `${base}?${qs.toString()}`;
  console.info('[Pollinations] Image request model:', model);
  console.info('[Pollinations] Image request URL:', url);

  return url;
}

// ── Image upload handlers ───────────────────────────────
function clearSourceImage() {
  currentSourceFile = null;
  const wrap = document.getElementById('image-preview-wrap');
  const ph   = document.getElementById('image-upload-placeholder');
  const prev = document.getElementById('source-image-preview');
  const inp  = document.getElementById('image-file-input');
  if (wrap) wrap.classList.add('hidden');
  if (ph)   ph.classList.remove('hidden');
  if (prev) prev.src = '';
  if (inp)  inp.value = '';
}

function applySourceFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  currentSourceFile = file;
  const wrap = document.getElementById('image-preview-wrap');
  const ph   = document.getElementById('image-upload-placeholder');
  const prev = document.getElementById('source-image-preview');
  if (prev) prev.src = URL.createObjectURL(file);
  if (ph)   ph.classList.add('hidden');
  if (wrap) wrap.classList.remove('hidden');
}

// File input change (works for both click-via-label and drag&drop)
const _fileInput = document.getElementById('image-file-input');
if (_fileInput) {
  _fileInput.addEventListener('change', e => {
    if (e.target.files && e.target.files[0]) applySourceFile(e.target.files[0]);
  });
}

// Remove button — prevent label from re-opening file picker
const _removeBtn = document.getElementById('remove-image-btn');
if (_removeBtn) {
  _removeBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    clearSourceImage();
  });
};

// Drag & drop on the label/area
const _dropArea = document.getElementById('image-drop-area');
if (_dropArea) {
  _dropArea.addEventListener('dragover', e => {
    e.preventDefault();
    e.stopPropagation();
    _dropArea.classList.add('drag-over');
  });
  _dropArea.addEventListener('dragleave', e => {
    if (!_dropArea.contains(e.relatedTarget)) {
      _dropArea.classList.remove('drag-over');
    }
  });
  _dropArea.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    _dropArea.classList.remove('drag-over');
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) applySourceFile(file);
  });
}



// ── Generate image ───────────────────────────────────────
async function generateImage() {
  const prompt = promptInput.value.trim();
  const apiKey = loadApiKey();

  if (!prompt) {
    showError('Please enter a prompt first.');
    promptInput.focus();
    return;
  }

  if (!apiKey) {
    showSetupScreen();
    return;
  }

  setLoading(true);
  showOutput('loading');

  try {
    let imageUrl = buildImageUrl({
      prompt,
      model: getSelectedModelName(),
      width: widthInput.value,
      height: heightInput.value,
      seed: seedInput.value,
      nologo: nologoChk.checked,
      enhance: enhanceChk.checked,
      apiKey
    });

    imageUrl += (imageUrl.includes('?') ? '&' : '?') + 'cb=' + Date.now();

    await new Promise((resolve, reject) => {
      const testImg = new Image();
      testImg.onload = resolve;
      testImg.onerror = () => reject(new Error('Image generation failed. Check API key, prompt, model, or network.'));
      testImg.src = imageUrl;
    });

    generatedImg.src = imageUrl;
    showOutput('image');
  } catch (err) {
    console.error(err);
    showError(err.message || 'Image generation failed.');
  } finally {
    setLoading(false);
  }
}


generateBtn.addEventListener('click', generateImage);
regenBtn.addEventListener('click', generateImage);

// ── Download generated image ────────────────────────────
downloadBtn.addEventListener('click', async () => {
  const src = generatedImg.src;
  if (!src) return;

  downloadBtn.textContent = '⏳ Preparing…';
  downloadBtn.disabled = true;

  try {
    const response = await fetch(src);
    const blob     = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href     = objectUrl;
    a.download = `pollinations-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch {
    alert('Download failed. Right-click the image to save it manually.');
  } finally {
    downloadBtn.textContent = '⬇ Download';
    downloadBtn.disabled = false;
  }
});

// ── Keyboard shortcut: Ctrl/Cmd + Enter to generate ────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    if (!generateBtn.disabled) generateImage();
  }
});

// ── Prompt character counter ────────────────────────────
const charCounter = document.createElement('small');
charCounter.style.cssText = 'float:right;font-size:.72rem;color:var(--clr-muted);';
promptInput.parentElement.querySelector('label').appendChild(charCounter);

function updateCharCount() {
  const len = promptInput.value.length;
  charCounter.textContent = `${len} / 1500`;
  charCounter.style.color = len > 1350 ? 'var(--clr-error)' : 'var(--clr-muted)';
}
promptInput.addEventListener('input', updateCharCount);
updateCharCount();

// ── Dimension input validation ─────────────────────────
function clampDimension(input) {
  let v = parseInt(input.value) || 1024;
  v = Math.max(64, Math.min(2048, v));
  // Round to nearest 64 for better compatibility
  v = Math.round(v / 64) * 64;
  input.value = v;
}

widthInput.addEventListener('blur',  () => clampDimension(widthInput));
heightInput.addEventListener('blur', () => clampDimension(heightInput));

// De-activate ratio preset if user manually edits dimensions
[widthInput, heightInput].forEach(inp => {
  inp.addEventListener('input', () => {
    document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.ratio-btn[data-w="0"]').classList.add('active');
  });
});

// ── Model descriptions ──────────────────────────────────

/**
 * Rebuild the custom dropdown from the hidden <select> options.
 * Called after loadModels() populates the native select.
 */




// MODEL_INFO and MODEL_MODALITIES are populated from the Pollinations models API.
let MODEL_INFO = {};
let MODEL_MODALITIES = {};
let CURRENT_MODEL = localStorage.getItem('__pig_model') || 'flux';

// DOM: image upload.
const imageUploadSection = document.getElementById('image-upload-section');
const imageDropArea = document.getElementById('image-drop-area');
const imageFileInput = document.getElementById('image-file-input');
const imageUploadPlaceholder = document.getElementById('image-upload-placeholder');
const imagePreviewWrap = document.getElementById('image-preview-wrap');
const sourceImagePreview = document.getElementById('source-image-preview');
const removeImageBtn = document.getElementById('remove-image-btn');

const modalityTagsEl = document.createElement('div');
modalityTagsEl.className = 'modality-tags';

let currentSourceFile = null;

const modelInfo = document.createElement('p');
modelInfo.style.cssText = 'font-size:.76rem;color:var(--clr-muted);margin-top:.35rem;min-height:1.1em;';
modelSelect.parentElement.appendChild(modelInfo);
modelSelect.parentElement.appendChild(modalityTagsEl);

function getModelLabel(model) {
  return model.description || model.label || model.name || model.id || 'Unknown model';
}

function getModelName(model) {
  return model.name || model.id || model.model || '';
}

function setSelectedModelName(modelName, persist = true) {
  const normalized = String(modelName || '').trim();
  const fallback = modelSelect.querySelector('option[value="flux"]')
    ? 'flux'
    : (modelSelect.options[0] ? modelSelect.options[0].value : 'flux');

  CURRENT_MODEL = normalized || fallback;

  if (modelSelect.querySelector(`option[value="${CSS.escape(CURRENT_MODEL)}"]`)) {
    modelSelect.value = CURRENT_MODEL;
  } else {
    CURRENT_MODEL = fallback;
    modelSelect.value = fallback;
  }

  if (persist) {
    localStorage.setItem('__pig_model', CURRENT_MODEL);
  }

  updateModelUI();
  console.info('[Pollinations] Selected model:', CURRENT_MODEL);
}

function updateModelInfo() {
  modelInfo.textContent = MODEL_INFO[CURRENT_MODEL] || MODEL_INFO[modelSelect.value] || '';
}

function updateModalityTags() {
  modalityTagsEl.innerHTML = '';

  const modalities = MODEL_MODALITIES[CURRENT_MODEL] || MODEL_MODALITIES[modelSelect.value] || ['text'];

  modalities.forEach((modality) => {
    const tag = document.createElement('span');
    tag.className = 'modality-tag';
    tag.textContent = modality === 'image' ? 'image input' : 'text input';
    modalityTagsEl.appendChild(tag);
  });
}

function updateImageUploadVisibility() {
  const modalities = MODEL_MODALITIES[CURRENT_MODEL] || MODEL_MODALITIES[modelSelect.value] || ['text'];
  const supportsImage = modalities.includes('image');

  if (imageUploadSection) {
    imageUploadSection.classList.toggle('hidden', !supportsImage);
  }

  if (!supportsImage && typeof clearSourceImage === 'function') {
    clearSourceImage();
  }
}

function updateModelUI() {
  updateModelInfo();
  updateModalityTags();
  updateImageUploadVisibility();
}

function addModelOption(group, model) {
  const modelName = getModelName(model);
  if (!modelName) return;

  const label = getModelLabel(model);
  const option = document.createElement('option');

  option.value = modelName;
  option.textContent = label + (model.paid_only ? ' (paid only)' : '');
  option.dataset.modelName = modelName;

  MODEL_INFO[modelName] = model.paid_only
    ? `${label} — paid plan required.`
    : label;

  MODEL_MODALITIES[modelName] = Array.isArray(model.input_modalities) && model.input_modalities.length
    ? model.input_modalities
    : ['text'];

  group.appendChild(option);
}

function buildModelGroup(models, label) {
  if (!models.length) return null;

  const group = document.createElement('optgroup');
  group.label = label;

  models.forEach((model) => addModelOption(group, model));

  return group.children.length ? group : null;
}

function loadFallbackModels() {
  const fallbackModels = [
    { name: 'flux', description: 'Flux Schnell - fast high-quality image generation', input_modalities: ['text'], paid_only: false },
    { name: 'zimage', description: 'Z-Image Turbo - fast image generation', input_modalities: ['text'], paid_only: false },
    { name: 'gptimage-mini', description: 'GPT Image 1 Mini - OpenAI image generation', input_modalities: ['text', 'image'], paid_only: false },
    { name: 'qwen-image', description: 'Qwen Image Plus - Alibaba text-to-image and editing', input_modalities: ['text', 'image'], paid_only: false },
    { name: 'wan-image', description: 'Wan Image - Alibaba text-to-image', input_modalities: ['text', 'image'], paid_only: false },
    { name: 'gptimage-large', description: 'GPT Image 1.5 - OpenAI advanced image generation', input_modalities: ['text', 'image'], paid_only: false },
    { name: 'kontext', description: 'FLUX.1 Kontext - in-context editing and generation', input_modalities: ['text', 'image'], paid_only: false },
    { name: 'p-image', description: 'Pruna p-image - fast text-to-image', input_modalities: ['text'], paid_only: true },
    { name: 'p-image-edit', description: 'Pruna p-image-edit - image editing', input_modalities: ['text', 'image'], paid_only: true },
    { name: 'grok-imagine', description: 'Grok Imagine - xAI image generation', input_modalities: ['text'], paid_only: true },
    { name: 'nanobanana', description: 'NanoBanana - Gemini Flash Image', input_modalities: ['text', 'image'], paid_only: true },
    { name: 'nova-canvas', description: 'Amazon Nova Canvas - Bedrock Image', input_modalities: ['text', 'image'], paid_only: true }
  ];

  renderModels(fallbackModels);
}

function renderModels(models) {
  const previousModel =
    CURRENT_MODEL ||
    localStorage.getItem('__pig_model') ||
    modelSelect.value ||
    'flux';

  modelSelect.innerHTML = '';
  MODEL_INFO = {};
  MODEL_MODALITIES = {};

  const imageModels = models.filter((model) => {
    const output = Array.isArray(model.output_modalities) ? model.output_modalities : ['image'];
    return output.includes('image') && !output.includes('video');
  });

  const freeModels = imageModels.filter((model) => !model.paid_only);
  const paidModels = imageModels.filter((model) => model.paid_only);

  const freeGroup = buildModelGroup(freeModels, 'Free Models');
  const paidGroup = buildModelGroup(paidModels, 'Paid Models');

  if (freeGroup) modelSelect.appendChild(freeGroup);
  if (paidGroup) modelSelect.appendChild(paidGroup);

  setSelectedModelName(previousModel, false);
}

async function loadModels() {
  try {
    const response = await fetch('https://gen.pollinations.ai/image/models', {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Expected JSON models response, got: ' + contentType);
    }

    const models = await response.json();

    if (!Array.isArray(models)) {
      throw new Error('Models response is not an array');
    }

    renderModels(models);
  } catch (error) {
    console.warn('Model load failed:', error);
    loadFallbackModels();
  }
}

modelSelect.addEventListener('change', () => {
  setSelectedModelName(modelSelect.value, true);
});

loadModels();
setInterval(loadModels, 15 * 60 * 1000);
