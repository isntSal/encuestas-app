/**
 * ErrorMessage.jsx
 * ─────────────────────────────────────────────────────────────────
 * Inline validation error shown below form fields.
 * Renders nothing when `message` is falsy — safe to always include.
 *
 * Props:
 *   message   {string}  — Error text to display
 *   id        {string}  — Optional id for aria-describedby linkage
 *   className {string}
 *
 * Usage:
 *   <ErrorMessage message={errors.nombre} id="nombre-error" />
 */
import { TX } from '../../styles/textStyles';

/* Inline error icon (circle with exclamation mark) */
function ErrorIcon() {
  return (
    <svg
      width="12" height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export default function ErrorMessage({ message, id, className = '' }) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className={[TX.error, 'mt-1.5', className].filter(Boolean).join(' ')}
    >
      <ErrorIcon />
      {message}
    </p>
  );
}
