# PRODUCT_SPECIFICATION.md

# FORMFIT Studio — Product Specification

**BSERC GenAI Internship — Week 2 | Project 02: Form Photo Fixer**
**Product:** FORMFIT Studio
**Version:** 1.0.0
**Category:** Offline-first web application
**Platform:** Desktop (1440 × 1000) and mobile-compatible (390 × 844)

---

## 1. Purpose

FORMFIT Studio helps students, examination candidates and job applicants prepare photographs and signatures according to the requirements of official application and examination forms.

The user uploads, crops, resizes, compresses, validates and downloads photographs and signatures entirely on their own device — no account, no remote uploads, no CDN assets, no tracking.

---

## 2. Mandatory requirements (six official requirements)

1. Upload a photograph.
2. Upload a signature.
3. Provide at least three form presets, each containing required image dimensions and KB limit.
4. Implement photograph cropping with a face guide.
5. Compress photographs to just under the required KB limit.
6. Allow users to create their own custom presets.
7. Allow users to download the finished photographs and signatures.

---

## 3. Official acceptance criteria

The application is complete only when:

- Output meets the requirements of three real forms.
- Official notices for those forms are linked in `documentation/OFFICIAL_FORM_SOURCES.md`.
- Actual file details confirm exported file size in KB.
- A large photograph from a phone works with Wi-Fi disabled.
- Downloaded files open correctly.

Official preset specifications are never fabricated. Custom and demonstration presets are kept separate from official presets.

---

## 4. Product vision

FORMFIT Studio feels like a professional image-processing workspace, not an ordinary image converter:

- Professional photo studio
- Simple image editor
- Intelligent compression engine
- Official form requirement library
- Local export and validation workspace

Simple enough for a first-time user, capable enough for large photographs and strict file-size limits.

### Primary user journey

Open application → Select form preset → Upload photograph → Crop and position face → Adjust image → Compress → Validate → Download

### Secondary user journey

Open application → Upload signature → Crop and adjust signature → Select output settings → Validate → Download

---

## 5. Fixed configuration

| Setting | Value |
|---------|-------|
| Design preference | Premium, modern, editorial, professional |
| Scope | Complete product scope |
| Platform | Offline-first desktop and mobile-compatible web application |
| Account system | None — no login, registration, authentication or cloud account |
| Privacy | No remote uploads, no external APIs, no analytics, no tracking |
| Network | Works offline after local install/open |
| Output formats | JPEG, PNG, WebP where supported |
| KB unit | 1 KB = 1024 bytes |

---

## 6. Technology stack

- React 18, TypeScript, Vite 6
- Lucide React icons (bundled)
- HTML Canvas API, ImageBitmap, Blob, File API, URL.createObjectURL
- IndexedDB for settings, custom presets, history metadata
- vite-plugin-singlefile for standalone `dist/index.html`
- Inter variable font bundled locally
- Vitest unit tests

---

## 7. Application structure

### Main navigation

1. Welcome
2. Dashboard
3. Photo Studio
4. Signature Studio
5. Preset Library
6. Compression Studio
7. Custom Presets
8. Export Center
9. Processing History
10. Settings

### Reference screens (design system)

11. Design System
12. Validation & Errors
13. Empty States

Total: 13 routed screens (13 + 5 mobile variants covered responsively).

---

## 8. Page specifications

### Page 01 — Welcome

- Logo, tagline, short explanation
- Privacy information, offline-first indicator
- Start Preparing button → Dashboard
- No login or registration

### Page 02 — Dashboard

- Welcome heading, active preset badge (verified)
- Quick photograph upload, quick signature upload
- Preset shortcuts
- Getting-started guide
- No meaningless dashboard statistics

### Page 03 — Photo Upload

- Drag-and-drop upload zone, browse files
- Supported formats (JPEG, PNG, WebP), file-size info (up to 50 MB)
- Image preview, replace, remove
- Continue button
- File type validated from magic bytes, not extension

### Page 04 — Photo Crop Editor

- Large image canvas, crop boundary
- Face positioning guide (DOM overlay, never exported)
- Drag-to-position, zoom slider, rotate controls
- Aspect ratio locked to preset (fixed by official spec)
- Reset, Continue

### Page 05 — Photo Adjustment

- Original and processed preview
- Brightness, contrast, saturation
- Target dimensions, output format
- Resolution information, reset adjustments
- Aspect-ratio preservation

### Page 06 — Signature Upload

- Drag-and-drop upload zone, browse files
- Preview, supported formats, replace, remove, Continue

### Page 07 — Signature Editor

- Large signature canvas, crop tool
- Background controls (white paper / transparent), ink contrast
- Brightness, positioning, output format
- Transparency controls where supported
- Final preview; handwriting preserved, not redrawn

### Page 08 — Preset Library

- Searchable preset cards
- Organisation, form name, category, photo/sig dimensions, KB limits, formats, verification status
- Search, filters, category selection, apply preset, view details
- Four verified presets; never invents official specifications

### Page 09 — Preset Details

- Full preset name, organisation
- Photo and signature specifications
- Accepted formats, maximum file sizes
- Official source reference, verification date
- Apply preset action

### Page 10 — Compression Studio

- Target KB input, output format, quality control
- Compression modes: Automatic, Balanced, Maximum, Manual
- Original size, resulting size, size reduction, target status
- Real Blob.size measurement, safety margin

### Page 11 — Before/After Comparison

- Original and compressed image slider
- Original file size, final file size, dimensions, quality info

### Page 12 — Custom Preset Builder

- Create, name, edit, delete presets
- Photo/sig dimensions, KB limits, accepted formats, source URL
- Input validation; custom presets clearly marked unverified

### Page 13 — Export Center

- Final previews, dimensions, format, actual file size
- Validation status, filename
- Download photograph, download signature, download both
- File not reported ready until actually checked

### Page 14 — Export Success

- Success status, final preview, file details
- Validation summary, download actions, return to dashboard
- Reachable only after a real export

### Page 15 — Processing History

- Searchable table: filename, preset, date, original size, final size, output dimensions, format, validation status
- Search, filter, reuse settings, delete record, clear history
- Original images not stored

### Page 16 — Settings

- Appearance (light/dark), density, reduce motion
- Default preset, default output format, default compression mode
- Safety margin, confirm before delete
- Local storage info, clear history, reset preferences
- Privacy explanation, offline info, application version

### Page 17 — Validation Errors

- Unsupported file, invalid image, too large, incorrect dimensions
- Exceeds KB limit, impossible target, export failure, storage failure
- Each error explains the problem and suggests an action

### Page 18 — Empty States

- No uploaded photograph, no uploaded signature, no history
- No presets found, no completed exports

---

## 9. Design system

Colours:

- Background `#F8F7F4`, text `#20211F`, accent `#E66A36`
- Surface `#FFFFFF`, border `#EAE8E2`
- Success `#18866B`, warning `#D99A32`, error `#D9534F`, muted `#777872`
- Typography: Inter (bundled locally)
- Responsive breakpoints: 1180px, 900px, 600px

Full details in `documentation/DESIGN_SYSTEM.md`.

---

## 10. Image processing engine

### Loading

Read files locally, validate file type via magic bytes, decode image, retrieve dimensions and size, release object URLs.

### Cropping

Canvas-based rendering. Supports user-controlled crop, positioning, zoom, rotation, aspect ratio. Face guide is a DOM overlay only — never burned into export.

### Resizing

Exact pixel dimensions, aspect-ratio preservation, high-quality resampling, correct output dimensions.

### Signature processing

Crop, resize, background handling, contrast adjustments, PNG transparency where appropriate, JPEG export where required. Handwriting preserved.

---

## 11. Compression engine

Real iterative compression:

1. Receive image, target KB, format, dimensions
2. Resize according to preset
3. Encode at initial quality
4. Measure actual Blob size
5. Compare with target (strictly below max KB)
6. Binary-search quality for JPEG/WebP
7. PNG handled losslessly with optional downscale
8. Validate final output, return Blob

Strict file-size: output must be below the limit, never at or above it.

---

## 12. Validation engine

Validates actual output:

- Dimensions: passed / failed / N/A
- File size: passed / failed
- Format: passed / failed
- Image integrity: passed / failed
- Overall: ready / not ready

Never claims portal acceptance. Verifies only requirements encoded in the selected preset.

---

## 13. Official presets

Four verified presets bundled in `data/presets.json`:

- IBPS CRP PO/MT — photo 200 × 230 px, 20–50 KB; signature 140 × 60 px, 10–20 KB; JPEG
- GATE 2025 — photo 200–530 × 260–690 px, 5 KB–1 MB; signature 250–580 × 80–180 px, 3 KB–1 MB; JPEG
- UPSC CSE — photo no fixed size, 20–200 KB; signature 350–500 × free, 20–100 KB; JPEG
- NEET UG 2025 — photo no fixed size, 10–200 KB; signature no fixed size, 10–50 KB; JPG/JPEG

Sources documented in `documentation/OFFICIAL_FORM_SOURCES.md`.

---

## 14. Local storage and privacy

IndexedDB for custom presets, history metadata, settings. LocalStorage fallback. Original photographs and signatures are not stored. Clear-history and clear-settings provided. No uploads, no external APIs, no remote fonts/scripts, no analytics.

---

## 15. Export system

Real downloads via `URL.createObjectURL` + anchor click.

Filenames: `FORMFIT_Photo_<Preset>_<W>x<H>.<ext>`, e.g. `FORMFIT_Photo_IBPS-PO_200x230.jpg`.

Blob verified before download. Supports JPEG, PNG, WebP.

---

## 16. Responsive design

Breakpoints at 1180px, 900px, 600px. Mobile bottom navigation below 900px. Touch targets ≥ 44px. Density: comfortable / compact. Dark theme and reduced-motion supported.

---

## 17. Accessibility

Keyboard navigation, visible focus states, accessible labels, appropriate contrast, descriptive errors, clear loading states, meaningful button labels, keyboard-accessible dialogs. Colour never used as the only indicator.

---

## 18. Testing strategy

- Unit: dimensions, aspect ratio, file size, preset validation, compression limits, export filenames, validation statuses
- Integration: upload → crop → resize → compression → validation → download; custom preset creation; history persistence
- Image cases: small/large JPEG, phone photo, portrait/landscape, PNG, WebP, transparent signature, invalid/unsupported file
- Compression cases: very small/moderate/large KB limit, auto/balanced/maximum/manual, impossible target
- Real file verification: file opens, format correct, dimensions correct, size correct, not distorted

---

## 19. Offline acceptance test

1. Build `dist/index.html`
2. Open via `file://`
3. Disable Wi-Fi
4. Open large phone photograph
5. Upload signature
6. Select preset
7. Crop, resize, compress, validate
8. Download photograph and signature
9. Open in another application

No required external network requests. Documented in `documentation/TESTING_REPORT.md`.

---

## 20. Error handling

Failed decoding, memory exhaustion, invalid files, unsupported formats, canvas encoding failures, compression failures, browser limitations, storage errors, download failures, missing presets. Application remains usable after recoverable errors.

---

## 21. Documentation

- `README.md` — overview, features, stack, install, build, offline usage, structure
- `PRODUCT_SPECIFICATION.md` — this file
- `DESIGN_SYSTEM.md` — colours, typography, spacing, components, navigation, responsive rules
- `TECHNICAL_DOCUMENTATION.md` — architecture, pipeline, compression, validation, storage, export, offline distribution
- `USER_GUIDE.md` — how to use
- `OFFICIAL_FORM_SOURCES.md` — verified presets and sources
- `TESTING_REPORT.md` — actual tests and results
- `DEVELOPMENT_LOG.md` — progress and decisions
- `PROJECT_PLAN.md` — project plan
- `prompts/prompts.md` — prompts used
