# DEVELOPMENT_LOG.md

# FORMFIT Studio — Development Log

**Product:** FORMFIT Studio  
**Project:** BSERC GenAI Internship — Week 2 | Project 02: Form Photo Fixer  
**Log date:** 2026-11-07

---

## Phase 0 — Repository inspection

- Inspected workspace: project folder `02-Form-Photo-Fixer` was empty
- No git repository existed
- Confirmed dependencies available: React 18, Vite 6, TypeScript, lucide-react, vite-plugin-singlefile, vitest
- Created `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- Created `PROJECT_PLAN.md`

---

## Phase 1 — Foundation

- Configured Vite with `vite-plugin-singlefile` for standalone `dist/index.html`
- `assetsInlineLimit: 100_000_000` to inline Inter variable woff2 font
- Custom hash router (works under `file://`, no React Router)
- AppContext global state: settings, custom presets, history, toasts, photo/signature jobs, route
- AppShell with sidebar, topbar (breadcrumbs, offline chip, help, settings), mobile nav
- Reusable components: Button, Badge, Notice, Field (TextInput/NumberInput/Select/Checkbox/Segmented/Switch/Slider/ProgressBar), EmptyState, Modal, Feedback
- Design tokens in CSS custom properties: bg `#F8F7F4`, text `#20211F`, accent `#E66A36`, surface `#FFFFFF`, border `#EAE8E2`, success `#18866B`, warning `#D99A32`, error `#D9534F`, muted `#777872`
- Inter font copied to `src/assets/Inter-var.woff2`

---

## Phase 2 — Dashboard and upload

- Welcome page with editorial hero, privacy points, Start preparing
- Dashboard with active preset badge, photograph/signature action tiles
- PhotoUpload with drag-and-drop zone, browse, sample image, format/size info
- SignatureUpload with drag-and-drop zone, browse, sample signature
- Image loading via `imageLoader.ts`: magic-byte sniffing, ≤ 50 MB limit, decode, object URL release

---

## Phase 3 — Photo Studio

- `imageCropper.ts`: `renderCrop()` used for both preview and export; rotation at canvas centre, cover scale, zoom, tone adjustments, signature paper removal
- Face guide is a DOM overlay only — never exported; no facial recognition claimed
- PhotoCrop: fixed-aspect frame, pan/zoom, rotate, aspect locked by preset, Continue
- PhotoAdjust: brightness/contrast/saturation, original vs processed preview, dimensions locked to preset

---

## Phase 4 — Signature Studio

- SignatureEditor: crop, white paper/transparent toggle, ink threshold 82%, output 140 × 60 px
- Transparency warning when preset requires JPEG
- Handwriting preserved, not redrawn

---

## Phase 5 — Preset library

- `data/presets.json`: four verified presets (IBPS PO/MT, GATE 2025, UPSC CSE, NEET UG 2025) with official sources
- PresetLibrary: search, category filters, verification badges, apply
- PresetDetails: full specs, official source link, apply
- CustomPresetBuilder: create/edit/delete, live summary, unverified marking
- `presetService.ts`: `updateCustomPreset`, `presetToCustomInput`, `buildCustomPreset`
- `AppContext.updatePreset`; `deletePreset` resets jobs when active preset deleted

---

## Phase 6 — Compression engine

- `compressionEngine.ts`: real iterative JPEG/WebP binary-search quality; PNG lossless; strict `< maxKB`; 1024 bytes/KB; dimension reduction in 10% steps; honest failure reporting
- Refactored `search()` to return `{ best, smallest, attempts }` — fixed TypeScript closure-narrowing errors
- `npx tsc --noEmit` passes
- CompressionStudio: target KB, format, modes (auto/balanced/maximum/manual), safety margin, file-size window, attempts, duration

---

## Phase 7 — Validation and export

- `validationEngine.ts`: validates real encoded Blob — integrity, format, accepted-by-preset, dimensions (exact/range/N/A), aspect, max-size, min-size; statuses pass/fail/na; never claims portal acceptance
- `exportEngine.ts`: sanitizeSegment, buildFileName (`FORMFIT_Photo_<Preset>_<W>x<H>.<ext>`), downloadBlob, previewUrl
- ExportCenter: async validation via `setPhotoResult`/`setSignatureResult`, download individually/both, recompress, download anyway
- ExportSuccess only reachable after `setLastExport` from a real download
- ComparePage: before/after slider with real encoded files

---

## Phase 8 — History and settings

- `storageService.ts`: IndexedDB `formfit-studio` (kv, presets, history) with localStorage fallback
- ProcessingHistory: search, filter, reuse, delete, clear; metadata only (no images stored)
- SettingsPage: appearance, density, defaults, storage, clear-all
- History does not persist original images

---

## Phase 9 — Offline distribution

- `vite-plugin-singlefile` build → `dist/index.html` ~568 KB
- Inter font inlined as data URL
- Verified direct `file://` opening with Wi-Fi disabled
- Removed `public/fonts` (font now sourced from `src/assets`)

---

## Phase 10 — CSS completion

- Created `src/styles/reference.css` — design-system, error-pattern, empty-state page styles (`ds-*`, `error-*`, `empty-*`, `offline-state`, `error-table`, `error-boundary-preview`)
- Created `src/styles/responsive.css` — breakpoints 1180/900/600px, density overrides, dark-theme checkerboard/shadow tweaks, reduced-motion rules, mobile bottom-nav layout, studio-bar mobile adjustments
- Created `src/styles/global.css` — `@import` chain: tokens, components, studio, workspace, forms, reference, responsive
- `npm run build` passes; `dist/index.html` built successfully
- Fixed `.dash-actions` mobile single-column and `.action-tile__go` nowrap

---

## Phase 10 — Tests and documentation

- Added Vitest config `exclude: ['**/node_modules/**', '**/._*']` to ignore macOS resource-fork files
- Deleted stale `._*` resource-fork files from `src`, `tests`, `data`, `documentation`, `prompts`, `public`
- Wrote 6 unit test files (54 tests): format, geometry, presets, export, compression, validation — all passing
- Wrote documentation: README.md, PRODUCT_SPECIFICATION.md, DESIGN_SYSTEM.md, TECHNICAL_DOCUMENTATION.md, USER_GUIDE.md, OFFICIAL_FORM_SOURCES.md, TESTING_REPORT.md
- Captured screenshots in `evidence/`: desktop-welcome, mobile-welcome, mobile-dashboard, desktop-compression, plus live-browser captures of dashboard, crop editor, compression, export center, signature editor, presets, settings, design system

---

## Technical decisions

- Custom hash router instead of React Router — works under `file://`
- Same `renderCrop()` for preview and export — what you see is what you export
- Face guide as DOM overlay only — never in exported file
- Compression binary search quality for JPEG/WebP; PNG lossless with optional downscale
- Strict `< maxKB` with 1024 bytes/KB
- Presets with unspecified dimensions validate as N/A with honest messaging
- Mobile handled responsively, not separate mockup files
- Clear distinction between verified official presets and custom presets in UI and docs

---

## Remaining items

- `prompts/prompts.md` — to be created
- `PROJECT_TRACKER.md` status update — to be created
- Screenshots to be captured into `evidence/02-Form-Photo-Fixer` (partial; done for key pages)
