# DESIGN_SYSTEM.md

# FORMFIT Studio — Design System

**Version:** 1.0  
**Product:** FORMFIT Studio — Offline Photo & Signature Preparation

---

## 1. Design direction

Premium editorial productivity software. Visual inspiration: professional creative applications, modern desktop utilities, minimal productivity software, professional image-editing workspaces.

Not a generic SaaS dashboard. No excessive gradients, no oversized rounded cards, no meaningless dashboard statistics, no decorative charts without purpose, no oversized illustrations.

---

## 2. Colour palette

All colours are defined as CSS custom properties in `src/styles/tokens.css` and consumed by components via tokens, never raw hex values.

### Neutral spine

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#F8F7F4` | Warm paper ground — primary background |
| `--bg-deep` | `#F1EFE9` | Sidebar background |
| `--surface` | `#FFFFFF` | Cards and panels |
| `--surface-2` | `#F4F2EC` | Elevated surfaces |
| `--surface-3` | `#ECE9E1` | Subtle dividers |
| `--text` | `#20211F` | Primary text |
| `--text-strong` | `#141513` | Headings, strong text |
| `--muted` | `#777872` | Secondary text |
| `--muted-strong` | `#5C5D57` | Stronger secondary text |
| `--border` | `#EAE8E2` | Hairlines |
| `--border-strong` | `#D8D4C9` | Stronger borders |

### Semantic signals

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent` | `#E66A36` | Primary action |
| `--accent-strong` | `#C95424` | Accent hover/dark |
| `--accent-soft` | `#FBECE4` | Accent background tint |
| `--accent-ink` | `#8F3D19` | Accent text on soft bg |
| `--success` | `#18866B` | Passed checks |
| `--success-soft` | `#E5F2EE` | Success background tint |
| `--success-ink` | `#0F5E4A` | Success text on soft bg |
| `--warning` | `#D99A32` | Needs attention |
| `--warning-soft` | `#FBF1DD` | Warning background tint |
| `--warning-ink` | `#82580E` | Warning text on soft bg |
| `--error` | `#D9534F` | Failed checks |
| `--error-soft` | `#FBE9E8` | Error background tint |
| `--error-ink` | `#8F2F2C` | Error text on soft bg |

### Stage & checkerboard

| Token | Hex | Usage |
|-------|-----|-------|
| `--checker-a` | `#FFFFFF` | Transparency checker A |
| `--checker-b` | `#E9E6DE` | Transparency checker B |
| `--stage` | `#EFEDE7` | Canvas stage background |
| `--stage-deep` | `#E7E3DA` | Deep stage background |

---

## 3. Typography

Font: **Inter** (variable), bundled locally at `src/assets/Inter-var.woff2`, inlined into `dist/index.html` via Vite's `assetsInlineLimit`. No remote fonts.

```css
--font: 'Inter', ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--mono: ui-monospace, 'SFMono-Regular', 'Cascadia Mono', 'Roboto Mono', monospace;
```

Base: 15px / 1.55, Inter font-feature-settings `cv02, cv03, cv04, cv11`.

### Type scale (reference page `ds-type-*` classes)

| Name | Class | Spec |
|------|-------|------|
| Display | `ds-type-display` | clamp(40px, 6vw, 76px) · 0.98 · -0.04em |
| Page title | `ds-type-page` | 34px · 1.05 · -0.03em |
| Section title | `ds-type-section` | 22px · 1.2 · -0.02em |
| Body | `ds-type-body` | 15px · 1.65 · 0 |
| Small | `ds-type-small` | 13px · 1.55 · 0 |
| Eyebrow | `eyebrow` | 11px · 0.14em · uppercase |

Utility classes from `tokens.css`: `.page-title`, `.page-desc`, `.section-title`, `.section-desc`, `.panel__title`, `.eyebrow`.

---

## 4. Spacing

4px base rhythm:

4, 8, 12, 16, 24, 32, 48, 64 px.

Radii: 5px (xs), 8px (sm), 12px (md), 18px (lg), 999px (pill).

Shadows: xs, sm, md, lg (subtle, warm-toned rgba).

Easing: `--ease` cubic-bezier(0.22, 0.7, 0.24, 1); `--fast` 150ms; `--base` 220ms; `--slow` 360ms.

---

## 5. Layout shell

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-w` | 248px | Desktop sidebar width |
| `--topbar-h` | 58px | Topbar height |
| `--page-max` | 1460px | Max page width |

- Sidebar fixed left, collapsible to bottom nav below 900px
- Topbar sticky with breadcrumbs, offline indicator, help, settings
- Main workspace flexible; image-editing screens get a large central canvas + narrow rail

---

## 6. Components

### Buttons (`Button.tsx`)
Variants: primary, secondary, ghost, danger. Sizes: sm, md, lg. States: default, hover, active, disabled, loading.

### Badges (`Badge.tsx`)
Tones: neutral, accent, success, warning, error, outline. `VerificationBadge` shows verified / unverified / custom.

### Notices (`Feedback.tsx`)
Tones: neutral, success, warning, error. Used for guide, passed, target-not-reached, decode-error messages.

### Form controls (`Field.tsx`)
TextInput, NumberInput, Select, Checkbox, Segmented, Switch, Slider, ProgressBar. Labels stay attached; hints explain consequences; errors appear under the field.

### Empty states (`EmptyState.tsx`)
Icon, eyebrow, title, description, actions. Compact and full variants.

### Modals & toasts (`Feedback.tsx`)
Accessible dialogs with destructive/primary actions; toasts for confirmation after the fact.

---

## 7. Navigation

Sidebar items with active indicator, hover states, consistent icons. Mobile bottom navigation (5 items + More) below 900px. Topbar breadcrumbs + offline chip + help + preferences.

---

## 8. Responsive rules

| Breakpoint | Behaviour |
|------------|-----------|
| ≤ 1180px | Sidebar narrows to 216px; studio rails tighten; single-column workspaces begin |
| ≤ 900px | Sidebar hidden; mobile bottom nav; single-column workspaces; stacked history cards |
| ≤ 600px | Phone-optimised; smaller touch targets; stacked reference grids; bottom nav |

Density: comfortable / compact (compact reduces padding). Reduced motion: respects `prefers-reduced-motion` and user setting.

---

## 9. Accessibility

- Skip link, focus-visible rings (2px accent + 2px offset)
- Keyboard-navigable interactive elements
- Status never conveyed by colour alone (icons + text + badges)
- Touch targets ≥ 44px on coarse pointers
- Screen-reader labels on icon buttons and navigation

---

## 10. Motion & writing

- Motion budget: 150–240ms UI transitions, 320ms canvas settle; no parallax or looping decoration
- Writing: say what happened, what it means, what to do next; never claim portal acceptance; distinguish verified facts from user input

---

## 11. CSS file organisation

| File | Contents |
|------|----------|
| `tokens.css` | Font-face, colour tokens, dark theme, reset, typography utilities, shell, sidebar, topbar, mobile nav, page intro, animations |
| `components.css` | Buttons, badges, notices, forms, panels, modals, toasts, empty states, validation list, crash card, delete summary |
| `studio.css` | Studio bars, crop stage, guides, compression, size meter, compare |
| `workspace.css` | Welcome, dashboard, preset library/details, upload, export, success, history |
| `forms.css` | Settings, custom preset builder |
| `reference.css` | Design system, error patterns, empty states page styles |
| `responsive.css` | Breakpoints, density, dark-theme tweaks, reduced motion, mobile bottom nav |
| `global.css` | `@import` chain of all above |

`src/main.tsx` imports `./styles/global.css`.
