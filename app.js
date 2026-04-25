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
const enhanceChk    = document.getElementById('enhance');
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
  const { prompt, model, width, height, seed, enhance, nologo, apiKey } = params;
  const encoded = encodeURIComponent(prompt.trim());
  const base    = `https://image.pollinations.ai/prompt/${encoded}`;

  const qs = new URLSearchParams({
    model,
    width:   Math.max(64, Math.min(2048, parseInt(width)  || 1024)),
    height:  Math.max(64, Math.min(2048, parseInt(height) || 1024)),
    nologo:  nologo  ? 'true' : 'false',
    enhance: enhance ? 'true' : 'false',
    key:     apiKey,
  });

  if (seed && seed.toString().trim() !== '') {
    qs.set('seed', parseInt(seed));
  }

  return `${base}?${qs.toString()}`;
}

// ── Generate image ──────────────────────────────────────
async function generateImage() {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    showError('Please enter a prompt before generating.');
    return;
  }

  const apiKey = loadApiKey();
  if (!apiKey) {
    clearApiKey();
    showSetupScreen();
    return;
  }

  const params = {
    prompt,
    model:   modelSelect.value,
    width:   widthInput.value,
    height:  heightInput.value,
    seed:    seedInput.value,
    enhance: enhanceChk.checked,
    nologo:  nologoChk.checked,
    apiKey,
  };

  setLoading(true);
  showOutput('loading');

  try {
    const url = buildImageUrl(params);

    // Load the image through an Image element so we get proper error events
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        generatedImg.src = url;
        resolve();
      };
      img.onerror = () => reject(new Error('Image generation failed. Check your API key or try a different prompt.'));
      img.src = url;
    });

    // Store URL for download
    generateBtn.dataset.lastUrl = url;
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
  charCounter.textContent = `${len} / 500`;
  charCounter.style.color = len > 450 ? 'var(--clr-error)' : 'var(--clr-muted)';
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
