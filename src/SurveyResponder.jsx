import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseKey) : null;

/* ─── Íconos inline ─── */
const IconStar = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconCheck = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function SurveyResponder() {
  const { id } = useParams();

  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState('');
  const [hovered, setHovered] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  /* ─── Cargar encuesta desde Supabase ─── */
  useEffect(() => {
    const fetchSurvey = async () => {
      if (!supabase) {
        setError('Error de configuración del servidor.');
        setLoading(false);
        return;
      }
      const { data, error: fetchError } = await supabase
        .from('encuestas_generales')
        .select('*')
        .eq('id', id)
        .eq('activa', true)
        .single();

      if (fetchError || !data) {
        setError('Esta encuesta no existe o ya no está disponible.');
      } else {
        setSurvey(data);
      }
      setLoading(false);
    };
    fetchSurvey();
  }, [id]);

  /* ─── Enviar respuesta ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) {
      setSubmitError('Por favor selecciona una opción para continuar.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    const { error: insertError } = await supabase
      .from('respuestas_encuestas')
      .insert([{ encuesta_id: id, respuesta: selected }]);

    if (insertError) {
      setSubmitError('Ocurrió un error al enviar tu respuesta. Inténtalo de nuevo.');
      setSubmitting(false);
    } else {
      setSubmitted(true);
    }
  };

  /* ─── Renderizado: Loading ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-semibold">Cargando encuesta...</p>
        </div>
      </div>
    );
  }

  /* ─── Renderizado: Error ─── */
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="text-red-500"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          </div>
          <h1 className="text-xl font-black text-slate-800">Encuesta no disponible</h1>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  /* ─── Renderizado: Enviado ─── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center space-y-6">
          {/* Ícono de éxito animado */}
          <div className="w-20 h-20 rounded-full bg-teal-500 flex items-center justify-center mx-auto shadow-xl shadow-teal-500/30"
            style={{ animation: 'pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            <span className="text-white"><IconCheck /></span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 mb-2">¡Gracias por responder!</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Tu respuesta ha sido registrada correctamente.<br />Los resultados se actualizan en tiempo real.
            </p>
          </div>
          {/* Respuesta enviada */}
          <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tu respuesta</p>
            <p className="text-lg font-black text-teal-600">{selected}</p>
          </div>
          <p className="text-xs text-slate-400">Puedes cerrar esta ventana.</p>
        </div>
        <style>{`
          @keyframes pop {
            0% { transform: scale(0); }
            80% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  /* ─── Opciones según tipo ─── */
  const opciones = Array.isArray(survey.opciones) ? survey.opciones : [];

  /* ─── Renderizado principal ─── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">Encuesta</p>
          <h1
            className="text-2xl font-black tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {survey.titulo}
          </h1>
          {survey.descripcion && (
            <p className="text-sm text-slate-500 leading-relaxed pt-1 max-w-sm mx-auto">
              {survey.descripcion}
            </p>
          )}
        </div>

        {/* Tarjeta de pregunta */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 p-6 space-y-5">

          {/* Pregunta */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pregunta</p>
            <p className="text-base font-bold text-slate-800 leading-snug">{survey.pregunta}</p>
          </div>

          {/* Separador */}
          <div className="h-px bg-slate-100" />

          {/* Opciones según tipo */}
          <div className="space-y-2.5">
            {survey.tipo === 'valoracion' ? (
              /* Valoración con estrellas */
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-3">Selecciona tu puntuación</p>
                <div className="flex justify-center gap-3">
                  {opciones.map((op) => {
                    const starNum = parseInt(op);
                    const isSelected = selected === op;
                    const isHovered = hovered ? parseInt(hovered) >= starNum : false;
                    const isActive = isSelected ? parseInt(selected) >= starNum : isHovered;
                    return (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setSelected(op)}
                        onMouseEnter={() => setHovered(op)}
                        onMouseLeave={() => setHovered('')}
                        className={`transition-all duration-75 active:scale-90 ${isActive ? 'text-amber-400' : 'text-slate-200'}`}
                      >
                        <IconStar filled={isActive} />
                      </button>
                    );
                  })}
                </div>
                {selected && (
                  <p className="text-center text-sm font-bold text-amber-500 mt-2">
                    {parseInt(selected)} de {opciones.length} estrellas
                  </p>
                )}
              </div>
            ) : (
              /* Sí/No y Múltiple — radio buttons */
              opciones.map((op) => {
                const isSelected = selected === op;
                return (
                  <label
                    key={op}
                    onClick={() => setSelected(op)}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-150 select-none ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 shadow-sm shadow-teal-200/60'
                        : 'border-slate-100 bg-slate-50 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    {/* Radio indicator */}
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'border-teal-500 bg-teal-500' : 'border-slate-300'
                    }`}>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                    </span>
                    <span className={`text-sm font-bold transition-colors ${
                      isSelected ? 'text-teal-700' : 'text-slate-700'
                    }`}>
                      {op}
                    </span>
                  </label>
                );
              })
            )}
          </div>

          {/* Error de validación */}
          {submitError && (
            <p className="text-xs font-semibold text-red-500 text-center">{submitError}</p>
          )}

          {/* Botón enviar */}
          <button
            type="submit"
            disabled={submitting || !selected}
            className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] ${
              selected && !submitting
                ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/25'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Enviar respuesta
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 font-medium">
          Motor de Encuestas · Respuesta anónima y segura
        </p>
      </div>
    </div>
  );
}
