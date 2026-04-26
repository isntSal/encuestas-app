/**
 * textStyles.js
 * ─────────────────────────────────────────────────────────────────
 * Reusable Tailwind CSS class strings.
 *
 * Usage example:
 *   import { TX } from '../styles/textStyles';
 *   <h1 className={TX.heading1}>Mi Título</h1>
 * ─────────────────────────────────────────────────────────────────
 */

/* ── Headings ───────────────────────────────────────────────────── */
export const TX = {
  // h1 — Page / survey title
  heading1: [
    'text-2xl font-black text-slate-900',
    'tracking-tight leading-tight',
  ].join(' '),

  // h2 — Section title (inside panels / cards)
  heading2: [
    'text-lg font-black text-slate-800',
    'tracking-tight leading-snug',
  ].join(' '),

  // h3 — Sub-section or card heading
  heading3: [
    'text-sm font-black text-slate-800',
    'leading-snug',
  ].join(' '),

  /* ── Body text ──────────────────────────────────────────────── */

  // Normal paragraph — used inside cards, insight panels, etc.
  body: [
    'text-sm font-medium text-slate-700',
    'leading-relaxed',
  ].join(' '),

  // Secondary / descriptive text
  bodySecondary: [
    'text-sm text-slate-500',
    'leading-relaxed',
  ].join(' '),

  // Insight / AI-generated text — needs generous line-height for readability
  bodyInsight: [
    'text-sm font-medium text-slate-700',
    'leading-[1.75] tracking-[0.01em]',
  ].join(' '),

  /* ── Labels ─────────────────────────────────────────────────── */

  // Standard form label
  label: [
    'block text-xs font-bold text-slate-600',
    'uppercase tracking-widest',
  ].join(' '),

  // Subtle label / eyebrow text
  labelMuted: [
    'block text-[10px] font-bold text-slate-400',
    'uppercase tracking-widest',
  ].join(' '),

  /* ── Helper / hint text ─────────────────────────────────────── */

  helper: [
    'text-xs text-slate-400 font-medium',
    'leading-snug',
  ].join(' '),

  helperAccent: [
    'text-xs font-semibold text-slate-900',
    'leading-snug',
  ].join(' '),

  /* ── Error messages ─────────────────────────────────────────── */

  error: [
    'text-xs font-semibold text-red-500',
    'flex items-center gap-1 leading-tight',
  ].join(' '),

  /* ── Badges / chips ─────────────────────────────────────────── */

  badge: [
    'inline-flex items-center gap-1.5',
    'text-[10px] font-bold uppercase tracking-widest',
    'px-2.5 py-1 rounded-full',
  ].join(' '),

  badgeBlue: [
    'inline-flex items-center gap-1.5',
    'text-[10px] font-bold uppercase tracking-widest',
    'px-2.5 py-1 rounded-full',
    'bg-slate-200 text-slate-900 border border-slate-300',
  ].join(' '),

  badgeTeal: [
    'inline-flex items-center gap-1.5',
    'text-[10px] font-bold uppercase tracking-widest',
    'px-2.5 py-1 rounded-full',
    'bg-teal-100 text-teal-700 border border-teal-200',
  ].join(' '),

  badgeIndigo: [
    'inline-flex items-center gap-1.5',
    'text-[10px] font-bold uppercase tracking-widest',
    'px-2.5 py-1 rounded-full',
    'bg-indigo-100 text-indigo-700 border border-indigo-200',
  ].join(' '),

  /* ── Misc text utilities ────────────────────────────────────── */

  caption: 'text-[10px] text-slate-400 font-medium',
  mono:    'text-[10px] font-mono font-bold text-slate-600 tracking-widest',
  link:    'text-slate-900 hover:text-black font-semibold underline-offset-2 hover:underline transition-colors',
};

/* ── Input / textarea base styles (string) ──────────────────────── */
export const inputBase = [
  'w-full px-4 py-3 rounded-xl border',
  'bg-slate-50 text-slate-900 font-semibold text-sm',
  'placeholder-slate-400 transition-all duration-150',
  'focus:outline-none focus:bg-white',
].join(' ');

export const inputValid = `${inputBase} border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-slate-900`;
export const inputError = `${inputBase} border-red-300 focus:ring-2 focus:ring-red-200`;

/* ── Button base styles ─────────────────────────────────────────── */
export const btnPrimary = [
  'w-full py-3.5 rounded-2xl font-bold text-sm',
  'flex items-center justify-center gap-2',
  'transition-all duration-150 active:scale-[0.98]',
  'bg-slate-900 hover:bg-black text-white',
  'shadow-md shadow-slate-900/20',
].join(' ');

export const btnSecondary = [
  'px-4 py-3.5 rounded-2xl font-bold text-sm',
  'transition-all duration-150 active:scale-[0.98]',
  'bg-slate-100 hover:bg-slate-200 text-slate-600',
].join(' ');

export const btnTeal = [
  'w-full py-3.5 rounded-2xl font-black text-sm',
  'flex items-center justify-center gap-2',
  'transition-all duration-150 active:scale-[0.98]',
  'bg-teal-600 hover:bg-teal-700 text-white',
  'shadow-md shadow-teal-600/25',
].join(' ');

export const btnDisabled = [
  'py-3.5 rounded-2xl font-black text-sm',
  'flex items-center justify-center gap-2',
  'bg-slate-100 text-slate-400 cursor-not-allowed',
].join(' ');
