/**
 * Text.jsx
 * ─────────────────────────────────────────────────────────────────
 * Versatile paragraph / span component.
 *
 * Props:
 *   as        {'p'|'span'|'div'}  — HTML element (default: 'p')
 *   variant   {'body'|'secondary'|'insight'|'caption'|'mono'}
 *   center    {bool}
 *   className {string}
 *   children  {ReactNode}
 *
 * Usage:
 *   <Text>Párrafo normal con buen interlineado.</Text>
 *   <Text variant="secondary">Texto descriptivo gris.</Text>
 *   <Text variant="insight">{aiGeneratedText}</Text>
 *   <Text variant="caption" center>Nota al pie</Text>
 */
import { TX } from '../../styles/textStyles';

const VARIANT_CLASSES = {
  body:       TX.body,
  secondary:  TX.bodySecondary,
  insight:    TX.bodyInsight,
  caption:    TX.caption,
  mono:       TX.mono,
};

export default function Text({
  as: Tag = 'p',
  variant = 'body',
  center = false,
  className = '',
  children,
  ...rest
}) {
  const base = VARIANT_CLASSES[variant] ?? TX.body;

  return (
    <Tag
      className={[
        base,
        center ? 'text-center' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  );
}
