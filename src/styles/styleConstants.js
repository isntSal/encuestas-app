/**
 * styleConstants.js
 * ─────────────────────────────────────────────────────────────────
 * Design tokens for the survey app.
 * Matches the current "Light Professional" palette (beige #e8e6e1 base).
 * Keep all raw values here; use textStyles.js for Tailwind class combos.
 * ─────────────────────────────────────────────────────────────────
 */

/* ── Brand palette ─────────────────────────────────────────────── */
export const COLORS = {
  // Backgrounds
  bgPage:          '#e8e6e1',   // beige canvas (body)
  bgCard:          '#ffffff',   // pure white card
  bgCardMuted:     '#f8fafc',   // very light slate for input fills
  bgPanelGlass:    'rgba(255,255,255,0.40)', // glass side-panel

  // Text
  textPrimary:     '#1e293b',   // slate-800 — main headings & body
  textSecondary:   '#475569',   // slate-600 — subtext, descriptions
  textMuted:       '#94a3b8',   // slate-400 — placeholders, helper
  textInverse:     '#ffffff',   // on dark / colored buttons

  // Brand accents
  accentBlue:      '#0f172a',   // slate-900 (black replacement)
  accentBlueLite:  '#1e293b',   // slate-800
  accentTeal:      '#0d9488',   // teal-600
  accentTealLite:  '#14b8a6',   // teal-500
  accentIndigo:    '#6366f1',   // indigo-500 (AI panel)

  // Semantic
  error:           '#ef4444',   // red-500
  errorBg:         '#fef2f2',   // red-50
  errorBorder:     '#fca5a5',   // red-300
  success:         '#10b981',   // emerald-500
  successBg:       '#ecfdf5',   // emerald-50
  warning:         '#f59e0b',   // amber-500
  warningBg:       '#fffbeb',   // amber-50

  // Borders
  border:          '#e2e8f0',   // slate-200
  borderFocus:     '#0f172a',   // slate-900
  borderFocusTeal: '#0d9488',   // teal-600
};

/* ── Typography scale ───────────────────────────────────────────── */
export const FONT = {
  family:  "'Inter', 'Outfit', system-ui, sans-serif",

  // Size
  xs:   '0.75rem',    // 12px — labels, badges, helpers
  sm:   '0.875rem',   // 14px — body, form inputs
  base: '1rem',       // 16px — base body
  lg:   '1.125rem',   // 18px — card sub-headings
  xl:   '1.25rem',    // 20px — section headings
  '2xl': '1.5rem',    // 24px — page headings
  '3xl': '1.875rem',  // 30px — hero headings

  // Weight
  normal:    400,
  medium:    500,
  semibold:  600,
  bold:      700,
  black:     900,

  // Line-height
  tight:    1.25,
  snug:     1.375,
  normal_lh: 1.5,
  relaxed:  1.625,
};

/* ── Spacing ────────────────────────────────────────────────────── */
export const SPACE = {
  0.5: '0.125rem',
  1:   '0.25rem',
  1.5: '0.375rem',
  2:   '0.5rem',
  2.5: '0.625rem',
  3:   '0.75rem',
  4:   '1rem',
  5:   '1.25rem',
  6:   '1.5rem',
  8:   '2rem',
  10:  '2.5rem',
};

/* ── Border radii ───────────────────────────────────────────────── */
export const RADIUS = {
  sm:   '0.5rem',    // 8px  — small chips, badges
  md:   '0.75rem',   // 12px — inputs
  lg:   '1rem',      // 16px — cards
  xl:   '1.25rem',   // 20px — buttons
  '2xl': '1.5rem',   // 24px — large cards
  '3xl': '1.875rem', // 30px — page-level cards
  full: '9999px',    // pills / circular
};

/* ── Shadows ────────────────────────────────────────────────────── */
export const SHADOW = {
  sm:   '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.04)',
  md:   '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
  lg:   '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.03)',
  card: '0 20px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.03)',
};
