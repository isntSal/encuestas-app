/**
 * Heading.jsx
 * ─────────────────────────────────────────────────────────────────
 * Renders h1, h2, or h3 using the design system's type scale.
 *
 * Props:
 *   as       {'h1'|'h2'|'h3'}  — HTML element (default: 'h1')
 *   level    {1|2|3}           — Visual size (default mirrors `as`)
 *   gradient {bool}            — Apply blue gradient fill (default false)
 *   center   {bool}            — Center alignment (default false)
 *   className {string}         — Extra Tailwind classes
 *   children  {ReactNode}
 *
 * Usage:
 *   <Heading>Page Title</Heading>
 *   <Heading as="h2" level={2}>Section</Heading>
 *   <Heading as="h1" gradient center>Survey Title</Heading>
 */
import { TX } from '../../styles/textStyles';

const LEVEL_CLASSES = {
  1: TX.heading1,
  2: TX.heading2,
  3: TX.heading3,
};

const GRADIENT_STYLE = {
  background: 'linear-gradient(135deg, #1e293b 0%, #3b82f6 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

export default function Heading({
  as: Tag = 'h1',
  level,
  gradient = false,
  center = false,
  className = '',
  children,
  ...rest
}) {
  // Infer level from tag if not explicitly provided
  const resolvedLevel = level ?? parseInt(Tag.replace('h', '')) ?? 1;
  const base = LEVEL_CLASSES[resolvedLevel] ?? TX.heading1;

  return (
    <Tag
      className={[
        base,
        center ? 'text-center' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={gradient ? GRADIENT_STYLE : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
