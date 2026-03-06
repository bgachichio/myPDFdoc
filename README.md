# myPDFdoc

> A privacy-first, client-side PDF editor — sign, annotate, compress, merge, split and convert PDFs entirely in your browser.

**Live at:** [mypdfdoc.online](https://mypdfdoc.online)

myPDFdoc is a complete PDF toolkit that runs 100% in the browser, with zero uploads, zero servers, and zero accounts required. Every operation — from signing a contract to splitting a multi-page report — is executed locally on the user's device using WebAssembly-powered PDF engines. Files never leave the browser tab.

---

## Features

### PDF Editing & Annotation
- **Sign** — draw a freehand signature, type it in one of four script fonts, or upload an image; place and resize it anywhere on the page
- **Add Text** — annotate pages with styled text; choose font family (sans, serif, mono), size, colour, bold and italic
- **Add Image** — insert PNG or JPEG images onto any page; drag and resize to fit
- **Draw** — freehand pen and eraser directly on the PDF canvas with configurable brush size and colour

### File Operations
- **Rename** — rename the PDF file without re-downloading and re-uploading
- **Compress** — re-serialise and optimise the PDF structure to reduce file size
- **Rotate** — rotate all pages or a specific range by 90°, 180° or 270°
- **Merge** — combine multiple PDFs into one; drag to reorder before merging
- **Split** — split by custom page ranges, every N pages, or extracted page numbers
- **Convert to Image** — export any page or range as high-resolution JPEG or PNG

### Privacy & Infrastructure
- **Zero uploads** — all processing runs in the browser via PDF.js and pdf-lib; no file ever touches a server
- **PWA-ready** — installs as a native-feeling app on Android and iOS; works fully offline after first load
- **Service worker caching** — Workbox pre-caches the app shell and runtime-caches fonts and the PDF.js worker
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection` and `Referrer-Policy` enforced on all responses via Firebase Hosting

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client Only)                     │
│              React 18 · Vite 5 · Tailwind CSS               │
│                                                             │
│  ┌────────────┐  ┌─────────────────────────────────────┐   │
│  │ LandingPage│  │             EditorPage               │   │
│  │            │  │                                     │   │
│  │ Upload zone│  │  ┌─────────────┐ ┌───────────────┐  │   │
│  │ Tool grid  │  │  │  PdfViewer  │ │ Tool Sidebar  │  │   │
│  │ Privacy CTA│  │  │  (PDF.js)   │ │ (per-tool     │  │   │
│  └────────────┘  │  └──────┬──────┘ │  panels)      │  │   │
│                  │         │        └───────────────┘  │   │
│                  │  ┌──────▼──────────────────────┐    │   │
│                  │  │      AnnotationLayer         │    │   │
│                  │  │  Draggable / resizable       │    │   │
│                  │  │  text · image · signature    │    │   │
│                  │  │  overlays + draw canvas      │    │   │
│                  │  └──────────────────────────────┘    │   │
│                  └─────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    pdfUtils.js                       │  │
│  │  addText · addImage · addSignature · addDrawing      │  │
│  │  rotatePdf · compressPdf · mergePdfs · splitPdf      │  │
│  │  convertToImages · renamePdf · bytesToUrl            │  │
│  │  Pure async functions — all powered by pdf-lib       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────┐   ┌────────────────────────────────┐  │
│  │  pdf-lib 1.17   │   │  pdfjs-dist 5.5  (rendering)   │  │
│  │  (manipulation) │   │  Worker runs off-main-thread    │  │
│  └─────────────────┘   └────────────────────────────────┘  │
│                                                             │
│  PWA: vite-plugin-pwa · Workbox service worker             │
│  State: React useState / useRef / useCallback (no Redux)   │
│  Routing: React Router v6                                   │
└─────────────────────────────────────────────────────────────┘
                             │
                    No network calls
                    (files stay local)
                             │
┌────────────────────────────▼────────────────────────────────┐
│                     Firebase Hosting                         │
│   CDN-distributed · HTTPS · SPA rewrites · Security headers │
│   SW: no-cache  ·  JS/CSS: immutable 1-year cache           │
│   Custom domain: mypdfdoc.online · Auto-provisioned SSL     │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 18.3 |
| Build tool | Vite | 5.4 |
| Styling | Tailwind CSS | 3.4 |
| Routing | React Router | 6.26 |
| PDF rendering | PDF.js (`pdfjs-dist`) | 5.5 |
| PDF manipulation | pdf-lib | 1.17 |
| Icons | Lucide React | 0.263 |
| Utility | clsx + tailwind-merge | — |
| PWA | vite-plugin-pwa + Workbox | 1.2 |
| Hosting | Firebase Hosting | — |

---

## Project Structure

```
mypdfdoc/
├── public/
│   ├── favicon.svg                  # SVG favicon (myPDFdoc wordmark)
│   ├── apple-touch-icon.png         # iOS PWA home screen icon
│   └── icons/                       # PWA icon set (72px → 512px)
│
├── src/
│   ├── main.jsx                     # React entry point, BrowserRouter
│   ├── App.jsx                      # Root layout: Navbar + Routes + Footer
│   ├── index.css                    # Tailwind directives + global styles + animations
│   │
│   ├── components/
│   │   ├── Navbar.jsx               # Sticky top bar; logo, nav links, upload CTA
│   │   ├── Footer.jsx               # "Made with ❤️" + Paystack support link
│   │   ├── PdfViewer.jsx            # PDF.js renderer; auto-fit scale; zoom in/out
│   │   └── AnnotationLayer.jsx      # Draggable/resizable overlays + freehand draw canvas
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx          # Hero, upload zone, tool grid, privacy banner
│   │   └── EditorPage.jsx           # Full editor: viewer + sidebar + mobile bottom toolbar
│   │
│   ├── tools/                       # One panel component per tool
│   │   ├── SignPanel.jsx            # Draw / type / upload signature modes
│   │   ├── AddTextPanel.jsx         # Font, size, colour, bold/italic pickers + live preview
│   │   ├── AddImagePanel.jsx        # Image upload with drag-and-drop placement
│   │   ├── DrawPanel.jsx            # Pen/eraser with colour and brush size controls
│   │   ├── CompressPanel.jsx        # One-click compress with before/after file size
│   │   ├── RotatePanel.jsx          # Angle picker + all-pages or page-range scope
│   │   ├── MergePanel.jsx           # Multi-file upload with reorder controls
│   │   ├── SplitPanel.jsx           # Custom ranges / every-N pages / extract modes
│   │   └── ConvertImagePanel.jsx    # JPEG/PNG, resolution (72–216 dpi), page scope
│   │
│   ├── utils/
│   │   └── pdfUtils.js              # All pdf-lib operations (pure async functions)
│   │
│   └── lib/
│       └── utils.js                 # clsx + tailwind-merge helper
│
├── firebase.json                    # Hosting: rewrites, cache headers, security headers
├── .firebaserc                      # Firebase project alias → mypdfdoc
├── vite.config.js                   # Vite + PWA plugin + Rollup chunk splitting
├── tailwind.config.js               # Brand colour (#237352) + font stack
└── package.json
```

---

## Key Design Decisions

**No backend, by design.** The entire processing model is client-side. `pdfUtils.js` is a set of pure async functions that accept a source URL or byte array, run a pdf-lib operation, and return a `Uint8Array`. EditorPage holds live PDF bytes in a `useRef` (not state) so the blob URL lifecycle is managed explicitly — this prevents the "file not found" bug that arises when fetch tries to re-read a garbage-collected blob URL from a previous apply cycle.

**Two-library PDF pipeline.** PDF.js renders pages to canvas for display (read-only, high-fidelity). pdf-lib writes mutations into the PDF document model (write-only, no rendering). They never overlap — each does one job.

**Overlay model.** Text, image, signature and drawing annotations are held as an `overlays` array in React state. They render as absolutely-positioned draggable/resizable `div`s layered over the PDF canvas — purely visual, non-destructive. On "Apply & Save", `doApply()` iterates the overlay array, calls the matching `pdfUtils` function for each annotation, threads the resulting bytes into the next call, then creates one final blob URL. Temp URLs are revoked immediately after each step.

**Scale resolution guard.** `PdfViewer` computes its auto-fit scale into a `resolvedScaleRef` (not state) so the `reportRect` callback always reads a real number. This prevents `pdfWidth = canvas.width / 0 = Infinity` — the root cause of coordinate corruption (`NaN` positions) in the apply pipeline.

**PWA chunk splitting.** Rollup splits pdf-lib (~430 KB), pdfjs (~450 KB) and react-vendor (~160 KB) into separate chunks with content-hash filenames. The service worker pre-caches the app shell; the PDF.js worker is runtime-cached with CacheFirst (30-day TTL) so repeat loads are near-instant.

---

## Local Development

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone

```bash
git clone https://github.com/bgachichio/myPDFdoc.git
cd myPDFdoc
```

### 2. Install

```bash
npm install
```

### 3. Run

```bash
npm run dev
# → http://localhost:5173
```

### 4. Build & preview

```bash
npm run build       # production build → dist/
npm run preview     # serve dist/ locally on port 4173
```

> No environment variables are required. There is no backend, no API keys, and no `.env` file.

---

## Deployment

### Firebase Hosting

```bash
# First time only
npm install -g firebase-tools
firebase login

# Every deploy
npm run build && firebase deploy --only hosting
```

The `firebase.json` config handles:
- All routes rewritten to `/index.html` for SPA routing
- `sw.js` served with `no-cache` so service worker updates propagate immediately
- All JS/CSS/font assets served with `immutable, max-age=31536000` (content-hashed by Vite)
- Security headers on every response

### Custom Domain

Firebase Console → Hosting → Add custom domain → `mypdfdoc.online`. Firebase auto-provisions SSL. DNS propagation takes 24–48 hours.

---

## PWA Installation

**Android (Chrome):** Open [mypdfdoc.online](https://mypdfdoc.online) → three-dot menu → **Add to Home Screen**. Runs fullscreen, works offline.

**iOS (Safari):** Open [mypdfdoc.online](https://mypdfdoc.online) in Safari → tap the **Share** button → **Add to Home Screen** → **Add**. Must use Safari — Chrome on iOS does not support PWA installation.

---

## Bundle

| Chunk | Raw | Gzipped |
|---|---|---|
| `pdf.worker.min.js` (loaded async) | ~1.2 MB | — |
| `pdfjs` | 447 KB | 133 KB |
| `pdf-lib` | 429 KB | 178 KB |
| `react-vendor` | 160 KB | 52 KB |
| `index` (app shell) | 86 KB | 24 KB |
| PWA precache total | 1,194 KB | 29 entries |

---

## Roadmap

- [x] Sign — draw, type, upload
- [x] Add text with font, size, colour, bold/italic
- [x] Add image with drag-and-resize
- [x] Freehand draw + eraser
- [x] Rename, compress, rotate, merge, split, convert to image
- [x] Mobile-optimised UI with bottom toolbar
- [x] PWA — installable on Android and iOS, works offline
- [x] Firebase Hosting + custom domain (mypdfdoc.online)
- [ ] Lock / unlock PDF (password protection)
- [ ] Page reordering (drag pages into a new order)
- [ ] Redaction (black-out sensitive text)
- [ ] Dark mode

---

## Contributing

This is a personal project. Issues and PRs are welcome — please open an issue first for any significant changes.

---

## License

MIT

---

Built by [Brian Gachichio](https://www.linkedin.com/in/briangachichio/) &nbsp;·&nbsp; [X](https://x.com/@b_gachichio) &nbsp;·&nbsp; [Substack](https://gachichio.substack.com) &nbsp;·&nbsp; [Support the project ☕](https://paystack.shop/pay/gachichio)
