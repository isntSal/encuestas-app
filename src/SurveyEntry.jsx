import { useState } from 'react';

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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {surveyTitle}
            </h1>
            <p className="mt-2 text-sm text-slate-400 font-medium">
              Por favor identifícate antes de continuar.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Campo — Nombre completo */}
            <div>
              <label
                htmlFor="entry-nombre"
                className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5"
              >
                Nombre completo
              </label>
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
                className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-900 font-semibold text-sm
                  placeholder-slate-300 transition-all duration-150 focus:outline-none focus:bg-white
                  ${errors.nombre
                    ? 'border-red-300 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-teal-400'
                  }`}
              />
              {errors.nombre && (
                <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {errors.nombre}
                </p>
              )}
            </div>

            {/* Campo — Documento de identidad */}
            <div>
              <label
                htmlFor="entry-identificacion"
                className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5"
              >
                Número de documento
              </label>
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
                className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-900 font-semibold text-sm
                  placeholder-slate-300 transition-all duration-150 focus:outline-none focus:bg-white
                  ${errors.identificacion
                    ? 'border-red-300 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-teal-400'
                  }`}
              />
              {errors.identificacion && (
                <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {errors.identificacion}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="entry-submit"
              type="submit"
              className="w-full mt-2 py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98]
                text-white font-bold text-sm rounded-2xl transition-all duration-150
                shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
              </svg>
              Iniciar encuesta
            </button>

          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          Tus datos son confidenciales y se usan únicamente con fines académicos.
        </p>

      </div>
    </div>
  );
}
