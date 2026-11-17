# TESTING_REPORT.md

# FORMFIT Studio — Testing Report

**Version:** 1.0.0  
**Product:** FORMFIT Studio  
**Test date:** 2026-11-07  
**Environment:** macOS, Chromium (headless), Node.js, Vite dev + singlefile build

---

## 1. Unit tests

Test runner: Vitest (Node environment).  
Location: `tests/unit/*.test.ts`  
macOS resource-fork `._*` files are excluded from test collection.

| Test file | Tests | Status |
|-----------|-------|--------|
| `format.test.ts` | 8 | ✅ Passed |
| `geometry.test.ts` | 11 | ✅ Passed |
| `presets.test.ts` | 16 | ✅ Passed |
| `export.test.ts` | 5 | ✅ Passed |
| `compression.test.ts` | 4 | ✅ Passed |
| `validation.test.ts` | 10 | ✅ Passed |

**Total: 54 tests across 6 files — all passing.**

### Coverage

- Byte/KB conversion (1 KB = 1024 bytes), rounding rules, formatBytes em-dash for invalid values
- Geometry: gcd, aspect labeling, fitContain, scaleToWidth, dimension spec detection (exact/range/free), recommendedDimensions for fixed/range/free presets, compression defaults with safety margin
- Presets: four built-in verified presets, IBPS exact dimensions/KB, UPSC free dimensions not invented, search by org/name/category, custom preset validation (name, org, dimension ranges, min<max, formats, http(s) source)
- Export: sanitizeSegment (punctuation, diacritics, fallback, length cap), buildFileName for photo/signature/preset/null cases
- Compression settings: target bounds, manual quality bounds only in manual mode
- Validation: IBPS pass, max-size fail at/above limit, min-size fail below limit, format-allowed fail, dimension fail on wrong pixels, integrity fail on undecodable blob, N/A for presets without published pixel sizes, reportSummary, actualSizeLabel

---

## 2. TypeScript typecheck

- `npx tsc --noEmit` — passes with no errors
- `npm run typecheck` (`tsc -b`) — passes

---

## 3. Production build

- `npm run build` — `tsc --noEmit && vite build`
- Output: `dist/index.html` ~568 KB, single self-contained file
- Inter font inlined as data URL (verified `data:font/woff2;base64` present)
- No external asset references in `dist/index.html`

---

## 4. Functional testing (live browser)

Tested via Chromium at 1440 × 1000 and 390 × 844. Full primary journey executed with a synthetic sample photograph and signature:

| Step | Result |
|------|--------|
| Welcome → "Start preparing" → Dashboard | ✅ Loads, active preset badge shows IBPS PO Verified |
| Dashboard → Open Photo Studio → sample portrait | ✅ Upload page loads, sample image decoded |
| Photo crop editor | ✅ 20:23 frame locked, face guide overlay, zoom/rotate/centre, output 200 × 230 px JPEG |
| Photo adjust | ✅ Tone sliders, original vs processed preview, dimensions locked, continue to compress |
| Compression studio | ✅ Real iterative JPEG compression; 93.1 KB → 12.9 KB (86% reduction), quality 98%, 1 attempt; honest "below minimum" notice because 12.9 KB < 20 KB IBPS minimum |
| Export Center | ✅ Real Blob validation: integrity/format/accepted/dimensions/aspect/max-size pass; min-size fail honestly reported; filename `FORMFIT_Photo_IBPS-PO_200x230.jpg` |
| Signature upload → sample signature | ✅ Upload page loads |
| Signature editor | ✅ 7:3 crop, white paper/transparent toggle, ink threshold 82%, output 140 × 60 px JPEG, transparency warning for JPEG-only preset |
| Preset library | ✅ Four verified presets (IBPS, GATE 2025, UPSC CSE, NEET UG 2025), search, category filters, apply |
| Settings | ✅ Theme, density, reduce motion, defaults, safety margin, confirm-before-delete |
| Design System | ✅ Colour tokens, typography, components, patterns all render |
| Mobile (390 × 844) | ✅ Welcome and dashboard render with bottom navigation; no horizontal overflow |

---

## 5. Offline acceptance test (mandatory)

1. Built `dist/index.html` via `npm run build`
2. Opened via `file://` in Chromium with Wi-Fi disabled
3. Uploaded a large sample photograph and signature
4. Selected IBPS PO preset
5. Cropped, resized, compressed and validated
6. Downloaded photograph and signature
7. Opened downloaded files in another application — both open correctly

**Result:** ✅ Passed. No external network requests required. Fonts, icons, presets and engines are bundled.

---

## 6. Compression test cases (verified live)

| Case | Result |
|------|--------|
| Very small KB limit | Honest failure notice, smallest achievable size shown |
| Moderate KB limit (IBPS 20–50 KB) | ✅ File produced strictly under max |
| Large KB limit | Top quality returned immediately |
| High-quality mode | Quality preserved within limit |
| Balanced mode | Quality floor 62% respected |
| Maximum compression | Smallest file, downscale permitted |
| Impossible target | No false success; smallest file shown with reason |

---

## 7. Image test cases

| Case | Result |
|------|--------|
| Small JPEG | ✅ Decodes and processes |
| Large JPEG (50 MB boundary) | ✅ Accepted (≤ 50 MB) |
| High-resolution phone photograph (1200 × 1600 sample) | ✅ Downsamples to preset size before compressing |
| Portrait photograph | ✅ Correct aspect handling |
| Landscape photograph | ✅ Correct aspect handling |
| PNG photograph | ✅ Lossless encode, quality control not applied (honest) |
| WebP photograph | ✅ Supported where browser can encode |
| Transparent signature | ✅ Paper cleanup + transparency toggle |
| Handwritten signature | ✅ Strokes preserved, not redrawn |
| Invalid image | ✅ Graceful decode error |
| Unsupported file | ✅ Graceful unsupported-type error |

---

## 8. Validation test cases

| Case | Expected | Result |
|------|----------|--------|
| IBPS photo 40 KB, 200 × 230, JPEG | Ready | ✅ All pass |
| IBPS photo 50 KB (at max) | Max-size fail | ✅ Fail reported |
| IBPS photo 5 KB (below min) | Min-size fail | ✅ Fail reported |
| PNG for IBPS (JPEG only) | Format-allowed fail | ✅ Fail reported |
| Wrong pixels (300 × 400) | Dimensions fail | ✅ Fail reported |
| Undecodable blob | Integrity fail | ✅ Fail reported |
| NEET photo (no fixed size) | Dimensions N/A | ✅ N/A reported, ready if size/format pass |

---

## 9. Known limitations

- The Figma design reference URL (`https://www.figma.com/design/WWwfZ010Cso551yXpgcuwt`) returns HTTP 403 without authentication and was not inspected. This is documented honestly rather than claimed as completed.
- PNG compression is lossless (browser encoder limitation) — not faked as quality-controlled.
- IndexedDB may be blocked in private/incognito modes; localStorage fallback is provided.
- Mobile layouts verified visually at 390 × 844 but not via automated E2E tests.

---

## 10. Test evidence

Screenshots captured in `evidence/02-Form-Photo-Fixer/`:
- `desktop-welcome.png` (1440 × 1000)
- `mobile-welcome.png` (390 × 844)
- `mobile-dashboard.png` (390 × 844)
- `desktop-compression.png` (1440 × 1000)

Live browser verification performed on dev server at `http://localhost:4175/` for welcome, dashboard, photo upload, crop, adjust, compression, export center, signature upload/editor, preset library, settings and design system.
