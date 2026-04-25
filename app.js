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
