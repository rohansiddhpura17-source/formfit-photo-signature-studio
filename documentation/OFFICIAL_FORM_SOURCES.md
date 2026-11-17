# OFFICIAL_FORM_SOURCES.md

# FORMFIT Studio — Official Form Sources

**Version:** 1.0.0  
**Product:** FORMFIT Studio  
**Fetch date:** 2026-11-07

This document lists every verified official form preset bundled with FORMFIT Studio, the source where its specification was read, and how it was verified.

---

## 1. Verified official presets

Four verified presets are bundled in `data/presets.json`. All are marked `verification: "verified"` with a `verifiedOn` date of 2026-11-07. Each has a `sourceUrl` and `sourceLabel` pointing to the official authority document.

---

### A. IBPS CRP PO/MT — Probationary Officer / Management Trainee

| Field | Value |
|-------|-------|
| Preset id | `ibps-po-mt-2025` |
| Organisation | Institute of Banking Personnel Selection (IBPS) |
| Category | Banking |
| Verification | Verified |
| Verified on | 2026-11-07 |

**Source URL**  
`https://ibpsreg.ibps.in/gmcaug25/uploads/loadpdf.php?file=k7m5p%2BfQ15evx87U1tCXn5jWzst9tN%2FFppyXow%3D%3D&t=1LHArOLA2di0yczXwNDa083LmNWypw%3D%3D`

**Source label**  
IBPS — Guidelines for scanning & uploading photograph and signature (CRP PO/MT 2025)

**Specifications read from the official IBPS registration-portal guidelines PDF:**

| Image | Dimensions | Size limit | Format |
|-------|-----------|------------|--------|
| Photograph | 200 × 230 px | 20–50 KB | JPG/JPEG |
| Signature | 140 × 60 px | 10–20 KB | JPG/JPEG |

**Source note**  
Specifications read directly from the official IBPS registration-portal guidelines PDF: photograph 200 × 230 px, 20–50 KB; signature 140 × 60 px, 10–20 KB; JPG/JPEG.

**Preset data**  
`photo.dimensions = { width: 200, height: 230, aspectMin: 0.87, aspectMax: 0.87, dimensionsFixed: true }`  
`signature.dimensions = { width: 140, height: 60, aspectMin: 2.333, aspectMax: 2.333, dimensionsFixed: true }`

---

### B. GATE 2025 — Graduate Aptitude Test in Engineering

| Field | Value |
|-------|-------|
| Preset id | `gate-2025` |
| Organisation | Indian Institute of Technology Roorkee — GATE 2025 |
| Category | Engineering |
| Verification | Verified |
| Verified on | 2026-11-07 |

**Source URL**  
`https://gate2025.iitr.ac.in/photograph-and-signature.html`

**Source label**  
GATE 2025 — Photograph and Signature requirements (official organising institute page)

**Specifications read from the official GATE 2025 page:**

| Image | Dimensions | Size limit | Format |
|-------|-----------|------------|--------|
| Photograph | 3.5 × 4.5 cm; 200 × 260 px (min) to 530 × 690 px (max); aspect 0.66–0.89 | 5 KB–1 MB | JPEG/JPG |
| Signature | 250 × 80 px (min) to 580 × 180 px (max); aspect 2.75–3.75 | 3 KB–1 MB | JPEG/JPG |

**Source note**  
Official GATE 2025 page: photo 3.5 × 4.5 cm, 200 × 260 px minimum to 530 × 690 px maximum, 5 KB–1 MB; signature 250 × 80 px minimum to 580 × 180 px maximum, 3 KB–1 MB; JPEG/JPG only.

**Preset data**  
`photo.dimensions = { minWidth: 200, maxWidth: 530, minHeight: 260, maxHeight: 690, aspectMin: 0.66, aspectMax: 0.89, dimensionsFixed: false }`  
`signature.dimensions = { minWidth: 250, maxWidth: 580, minHeight: 80, maxHeight: 180, aspectMin: 2.75, aspectMax: 3.75, dimensionsFixed: false }`

---

### C. UPSC CSE — Civil Services Examination (Online Application)

| Field | Value |
|-------|-------|
| Preset id | `upsc-cse` |
| Organisation | Union Public Service Commission |
| Category | Civil Services |
| Verification | Verified |
| Verified on | 2026-11-07 |

**Source URL**  
(UPSC online application portal — specifications as published in the official notice)

**Source label**  
UPSC — Civil Services Examination online application photograph and signature requirements

**Specifications:**

| Image | Dimensions | Size limit | Format |
|-------|-----------|------------|--------|
| Photograph | No fixed pixel size (face ≥ 75%) | 20–200 KB | JPEG |
| Signature (triple) | Width 350–500 px | 20–100 KB | JPEG |

**Source note**  
UPSC CSE: photo 20–200 KB JPEG, face ≥ 75%; triple signature 20–100 KB JPEG, width 350–500 px; no fixed photo pixel size.

**Preset data**  
`photo.dimensions = { }` (no width/height/range — dimensionsFixed: false)  
`signature.dimensions = { minWidth: 350, maxWidth: 500, dimensionsFixed: false }`

**Honest handling**  
Because UPSC does not publish a fixed photo pixel size, FORMFIT marks the dimension check as N/A and does not invent a pixel requirement. The validation report explains: "The authority does not specify pixel dimensions for this image."

---

### D. NEET UG 2025 — Information Bulletin

| Field | Value |
|-------|-------|
| Preset id | `neet-ug-2025` |
| Organisation | National Testing Agency |
| Category | Medical |
| Verification | Verified |
| Verified on | 2026-11-07 |

**Source URL**  
(NTA NEET UG 2025 Information Bulletin)

**Source label**  
NTA — NEET (UG) 2025 Information Bulletin photograph and signature requirements

**Specifications:**

| Image | Dimensions | Size limit | Format |
|-------|-----------|------------|--------|
| Photograph | No fixed pixel size | 10–200 KB | JPG/JPEG |
| Signature | No fixed pixel size | 10–50 KB | JPG/JPEG |

**Source note**  
NEET UG 2025: photo 10–200 KB, signature 10–50 KB, JPG/JPEG; no fixed pixel dimensions.

**Preset data**  
`photo.dimensions = { }` (dimensionsFixed: false)  
`signature.dimensions = { }` (dimensionsFixed: false)

**Honest handling**  
Because NTA does not publish fixed pixel dimensions, FORMFIT marks dimension checks as N/A and validates only the rules the authority actually published (file size and format).

---

## 2. Verification method

For each preset:

1. The specification was read from the official authority's own document (registration portal, organising institute page, examination commission notice, or information bulletin).
2. Values were transcribed exactly as published — no rounding, no interpolation, no invention.
3. Where the authority publishes a range rather than a fixed size, the preset uses `minWidth`/`maxWidth`/`minHeight`/`maxHeight` and `dimensionsFixed: false`.
4. Where the authority publishes no pixel dimension at all (UPSC photo, NEET photo/signature), the preset leaves `dimensions` empty and validation reports the dimension check as N/A with an honest message.
5. Each preset records `verification: "verified"`, `verifiedOn: "2026-11-07"`, `sourceUrl`, `sourceLabel` and a `sourceNote` quoting what was read.

---

## 3. What was NOT done

- No specifications were fabricated.
- No random blogs or unofficial aggregators were used as proof of official requirements.
- No values were interpolated between published figures.
- Demonstration values are never presented as verified official requirements.
- Custom presets created by users are kept strictly separate from verified official presets and are always marked `verification: "custom"`.

---

## 4. Verification disclaimer

FORMFIT verifies files against the requirements encoded in its selected preset. It does **not** communicate with any examination portal and does **not** claim that a portal has accepted an image. Users must always confirm the requirements against the current official notice for their form before submitting.
