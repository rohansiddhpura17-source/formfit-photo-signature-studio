# PROJECT_PLAN.md

# FORMFIT Studio — Project Plan

**Product:** FORMFIT Studio  
**Project:** BSERC GenAI Internship — Week 2 | Project 02: Form Photo Fixer  
**Project root:** `/Volumes/PortableSSD/BSERC-WEEK-2/02-Form-Photo-Fixer`  
**Plan date:** 2026-11-07  
**Status:** Complete (all phases delivered)

---

## 1. Objective

Build FORMFIT Studio, a complete offline-first React/TypeScript photo & signature preparation app with 18 screens (13 routed + reference), real canvas processing, compression, validation, export, docs, tests, and offline distribution as a single-file `dist/index.html` that opens via `file://`.

---

## 2. Requirements (six mandatory)

1. Upload a photograph
2. Upload a signature
3. At least three form presets with dimensions and KB limits
4. Photograph cropping with a face guide
5. Compress photographs to just under the KB limit
6. Custom presets
7. Download finished photographs and signatures

---

## 3. Implementation phases

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Repository inspection, project plan | ✅ Complete |
| 1 | Foundation: Vite, router, context, shell, components, design tokens, Inter font | ✅ Complete |
| 2 | Dashboard and upload: Welcome, Dashboard, PhotoUpload, SignatureUpload, image loader | ✅ Complete |
| 3 | Photo Studio: cropper, face guide, zoom/rotate, PhotoCrop, PhotoAdjust | ✅ Complete |
| 4 | Signature Studio: SignatureEditor, paper cleanup, ink threshold | ✅ Complete |
| 5 | Preset library: four verified presets, PresetLibrary, PresetDetails, custom presets | ✅ Complete |
| 6 | Compression engine: iterative JPEG/WebP, PNG lossless, strict KB, CompressionStudio | ✅ Complete |
| 7 | Validation and export: validation engine, ExportCenter, ExportSuccess, ComparePage | ✅ Complete |
| 8 | History and settings: IndexedDB, ProcessingHistory, SettingsPage | ✅ Complete |
| 9 | Offline distribution: singlefile build, `dist/index.html`, file:// test | ✅ Complete |
| 10 | QA and polish: CSS (reference, responsive, global), unit tests, docs, screenshots | ✅ Complete |

---

## 4. Deliverables

### Code
- `src/` — React/TypeScript application (engines, services, components, pages, types, utils, styles)
- `data/presets.json` — four verified official presets
- `public/fonts/Inter-var.woff2` — bundled font (also in `src/assets`)
- `dist/index.html` — standalone offline build (~568 KB)
- `package.json`, `vite.config.ts`, `tsconfig.json`

### Tests
- `tests/unit/` — 6 test files, 54 tests, all passing

### Documentation
- `README.md`
- `documentation/PRODUCT_SPECIFICATION.md`
- `documentation/DESIGN_SYSTEM.md`
- `documentation/TECHNICAL_DOCUMENTATION.md`
- `documentation/USER_GUIDE.md`
- `documentation/OFFICIAL_FORM_SOURCES.md`
- `documentation/TESTING_REPORT.md`
- `documentation/DEVELOPMENT_LOG.md`
- `documentation/PROJECT_PLAN.md` (this file)
- `prompts/prompts.md`

### Evidence
- `evidence/` — screenshots at 1440 × 1000 and 390 × 844

---

## 5. Presets (verified)

| Preset | Organisation | Photo | Signature | Formats | Source verified |
|--------|-------------|-------|-----------|---------|-----------------|
| IBPS CRP PO/MT | IBPS | 200 × 230 px, 20–50 KB | 140 × 60 px, 10–20 KB | JPEG | Official IBPS notice |
| GATE 2025 | IIT Roorkee | 200–530 × 260–690 px, 5 KB–1 MB | 250–580 × 80–180 px, 3 KB–1 MB | JPEG | Official GATE 2025 page |
| UPSC CSE | UPSC | No fixed size, 20–200 KB | 350–500 × free, 20–100 KB | JPEG | Official UPSC notice |
| NEET UG 2025 | NTA | No fixed size, 10–200 KB | No fixed size, 10–50 KB | JPG/JPEG | Official NEET UG 2025 bulletin |

Full sources: `documentation/OFFICIAL_FORM_SOURCES.md`

---

## 6. Acceptance criteria (all met)

- [x] Output meets requirements of three real forms (four verified presets)
- [x] Official notices linked in `documentation/OFFICIAL_FORM_SOURCES.md`
- [x] Actual exported file sizes confirmed in KB (real Blob.size)
- [x] Large photograph processed with Wi-Fi disabled (offline acceptance test passed)
- [x] Downloaded files open correctly
- [x] No fabricated official requirements
- [x] Custom presets kept separate from verified presets
- [x] No external network requests in standalone build

---

## 7. Commands

| Task | Command |
|------|---------|
| Install | `npm install` |
| Develop | `npm run dev` (localhost:5175) |
| Build | `npm run build` (→ `dist/index.html`) |
| Preview | `npm run preview` |
| Typecheck | `npm run typecheck` |
| Tests | `npm test` |

---

## 8. Risks and limitations

- Figma design reference URL returns HTTP 403 without auth; not inspected — design follows the written spec, documented honestly
- PNG compression is lossless (browser encoder limitation) — not faked
- IndexedDB may be blocked in private modes; localStorage fallback provided
- Mobile layouts verified visually, not via automated E2E
