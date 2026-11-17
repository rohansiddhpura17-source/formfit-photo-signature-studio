# FORMFIT Studio

Offline-first photo & signature preparation for official application forms.

**BSERC GenAI Internship — Week 2 | Project 02: Form Photo Fixer**
**Project root:** `02-Form-Photo-Fixer`

---

## 1. What it does

FORMFIT Studio helps students, examination candidates and job applicants prepare photographs and signatures that match the exact dimensions, format and KB limit of their application forms — **without sending a single pixel to a server**.

Everything runs on the user's device:

- Upload photographs and signatures (JPEG, PNG, WebP; up to 50 MB)
- Select from verified official form presets (IBPS PO/MT, GATE 2025, UPSC CSE, NEET UG 2025)
- Crop with a face-positioning guide, zoom, rotate and position
- Adjust tone (brightness/contrast/saturation)
- Compress to just under the KB limit using real iterative JPEG/WebP compression measured against `Blob.size`
- Validate the real encoded file against the preset
- Download finished files
- Build and manage custom presets
- Browse processing history locally (IndexedDB)
- No account, no registration, no uploads, no tracking

---

## 2. Feature checklist

| Area | Status |
|------|--------|
| Photograph upload | Drag-and-drop, browse, preview, replace, remove |
| Signature upload | Drag-and-drop, browse, preview, replace, remove |
| Photo crop editor | Fixed-aspect frame, pan/zoom, rotate, face guide overlay (DOM, never exported) |
| Photo adjustment | Brightness, contrast, saturation; original vs processed preview |
| Signature editor | Paper cleanup, ink threshold, transparency toggle |
| Compression studio | Binary-search JPEG/WebP, PNG lossless, dimension reduction, safety margin |
| Before/after comparison | Original vs compressed slider |
| Preset library | Search, filters, four verified official presets |
| Custom preset builder | Create/edit/delete unverified local presets |
| Export center | Real file validation, filenames, download individually or both |
| Export success | Reachable only after a real download |
| Processing history | Search, filter, reuse, delete, clear |
| Settings | Theme, density, reduce motion, defaults, storage clear |
| Offline distribution | Single-file `dist/index.html`, Inter font inlined |

---

## 3. Technology stack

- React 18, TypeScript, Vite 6
- Lucide React icons (bundled locally)
- HTML Canvas API for all image processing
- IndexedDB for custom presets and processing metadata
- `vite-plugin-singlefile` for standalone `dist/index.html`
- Inter variable font bundled locally (`src/assets/Inter-var.woff2`)
- Vitest unit tests (`tests/unit`)

---

## 4. Getting started

### Prerequisites

Node.js 18+ and npm.

### Install

```bash
cd /Volumes/PortableSSD/BSERC-WEEK-2/02-Form-Photo-Fixer
npm install
```

### Develop (local server)

```bash
npm run dev
```

Open `http://localhost:5175/`.

### Build (offline distribution)

```bash
npm run build
```

Produces `dist/index.html` (~568 KB) — a single self-contained HTML file with JS, CSS and the Inter font inlined as data URLs. Open it directly via `file://` with no network access.

### Typecheck & tests

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest
```

---

## 5. Project structure

```
02-Form-Photo-Fixer/
├── dist/
│   └── index.html          # standalone offline build
├── data/
│   └── presets.json        # four verified official presets
├── documentation/          # all project documentation
├── evidence/               # screenshots captured during testing
├── prompts/
│   └── prompts.md
├── public/
│   └── fonts/
│       └── Inter-var.woff2
├── src/
│   ├── app/                # context, router, shell
│   ├── components/         # common, layout, upload, editor, compression
│   ├── engines/            # cropper, loader, compression, validation, export
│   ├── pages/              # all 18 screens
│   ├── services/           # presets, storage
│   ├── styles/             # tokens, components, studio, workspace, forms, reference, responsive, global
│   ├── types/
│   └── utils/
└── tests/
    └── unit/
```

---

## 6. Official presets (verified)

Four verified presets are bundled in `data/presets.json`:

| Preset | Organisation | Photo | Signature | Formats | Source verified |
|--------|-------------|-------|-----------|---------|-----------------|
| IBPS CRP PO/MT | IBPS | 200 × 230 px, 20–50 KB | 140 × 60 px, 10–20 KB | JPEG | Official IBPS notice |
| GATE 2025 | IIT Roorkee | 200–530 × 260–690 px, 5 KB–1 MB | 250–580 × 80–180 px, 3 KB–1 MB | JPEG | Official GATE 2025 page |
| UPSC CSE | UPSC | No fixed pixel size, 20–200 KB | 350–500 × free height, 20–100 KB | JPEG | Official UPSC notice |
| NEET UG 2025 | NTA | No fixed pixel size, 10–200 KB | No fixed pixel size, 10–50 KB | JPG/JPEG | Official NEET UG 2025 bulletin |

Full sources and verification notes are in `documentation/OFFICIAL_FORM_SOURCES.md`.

---

## 7. Offline acceptance test

The application was opened via `file://` (`dist/index.html`) with Wi-Fi disabled:

1. Loaded the standalone build
2. Disabled network
3. Uploaded a large sample photograph and signature
4. Selected IBPS PO preset
5. Cropped, resized, compressed and validated
6. Downloaded photograph and signature
7. Confirmed exported files open correctly

No external network requests were made. Fonts, icons, presets and engines are all bundled.

---

## 8. Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite dev server on :5175 |
| `npm run build` | Typecheck + single-file production build → `dist/index.html` |
| `npm run preview` | Serve `dist/` locally |
| `npm run test` | Run Vitest unit tests |
| `npm run typecheck` | TypeScript project reference build |

---

## 9. Documentation

| Document | Location |
|----------|----------|
| Product specification | `documentation/PRODUCT_SPECIFICATION.md` |
| Design system | `documentation/DESIGN_SYSTEM.md` |
| Technical documentation | `documentation/TECHNICAL_DOCUMENTATION.md` |
| User guide | `documentation/USER_GUIDE.md` |
| Official form sources | `documentation/OFFICIAL_FORM_SOURCES.md` |
| Testing report | `documentation/TESTING_REPORT.md` |
| Development log | `documentation/DEVELOPMENT_LOG.md` |
| Project plan | `PROJECT_PLAN.md` |
| Prompts | `prompts/prompts.md` |

---

## 10. Browser & offline notes

- Tested direct `file://` opening of `dist/index.html`.
- No CDN assets, no remote fonts, no remote scripts.
- IndexedDB falls back to `localStorage` if the browser refuses persistent storage.
- The Figma design reference URL (`https://www.figma.com/design/WWwfZ010Cso551yXpgcuwt`) returns HTTP 403 without auth and was not inspected; the build follows the written design system instead. This is documented honestly rather than claimed as completed.

---

**Version:** 1.0.0 · Offline build · No account · No uploads · No tracking
\n
---

## 👨‍💻 Developer & Contact

**Rohan Siddhpura**  
*B.Tech in Information Technology — RK University*  
- **GitHub:** [@rohansiddhpura17-source](https://github.com/rohansiddhpura17-source)  
- **Email:** [rohansiddhpura17@gmail.com](mailto:rohansiddhpura17@gmail.com)  
- **Open for:** Software Engineering Internships, Graduate Roles & Open-Source Collaboration
