import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseKey) : null;

/* ──────────── Validaciones de identidad ──────────── */
// Nombre: mínimo 2 palabras, solo letras (incluyendo tildes), espacios, guiones. Sin números.
const NAME_RE = /^[A-Za-záéíóúÁÉÍÓÚüÜñÑ]+(\s[A-Za-záéíóúÁÉÍÓÚüÜñÑ]+)+$/;
// Documento: solo dígitos, entre 5 y 15 caracteres
const ID_RE = /^\d{5,15}$/;

const validateIdentity = ({ nombre, identificacion }) => {
  const errors = {};
  const n = nombre.trim();
  const id = identificacion.trim();
  if (!n) errors.nombre = 'El nombre es obligatorio.';
  else if (!NAME_RE.test(n)) errors.nombre = 'Ingresa tu nombre completo (solo letras, mínimo dos palabras).';
  if (!id) errors.identificacion = 'El documento es obligatorio.';
  else if (!ID_RE.test(id)) errors.identificacion = 'El documento debe contener solo números (5–15 dígitos).';
  return errors;
};

/* ──────────── Íconos inline ──────────── */
const IconStar = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/* ──────────── COMPONENTE PRINCIPAL ──────────── */
export default function SurveyResponder() {
  const { id } = useParams();

  // Pasos: 'identity' → 'question' → 'submitted'
  const [step, setStep] = useState('identity');
  const [identity, setIdentity] = useState({ nombre: '', identificacion: '' });
  const [identityErrors, setIdentityErrors] = useState({});

  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState('');
  const [hovered, setHovered] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  /* ─── Cargar encuesta ─── */
  useEffect(() => {
    const fetchSurvey = async () => {
      if (!supabase) { setError('Error de configuración del servidor.'); setLoading(false); return; }
      const { data, error: fetchError } = await supabase
        .from('encuestas_generales')
        .select('*')
        .eq('id', id)
        .eq('activa', true)
        .single();
      if (fetchError || !data) setError('Esta encuesta no existe o ya no está disponible.');
      else setSurvey(data);
      setLoading(false);
    };
    fetchSurvey();
  }, [id]);

  /* ─── Paso 1: validar identidad ─── */
  const handleIdentitySubmit = (e) => {
    e.preventDefault();
    const errors = validateIdentity(identity);
    if (Object.keys(errors).length > 0) { setIdentityErrors(errors); return; }
    setIdentityErrors({});
    setStep('question');
  };

  /* ─── Paso 2: enviar respuesta ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) { setSubmitError('Por favor selecciona una opción para continuar.'); return; }
    setSubmitting(true);
    setSubmitError('');
    const { error: insertError } = await supabase
      .from('respuestas_encuestas')
      .insert([{
        encuesta_id: id,
        respuesta: selected,
        respondent_name: identity.nombre.trim(),
        respondent_id: identity.identificacion.trim(),
      }]);
    if (insertError) { setSubmitError('Ocurrió un error al enviar. Inténtalo de nuevo.'); setSubmitting(false); }
    else setStep('submitted');
  };

  /* ─── Render: loading ─── */
  if (loading) return (
    <Screen>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-semibold">Cargando encuesta...</p>
      </div>
    </Screen>
  );

  /* ─── Render: error ─── */
  if (error) return (
    <Screen>
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-xl font-black text-slate-800">Encuesta no disponible</h1>
        <p className="text-slate-500 text-sm">{error}</p>
      </div>
    </Screen>
  );

  /* ─── Render: confirmación ─── */
  if (step === 'submitted') return (
    <Screen bg="from-teal-50 to-emerald-50">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-teal-500 flex items-center justify-center mx-auto shadow-xl shadow-teal-500/30"
          style={{ animation: 'pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">¡Gracias, {identity.nombre.split(' ')[0]}!</h1>
          <p className="text-slate-500 text-sm leading-relaxed">Tu respuesta ha sido registrada correctamente.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tu respuesta</p>
          <p className="text-lg font-black text-teal-600">{selected}</p>
          <p className="text-[10px] text-slate-400">Registrado como: {identity.nombre}</p>
        </div>
        <p className="text-xs text-slate-400">Puedes cerrar esta ventana.</p>
      </div>
      <style>{`@keyframes pop { 0%{transform:scale(0)} 80%{transform:scale(1.05)} 100%{transform:scale(1)} }`}</style>
    </Screen>
  );

  const opciones = Array.isArray(survey.opciones) ? survey.opciones : [];

  return (
    <Screen>
      <div className="w-full max-w-md space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">Encuesta</p>
          <h1 className="text-2xl font-black tracking-tight"
            style={{ background: 'linear-gradient(135deg,#1e293b 0%,#475569 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {survey.titulo}
          </h1>
          {survey.descripcion && (
            <p className="text-sm text-slate-500 leading-relaxed pt-1 max-w-sm mx-auto">{survey.descripcion}</p>
          )}
        </div>

        {/* Indicador de paso */}
        <div className="flex items-center gap-2 justify-center">
          {['identity', 'question'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center transition-all ${
                step === s ? 'bg-teal-500 text-white shadow-md shadow-teal-200' :
                (step === 'question' && s === 'identity') || step === 'submitted' ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'
              }`}>{i + 1}</span>
              {i === 0 && <div className="w-8 h-px bg-slate-200" />}
            </div>
          ))}
        </div>

        {/* ─── PASO 1: Identificación ─── */}
        {step === 'identity' && (
          <form onSubmit={handleIdentitySubmit} className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 p-6 space-y-5">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Paso 1 de 2</p>
              <p className="text-base font-bold text-slate-800">Identifícate antes de responder</p>
              <p className="text-xs text-slate-400 mt-0.5">Tus datos son confidenciales y solo los ve el creador de la encuesta.</p>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                autoComplete="name"
                placeholder="Ej: María Fernanda López"
                value={identity.nombre}
                onChange={e => setIdentity(prev => ({ ...prev, nombre: e.target.value }))}
                className={`w-full px-4 py-3 rounded-2xl border-2 text-sm font-semibold text-slate-800 bg-slate-50 placeholder-slate-300 focus:outline-none focus:bg-white transition-all ${
                  identityErrors.nombre ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-teal-400'
                }`}
              />
              {identityErrors.nombre && (
                <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {identityErrors.nombre}
                </p>
              )}
            </div>

            {/* Documento */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                Número de documento
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Ej: 1020304050"
                value={identity.identificacion}
                onChange={e => setIdentity(prev => ({ ...prev, identificacion: e.target.value.replace(/\D/g, '') }))}
                className={`w-full px-4 py-3 rounded-2xl border-2 text-sm font-mono font-bold text-slate-800 bg-slate-50 placeholder-slate-300 focus:outline-none focus:bg-white tracking-widest transition-all ${
                  identityErrors.identificacion ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-teal-400'
                }`}
              />
              {identityErrors.identificacion && (
                <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {identityErrors.identificacion}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl font-black text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Continuar a la pregunta
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </form>
        )}

        {/* ─── PASO 2: Pregunta ─── */}
        {step === 'question' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 p-6 space-y-5">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Paso 2 de 2 · Hola, {identity.nombre.split(' ')[0]}</p>
              <p className="text-base font-bold text-slate-800 leading-snug">{survey.pregunta}</p>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Opciones */}
            <div className="space-y-2.5">
              {survey.tipo === 'valoracion' ? (
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-3">Selecciona tu puntuación</p>
                  <div className="flex justify-center gap-3">
                    {opciones.map((op) => {
                      const starNum = parseInt(op);
                      const selNum = selected ? parseInt(selected) : 0;
                      const hovNum = hovered ? parseInt(hovered) : 0;
                      const isActive = hovered ? hovNum >= starNum : selNum >= starNum;
                      return (
                        <button key={op} type="button"
                          onClick={() => setSelected(op)}
                          onMouseEnter={() => setHovered(op)}
                          onMouseLeave={() => setHovered('')}
                          className={`transition-all duration-75 active:scale-90 ${isActive ? 'text-amber-400' : 'text-slate-200'}`}>
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
                opciones.map((op) => {
                  const isSelected = selected === op;
                  return (
                    <label key={op} onClick={() => setSelected(op)}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-150 select-none ${
                        isSelected ? 'border-teal-500 bg-teal-50 shadow-sm shadow-teal-200/60' : 'border-slate-100 bg-slate-50 hover:border-slate-300 hover:bg-white'
                      }`}>
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'border-teal-500 bg-teal-500' : 'border-slate-300'
                      }`}>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                      </span>
                      <span className={`text-sm font-bold transition-colors ${isSelected ? 'text-teal-700' : 'text-slate-700'}`}>{op}</span>
                    </label>
                  );
                })
              )}
            </div>

            {submitError && <p className="text-xs font-semibold text-red-500 text-center">{submitError}</p>}

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep('identity')}
                className="px-4 py-3.5 rounded-2xl font-bold text-sm text-slate-400 bg-slate-100 hover:bg-slate-200 transition-all active:scale-[0.98]">
                ← Atrás
              </button>
              <button type="submit" disabled={submitting || !selected}
                className={`flex-1 py-3.5 rounded-2xl font-black text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] ${
                  selected && !submitting ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/25' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}>
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando...</>
                ) : (
                  <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Enviar respuesta</>
                )}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-[10px] text-slate-400 font-medium">Motor de Encuestas · Respuesta confidencial</p>
      </div>
    </Screen>
  );
}

/* ─── Wrapper de pantalla ─── */
function Screen({ children, bg = 'from-slate-50 to-slate-100' }) {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${bg} flex flex-col items-center justify-center px-4 py-10 font-sans`}>
      {children}
    </div>
  );
}
