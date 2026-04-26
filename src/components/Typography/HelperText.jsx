/**
 * HelperText.jsx
 * ─────────────────────────────────────────────────────────────────
 * Small helper / hint text that sits below a form field or section.
 * Can also display a non-critical informational note with an icon.
 *
 * Props:
 *   children  {ReactNode}
 *   accent    {bool}    — Use blue accent color (for tips / links)
 *   icon      {bool}    — Prepend an info icon (default false)
 *   className {string}
 *
 * Usage:
 *   <HelperText>Solo letras, mínimo dos palabras.</HelperText>
 *   <HelperText accent>Toca "Generar análisis" para continuar.</HelperText>
 *   <HelperText icon>Tus datos son confidenciales.</HelperText>
 */
import { TX } from '../../styles/textStyles';

function InfoIcon() {
  return (
    <svg
      width="11" height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
      className="shrink-0 mt-px"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export default function HelperText({
  children,
  accent = false,
  icon = false,
  className = '',
}) {
  const base = accent ? TX.helperAccent : TX.helper;

  return (
    <p className={[
      base,
      icon ? 'flex items-start gap-1' : '',
      'mt-1',
      className,
    ].filter(Boolean).join(' ')}>
      {icon && <InfoIcon />}
      {children}
    </p>
  );
}
