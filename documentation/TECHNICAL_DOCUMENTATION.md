# TECHNICAL_DOCUMENTATION.md

# FORMFIT Studio — Technical Documentation

**Version:** 1.0.2  
**Product:** FORMFIT Studio — Offline Photo & Signature Preparation

---

## 1. Architecture

Separation of concerns across UI, processing engines, storage and business logic:

```
src/
  app/          AppContext (global state), custom hash router, AppShell
  components/   Common UI, layout (sidebar/header), upload, editor, compression
  pages/        All routed screens
  engines/      imageLoader, imageCropper, compressionEngine, validationEngine, exportEngine
  services/     presetService, storageService (IndexedDB + localStorage fallback)
  types/        Shared TypeScript interfaces
  utils/        format (bytes/KB/dates), geometry (aspect/fit/recommended dims)
  styles/       Design tokens + component/page/responsive CSS
```

### State management

`AppContext` holds: settings (appearance, density, defaults), custom presets, history, toasts, photo job, signature job, route. `activePreset` follows `photo.presetId`, while `activeSignaturePreset` follows `signature.presetId` independently. Presets array = `[...BUILTIN_PRESETS, ...customPresets]`.

### Routing

Custom hash router (`src/app/routes.ts`) — works under `file://` without React Router. `parseHash()` parses `#/path?query` into path, segments and query. `App.tsx` renders pages behind an `ErrorBoundary` + `AppProvider` + `AppShell`.

---

## 2. Image-processing pipeline

### Loading — `engines/imageLoader.ts`

- `sniffImageType(file)` reads magic bytes (JPEG FF D8 FF, PNG 89 50 4E 47, WebP RIFF....WEBP) — never trusts the extension
- `loadImageFile(file)` validates size (≤ 50 MB), type, decodes via `Image`, returns `LoadedImage` with natural dimensions and revocable object URL
- `canvasToBlob(canvas, type, quality)` wraps `canvas.toBlob`
- `blobDecodes(blob)` re-decodes via `createImageBitmap` (fallback `Image`) to verify the exported file is readable
- `supportsFormat(type)` probes a 2×2 canvas encode

### Cropping — `engines/imageCropper.ts`

`renderCrop(canvas, options)` draws the crop into a canvas:

- Canvas sized to output width/height
- Background filled white (or signature transparent)
- Rotation applied at canvas centre
- Cover scale computed so the rotated image fully covers the frame
- Zoom applied as multiplier on cover scale
- Image drawn with `imageSmoothingQuality = 'high'`
- Tone adjustments (brightness/contrast/saturation) applied via `getImageData`/`putImageData`
- Signature paper removal via luminance threshold (`removePaper`)

The same `renderCrop()` is used for on-screen preview and export — what the user sees is what they export. The face guide is a DOM overlay only and is never drawn to canvas.

### Resizing — `scaleCanvas(source, factor)`

Downscale copy without re-decoding the source; used by compression when quality alone cannot fit.

---

## 3. Compression engine — `engines/compressionEngine.ts`

Real iterative compression measured against `Blob.size`.

### Workflow

1. Receive canvas, settings (targetKB, format, mode, quality, allowDownscale), optional requirement
2. Compute `maxBytes = floor(targetKB * 1024) - 1` (strictly below the limit)
3. For JPEG/WebP: binary-search quality between `floor` (mode-dependent: auto 0.4, balanced 0.62, maximum 0.25, manual 0.3) and 0.98
4. Keep the largest result under `maxBytes`; also track the smallest result overall for honest failure reporting
5. If target missed and downscale allowed, reduce dimensions in 10% steps and repeat
6. PNG encoded losslessly (quality ignored); no pretending PNG has quality control
7. Return `CompressionResult` with blob, bytes, quality, dimensions, attempts, targetMet, downscaled, durationMs, note

### Strict file-size rule

If a form permits max 50 KB, output must be strictly below 50 KB (`blob.size < maxBytes`). KB = 1024 bytes (documented, matches file managers).

### Manual mode

One honest encode at the chosen quality — no false search.

### Modes

- `automatic`: best quality under the limit
- `balanced`: quality floor 62%
- `maximum`: smallest file, may downscale
- `manual`: encode at fixed quality (5–100%)

### Validation

`validateCompressionSettings(settings)` rejects non-finite/tiny targets, targets > 10,240 KB, and out-of-range manual quality.

---

## 4. Validation engine — `engines/validationEngine.ts`

`validateImageBlob(args)` validates the real encoded Blob, not the intent:

1. **Integrity** — re-decode the blob; pass if width/height > 0
2. **File format** — `blob.type === format`
3. **Accepted by preset** — `requirement.formats.includes(blob.type)`
4. **Dimensions** — exact match (fixed spec), within range (ranged spec), or N/A (no published dimensions — never invented)
5. **Aspect ratio** — when `aspectMin`/`aspectMax` published
6. **Maximum file size** — `blob.size < maxKB * 1024`
7. **Minimum file size** — `blob.size >= minKB * 1024`

Statuses: `pass` / `fail` / `na`. Overall `ready` when no check fails. Never claims portal acceptance.

---

## 5. Export engine — `engines/exportEngine.ts`

- `sanitizeSegment(value)` — NFKD normalize, strip punctuation, collapse whitespace to hyphens, cap at 48 chars, fallback
- `buildFileName(kind, preset, width, height, format, customName)` — `photo.<ext>` / `signature.<ext>` for `upsc-cse`, and `FORMFIT_<Kind>_<Preset>_<W>x<H>.<ext>` otherwise
- `downloadBlob(blob, filename)` — real browser download via `URL.createObjectURL` + anchor click; revokes URL after 4s
- `useBlobUrl(blob)` in `CompareSlider.tsx` — StrictMode-safe object URL lifecycle created and revoked inside `useEffect`
- `previewUrl(blob)` — object URL for previews

---

## 6. Storage design — `services/storageService.ts`

IndexedDB database `formfit-studio` v1 with stores: `kv`, `presets`, `history`. Falls back to `localStorage` keys `formfit:kv|presets:history` if IndexedDB unavailable, then in-memory.

Persisted: settings, custom presets, processing history metadata. Original images are NOT stored — kept in memory only.

`presetService.ts`: `BUILTIN_PRESETS` from `data/presets.json`, `getAllPresets()`, `findPreset()`, `searchPresets()`, `validateCustomPreset()`, `createCustomPreset()`, `updateCustomPreset()`, `removeCustomPreset()`, `presetToCustomInput()`, summary helpers. Custom presets marked `verification: 'custom'` with source note "Created locally... not officially verified."

`AppContext.deletePreset` resets photo/signature jobs when the active preset is deleted.

---

## 7. Offline distribution

- `vite-plugin-singlefile` inlines all JS and CSS into `dist/index.html`
- `assetsInlineLimit: 100_000_000` inlines Inter `woff2` as data URL
- `cssCodeSplit: false` — single stylesheet
- `dist/index.html` ~529 KB, self-contained, opens via `file://` with no network
- Verified: loads with Wi-Fi disabled; no external network requests

---

## 8. Router & navigation

Hash-based custom router supports `file://`. Routes: `/welcome`, `/dashboard`, `/photo`, `/photo/crop`, `/photo/adjust`, `/signature`, `/signature/editor`, `/presets`, `/presets/:id`, `/compression`, `/compare`, `/custom-presets`, `/custom-presets/new`, `/export`, `/export/success`, `/history`, `/settings`, `/system`, `/errors`, `/empty-states`.

`document.documentElement` sets `data-theme`, `data-density`, `data-reduce-motion` from settings.

---

## 9. Tests

Vitest, Node environment, `tests/unit/*.test.ts` (resource-fork `._*` files excluded):

- `format.test.ts` — bytes/KB conversion, formatBytes, labels, clamp, percentChange
- `geometry.test.ts` — gcd, aspectLabel, fitContain, scaleToWidth, dimension specs/clamping, rotation math, recommendedDimensions, compression defaults
- `presets.test.ts` — built-in presets, findPreset, searchPresets, custom preset validation, summaries
- `export.test.ts` — sanitizeSegment, buildFileName (including UPSC CSE official filenames)
- `compression.test.ts` — validateCompressionSettings, `padJpegToMinimum`, magic-byte `sniffImageType`
- `validation.test.ts` — validateImageBlob (IBPS pass/fail/min-size fail/exact min/max, format, dimensions, integrity, N/A for free dims), helpers

64 tests across 6 files, all passing.

---

## 10. TypeScript

`tsc --noEmit` passes with no errors. `npm run typecheck` uses `tsc -b`.

Strict typing: `CompressionSettings['mode]` unions, `OutputFormat` union, `Verification` union (`verified`/`unverified`/`custom`), `DimensionSpec` optional fields for ranged/free specs.

---

## 11. Build & scripts

| Script | Command |
|--------|---------|
| `dev` | `vite` (port 5175) |
| `build` | `tsc --noEmit && vite build` |
| `preview` | `vite preview` |
| `test` | `vitest run` |
| `typecheck` | `tsc -b --pretty false` |

`vite.config.ts` uses `defineConfig` from `vitest/config` with react + singlefile plugins.

---

## 12. Known limitations

- The Figma design reference URL returns HTTP 403 without auth and was not inspected; the build follows the written design system instead. Documented honestly.
- PNG compression is lossless (browser encoder limitation) — documented, not faked.
- IndexedDB may be blocked in some private/incognito modes; localStorage fallback provided.
- No Web Workers used (compression is fast enough on main thread for target sizes).
