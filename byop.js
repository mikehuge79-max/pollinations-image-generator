(() => {
  const POLLINATIONS_APP_CLIENT_ID = "pk_jymkK5wZB9aVFWUh";
  const BYOP_STATE_KEY = "__pig_byop_state";

  // Дублируем формат хранения из app.js, чтобы byop.js не зависел от const внутри app.js
  const STORAGE_KEY = "__pig_k";
  const XOR_SEED = 0x5A;

  function encodeKey(rawKey) {
    const bytes = Array.from(rawKey).map(c => c.charCodeAt(0) ^ XOR_SEED);
    return btoa(String.fromCharCode(...bytes));
  }

  function saveGeneratedUserKey(rawKey) {
    localStorage.setItem(STORAGE_KEY, encodeKey(rawKey));
  }

  function getRedirectUri() {
    return window.location.origin + window.location.pathname;
  }

  function createState() {
    const bytes = new Uint8Array(16);

    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
    }

    return String(Date.now()) + Math.random().toString(16).slice(2);
  }

  function startPollinationsAuth() {
    const state = createState();
    localStorage.setItem(BYOP_STATE_KEY, state);

    const params = new URLSearchParams({
      redirect_uri: getRedirectUri(),
      client_id: POLLINATIONS_APP_CLIENT_ID,
      state,
      scope: "usage",
      budget: "10",
      expiry: "30"
    });

    window.location.href = "https://enter.pollinations.ai/authorize?" + params.toString();
  }

  function handlePollinationsRedirect() {
    if (!window.location.hash) return;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const apiKey = params.get("api_key");
    const error = params.get("error");
    const returnedState = params.get("state");
    const expectedState = localStorage.getItem(BYOP_STATE_KEY);

    if (!apiKey && !error) return;

    if (expectedState && returnedState !== expectedState) {
      localStorage.removeItem(BYOP_STATE_KEY);
      window.history.replaceState(null, "", getRedirectUri());
      alert("Pollinations authorization failed: state mismatch.");
      return;
    }

    localStorage.removeItem(BYOP_STATE_KEY);
    window.history.replaceState(null, "", getRedirectUri());

    if (error) {
      alert("Pollinations authorization failed: " + error);
      return;
    }

    if (apiKey) {
      saveGeneratedUserKey(apiKey);

      if (typeof window.showMainApp === "function") {
        window.showMainApp(apiKey);
      } else {
        window.location.reload();
      }
    }
  }

  function addConnectButton() {
    if (document.getElementById("connect-pollen-btn")) return;

    const saveKeyBtn = document.getElementById("save-key-btn");
    if (!saveKeyBtn) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "connect-pollen-btn";
    btn.textContent = "🌸 Connect Pollinations account";
    btn.style.cssText = [
      "width:100%",
      "margin-top:.75rem",
      "padding:.85rem 1rem",
      "border-radius:12px",
      "border:1px solid rgba(167,115,255,.45)",
      "background:linear-gradient(135deg,#a855f7,#6366f1)",
      "color:#fff",
      "font-weight:700",
      "cursor:pointer"
    ].join(";");

    const hint = document.createElement("p");
    hint.textContent = "Recommended: authorize this app and use your own Pollen balance.";
    hint.style.cssText = "font-size:.76rem;color:var(--clr-muted);margin:.5rem 0 0;line-height:1.4;";

    btn.addEventListener("click", startPollinationsAuth);

    saveKeyBtn.insertAdjacentElement("afterend", btn);
    btn.insertAdjacentElement("afterend", hint);
  }

  handlePollinationsRedirect();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addConnectButton);
  } else {
    addConnectButton();
  }
})();
