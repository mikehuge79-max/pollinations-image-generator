# 🌸 Pollinations Image Generator

A polished, browser-based UI for generating AI images with the [Pollinations.ai](https://pollinations.ai) API — no server required.

## ✨ Features

| Feature | Details |
|---------|---------|
| 🔑 Secure key storage | XOR-obfuscated, base64-encoded in `localStorage` |
| 🖼️ 21 AI models | Full current Pollinations.ai model list (free + paid) |
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

| Display Name | API Value | Badge |
|---|---|---|
| Flux Schnell | `flux` | — |
| Z-Image Turbo | `zimage` | — |
| Pruna p-image | `p-image` | — |
| FLUX.2 Klein K8 | `klein` | PLUS |
| GPT Image 1 Mini | `gptimage` | PRO |
| NanoBanana | `nanobanana` | — |
| NanoBanana 2 | `nanobanana-2` | — |
| Qwen Image Plus | `qwen-image` | — |
| Seedream 5.0 Lite | `seedream5` | — |
| Seedream | `seedream` | — |
| GPT Image 2 | `gpt-image-2` | NEW |
| Wan 3.7 Image | `wan-image` | NEW |
| GPT Image 1.5 | `gptimage-large` | PRO |

### Paid Models 💳

| Display Name | API Value |
|---|---|
| Pruna p-image-edit (PAID) | `p-image-edit` |
| Grok Imagine (PAID) | `grok-imagine` |
| FLUX.1 Kontext (PAID) | `kontext` |
| Nova Canvas (PAID) | `nova-canvas` |
| Grok Imagine Pro (PAID) | `grok-imagine-pro` |
| NanoBanana Pro (PAID) | `nanobanana-pro` |
| Wan 3.7 Image Pro (PAID) | `wan-image-pro` |
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
