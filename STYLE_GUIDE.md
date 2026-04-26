# Style Guide — Survey App

> Design system reference for developers and contributors.
> Last updated: 2026-04

---

## 1. Core principles

| Principle | Guideline |
|-----------|-----------|
| **Clarity first** | Every text element must be immediately readable — no ambiguous contrast ratios |
| **Conversational but professional** | Write labels and helper text as if explaining to a smart colleague |
| **Generous spacing** | When in doubt, add more vertical space — cramped UI signals low quality |
| **Accessibility** | Every form input has a visible `<label>`, `aria-describedby`, and `role="alert"` on errors |
| **Single source of truth** | All class strings live in `src/styles/textStyles.js` — never repeat raw Tailwind combos |

---

## 2. Color palette

Defined in `src/styles/styleConstants.js` as `COLORS`.

### Backgrounds
| Token | Hex | Use |
|-------|-----|-----|
| `bgPage` | `#e8e6e1` | Body canvas |
| `bgCard` | `#ffffff` | Cards, modals |
| `bgCardMuted` | `#f8fafc` | Input fills |
| `bgPanelGlass` | `rgba(255,255,255,0.40)` | Glassmorphism side-panel |

### Text
| Token | Tailwind class | Use |
|-------|---------------|-----|
| `textPrimary` | `text-slate-900` | h1, h2, form values |
| `textSecondary` | `text-slate-600` | Descriptions, sub-copy |
| `textMuted` | `text-slate-400` | Placeholders, footers |

### Accents
| Token | Hex | Use |
|-------|-----|-----|
| `accentBlue` | `#2563eb` | Primary buttons, focus rings |
| `accentTeal` | `#0d9488` | Survey step buttons |
| `accentIndigo` | `#6366f1` | AI / Insights panel |

### Semantic
| State | Background | Text | Border |
|-------|-----------|------|--------|
| Error | `red-50` | `red-500` | `red-300` |
| Success | `emerald-50` | `emerald-500` | `emerald-200` |
| Warning | `amber-50` | `amber-500` | `amber-200` |

---

## 3. Typography scale

Defined in `src/styles/styleConstants.js` as `FONT`.

| Level | Size | Weight | Line-height | Tailwind class (via `TX`) |
|-------|------|--------|-------------|--------------------------|
| **Heading 1** | 24px | Black 900 | 1.25 | `TX.heading1` |
| **Heading 2** | 18px | Black 900 | 1.375 | `TX.heading2` |
| **Heading 3** | 14px | Black 900 | 1.375 | `TX.heading3` |
| **Body** | 14px | Medium 500 | 1.625 | `TX.body` |
| **Body Secondary** | 14px | Regular 400 | 1.625 | `TX.bodySecondary` |
| **AI Insight** | 14px | Medium 500 | 1.75 | `TX.bodyInsight` |
| **Label** | 12px | Bold 700 | — | `TX.label` |
| **Label Muted** | 10px | Bold 700 | — | `TX.labelMuted` |
| **Helper** | 12px | Medium 500 | 1.375 | `TX.helper` |
| **Caption** | 10px | Medium 500 | — | `TX.caption` |
| **Mono** | 10px | Bold 700 | — | `TX.mono` |

---

## 4. Components

All typography components live in `src/components/Typography/` and re-export from `index.js`.

```js
import { Heading, Text, Label, ErrorMessage, HelperText } from './components/Typography';
```

### `<Heading>`

```jsx
// h1 — Page title (default)
<Heading>Título de la Encuesta</Heading>

// h2 — Section title
<Heading as="h2" level={2}>Identificación</Heading>

// h1 with gradient (dark bg safe)
<Heading as="h1" gradient center>{survey.titulo}</Heading>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `as` | `'h1'│'h2'│'h3'` | `'h1'` | HTML element |
| `level` | `1│2│3` | inferred from `as` | Visual size |
| `gradient` | `bool` | `false` | Blue gradient fill |
| `center` | `bool` | `false` | Center text |
| `className` | `string` | `''` | Extra classes |

---

### `<Text>`

```jsx
// Normal paragraph
<Text>Por favor completa todos los campos requeridos.</Text>

// Secondary / muted
<Text variant="secondary">Tus datos son confidenciales.</Text>

// AI-generated — extra generous line-height
<Text variant="insight">{insightText}</Text>

// Caption (10px)
<Text variant="caption" center>Motor de Encuestas · Respuesta confidencial</Text>
```

**Variants:** `body` (default) · `secondary` · `insight` · `caption` · `mono`

---

### `<Label>`

```jsx
<Label htmlFor="entry-nombre" required>
  Nombre completo
</Label>

// Smaller / lighter
<Label htmlFor="meta" muted>Paso 1 de 2</Label>
```

> Always pair with an input's `id` via `htmlFor` for accessibility.

---

### `<ErrorMessage>`

```jsx
// Self-hides when message is empty — safe to always render
<ErrorMessage message={errors.nombre} id="error-nombre" />
```

Link the input to the error for screen-readers:
```jsx
<input
  id="entry-nombre"
  aria-describedby="error-nombre"
  aria-invalid={!!errors.nombre}
/>
<ErrorMessage message={errors.nombre} id="error-nombre" />
```

---

### `<HelperText>`

```jsx
// Default (slate-400)
<HelperText>Solo letras, mínimo dos palabras.</HelperText>

// Blue accent — for calls-to-action
<HelperText accent>
  Presiona «Generar análisis» para obtener un resumen.
</HelperText>

// With info icon
<HelperText icon>
  Tus datos son confidenciales.
</HelperText>
```

---

## 5. Input styles

From `src/styles/textStyles.js`:

```js
import { inputValid, inputError } from '../styles/textStyles';

<input className={errors.field ? inputError : inputValid} />
```

Both strings include: `rounded-xl border bg-slate-50 text-slate-900 font-semibold text-sm placeholder-slate-400 focus:outline-none focus:bg-white transition-all`

---

## 6. Button styles

```js
import { btnPrimary, btnSecondary, btnTeal, btnDisabled } from '../styles/textStyles';

// Primary blue (default CTA)
<button className={btnPrimary}>Iniciar encuesta</button>

// Teal (survey flow)
<button className={btnTeal}>Continuar a la pregunta</button>

// Secondary ghost
<button className={btnSecondary}>← Atrás</button>

// Disabled state (no opacity trick — explicit disabled classes)
<button disabled className={btnDisabled}>Enviar respuesta</button>
```

---

## 7. Spacing rules

- Between label and input: `mb-1.5` (via `Label` component)
- Between form fields: `space-y-5` on the `<form>`
- Between card sections: `space-y-4` or `py-5`
- Between cards on a page: `mt-4` or `gap-4`
- Inside a card: `p-6` or `p-8`

---

## 8. Do's and Don'ts

**✅ Do**
- Use `<Heading>`, `<Text>`, `<Label>` — never raw `<h1>`, `<p>`, `<label>` with manually typed Tailwind
- Use `TX.xxx` or `inputValid/btnPrimary` from `textStyles.js` for any shared style
- Add `aria-describedby` + `aria-invalid` to every validated input
- Prefer `variant="secondary"` over inline `text-slate-500`

**❌ Don't**
- Don't write `className="text-sm font-medium text-slate-700 leading-relaxed"` inline — use `TX.body`
- Don't style headings with different font sizes without updating `styleConstants.js`
- Don't skip `<ErrorMessage>` in forms — always render it (it self-hides when empty)
- Don't add new colors not defined in `COLORS` — extend the token file instead
