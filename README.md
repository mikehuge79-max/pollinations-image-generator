# 🌸 Pollinations Image Generator

A polished, browser-based UI for generating AI images with the [Pollinations.ai](https://pollinations.ai) API — no server required.

## ✨ Features

| Feature | Details |
|---------|---------|
| 🔑 Secure key storage | XOR-obfuscated, base64-encoded in `localStorage` |
| 🖼️ 21 AI models | 10 free + 11 paid — full current Pollinations.ai list |
| 📐 Ratio presets | 1:1 · 16:9 · 9:16 · 4:3 · 3:4 · Custom |
| 🎲 Seed control | Reproducible images or random |
| ✨ Prompt enhance | AI-improved prompts via Pollinations |
| ⬇️ Download | One-click PNG download with CORS fallback |
| ⌨️ Keyboard | `Ctrl / ⌘ + Enter` to generate |

## 🚀 Getting Started

1. **Get your API key** at [enter.pollinations.ai](https://enter.pollinations.ai) (free)
2. **Open** `index.html` directly in any modern browser — no server needed
3. **Paste** your publishable key (`pk_…`) into the setup screen
4. **Generate** — craft a prompt, pick a model, hit ✨ Generate

## 🖼️ Available Models

### Free Models

| Display Name | API Value | Notes |
|---|---|---|
| Flux Schnell | `flux` | Default — fast & balanced |
| Z-Image Turbo | `zimage` | High-speed generation |
| FLUX.2 Klein 4B | `klein` | Alpha variant |
| GPT Image 1 Mini | `gptimage` | OpenAI — PRO plan |
| Qwen Image Plus | `qwen-image` | Alibaba model |
| GPT Image 2 | `gpt-image-2` | OpenAI v2 — new |
| Wan 2.7 Image | `wan-image` | New model |
| GPT Image 1.5 | `gptimage-large` | OpenAI — PRO plan |
| FLUX.1 Kontext | `kontext` | Context-aware Flux |
| Seedream | `seedream` | Dream-style artistic |

### Paid Models 💳

| Display Name | API Value |
|---|---|
| Pruna p-image (PAID) | `p-image` |
| Pruna p-image-edit (PAID) | `p-image-edit` |
| Grok Imagine (PAID) | `grok-imagine` |
| NanoBanana (PAID) | `nanobanana` |
| Nova Canvas (PAID) | `nova-canvas` |
| Seedream 5.0 Lite (PAID) | `seedream5` |
| NanoBanana 2 (PAID) | `nanobanana-2` |
| Grok Imagine Pro (PAID) | `grok-imagine-pro` |
| Wan 2.7 Image Pro (PAID) | `wan-image-pro` |
| NanoBanana Pro (PAID) | `nanobanana-pro` |
| Seedream Pro (PAID) | `seedream-pro` |

## 🔒 API Key Security

Your key is:
- Stored **only in your browser's `localStorage`** — never on any server
- Obfuscated with XOR + base64 so it's not plaintext-readable in DevTools
- Cleared instantly from the input field after saving
- Displayed only as a masked preview (e.g. `pk_12••••5678`)

Use your **publishable key** (`pk_…`) — it is safe for client-side use.  
Never paste a secret key (`sk_…`) into any browser app.

## 🖥️ API Used

```
GET https://image.pollinations.ai/prompt/{encoded_prompt}
    ?model=flux
    &width=1024
    &height=1024
    &nologo=true
    &enhance=false
    &seed=12345
    &key=pk_xxxx
```

Full docs: [pollinations.ai API](https://github.com/pollinations/pollinations/blob/main/APIDOCS.md)

## 📁 Project Structure

```
pollinations-image-generator/
├── index.html   # App markup
├── style.css    # All styles
├── app.js       # App logic
└── README.md
```

## 🛠️ Tech Stack

Plain **HTML · CSS · Vanilla JS** · No build tools · No dependencies

## 📄 License

MIT — free to use, modify, and distribute.
