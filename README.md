# myPDFdoc

> Edit PDFs safely, entirely in your browser. No uploads. No servers. 100% private.

Built by [Brian Gachichio](https://www.linkedin.com/in/briangachichio/).

---

## What it does

myPDFdoc is a privacy-first, client-side PDF editor. Every operation — signing, compressing, merging, splitting, annotating — happens locally on your device. Your files never leave your browser.

**Tools available:**
- ✍️ **Sign** — draw, type, or upload your signature
- 📝 **Add Text** — annotate pages with styled text
- 🖼️ **Add Image** — insert images onto any page
- ✏️ **Draw** — freehand drawing and annotation
- 📛 **Rename** — rename the file
- 🗜️ **Compress** — reduce file size
- 🔄 **Rotate** — rotate pages
- 🔀 **Merge** — combine multiple PDFs
- ✂️ **Split** — split into separate files
- 🖼️ **Convert to Image** — export pages as JPEG/PNG

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| PDF rendering | PDF.js |
| PDF manipulation | pdf-lib |
| PWA | vite-plugin-pwa + Workbox |
| Hosting | Firebase Hosting |
| Icons | Lucide React |

---

## Local development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## Deployment (Firebase Hosting)

### First time setup

```bash
# 1. Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Create a Firebase project at https://console.firebase.google.com
#    Then update .firebaserc with your project ID:
#    { "projects": { "default": "your-actual-project-id" } }

# 4. Build the app
npm run build

# 5. Deploy
firebase deploy --only hosting
```

### Subsequent deploys

```bash
npm run build && firebase deploy --only hosting
```

### Custom domain

In [Firebase Console](https://console.firebase.google.com) → Hosting → Add custom domain. 
Firebase auto-provisions SSL. DNS propagation takes 24–48 hours.

---

## PWA installation

On mobile: open the site in Chrome (Android) or Safari (iOS), tap **Share → Add to Home Screen**. The app installs with a native icon, runs fullscreen, and works offline after first load.

---

## Repository

```
mypdfdoc/
├── public/
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   └── icons/          # PWA icons (72px → 512px)
├── src/
│   ├── components/     # PdfViewer, AnnotationLayer, Navbar, Footer
│   ├── pages/          # LandingPage, EditorPage
│   ├── tools/          # One file per tool panel
│   └── utils/          # pdfUtils.js — all PDF operations
├── firebase.json       # Firebase Hosting config
├── .firebaserc         # Firebase project alias
└── vite.config.js      # Vite + PWA plugin config
```

---

## Support

If myPDFdoc saves you time, [buy Brian a coffee ☕](https://paystack.shop/pay/gachichio)
