import { useState, useEffect, useRef } from 'react';
import Groq from 'groq-sdk';
import { Heading, Text, Label } from './components/Typography';
import { TX } from './styles/textStyles';

const groq = import.meta.env.VITE_GROQ_API_KEY
  ? new Groq({ apiKey: import.meta.env.VITE_GROQ_API_KEY, dangerouslyAllowBrowser: true })
  : null;

/* ──────────────────────────────────────────────────
   Utility: Call Groq with the analyst prompt
────────────────────────────────────────────────── */
async function analyzeSurveyResults(resultsData) {
  if (!groq) throw new Error('Groq no configurado.');
  const jsonStr = JSON.stringify(resultsData, null, 2);
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'Actúa como un analista de datos profesional. Recibirás resultados cuantitativos de una encuesta en formato JSON. Escribe un resumen ejecutivo de un solo párrafo (máximo 4 líneas) destacando la conclusión más importante. No uses markdown, no uses asteriscos, solo texto plano y directo.',
      },
      {
        role: 'user',
        content: `Aquí tienes los resultados cuantitativos de una encuesta en formato JSON:\n${jsonStr}`,
      },
    ],
    model: 'llama-3.1-8b-instant',
    temperature: 0.3,
    max_tokens: 200,
  });
  return completion.choices[0].message.content.trim();
}

/* ──────────────────────────────────────────────────
   Component: SurveyInsights
   Props:
     - titulo     string   — survey title
     - pregunta   string   — survey question
     - results    object   — { opcion: count, ... }
────────────────────────────────────────────────── */
export default function SurveyInsights({ titulo, pregunta, results = {} }) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const prevResultsRef = useRef('');

  const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);
  const hasResults = totalVotes > 0;

  // Auto-refresh insight when results change (debounced to avoid spamming on polling)
  useEffect(() => {
    if (!hasResults) { setInsight(''); return; }
    const key = JSON.stringify(results);
    if (key === prevResultsRef.current) return;
    prevResultsRef.current = key;
    if (insight) generateInsight();
  }, [results]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateInsight = async () => {
    if (!hasResults) return;
    setLoading(true);
    setError('');
    try {
      const payload = {
        titulo,
        pregunta,
        total_respuestas: totalVotes,
        resultados: Object.entries(results).map(([opcion, votos]) => ({
          opcion,
          votos,
          porcentaje: `${Math.round((votos / totalVotes) * 100)}%`,
        })),
      };
      const text = await analyzeSurveyResults(payload);
      setInsight(text);
    } catch (err) {
      console.error('SurveyInsights error:', err);
      setError('No se pudo generar el análisis. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasResults) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-4 px-4 fade-in">
      <div
        className="rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_15px_rgba(0,255,255,0.1)]"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1a1f35 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </span>
            <div>
              {/* Eyebrow label using TX directly (dark card context) */}
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#818cf8' }}>Análisis IA</p>
              <Heading as="h3" className="!text-white">Resumen Ejecutivo</Heading>
            </div>
          </div>

          <button
            onClick={generateInsight}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'rgba(99,102,241,0.25)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.35)' }}
          >
            {loading ? (
              <>
                <span className="w-3 h-3 border-2 border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                {insight ? 'Regenerar' : 'Generar análisis'}
              </>
            )}
          </button>
        </div>

        {/* Stats bar */}
        <div className="px-6 pb-3 flex items-center gap-3 flex-wrap">
          {Object.entries(results).map(([opcion, votos]) => {
            const pct = Math.round((votos / totalVotes) * 100);
            return (
              <div key={opcion} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span className="text-[11px] font-semibold" style={{ color: '#94a3b8' }}>
                  <span className="text-white font-black">{pct}%</span> {opcion}
                </span>
              </div>
            );
          })}
          <span className={[TX.caption, 'ml-auto'].join(' ')} style={{ color: '#475569' }}>
            {totalVotes} respuesta{totalVotes !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 24px' }} />

        {/* Content area */}
        <div className="px-6 py-5 min-h-[72px] flex items-center">
          {error ? (
            <Text variant="body" className="!text-red-400">{error}</Text>
          ) : loading ? (
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                    style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
              <Text variant="secondary" className="!text-slate-400/80">Generando resumen ejecutivo...</Text>
            </div>
          ) : insight ? (
            /* AI-generated text — insight variant for generous line-height */
            <Text variant="insight" className="!text-slate-300">{insight}</Text>
          ) : (
            <Text variant="body" className="!text-slate-500">
              Presiona <strong style={{ color: '#818cf8' }}>Generar análisis</strong> para obtener un resumen ejecutivo basado en los votos actuales.
            </Text>
          )}
        </div>

        {/* Footer */}
        {insight && (
          <div className="px-6 pb-4">
            <p className={TX.caption} style={{ color: '#334155' }}>
              Generado con Groq · llama-3.1-8b-instant · Basado en {totalVotes} resp. al momento del análisis
            </p>
          </div>
        )}
      </div>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:.5} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}
