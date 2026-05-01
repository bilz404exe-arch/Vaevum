# VAEVUM Design System Rules

Always follow these rules for every component, page, and style decision.

---

## Color Tokens

```
background:     #050507
surface:        #12121c
surface2:       #1a1a28
border:         rgba(255,255,255,0.06)
border-active:  rgba(255,255,255,0.10)
accent-purple:  #9d8cff
accent-pink:    #ff6b9d
accent-gold:    #ffb347
text:           #e8e6f0
text-dim:       #6b6880
text-muted:     #3a3850
```

These are the ONLY colors used in the application. Do not introduce any other colors.

---

## Typography

**Display text, headings, AI message bubbles:**

- Font: Cormorant Garamond
- Style: serif, italic preferred for display
- Weight: 300–400
- Import from Google Fonts

**UI labels, buttons, user message bubbles, code, monospace elements:**

- Font: Space Mono
- Style: monospace
- Use uppercase for labels and button text
- Import from Google Fonts

**NEVER use:** Inter, Roboto, Arial, system-ui, sans-serif, or any other font family.

---

## Shape Rules

- **NO rounded corners** on containers, cards, buttons, or inputs — `border-radius: 0` everywhere.
- Persona avatar glyphs: square, `border-radius: 0`.
- Borders: `1px solid` at low opacity (use `border` token).
- Shadows: colored glow-style only — `box-shadow` with a color value. No grey drop-shadows.

---

## Atmosphere Effects

Apply these on every full-page layout:

### Noise Texture Overlay

```html
<svg
  style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;opacity:0.03;z-index:9999"
>
  <filter id="noise">
    <feTurbulence
      type="fractalNoise"
      baseFrequency="0.65"
      numOctaves="3"
      stitchTiles="stitch"
    />
    <feColorMatrix type="saturate" values="0" />
  </filter>
  <rect width="100%" height="100%" filter="url(#noise)" />
</svg>
```

### Ambient Glow Blobs

Three fixed-position radial gradient blobs, `pointer-events: none`, `z-index: 0`:

- Top-left: `radial-gradient(ellipse at top left, rgba(157,140,255,0.04), transparent 60%)`
- Bottom-right: `radial-gradient(ellipse at bottom right, rgba(255,107,157,0.03), transparent 60%)`
- Mid-left: `radial-gradient(ellipse at 20% 60%, rgba(255,179,71,0.02), transparent 50%)`

### Custom Cursor

Apply globally. Two elements:

- Dot: `8px × 8px` filled circle, `background: white`, `mix-blend-mode: difference`, follows mouse exactly.
- Ring: `28px × 28px` circle border, `border: 1px solid white`, `mix-blend-mode: difference`, follows mouse with ~80ms lag (lerp or CSS transition).
- Hide the default cursor: `cursor: none` on `body`.

---

## Animations

Use sparingly — only on high-impact moments.

| Element          | Animation                                                            |
| ---------------- | -------------------------------------------------------------------- |
| Logo shimmer     | Gradient background-position shift, 6s ease-in-out infinite          |
| Page load        | Logo fades up: `opacity 0 → 1`, `translateY 20px → 0`, duration 0.8s |
| Message entry    | `fadeUp`: `opacity 0 → 1`, `translateY 8px → 0`, duration 0.3s ease  |
| Typing dots      | Staggered pulse: scale or opacity, 0.4s intervals                    |
| Page transitions | Opacity fade: 0.3s ease                                              |
| Mode divider     | Fade in: 0.3s ease                                                   |

**NEVER use:** bounce, spring, slide-in-from-sides, scale-up-from-zero, or any physics-based easing.

---

## Component Defaults

### Buttons

```css
background: transparent;
border: 1px solid rgba(255, 255, 255, 0.1);
color: var(--text);
font-family: "Space Mono", monospace;
text-transform: uppercase;
letter-spacing: 0.1em;
border-radius: 0;
transition:
  letter-spacing 0.2s ease,
  border-color 0.2s ease;

&:hover {
  letter-spacing: 0.15em;
  border-color: rgba(255, 255, 255, 0.2);
}
```

### Inputs

```css
background: transparent;
border: none;
border-bottom: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 0;
color: var(--text);
font-family: "Space Mono", monospace;

&:focus {
  border-bottom-color: rgba(157, 140, 255, 0.6);
  outline: none;
}
```

### Cards

```css
background: var(--surface); /* #12121c */
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: 0;
```

### Gradient Send Button

```css
background: linear-gradient(135deg, #9d8cff, #ff6b9d);
border: none;
border-radius: 0;
```

### Mode Badge

```css
background: rgba(157, 140, 255, 0.12);
border: 1px solid rgba(157, 140, 255, 0.25);
color: #9d8cff;
font-family: "Space Mono", monospace;
font-size: 0.65rem;
text-transform: uppercase;
letter-spacing: 0.08em;
border-radius: 0;
padding: 2px 8px;
```

---

## Responsive Breakpoints

- Mobile: < 768px — single column layouts, sidebar collapses to bottom drawer or hidden
- Desktop: ≥ 768px — full split layouts, 2-column grids

---

## Z-Index Scale

```
blobs:          0
content:        1
sidebar:        10
header:         20
modal:          100
noise-overlay:  9999
cursor:         10000
```
