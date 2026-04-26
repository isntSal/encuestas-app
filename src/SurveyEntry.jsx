import { useState } from 'react';
import { Heading, Text, Label, ErrorMessage, HelperText } from './components/Typography';
import { inputValid, inputError, btnPrimary } from './styles/textStyles';

/**
 * SurveyEntry — Puerta de enlace
 * Captura Nombre y Documento de Identidad del encuestado.
 * Al enviar el formulario llama a `onSubmit({ nombre, identificacion })`
 * para actualizar el estado global en App.jsx y desbloquear la encuesta.
 *
 * Props:
 *   surveyTitle  {string}   — Título de la encuesta a mostrar (opcional)
 *   onSubmit     {Function} — Callback que recibe el objeto Respondent
 */
export default function SurveyEntry({ surveyTitle = 'Encuesta', onSubmit }) {
  const [nombre, setNombre] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [errors, setErrors] = useState({});

  // ── Validación simple ──
  const validate = () => {
    const newErrors = {};
    if (!nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.';
    if (!identificacion.trim()) {
      newErrors.identificacion = 'El documento de identidad es obligatorio.';
    } else if (!/^\d{6,15}$/.test(identificacion.trim())) {
      newErrors.identificacion = 'Ingresa un número de documento válido (6-15 dígitos).';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    onSubmit({ nombre: nombre.trim(), identificacion: identificacion.trim() });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* ── Logo / Badge ── */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-sm text-sm font-bold text-slate-500 tracking-wide uppercase">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            Formulario de Encuesta
          </span>
        </div>

        {/* ── Card ── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-900/5 p-8">

          {/* Título */}
          <div className="text-center mb-8">
            <Heading as="h1">{surveyTitle}</Heading>
            <Text variant="secondary" center className="mt-2">
              Por favor identifícate antes de continuar.
            </Text>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Campo — Nombre completo */}
            <div>
              <Label htmlFor="entry-nombre" required>
                Nombre completo
              </Label>
              <input
                id="entry-nombre"
                type="text"
                autoComplete="name"
                placeholder="Ej: María García López"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: '' }));
                }}
                aria-describedby={errors.nombre ? 'error-nombre' : undefined}
                aria-invalid={!!errors.nombre}
                className={errors.nombre ? inputError : inputValid}
              />
              <ErrorMessage message={errors.nombre} id="error-nombre" />
            </div>

            {/* Campo — Documento de identidad */}
            <div>
              <Label htmlFor="entry-identificacion" required>
                Número de documento
              </Label>
              <input
                id="entry-identificacion"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Ej: 1234567890"
                value={identificacion}
                onChange={(e) => {
                  setIdentificacion(e.target.value);
                  if (errors.identificacion) setErrors((prev) => ({ ...prev, identificacion: '' }));
                }}
                aria-describedby={errors.identificacion ? 'error-identificacion' : undefined}
                aria-invalid={!!errors.identificacion}
                className={errors.identificacion ? inputError : inputValid}
              />
              <ErrorMessage message={errors.identificacion} id="error-identificacion" />
            </div>

            {/* Submit */}
            <button
              id="entry-submit"
              type="submit"
              className={btnPrimary}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
              </svg>
              Iniciar encuesta
            </button>

          </form>
        </div>

        {/* Footer */}
        <HelperText center icon className="text-center mt-6">
          Tus datos son confidenciales y se usan únicamente con fines académicos.
        </HelperText>

      </div>
    </div>
  );
}
