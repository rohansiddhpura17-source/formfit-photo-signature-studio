# prompts/prompts.md

# FORMFIT Studio — Prompts Log

**Product:** FORMFIT Studio  
**Project:** BSERC GenAI Internship — Week 2 | Project 02: Form Photo Fixer

This file records the major prompts and technical decisions that shaped the build.

---

## Design system

- Primary background: `#F8F7F4`, text: `#20211F`, accent: `#E66A36`
- Surface: `#FFFFFF`, border: `#EAE8E2`
- Success: `#18866B`, warning: `#D99A32`, error: `#D9534F`, muted: `#777872`
- Typography: Inter (bundled locally), premium editorial aesthetic — not a generic SaaS dashboard

---

## Architecture decisions

- Custom hash router instead of React Router — works under `file://`
- `vite-plugin-singlefile` with `assetsInlineLimit: 100_000_000` for standalone `dist/index.html`
- Inter variable woff2 copied to `src/assets/Inter-var.woff2` and referenced from CSS so Vite inlines it
- Same `renderCrop()` used for preview and export — what you see is what you export
- Face guide as DOM overlay only — never exported; no facial recognition claimed

---

## Compression

- Binary search quality for JPEG/WebP; PNG lossless with optional downscale
- Strict `< maxKB`, 1024 bytes/KB, safety margin below preset maximum
- Honest failure reporting when target unreachable

---

## Presets

- Four verified presets researched from official sources (fetch date 2026-11-07): IBPS CRP PO/MT, GATE 2025, UPSC CSE, NEET UG 2025
- Presets with unspecified dimensions validate as N/A with honest messaging
- Clear distinction between verified official presets and custom presets

---

## Mobile

- Handled responsively, not separate mockup files; bottom navigation below 900px

---

## Figma

- Figma file `https://www.figma.com/design/WWwfZ010Cso551yXpgcuwt` returned HTTP 403 without auth; not inspected; build follows the written design system; documented honestly

---

## Screens

13 routed screens: Welcome, Dashboard, Photo Upload, Photo Crop, Photo Adjust, Signature Upload, Signature Editor, Preset Library, Preset Details, Compression Studio, Compare, Export Center, Export Success, Processing History, Settings, Design System, Validation Errors, Empty States. Mobile handled responsively at 390 × 844.
