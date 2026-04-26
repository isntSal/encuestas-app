/**
 * Label.jsx
 * ─────────────────────────────────────────────────────────────────
 * Form field label — always <label>, always uppercase + tracked.
 *
 * Props:
 *   htmlFor  {string}  — links to input id (for accessibility)
 *   muted    {bool}    — smaller, lighter variant (default false)
 *   required {bool}    — appends a red asterisk (default false)
 *   className{string}
 *   children {ReactNode}
 *
 * Usage:
 *   <Label htmlFor="email">Correo electrónico</Label>
 *   <Label htmlFor="doc" muted>Número de documento</Label>
 *   <Label htmlFor="name" required>Nombre completo</Label>
 */
import { TX } from '../../styles/textStyles';

export default function Label({
  htmlFor,
  muted = false,
  required = false,
  className = '',
  children,
  ...rest
}) {
  const base = muted ? TX.labelMuted : TX.label;

  return (
    <label
      htmlFor={htmlFor}
      className={[base, 'mb-1.5', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
      {required && (
        <span className="ml-1 text-red-500" aria-hidden="true">*</span>
      )}
    </label>
  );
}
