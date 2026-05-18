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
function buildImageUrl(params) {
  const { prompt, model, width, height, seed, nologo, apiKey } = params;
  const encoded = encodeURIComponent(prompt.trim());
  const base    = `https://image.pollinations.ai/prompt/${encoded}`;

  const qs = new URLSearchParams({
    model,
    width:   Math.max(64, Math.min(2048, parseInt(width)  || 1024)),
    height:  Math.max(64, Math.min(2048, parseInt(height) || 1024)),
    nologo:  nologo  ? 'true' : 'false',
    key:     apiKey,
  });

  if (seed && seed.toString().trim() !== '') {
    qs.set('seed', parseInt(seed));
  }

  return `${base}?${qs.toString()}`;
}

// ── Generate image ────────────────────────────────────────
async function generateImage() {
  const prompt = promptInput.value.trim();
  if (!prompt) { showError('Please enter a prompt before generating.'); return; }

  const apiKey = loadApiKey();
  if (!apiKey) { clearApiKey(); showSetupScreen(); return; }

  const model  = modelSelect.value;
  const width  = Math.max(64, Math.min(2048, parseInt(widthInput.value)  || 1024));
  const height = Math.max(64, Math.min(2048, parseInt(heightInput.value) || 1024));
  const seed   = seedInput.value?.toString().trim() || '';
  const nologo = nologoChk.checked;

  setLoading(true);
  showOutput('loading');

  try {
    let imageUrl;

    if (currentSourceFile) {
      // POST with FormData for models that accept image input
      const encoded  = encodeURIComponent(prompt);
      const endpoint = `https://gen.pollinations.ai/image/${encoded}`;
      const qs = new URLSearchParams({ model, width, height, key: apiKey, nologo: String(nologo) });
      if (seed) qs.set('seed', seed);

      const form = new FormData();
      form.append('image', currentSourceFile, currentSourceFile.name);

      const resp = await fetch(`${endpoint}?${qs}`, { method: 'POST', body: form });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => resp.statusText);
        throw new Error(`API error ${resp.status}: ${txt.slice(0, 150)}`);
      }
      const blob = await resp.blob();
      imageUrl = URL.createObjectURL(blob);

    } else {
      // GET for text-only generation
      imageUrl = buildImageUrl({ prompt, model, width, height, seed, nologo, apiKey });
    }

    await new Promise((resolve, reject) => {
      const img  = new Image();
      img.onload = () => { generatedImg.src = imageUrl; currentImageUrl = imageUrl; resolve(); };
      img.onerror= () => reject(new Error('Image generation failed. Check your API key or try a different prompt.'));
      img.src    = imageUrl;
    });

    showOutput('image');
  } catch (err) {
    showError(err.message);
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




// MODEL_INFO and MODEL_MODALITIES populated dynamically from API
let MODEL_INFO       = {};
let MODEL_MODALITIES = {};  // { modelName: ["text"] | ["text","image"] }

// ── DOM: image upload ──────────────────────────────────
const imageUploadSection    = document.getElementById('image-upload-section');
const imageDropArea         = document.getElementById('image-drop-area');
const imageFileInput        = document.getElementById('image-file-input');
const imageUploadPlaceholder= document.getElementById('image-upload-placeholder');
const imagePreviewWrap      = document.getElementById('image-preview-wrap');
const sourceImagePreview    = document.getElementById('source-image-preview');
const removeImageBtn        = document.getElementById('remove-image-btn');
const modalityTagsEl        = document.createElement('div');
modalityTagsEl.className    = 'modality-tags';
let currentSourceFile       = null;

// ── Dynamic model loading ──────────────────────────────
async function loadModels() {
  const select = modelSelect;
  const previousValue = select.value || localStorage.getItem('__pig_model') || 'flux';

  try {
    const resp = await fetch('https://gen.pollinations.ai/image/models');
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const all = await resp.json();

    // Image-output only, exclude video
    const models = all.filter(m =>
      Array.isArray(m.output_modalities) &&
      m.output_modalities.includes('image') &&
      !m.output_modalities.includes('video')
    );

    select.innerHTML = '';
    MODEL_INFO       = {};
    MODEL_MODALITIES = {};

    const free = models.filter(m => !m.paid_only);
    const paid = models.filter(m =>  m.paid_only);

    function buildGroup(list, label) {
      if (!list.length) return;
      const grp = document.createElement('optgroup');
      grp.label = label;
      list.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.name;
        const desc   = m.description || m.name;
        const suffix = m.paid_only ? ' (paid only)' : '';
        opt.textContent         = desc + suffix;
        MODEL_INFO[m.name]      = m.paid_only ? '💳 ' + desc + ' — paid plan required.' : desc;
        MODEL_MODALITIES[m.name]= m.input_modalities || ['text'];
        grp.appendChild(opt);
      });
      select.appendChild(grp);
    }

    buildGroup(free, 'Free Models');
    buildGroup(paid, 'Paid Models 💳');

    // Restore selection
    if (select.querySelector(`option[value="${previousValue}"]`)) {
      select.value = previousValue;
    } else if (select.querySelector('option[value="flux"]')) {
      select.value = 'flux';
    } else if (select.options.length) {
      select.selectedIndex = 0;
    }

    updateModelUI();

  } catch (err) {
    console.warn('Model load failed:', err.message);
    select.innerHTML = `
      <optgroup label="Free Models">
        <option value="flux">Flux Schnell - Fast high-quality image generation</option>
        <option value="zimage">Z-Image Turbo - Fast 6B Flux with 2x upscaling</option>
        <option value="klein">FLUX.2 Klein 4B - Fast image generation and editing</option>
        <option value="gptimage">GPT Image 1 Mini - OpenAI image generation model</option>
        <option value="qwen-image">Qwen Image Plus - Alibaba text-to-image and editing</option>
        <option value="wan-image">Wan 2.7 Image - Alibaba text-to-image (up to 2K)</option>
        <option value="gptimage-large">GPT Image 1.5 - OpenAI advanced image generation</option>
        <option value="kontext">FLUX.1 Kontext - In-context editing &amp; generation</option>
      </optgroup>
      <optgroup label="Paid Models 💳">
        <option value="p-image">Pruna p-image - Fast text-to-image (paid only)</option>
        <option value="p-image-edit">Pruna p-image-edit - Image editing (paid only)</option>
        <option value="grok-imagine">Grok Imagine - xAI image generation (paid only)</option>
        <option value="nanobanana">NanoBanana - Gemini 2.5 Flash Image (paid only)</option>
        <option value="nova-canvas">Amazon Nova Canvas - Bedrock Image (paid only)</option>
        <option value="seedream5">Seedream 5.0 Lite - ByteDance ARK (paid only)</option>
        <option value="nanobanana-2">NanoBanana 2 - Gemini 3.1 Flash Image (paid only)</option>
        <option value="grok-imagine-pro">Grok Imagine Pro - xAI pro image (paid only)</option>
        <option value="wan-image-pro">Wan 2.7 Image Pro - Alibaba 4K thinking (paid only)</option>
        <option value="nanobanana-pro">NanoBanana Pro - Gemini 3 Pro Image (paid only)</option>
      </optgroup>`;

    const imgInputModels = ['kontext','klein','gptimage','gptimage-large','qwen-image',
      'wan-image','wan-image-pro','p-image-edit','nanobanana','nanobanana-2','nanobanana-pro','nova-canvas'];
    select.querySelectorAll('option').forEach(opt => {
      MODEL_MODALITIES[opt.value] = imgInputModels.includes(opt.value) ? ['text','image'] : ['text'];
      MODEL_INFO[opt.value]       = opt.textContent;
    });
    if (select.querySelector('option[value="flux"]')) select.value = 'flux';
    updateModelUI();
  }
}

// ── Model UI helpers ───────────────────────────────────
function updateModelInfo() {
  if (window._modelInfoEl) window._modelInfoEl.textContent = MODEL_INFO[modelSelect.value] || '';
}

function updateModalityTags() {
  modalityTagsEl.innerHTML = '';
  (MODEL_MODALITIES[modelSelect.value] || ['text']).forEach(mod => {
    const t = document.createElement('span');
    t.className   = 'modality-tag';
    t.textContent = mod === 'text' ? '📝 text input' : '🖼️ image input';
    modalityTagsEl.appendChild(t);
  });
}

function updateImageUploadVisibility() {
  const supportsImage = (MODEL_MODALITIES[modelSelect.value] || []).includes('image');
  if (imageUploadSection) imageUploadSection.classList.toggle('hidden', !supportsImage);
  if (!supportsImage && typeof clearSourceImage === 'function') clearSourceImage();
}

function updateModelUI() {
  updateModelInfo();
  updateModalityTags();
  updateImageUploadVisibility();
}

// Load immediately + refresh every 15 minutes
loadModels();
setInterval(loadModels, 15 * 60 * 1000);


const modelInfo = document.createElement('p');
modelInfo.style.cssText = 'font-size:.76rem;color:var(--clr-muted);margin-top:.35rem;min-height:1.1em;';
modelSelect.parentElement.appendChild(modelInfo);
modelSelect.parentElement.appendChild(modalityTagsEl);
window._modelInfoEl = modelInfo;

function updateModelInfo() {
  modelInfo.textContent = MODEL_INFO[modelSelect.value] || '';
}
modelSelect.addEventListener('change', () => {
  localStorage.setItem('__pig_model', modelSelect.value);
  updateModelUI();
});
updateModelInfo();
