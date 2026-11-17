# USER_GUIDE.md

# FORMFIT Studio — User Guide

**Version:** 1.0.0  
**Product:** FORMFIT Studio — Offline Photo & Signature Preparation

FORMFIT Studio helps you prepare photographs and signatures for official application and examination forms. Everything runs on your device — nothing is uploaded, no account is needed, and no internet connection is required after opening the app.

---

## 1. Getting started

1. Open `dist/index.html` in your browser (or run `npm run dev` and open `http://localhost:5175/`).
2. The Welcome screen introduces FORMFIT. Select **Start preparing** to open the Dashboard.
3. On the Dashboard, the active preset is shown (default: IBPS PO — Verified). You can change it in Settings or the Preset Library.

---

## 2. Preparing a photograph

### Step 1 — Upload

From the Dashboard, select **Open Photo Studio**, or go directly to Photo Studio from the sidebar.

Drag a photograph into the upload zone, or select **Choose photograph** / **Try a sample portrait**. Supported formats: JPEG, PNG, WebP (up to 50 MB). The file type is checked from the file's actual contents, not its filename.

### Step 2 — Crop & position

The crop editor opens with the preset's aspect ratio locked (e.g. IBPS PO 200 × 230 px = 20:23).

- Drag the photograph behind the frame to reposition the face
- Use the zoom slider to crop tighter or wider
- Use the rotate buttons for 90° turns
- The **Face guide** overlay shows where the eye line and chin should sit. It is a visual guide only — it is never exported and no facial recognition is performed
- Select **Continue** when the framing is correct

### Step 3 — Adjust tone

Review the original vs processed preview. Adjust brightness, contrast and saturation if needed. Dimensions are locked to the preset. Select **Compress photo**.

### Step 4 — Compress

The compression studio searches for the highest quality that fits strictly under the preset's KB limit.

- Target KB is pre-filled with a small safety margin below the maximum
- Choose output format (the preset may accept only JPEG)
- Choose compression mode: Automatic, Balanced, Maximum or Manual
- Allow dimension reduction if quality alone cannot reach the target
- Actual sizes are read from the encoded file, not estimated

If the result is below the preset minimum, the app tells you and suggests raising the target or using a larger source.

### Step 5 — Validate & export

The Export Center shows the real encoded file: dimensions, format, actual byte size, and a validation report against every preset check.

- Select **Download photograph** to save `FORMFIT_Photo_<Preset>_<W>x<H>.jpg`
- Select **Recompress** to adjust settings
- Select **Download anyway** only if you accept that the file may not meet every requirement

A file is reported ready only after it has actually been checked.

---

## 3. Preparing a signature

### Step 1 — Upload

From the Dashboard, select **Open Signature Studio**, or go to Signature Studio from the sidebar.

Drag a signature scan into the upload zone, or choose **Try a sample signature**. Supported formats: JPEG, PNG, WebP.

### Step 2 — Edit

The signature editor lets you:

- Crop close to the handwriting with an even margin
- Drag to reposition and zoom to crop tighter
- Choose **White paper** (flattens to white) or **Transparent** background
- Adjust ink contrast and brightness
- Rotate in 90° steps

Presets may require JPEG (which does not support transparency). If transparency is on but the preset needs JPEG, the app warns you to turn transparency off before validating.

### Step 3 — Compress & export

Select **Continue to compress**, then follow the same compression and export steps as for a photograph.

---

## 4. Working with presets

### Preset Library

Browse official presets (IBPS PO/MT, GATE 2025, UPSC CSE, NEET UG 2025). Each card shows the organisation, form name, photo and signature dimensions, KB limits, accepted formats and verification status.

Use **Search** and the category filters (All, Banking, Engineering, Civil Services, Medical, University, Custom) to narrow results.

### Preset details

Open a preset's details to see full specifications and the official source link. Select **Apply** to make it the active preset.

### Custom presets

If your form is not listed:

1. Go to Custom Presets → **Create custom preset**
2. Enter the name, organisation, category and source URL from your official notice
3. Enter photo and signature dimensions and KB limits
4. Select accepted formats
5. Save

Custom presets are stored locally on this device and are always marked **unverified** — they are never confused with official verified presets. You can edit or delete them later.

---

## 5. Export Center

After preparing a photograph and/or signature, the Export Center lists each finished file with:

- Preview, dimensions, format, actual file size
- Validation status (each check: passed / failed / N/A)
- Filename

Select **Download both** to download every ready file, or download individually.

---

## 6. Export Success

After at least one real download, the Export Success screen shows:

- Success status
- Final preview and file details
- Validation summary
- Download actions
- Return to Dashboard

This screen only appears after a real export has occurred — it is never faked.

---

## 7. Processing history

Every completed export is recorded locally as metadata (filename, preset, date, sizes, format, validation status). Original images are not stored.

From the History screen you can:

- Search by filename, preset or organisation
- Filter by document type and validation status
- **Reuse** a record's preset and compression target (you must re-add the source image)
- Delete individual records
- Clear all history

---

## 8. Settings

Open Settings from the sidebar (More → Settings on mobile):

- **Appearance** — Light (default) or Dark
- **Density** — Comfortable or Compact
- **Reduce motion** — disables non-essential transitions
- **Studio defaults** — default preset, output format, compression mode, safety margin
- **Confirm before delete** — ask before removing history, presets or data
- **Clear application history / Reset preferences** — local data management
- Privacy and offline information, application version

All preferences are stored in this browser only. Clearing site data removes them.

---

## 9. Offline use

FORMFIT works entirely offline:

- Fonts, icons, presets and engines are bundled in the single HTML file
- No remote requests are made
- IndexedDB stores your presets and history locally

Open `dist/index.html` directly via `file://`, disable Wi-Fi, and the full workflow still works.

---

## 10. Important reminders

- FORMFIT validates against the preset requirements encoded in the app — it does **not** claim that an examination portal has accepted your image
- Always confirm the current official notice for your form before submitting
- Custom presets are user-supplied and unverified
- Original images are processed in memory and are not stored by the app
- Exported filenames follow the pattern `FORMFIT_Photo_<Preset>_<W>x<H>.jpg`
