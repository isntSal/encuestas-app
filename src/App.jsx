import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Groq from "groq-sdk";
import SurveyInsights from './SurveyInsights';
import CyberBarChart from './CyberBarChart';

// Inicializamos Groq fuera del componente para no recrearlo en cada render
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Requerido para ejecutar la API directamente desde React
});

// Inicializar cliente Supabase con variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseKey) : null;

/* ═══════════════════════════════════════════════════════════════════
   FASE 1 — Estructuras de Datos Propuestas para el Motor de Encuestas
   ═══════════════════════════════════════════════════════════════════

   ┌─────────────────────────────────────────────────────────────────┐
   │  Respondent — Encuestado                                        │
   │                                                                 │
   │  Estado que identifica a quien responde la encuesta.            │
   │  Se captura en <SurveyEntry /> y se eleva a App.jsx.            │
   │                                                                 │
   │  {                                                              │
   │    nombre:          string,  // Nombre completo del encuestado  │
   │    identificacion:  string   // Número de documento             │
   │  }                                                              │
   └─────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────────┐
   │  Survey — Encuesta                                              │
   │                                                                 │
   │  Estructura flexible que soporta dos tipos de encuesta:         │
   │    • 'general'     → itera sobre preguntas estándar             │
   │                       (radio, checkbox, text) en SurveyRunner   │
   │    • 'set_theory'  → renderiza diagramas de Venn + Gauss-Jordan │
   │                                                                 │
   │  {                                                              │
   │    id:       string,                    // UUID o slug único     │
   │    titulo:   string,                    // Título visible        │
   │    tipo:     'general' | 'set_theory',  // Discriminador        │
   │    preguntas: Array<Question>           // Solo para 'general'  │
   │  }                                                              │
   │                                                                 │
   │  Question (tipo 'general'):                                     │
   │  {                                                              │
   │    id:       string,                          // Clave única     │
   │    texto:    string,                          // Enunciado       │
   │    tipo:     'radio' | 'checkbox' | 'text',   // Input type     │
   │    opciones: string[]   // Requerido para radio y checkbox       │
   │  }                                                              │
   └─────────────────────────────────────────────────────────────────┘
*/

/**
 * Estado inicial del encuestado (Respondent).
 * Úsalo con useState en App.jsx:
 *   const [respondent, setRespondent] = useState(INITIAL_RESPONDENT);
 */
const INITIAL_RESPONDENT = {
  nombre: '',
  identificacion: '',
};

function createSurvey(id, titulo, tipo = 'general', preguntas = []) {
  return { id, titulo, tipo, preguntas };
}

/* ─────────────────────── SVG ICONS (inline) ─────────────────────── */
const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconBarChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);
const IconCross = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <line x1="21.17" y1="8" x2="12" y2="8" />
    <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
    <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
  </svg>
);
const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconSave = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);
const IconInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

/* ─────────────────────── MAIN APP ─────────────────────── */
function App() {
  const [activeTab, setActiveTab] = useState('nueva'); // 'nueva' | 'history'

  const [surveyMeta, setSurveyMeta] = useState({
    title: '',
    description: ''
  });

  const [varNames, setVarNames] = useState({
    A: '',
    B: '',
    C: ''
  });

  const [inputs, setInputs] = useState({
    Total: '',
    none: '',
    totalA: '',
    totalB: '',
    totalC: '',
    intAB: '',
    intAC: '',
    intBC: '',
    triple: ''
  });

  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [report, setReport] = useState([]);           // Reportes de validación matemática
  const [deducedFields, setDeducedFields] = useState([]); // Campos auto-completados por el algoritmo
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null); // Resultados extendidos de la IA

  // ─── Encuesta publicada + resultados en tiempo real ───
  const [publishedSurvey, setPublishedSurvey] = useState(null); // { id, url }
  const [showPreview, setShowPreview] = useState(false);
  const [surveyResults, setSurveyResults] = useState({}); // { opcion: count }
  const [linkCopied, setLinkCopied] = useState(false);

  // ─── Motor de encuesta general ───
  const [activeSurveyMode, setActiveSurveyMode] = useState('general'); // 'general' | 'set_theory'
  const [generalSurvey, setGeneralSurvey] = useState({
    titulo: '',
    descripcion: '',
    pregunta: '',
    tipo: 'si_no',          // 'si_no' | 'valoracion' | 'multiple'
    opcionesCustom: ['Opción A', 'Opción B', 'Opción C'],
  });
  const getOpcionesForType = (tipo, custom) => {
    if (tipo === 'si_no') return ['Sí', 'No'];
    if (tipo === 'valoracion') return ['1 ★', '2 ★', '3 ★', '4 ★', '5 ★'];
    return custom.filter(o => o.trim() !== '').slice(0, 4);
  };

  // ─── Historial de encuestas generales ───
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    if (!supabase) return;
    setLoadingHistory(true);
    const { data } = await supabase
      .from('encuestas_generales')
      .select('id, titulo, descripcion, pregunta, tipo, opciones, activa, created_at')
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setHistory(data);
    setLoadingHistory(false);
  };

  // Cargar historial al montar y cuando se publica una encuesta nueva
  useEffect(() => { fetchHistory(); }, []);
  useEffect(() => { if (publishedSurvey?.id) fetchHistory(); }, [publishedSurvey?.id]);

  const loadSavedSurvey = (survey) => {
    // Restaura la encuesta en el formulario y activa el seguimiento de resultados
    setGeneralSurvey({
      titulo: survey.titulo,
      descripcion: survey.descripcion || '',
      pregunta: survey.pregunta,
      tipo: survey.tipo,
      opcionesCustom: Array.isArray(survey.opciones) ? survey.opciones : ['Opción A', 'Opción B', 'Opción C'],
    });
    const surveyUrl = `${window.location.origin}/survey/${survey.id}`;
    setPublishedSurvey({ id: survey.id, url: surveyUrl });
    setSurveyResults({});
    setActiveTab('nueva'); // volver al tab de creación para ver el panel y el gráfico
    setStatus({ type: 'success', message: `Monitoreando: ${survey.titulo}` });
    setTimeout(() => setStatus({ type: '', message: '' }), 3500);
  };

  const handleDeleteGeneralSurvey = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar esta encuesta permanentemente? Las respuestas también se eliminarán.')) return;
    setStatus({ type: 'loading', message: 'Eliminando encuesta...' });
    const { error } = await supabase.from('encuestas_generales').delete().eq('id', id);
    if (error) {
      setStatus({ type: 'error', message: `Error al eliminar: ${error.message}` });
    } else {
      setHistory(prev => prev.filter(s => s.id !== id));
      if (publishedSurvey?.id === id) { setPublishedSurvey(null); setSurveyResults({}); }
      setStatus({ type: 'success', message: 'Encuesta eliminada.' });
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    }
  };

  // ─── Polling de resultados en tiempo real ───
  useEffect(() => {
    if (!publishedSurvey?.id || !supabase) return;
    const fetchResults = async () => {
      const { data } = await supabase
        .from('respuestas_encuestas')
        .select('respuesta')
        .eq('encuesta_id', publishedSurvey.id);
      if (data) {
        const counts = {};
        data.forEach(r => { counts[r.respuesta] = (counts[r.respuesta] || 0) + 1; });
        setSurveyResults(counts);
      }
    };
    fetchResults();
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, [publishedSurvey?.id]);

  // ─── Publicar encuesta en Supabase ───
  const handlePublishSurvey = async () => {
    if (!generalSurvey.titulo.trim()) {
      setStatus({ type: 'error', message: 'El título de la encuesta es obligatorio.' });
      return;
    }
    if (!generalSurvey.pregunta.trim()) {
      setStatus({ type: 'error', message: 'La pregunta es obligatoria.' });
      return;
    }
    if (!supabase) {
      setStatus({ type: 'error', message: 'Configura las variables de Supabase en .env.local' });
      return;
    }
    setStatus({ type: 'loading', message: 'Publicando encuesta...' });
    const opciones = getOpcionesForType(generalSurvey.tipo, generalSurvey.opcionesCustom);
    const { data, error } = await supabase
      .from('encuestas_generales')
      .insert([{
        titulo: generalSurvey.titulo.trim(),
        descripcion: generalSurvey.descripcion.trim(),
        pregunta: generalSurvey.pregunta.trim(),
        tipo: generalSurvey.tipo,
        opciones,
        activa: true,
      }])
      .select()
      .single();
    if (error) {
      setStatus({ type: 'error', message: `Error al publicar: ${error.message}` });
      return;
    }
    const surveyUrl = `${window.location.origin}/survey/${data.id}`;
    setPublishedSurvey({ id: data.id, url: surveyUrl });
    setSurveyResults({});
    setStatus({ type: 'success', message: '¡Encuesta publicada y disponible!' });
    setTimeout(() => setStatus({ type: '', message: '' }), 4000);
  };

  // ─── IA: Copiloto Creador — Generar preguntas sugeridas con Groq ───
  const handleAiProcess = async () => {
    if (!generalSurvey.descripcion.trim()) {
      setStatus({ type: 'error', message: 'Escribe una descripción del estudio antes de generar preguntas.' });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResults(null);
    setStatus({ type: 'loading', message: 'Generando preguntas con IA...' });

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'Actúa como un experto en diseño de encuestas. Recibirás la descripción de un estudio. Tu tarea es devolver ÚNICAMENTE un objeto JSON válido con una propiedad "preguntas" que contenga un arreglo de 3 preguntas sugeridas. Cada pregunta debe tener la estructura: { "id": string, "question": string, "type": "single_choice" | "multiple_choice", "options": string[] }.'
          },
          {
            role: 'user',
            content: generalSurvey.descripcion.trim()
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.4,
        max_tokens: 600,
        response_format: { type: 'json_object' }
      });

      const rawContent = completion.choices[0].message.content;
      const cleanedContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedContent);

      const questions = Array.isArray(parsed)
        ? parsed
        : parsed.questions || parsed.preguntas || Object.values(parsed)[0] || [];

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('La IA no devolvió preguntas válidas.');
      }

      setAnalysisResults({ generatedQuestions: questions });
      setStatus({ type: 'success', message: `¡${questions.length} preguntas generadas! Revísalas en el panel.` });
      setTimeout(() => setStatus({ type: '', message: '' }), 5000);

    } catch (error) {
      console.error('Error generando preguntas:', error);
      setStatus({
        type: 'error',
        message: error instanceof SyntaxError
          ? 'La IA devolvió una respuesta inválida. Intenta reformular la descripción.'
          : 'Error al contactar con la IA. Revisa la consola.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };


  // ─── Álgebra de Conjuntos (Cálculos dinámicos) ───
  const val = (key) => Number(inputs[key]) || 0;

  const U = val('U');
  const totalA = val('totalA');
  const totalB = val('totalB');
  const totalC = val('totalC');
  const intAB = val('intAB');
  const intAC = val('intAC');
  const intBC = val('intBC');
  const triple = val('triple');

  // Cálculo de las particiones exclusivas para el diagrama SVG
  const excAB = intAB - triple;
  const excAC = intAC - triple;
  const excBC = intBC - triple;

  const onlyA = totalA - intAB - intAC + triple;
  const onlyB = totalB - intAB - intBC + triple;
  const onlyC = totalC - intAC - intBC + triple;

  // Cálculo de la unión total y los elementos externos (Ninguno)
  const unionTotal = totalA + totalB + totalC - intAB - intAC - intBC + triple;
  const none = inputs.none !== '' && inputs.none !== undefined ? Number(inputs.none) : U - unionTotal;

  // Progreso: cuántos campos tienen valor
  const allInputKeys = ['U', 'none', 'totalA', 'totalB', 'totalC', 'intAB', 'intAC', 'intBC', 'triple'];
  const filledCount = allInputKeys.filter(k => inputs[k] !== '' && inputs[k] !== undefined).length;
  const progressPct = Math.round((filledCount / allInputKeys.length) * 100);

  // Mapa de valores calculados para resolver incógnitas del panel de IA
  const computedValues = {
    onlyA, onlyB, onlyC,
    excAB, excAC, excBC,
    triple, none,
    unionTotal,
    U, totalA, totalB, totalC,
    intAB, intAC, intBC
  };



  const getDisplayValue = (rawValue) => {
    if (hoveredRegion !== null && U > 0) {
      return ((rawValue / U) * 100).toFixed(1) + '%';
    }
    return rawValue;
  };

  const handleNameChange = (key, value) => setVarNames(prev => ({ ...prev, [key]: value }));
  const handleInputChange = (key, value) => {
    if (value === '' || /^-?\d*$/.test(value)) {
      setInputs(prev => ({ ...prev, [key]: value }));
      setDeducedFields(prev => prev.filter(k => k !== key));
    }
  };

  const handleClearData = () => {
    // Reinicia los inputs numéricos (set theory)
    setInputs({
      Total: '', none: '', totalA: '', totalB: '', totalC: '',
      intAB: '', intAC: '', intBC: '', triple: ''
    });
    // Reinicia también los metadatos y los nombres de variables
    setSurveyMeta({ title: '', description: '' });
    setVarNames({ A: '', B: '', C: '' });
    setReport([]);
    setDeducedFields([]);
    // Reinicia la encuesta general
    setGeneralSurvey({
      titulo: '',
      descripcion: '',
      pregunta: '',
      tipo: 'si_no',
      opcionesCustom: ['Opción A', 'Opción B', 'Opción C'],
    });
    setAnalysisResults(null);
    setPublishedSurvey(null);
    setShowPreview(false);
    setStatus({ type: 'success', message: '¡Formulario reiniciado!' });
    setTimeout(() => setStatus({ type: '', message: '' }), 2500);
  };

  // ─── handleValidate — NO MODIFICADO ───
  const handleValidate = () => {
    let newReport = [];
    let currentInputNames = ['U', 'none', 'totalA', 'totalB', 'totalC', 'intAB', 'intAC', 'intBC', 'triple'];

    const EQ_MAP = {
      U: [1, 1, 1, 1, 1, 1, 1, 1],
      none: [0, 0, 0, 0, 0, 0, 0, 1],
      totalA: [1, 0, 0, 1, 1, 0, 1, 0],
      totalB: [0, 1, 0, 1, 0, 1, 1, 0],
      totalC: [0, 0, 1, 0, 1, 1, 1, 0],
      intAB: [0, 0, 0, 1, 0, 0, 1, 0],
      intAC: [0, 0, 0, 0, 1, 0, 1, 0],
      intBC: [0, 0, 0, 0, 0, 1, 1, 0],
      triple: [0, 0, 0, 0, 0, 0, 1, 0]
    };

    let equations = [];
    let definedKeys = [];
    currentInputNames.forEach(k => {
      if (inputs[k] !== '' && inputs[k] !== undefined) {
        let val = Number(inputs[k]);
        equations.push([...EQ_MAP[k], val]);
        definedKeys.push(k);
      }
    });

    if (equations.length === 0) {
      setReport([{ type: 'warn', msg: 'No hay datos. Introduce los valores.' }]);
      return;
    }

    // ELIMINACIÓN DE GAUSS-JORDAN
    let M = equations.map(row => [...row]);
    let rowCount = M.length;
    let colCount = 8;

    let lead = 0;
    for (let r = 0; r < rowCount; r++) {
      if (colCount <= lead) break;
      let i = r;
      while (Math.abs(M[i][lead]) < 1e-9) {
        i++;
        if (rowCount === i) { i = r; lead++; if (colCount === lead) break; }
      }
      if (colCount <= lead) break;

      let temp = M[i]; M[i] = M[r]; M[r] = temp;
      let val = M[r][lead];
      if (Math.abs(val) > 1e-9) {
        for (let j = 0; j <= colCount; j++) M[r][j] /= val;
      }

      for (let i = 0; i < rowCount; i++) {
        if (i !== r) {
          val = M[i][lead];
          for (let j = 0; j <= colCount; j++) M[i][j] -= val * M[r][j];
        }
      }
      lead++;
    }

    // LIMPIAR Y EXTRAER RESULTADOS
    let solutions = new Array(8).fill(null);
    let validSystem = true;
    for (let r = 0; r < rowCount; r++) {
      let ones = 0, oneIdx = -1, nonZero = false;
      for (let c = 0; c <= colCount; c++) {
        if (c < 8) {
          if (Math.abs(M[r][c] - 1) < 1e-9) { ones++; oneIdx = c; }
          else if (Math.abs(M[r][c]) > 1e-9) nonZero = true;
        } else {
          M[r][c] = Math.round(M[r][c] * 100) / 100;
        }
      }

      if (ones === 1 && !nonZero) {
        if (solutions[oneIdx] !== null && solutions[oneIdx] !== M[r][8]) validSystem = false;
        solutions[oneIdx] = M[r][8];
      } else if (ones === 0 && !nonZero && Math.abs(M[r][8]) > 1e-9) {
        validSystem = false;
      }
    }

    if (!validSystem) {
      setReport([{ type: 'error', msg: 'Contradicción Matemática. Los datos provistos chocan entre sí o violan la Ley de Unión de Conjuntos.' }]);
      return;
    }

    let missingVars = solutions.filter(s => s === null).length;

    if (missingVars === 0) {
      if (solutions.some(s => s < 0)) {
        setReport([{ type: 'error', msg: 'Imposibilidad. Esto produce personas negativas en el diagrama (Ej: una Intersección es mayor que su Total base).' }]);
        return;
      }

      let calc = {
        U: solutions[0] + solutions[1] + solutions[2] + solutions[3] + solutions[4] + solutions[5] + solutions[6] + solutions[7],
        none: solutions[7],
        totalA: solutions[0] + solutions[3] + solutions[4] + solutions[6],
        totalB: solutions[1] + solutions[3] + solutions[5] + solutions[6],
        totalC: solutions[2] + solutions[4] + solutions[5] + solutions[6],
        intAB: solutions[3] + solutions[6],
        intAC: solutions[4] + solutions[6],
        intBC: solutions[5] + solutions[6],
        triple: solutions[6]
      };

      let deduced = 0;
      let newInputs = { ...inputs };
      let deducedKeys = [];
      currentInputNames.forEach(k => {
        if (inputs[k] === '' || inputs[k] === undefined) {
          newInputs[k] = String(calc[k]);
          deducedKeys.push(k);
          deduced++;
        } else if (Number(inputs[k]) !== calc[k]) {
          validSystem = false;
        }
      });

      if (!validSystem) {
        setReport([{ type: 'error', msg: 'Incongruencia Total. (El Universo es menor que la suma de sus componentes, o la intersección máxima es errada).' }]);
        return;
      }

      if (deduced > 0) {
        setInputs(newInputs);
        setDeducedFields(deducedKeys);

        const labelMap = {
          'U': 'Universo Total',
          'none': 'Ninguna de las opciones',
          'totalA': `Total ${varNames.A || 'A'}`,
          'totalB': `Total ${varNames.B || 'B'}`,
          'totalC': `Total ${varNames.C || 'C'}`,
          'intAB': `Intersección ${varNames.A || 'A'} y ${varNames.B || 'B'}`,
          'intAC': `Intersección ${varNames.A || 'A'} y ${varNames.C || 'C'}`,
          'intBC': `Intersección ${varNames.B || 'B'} y ${varNames.C || 'C'}`,
          'triple': 'Las 3 opciones'
        };
        const deducedNames = deducedKeys.map(k => labelMap[k]).join(', ');

        setReport([{ type: 'success', msg: `Se dedujeron ${deduced} dato(s) restante(s): ${deducedNames}.` }]);
      } else {
        setReport([{ type: 'success', msg: '¡Matemáticamente Perfecto! Datos congruentes y el sistema no necesita deducciones adicionales.' }]);
      }

    } else {
      let infoStr = missingVars === 8 ? "Faltan casi todos los datos." : `Faltan demasiados campos (Sistema matemáticamente indeterminado).`;
      setReport([{ type: 'warn', msg: `${infoStr} Agrega al menos los datos base de tu problema (¿El Universo? ¿Ninguno = 0?).` }]);
    }
  };

  const handleSave = async () => {
    if (!U) {
      setStatus({ type: 'error', message: 'La Muestra Total (Universo U) es obligatoria.' });
      return;
    }

    if (!supabase) {
      setStatus({ type: 'error', message: 'Configura variables de Supabase en .env.local' });
      return;
    }

    setStatus({ type: 'loading', message: 'Guardando en la nube...' });

    const { error } = await supabase
      .from('problemas_conjuntos')
      .insert([{
        title: surveyMeta.title.trim(), description: surveyMeta.description.trim(),
        var_a_name: varNames.A.trim(), var_b_name: varNames.B.trim(), var_c_name: varNames.C.trim(),
        universe: U, total_a: totalA, total_b: totalB, total_c: totalC,
        only_a: onlyA, only_b: onlyB, only_c: onlyC, none: none,
        intersection_ab: excAB, intersection_ac: excAC, intersection_bc: excBC, intersection_abc: triple
      }]);

    if (error) {
      setStatus({ type: 'error', message: `Error: ${error.message}` });
    } else {
      setStatus({ type: 'success', message: '¡Problema guardado exitosamente!' });
      setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    }
  };


  // ─── SVG regions — coordinates match new circle layout ───
  // Circle A: cx=155 cy=155 r=115  | Circle B: cx=245 cy=155 r=115  | Circle C: cx=200 cy=235 r=115
  const svgRegions = [
    { key: 'onlyA', x: 85, y: 138, value: onlyA },   // left of A, clear of overlap
    { key: 'onlyB', x: 325, y: 138, value: onlyB },   // right of B, clear of overlap
    { key: 'onlyC', x: 200, y: 305, value: onlyC },   // bottom of C
    { key: 'AB', x: 200, y: 90, value: excAB },   // top overlap A∩B — lowered for visual centre
    { key: 'AC', x: 120, y: 218, value: excAC },   // left overlap A∩C
    { key: 'BC', x: 270, y: 218, value: excBC },   // right overlap B∩C
    { key: 'ABC', x: 200, y: 185, value: triple }    // centre triple
  ];

  /* ────────────────────────────── RENDER ────────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-transparent font-sans overflow-hidden">

      {/* ══════════════════ LEFT PANEL — Light Venn (reference style) ══════════════════ */}
      <div className="flex-1 flex flex-col bg-transparent relative overflow-y-auto custom-scrollbar">

        {activeSurveyMode === 'general' ? (
          <>
            <CyberBarChart
              titulo={generalSurvey.titulo}
              descripcion={generalSurvey.descripcion}
              pregunta={generalSurvey.pregunta}
              tipo={generalSurvey.tipo}
              opciones={getOpcionesForType(generalSurvey.tipo, generalSurvey.opcionesCustom)}
              results={surveyResults}
              isPublished={!!publishedSurvey}
            />
            <SurveyInsights titulo={generalSurvey.titulo} pregunta={generalSurvey.pregunta} results={surveyResults} />
          </>
        ) : (<>
          {/* Header — title + description stacked, centred */}
          <header className="relative z-10 flex flex-col items-center text-center px-8 pt-8 pb-2">
            {/* Big gradient title */}
            <h1 className="text-4xl font-black tracking-tight uppercase leading-none"
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
              {surveyMeta.title || 'Encuesta'}
            </h1>

            {/* Description — styled card with scroll cap */}
            {surveyMeta.description && (
              <div className="max-w-2xl w-full mx-auto mt-4 glass-panel rounded-2xl p-5">
                {/* Card header */}
                <div className="flex items-center justify-center gap-1.5 mb-2 text-slate-400">
                  <IconInfo />
                  <span className="text-xs font-bold uppercase tracking-widest">Descripción</span>
                </div>
                {/* Scrollable text body */}
                <div className="max-h-40 overflow-y-auto custom-scrollbar">
                  <p className="text-sm text-slate-600 font-medium leading-relaxed text-center whitespace-pre-line">
                    {surveyMeta.description}
                  </p>
                </div>
              </div>
            )}
          </header>


          {/* SVG Diagram area */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-8">

            {/* SVG wrapper — relative so labels can be absolute */}
            <div className="relative w-full max-w-lg">

              {/* Total badge — above Variable B, right side */}
              <span className="absolute top-[18%] -right-4 z-10 flex items-baseline gap-1.5 bg-white/80 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm backdrop-blur-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                <span className="text-lg font-black text-slate-700 leading-none">{U}</span>
              </span>

              {/* Variable A — left label, slightly outside the circle */}
              <span className="absolute -left-6 top-[38%] -translate-y-1/2 text-slate-700 text-sm font-black leading-tight">
                {varNames.A || 'Variable A'}
              </span>
              {/* Variable B — right label, slightly outside the circle */}
              <span className="absolute -right-6 top-[38%] -translate-y-1/2 text-slate-700 text-sm font-black leading-tight text-right">
                {varNames.B || 'Variable B'}
              </span>

              <svg viewBox="0 0 400 390" className="w-full h-auto">

                {/* Circle A — deep blue */}
                <circle cx="155" cy="155" r="115"
                  fill={['circleA', 'onlyA', 'AB', 'AC', 'ABC'].includes(hoveredRegion) ? 'rgba(30,64,175,0.88)' : 'rgba(30,64,175,0.78)'}
                  style={{ transition: 'fill 0.2s', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredRegion('circleA')}
                  onMouseLeave={() => setHoveredRegion(null)}
                />

                {/* Circle B — green */}
                <circle cx="245" cy="155" r="115"
                  fill={['circleB', 'onlyB', 'AB', 'BC', 'ABC'].includes(hoveredRegion) ? 'rgba(5,150,105,0.88)' : 'rgba(5,150,105,0.78)'}
                  style={{ transition: 'fill 0.2s', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredRegion('circleB')}
                  onMouseLeave={() => setHoveredRegion(null)}
                />

                {/* Circle C — brown/terracotta */}
                <circle cx="200" cy="235" r="115"
                  fill={['circleC', 'onlyC', 'AC', 'BC', 'ABC'].includes(hoveredRegion) ? 'rgba(120,72,40,0.82)' : 'rgba(120,72,40,0.72)'}
                  style={{ transition: 'fill 0.2s', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredRegion('circleC')}
                  onMouseLeave={() => setHoveredRegion(null)}
                />

                {/* Variable C label inside bottom of circle */}
                <text x="200" y="368" textAnchor="middle" style={{ fontSize: '14px', fontWeight: 900, fill: '#374151' }}>
                  {varNames.C || 'Variable C'}
                </text>

                {/* "Fuera" — bottom-right corner of SVG */}
                <text
                  x="388" y="386"
                  textAnchor="end"
                  style={{ fontSize: '11px', fontWeight: 700, fill: '#b45309', cursor: 'pointer', letterSpacing: '0.05em' }}
                  onMouseEnter={() => setHoveredRegion('none')}
                  onMouseLeave={() => setHoveredRegion(null)}
                >
                  FUERA: {getDisplayValue(none)}
                </text>

                {/* Region values — bold white numbers */}
                {svgRegions.map((reg) => (
                  <text
                    key={reg.key}
                    x={reg.x}
                    y={reg.y + 10}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    style={{
                      fontSize: reg.key === 'ABC' ? '20px' : (reg.key === 'onlyA' || reg.key === 'onlyB' || reg.key === 'onlyC' ? '22px' : '17px'),
                      fontWeight: 900,
                      fill: reg.value < 0 ? '#fca5a5' : '#ffffff',
                      cursor: 'pointer',
                      filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))',
                      transition: 'font-size 0.15s',
                      letterSpacing: '-0.01em'
                    }}
                    onMouseEnter={() => setHoveredRegion(reg.key)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    {getDisplayValue(reg.value)}
                  </text>
                ))}
              </svg>
            </div>

            {/* Validation Report — inline below diagram */}
            {report.length > 0 && (
              <div className="w-full max-w-lg mt-4 space-y-2 fade-in">
                {report.map((item, idx) => (
                  <div key={idx} className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm font-semibold border ${item.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                    item.type === 'warn' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                    <span className="shrink-0 mt-0.5">
                      {item.type === 'error' && '❌'}
                      {item.type === 'warn' && '⚠️'}
                      {item.type === 'success' && '✅'}
                    </span>
                    {item.msg}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel: Preguntas sugeridas por la IA */}
          {analysisResults && analysisResults.generatedQuestions && analysisResults.generatedQuestions.length > 0 && (
            <div className="w-full max-w-2xl mx-auto mt-6 fade-in px-4">
              <div className="bg-white border border-indigo-100 rounded-3xl shadow-lg shadow-indigo-100/50 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-50 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
                        <circle cx="12" cy="15" r="2" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Copiloto IA</p>
                      <h3 className="font-black text-slate-800 text-sm leading-tight">Preguntas sugeridas</h3>
                    </div>
                  </div>
                  <button onClick={() => setAnalysisResults(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-all" title="Cerrar sugerencias">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {analysisResults.generatedQuestions.map((q, i) => {
                    const isMultiple = q.type === 'multiple_choice';
                    const typeLabel = isMultiple ? 'Opcion multiple' : 'Opcion unica';
                    const typeColor = isMultiple ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700';
                    const appTipo = isMultiple ? 'multiple' : 'si_no';
                    return (
                      <div key={q.id || i} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeColor}`}>{typeLabel}</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-800 leading-snug mb-2.5">{q.question}</p>
                            {Array.isArray(q.options) && q.options.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {q.options.slice(0, 4).map((opt, j) => (
                                  <span key={j} className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{opt}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const opts = Array.isArray(q.options) && q.options.length > 1 ? q.options.slice(0, 4) : ['Opcion A', 'Opcion B', 'Opcion C'];
                              // Auto-detect chart type: 2 options → si_no, 5 options → valoracion, else multiple
                              let detectedTipo = 'multiple';
                              if (opts.length === 2) detectedTipo = 'si_no';
                              else if (opts.length === 5 && opts.some(o => o.includes('★') || o.includes('⭐') || /^\d/.test(o))) detectedTipo = 'valoracion';
                              setGeneralSurvey(prev => ({ ...prev, pregunta: q.question, tipo: detectedTipo, opcionesCustom: opts, descripcion: '' }));
                              setStatus({ type: 'success', message: 'Pregunta aplicada al formulario.' });
                              setTimeout(() => setStatus({ type: '', message: '' }), 3000);
                            }}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition-all active:scale-95"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                            Usar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-medium text-center">Clic en Usar para aplicar una pregunta al formulario. Puedes editarla despues.</p>
                </div>
              </div>
            </div>
          )}
        </>)}
      </div>

      {/* ══════════════════ RIGHT PANEL — Smart Panel ══════════════════ */}
      <div className="w-full lg:max-w-sm flex flex-col relative z-10 border-t border-slate-300 lg:border-t-0 overflow-y-auto" style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', boxShadow: '-4px 0 24px rgba(0,0,0,0.05)' }}>

        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-300">
          <h2 className="font-black text-lg tracking-tight text-slate-800">¿Qué tienes en mente?</h2>
          <button
            onClick={handleClearData}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-all"
            title="Reiniciar todo"
          >
            <IconTrash />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-300 px-2 pt-1">
          {[
            { id: 'nueva', label: 'Crear Encuesta' },
            { id: 'history', label: 'Historial' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 pb-2.5 pt-1 text-xs font-bold transition-all border-b-2 ${activeTab === tab.id
                ? 'border-slate-900 text-black'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-5">



          {/* ── TAB: Historial ── */}
          {activeTab === 'history' && (
            <div className="space-y-3 fade-in">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-black text-slate-800 text-sm">Mis Encuestas Publicadas</h4>
                <button
                  onClick={fetchHistory}
                  className="flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-black transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                  Refrescar
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-10 text-center text-slate-500 text-sm animate-pulse">Cargando encuestas...</div>
              ) : history.length === 0 ? (
                <div className="py-10 text-center text-slate-600 text-sm glass-panel rounded-2xl space-y-2">
                  <p className="text-2xl">📋</p>
                  <p>No has publicado encuestas aún.</p>
                  <p className="text-[10px]">Crea una en el tab <strong className="text-slate-900">Crear Encuesta</strong>.</p>
                </div>
              ) : (
                history.map((survey) => {
                  const isActive = publishedSurvey?.id === survey.id;
                  const totalResp = isActive ? Object.values(surveyResults).reduce((a, b) => a + b, 0) : null;
                  return (
                    <div
                      key={survey.id}
                      onClick={() => loadSavedSurvey(survey)}
                      className={`relative p-4 rounded-2xl border transition-all cursor-pointer group ${isActive
                        ? 'border-slate-400 bg-slate-100/80 shadow-md'
                        : 'border-slate-300 hover:border-slate-400 hover:shadow-sm'
                        }`}
                      style={{ background: isActive ? 'rgba(239, 246, 255, 0.7)' : 'rgba(255,255,255,0.5)' }}
                    >
                      {/* Indicador activo */}
                      {isActive && (
                        <span className="absolute top-3 left-3 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500" />
                        </span>
                      )}

                      {/* Botón eliminar */}
                      <button
                        onClick={(e) => handleDeleteGeneralSurvey(survey.id, e)}
                        title="Eliminar encuesta"
                        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-100 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                      </button>

                      {/* Contenido */}
                      <h5 className={`font-bold text-sm mb-0.5 pr-8 ${isActive ? 'text-black pl-4' : 'text-slate-800 group-hover:text-black'} transition-colors`}>
                        {survey.titulo}
                      </h5>
                      <p className="text-[10px] text-slate-600 mb-2 truncate pr-4">
                        {survey.pregunta}
                      </p>
                      <div className="flex gap-1.5 flex-wrap items-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${survey.tipo === 'si_no' ? 'bg-slate-200 text-black border border-slate-300'
                          : survey.tipo === 'valoracion' ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-purple-100 text-purple-700 border border-purple-200'
                          }`}>
                          {survey.tipo === 'si_no' ? 'Sí/No' : survey.tipo === 'valoracion' ? 'Valoración' : 'Múltiple'}
                        </span>
                        {isActive && totalResp !== null && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                            {totalResp} resp. en vivo
                          </span>
                        )}
                        <span className="text-[10px] text-slate-600 ml-auto">
                          {new Date(survey.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── TAB: Crear Encuesta ── */}
          {activeTab === 'nueva' && (
            <div className="space-y-4 fade-in">

              {/* ── Datos del Estudio ── */}
              <div className="rounded-2xl p-4 glass-panel border-slate-300">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">📝</span>
                  <h4 className="font-black text-slate-800 text-sm">Datos del Estudio</h4>
                </div>

                {/* Título del estudio — se refleja en vivo en el panel izquierdo */}
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Título del Estudio</label>
                <input
                  id="general-titulo"
                  type="text"
                  placeholder="Ej: Hábitos de Consumo 2026"
                  value={generalSurvey.titulo}
                  onChange={e => setGeneralSurvey(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full px-3 py-2.5 mb-3 border border-slate-300 font-semibold rounded-xl text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none placeholder-slate-400 transition-all text-slate-800"
                  style={{ background: 'rgba(255,255,255,0.7)' }}
                />

                {/* Descripción — se refleja en vivo como tarjeta debajo del título */}
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Descripción</label>
                <textarea
                  id="general-descripcion"
                  rows="5"
                  placeholder="Ej: Descripción del estudio..."
                  value={generalSurvey.descripcion}
                  onChange={e => setGeneralSurvey(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-300 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-slate-400 focus:outline-none placeholder-slate-400 transition-all resize-none"
                  style={{ background: 'rgba(255,255,255,0.7)' }}
                />

                {/* Botón Solución del ejercicio — llama a la IA */}
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleAiProcess}
                    disabled={isAnalyzing}
                    className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-sm
                      ${isAnalyzing
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                        : 'bg-slate-900 text-white hover:bg-black active:scale-95'
                      }`}
                  >
                    {isAnalyzing ? 'Generando...' : 'Generar Preguntas con IA'}
                  </button>
                </div>
              </div>

              {/* ── Preguntas sugeridas por la IA ── */}
              {analysisResults && analysisResults.generatedQuestions && analysisResults.generatedQuestions.length > 0 && (
                <div className="mt-4 rounded-2xl border border-slate-300 overflow-hidden shadow-sm bg-slate-50/50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" /><circle cx="12" cy="15" r="2" /></svg>
                      </span>
                      <div>
                        <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest leading-none">Copiloto IA</p>
                        <p className="text-xs font-black text-slate-800">Preguntas sugeridas</p>
                      </div>
                    </div>
                    <button onClick={() => setAnalysisResults(null)} className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                  {/* Cards */}
                  <div className="divide-y divide-slate-300">
                    {analysisResults.generatedQuestions.map((q, i) => {
                      const isMultiple = q.type === 'multiple_choice';
                      const appTipo = isMultiple ? 'multiple' : 'si_no';
                      return (
                        <div key={q.id || i} className="px-4 py-3 hover:bg-slate-100/50 transition-colors">
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-black flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 leading-snug mb-1.5">{q.question}</p>
                              {Array.isArray(q.options) && q.options.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {q.options.slice(0, 4).map((opt, j) => (
                                    <span key={j} className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full">{opt}</span>
                                  ))}
                                </div>
                              )}
                              <button
                                onClick={() => {
                                  const opts = Array.isArray(q.options) && q.options.length > 1 ? q.options.slice(0, 4) : ['Opción A', 'Opción B', 'Opción C'];
                                  // Auto-detect chart type: 2 options → si_no, 5 options → valoracion, else multiple
                                  let detectedTipo = 'multiple';
                                  if (opts.length === 2) detectedTipo = 'si_no';
                                  else if (opts.length === 5 && opts.some(o => o.includes('★') || o.includes('⭐') || /^\d/.test(o))) detectedTipo = 'valoracion';
                                  setGeneralSurvey(prev => ({ ...prev, pregunta: q.question, tipo: detectedTipo, opcionesCustom: opts, descripcion: '' }));
                                  setStatus({ type: 'success', message: `Pregunta ${i + 1} aplicada ✓` });
                                  setTimeout(() => setStatus({ type: '', message: '' }), 2500);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black text-white bg-slate-900 hover:bg-black transition-all active:scale-95 shadow-sm"
                              >
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Usar esta pregunta
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-4 py-2 border-t border-slate-300 bg-slate-100/50">
                    <p className="text-[10px] text-slate-900 font-medium">Toca "Usar esta pregunta" para aplicarla al formulario</p>
                  </div>
                </div>
              )}

              {/* ── Configurar Pregunta ── */}

              <div className="rounded-2xl p-4 glass-panel border-slate-300">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">📊</span>
                  <h4 className="font-black text-slate-800 text-sm">Diseñar una Pregunta Manualmente</h4>
                </div>
                
                {/* Pregunta */}
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Pregunta</label>
                <textarea
                  id="general-pregunta"
                  rows="3"
                  placeholder="Ej: ¿Prefieres estudiar de forma presencial o virtual?"
                  value={generalSurvey.pregunta}
                  onChange={e => setGeneralSurvey(prev => ({ ...prev, pregunta: e.target.value }))}
                  className="w-full px-3 py-2.5 mb-4 border border-slate-300 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-slate-400 focus:outline-none placeholder-slate-400 transition-all resize-none"
                  style={{ background: 'rgba(255,255,255,0.7)' }}
                />

                {/* Tipo de respuesta */}
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Tipo de respuesta</label>
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                  {[
                    { value: 'si_no', label: 'Sí / No', icon: '✓' },
                    { value: 'valoracion', label: 'Valoración', icon: '★' },
                    { value: 'multiple', label: 'Múltiple', icon: '≡' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setGeneralSurvey(prev => ({ ...prev, tipo: opt.value }))}
                      className={`py-2.5 px-1 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-0.5 ${generalSurvey.tipo === opt.value
                        ? 'text-black border-slate-400 bg-slate-100/80 shadow-sm'
                        : 'text-slate-500 border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
                        }`}
                      style={generalSurvey.tipo === opt.value ? { background: 'rgba(241, 245, 249, 0.8)' } : { background: 'rgba(255,255,255,0.5)' }}
                    >
                      <span className="text-sm">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Opciones personalizadas (solo tipo múltiple) */}
                {generalSurvey.tipo === 'multiple' && (
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Opciones (máx. 4)</label>
                    <div className="space-y-1.5">
                      {generalSurvey.opcionesCustom.map((op, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder={`Opción ${idx + 1}`}
                            value={op}
                            onChange={e => {
                              const newOpts = [...generalSurvey.opcionesCustom];
                              newOpts[idx] = e.target.value;
                              setGeneralSurvey(prev => ({ ...prev, opcionesCustom: newOpts }));
                            }}
                            className="flex-1 px-3 py-2 border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-2 focus:ring-slate-400 focus:outline-none placeholder-slate-400 transition-all"
                            style={{ background: 'rgba(255,255,255,0.7)' }}
                          />
                          {generalSurvey.opcionesCustom.length > 2 && (
                            <button
                              onClick={() => setGeneralSurvey(prev => ({ ...prev, opcionesCustom: prev.opcionesCustom.filter((_, i) => i !== idx) }))}
                               className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-100 transition-all"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          )}
                        </div>
                      ))}
                      {generalSurvey.opcionesCustom.length < 4 && (
                        <button
                          onClick={() => setGeneralSurvey(prev => ({ ...prev, opcionesCustom: [...prev.opcionesCustom, ''] }))}
                          className="text-xs font-bold text-slate-900 hover:text-black flex items-center gap-1 mt-1"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          Agregar opción
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Previsualizar encuesta ── */}
              <button
                id="general-preview-btn"
                onClick={() => setShowPreview(prev => !prev)}
                className={`w-full py-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 border ${showPreview
                  ? 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200'
                  : 'text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                style={!showPreview ? { background: 'rgba(255,255,255,0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' } : {}}
              >
                {showPreview ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    Ocultar vista previa
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    Vista previa de la encuesta
                  </>
                )}
              </button>

              {/* ── Preview inline: cómo verán los encuestados ── */}
              {showPreview && (
                <div className="glass-panel rounded-2xl border border-dashed border-slate-400 p-5 space-y-4 fade-in">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-900"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    </span>
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Así verán los encuestados</span>
                  </div>

                  {/* Pregunta preview */}
                  <p className="text-sm font-bold text-slate-800 leading-relaxed">
                    {generalSurvey.pregunta || 'Tu pregunta aparecerá aquí...'}
                  </p>

                  {/* Opciones preview */}
                  <div className="space-y-2">
                    {getOpcionesForType(generalSurvey.tipo, generalSurvey.opcionesCustom).map((op, i) => (
                      <label key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-400 transition-all cursor-pointer group">
                        {generalSurvey.tipo === 'checkbox' || generalSurvey.tipo === 'multiple' ? (
                          <span className="w-4 h-4 rounded border-2 border-slate-400 group-hover:border-slate-500 transition-colors shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border-2 border-slate-400 group-hover:border-slate-500 transition-colors shrink-0" />
                        )}
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-black transition-colors">{op}</span>
                      </label>
                    ))}
                  </div>

                  {/* Disabled submit button */}
                  <button disabled className="w-full py-2.5 text-slate-400 rounded-xl text-sm font-bold cursor-not-allowed border border-slate-200" style={{ background: 'rgba(255,255,255,0.5)' }}>
                    Enviar respuesta (solo vista previa)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Bottom action bar ── */}
        <div className="px-5 pb-6 pt-3 border-t border-white/5 space-y-2.5 shrink-0">
          {status.message && (
            <div className={`text-xs font-semibold px-3 py-2 rounded-lg text-center fade-in border ${status.type === 'error' ? 'bg-red-100 text-red-700 border-red-200' :
              status.type === 'loading' ? 'bg-slate-200 text-black border-slate-300' :
                'bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}>
              {status.message}
            </div>
          )}

          {activeTab === 'nueva' && (
            <>
              {/* ── Panel de encuesta publicada ── */}
              {publishedSurvey && (
                <div className="glass-panel rounded-2xl p-4 space-y-3 fade-in border border-slate-300 shadow-sm" style={{ background: 'rgba(239, 246, 255, 0.5)' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(15, 23, 42, 0.1)', boxShadow: '0 0 8px rgba(15, 23, 42, 0.2)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    </span>
                    <span className="text-xs font-black text-black uppercase tracking-widest">Encuesta activa</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 shrink-0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    <span className="flex-1 text-[10px] font-mono text-slate-600 truncate">{publishedSurvey.url}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(publishedSurvey.url);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2500);
                      }}
                      className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg transition-all border ${linkCopied ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-400'
                        }`}
                    >
                      {linkCopied ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500">
                      {Object.values(surveyResults).reduce((a, b) => a + b, 0)} respuesta(s) · actualiza cada 5s
                    </span>
                    <a
                      href={publishedSurvey.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-slate-900 hover:text-black flex items-center gap-1"
                    >
                      Abrir como encuestado
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                    </a>
                  </div>
                </div>
              )}
              <button
                id="btn-publish"
                onClick={handlePublishSurvey}
                disabled={status.type === 'loading'}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 text-white border border-slate-500 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #0f172a, #3b82f6)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                {status.type === 'loading' ? 'Publicando...' : publishedSurvey ? 'Republicar encuesta' : 'Publicar encuesta'}
              </button>
            </>
          )}

        </div>

      </div>
    </div>
  );
}

/* ─────────────────────── SUB-COMPONENTS ─────────────────────── */

/** Gráfico de barras interactivo para encuestas generales */
function GeneralSurveyCanvas({ titulo, descripcion, pregunta, tipo, opciones, results = {}, isPublished = false }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  const COLORS      = ['#0d9488', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];
  const COLORS_LITE = ['#ccfbf1', '#dbeafe', '#fef3c7', '#ede9fe', '#fee2e2'];

  // Canvas dimensions
  const MARGIN_L   = 48;   // space for y-axis labels
  const MARGIN_R   = 16;
  const H           = 255;  // chart area height (bars only)
  const LABEL_H     = 90;   // space below x-axis reserved for labels
  const AXIS_Y      = H + 14;
  const W_INNER     = 500;  // drawable width inside margins
  const SVG_W       = MARGIN_L + W_INNER + MARGIN_R;
  const SVG_H       = AXIS_Y + LABEL_H;

  const count  = Math.max(1, opciones.length);
  const BAR_W  = Math.max(38, Math.floor(W_INNER / count) - 16);
  const gap    = Math.floor((W_INNER - BAR_W * count) / (count + 1));

  const DEMO_H = [0.65, 0.35, 0.82, 0.48, 0.57, 0.70, 0.42];

  const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);
  const hasRealData = isPublished && totalVotes > 0;

  const getBarH = (op, i) => {
    if (hasRealData) return Math.max(8, Math.round(((results[op] || 0) / totalVotes) * H));
    return Math.max(20, Math.round(DEMO_H[i % DEMO_H.length] * H));
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-4 pt-8 pb-6 w-full">

      {/* Título */}
      <h1 className="text-3xl font-black tracking-tight uppercase leading-none text-center mb-1"
        style={{ background: 'linear-gradient(135deg,#1e293b 0%,#475569 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
        {titulo || 'Nueva Encuesta'}
      </h1>

      {/* Descripción */}
      {descripcion && (
        <div className="w-full max-w-2xl mx-auto mt-3 bg-slate-50/70 border border-slate-200 rounded-2xl px-5 py-3">
          <div className="max-h-28 overflow-y-auto custom-scrollbar">
            <p className="text-sm text-slate-600 font-medium leading-relaxed text-center whitespace-pre-line">{descripcion}</p>
          </div>
        </div>
      )}

      {/* Pregunta */}
      {pregunta && (
        <div className="w-full max-w-xl mx-auto mt-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 text-center shadow-sm">
          <p className="text-base text-slate-700 font-semibold leading-relaxed">{pregunta}</p>
        </div>
      )}

      {/* ── Gráfico SVG ── */}
      <div className="relative w-full mt-4 mx-auto" style={{ maxWidth: 'min(100%, 680px)' }}>
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-auto"
          style={{ overflow: 'visible' }}
        >
          {/* Definiciones — filtros de sombra para hover */}
          <defs>
            {COLORS.map((c, i) => (
              <filter key={i} id={`glow-${i}`} x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor={c} floodOpacity="0.45" />
              </filter>
            ))}
          </defs>

          {/* Eje Y */}
          <line x1={MARGIN_L} y1="10" x2={MARGIN_L} y2={AXIS_Y}
            stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
          {/* Eje X */}
          <line x1={MARGIN_L} y1={AXIS_Y} x2={SVG_W - MARGIN_R} y2={AXIS_Y}
            stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />

          {/* Grid horizontal */}
          {[0.25, 0.5, 0.75, 1].map((pct) => {
            const lineY = AXIS_Y - pct * H;
            return (
              <g key={pct}>
                <line x1={MARGIN_L} y1={lineY} x2={SVG_W - MARGIN_R} y2={lineY}
                  stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="5 5" />
                <text x={MARGIN_L - 6} y={lineY + 4} textAnchor="end"
                  style={{ fontSize: '12px', fill: '#94a3b8', fontWeight: 600 }}>
                  {Math.round(pct * 100)}%
                </text>
              </g>
            );
          })}

          {/* ── Barras ── */}
          {opciones.map((op, i) => {
            const bH      = getBarH(op, i);
            const x       = MARGIN_L + gap + i * (BAR_W + gap);
            const barTop  = AXIS_Y - bH;
            const cx      = x + BAR_W / 2;           // center-x of the bar
            const color   = COLORS[i % COLORS.length];
            const colorLt = COLORS_LITE[i % COLORS_LITE.length];
            const isHov   = hoveredBar === i;

            // Real data label
            const votes = hasRealData ? (results[op] || 0) : null;
            const pctStr = votes !== null ? `${Math.round((votes / totalVotes) * 100)}%` : null;

            return (
              <g key={op}
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Hover background glow area */}
                {isHov && (
                  <rect
                    x={x - 8} y={barTop - 8}
                    width={BAR_W + 16} height={bH + 8}
                    rx="14" fill={color} opacity="0.08"
                  />
                )}

                {/* Drop shadow rect */}
                <rect x={x + 4} y={barTop + 8} width={BAR_W} height={bH}
                  rx="12" fill={color} opacity={isHov ? 0.18 : 0.1} />

                {/* Main bar — lifts 6px on hover */}
                <rect
                  x={x} y={isHov ? barTop - 6 : barTop}
                  width={BAR_W} height={bH}
                  rx="12"
                  fill={color}
                  opacity={isHov ? 1 : 0.82}
                  filter={isHov ? `url(#glow-${i % COLORS.length})` : undefined}
                  style={{ transition: 'y 0.18s ease, opacity 0.18s ease' }}
                />

                {/* Inner shine strip */}
                <rect
                  x={x + 8} y={isHov ? barTop - 6 + 8 : barTop + 8}
                  width={BAR_W - 16} height="12" rx="6"
                  fill="rgba(255,255,255,0.30)"
                  style={{ transition: 'y 0.18s ease' }}
                />

                {/* ── Tooltip on hover ── */}
                {isHov && (
                  <g>
                    {/* Tooltip bubble */}
                    <rect
                      x={cx - 52} y={barTop - 50}
                      width="104" height="38" rx="10"
                      fill="#0f172a" opacity="0.93"
                    />
                    {/* Arrow */}
                    <polygon
                      points={`${cx - 7},${barTop - 13} ${cx + 7},${barTop - 13} ${cx},${barTop - 4}`}
                      fill="#0f172a" opacity="0.93"
                    />
                    {/* Option name */}
                    <text x={cx} y={barTop - 32} textAnchor="middle"
                      style={{ fontSize: '11px', fontWeight: 700, fill: '#94a3b8' }}>
                      {op.length > 22 ? op.slice(0, 20) + '…' : op}
                    </text>
                    {/* Value or "Vista previa" */}
                    <text x={cx} y={barTop - 17} textAnchor="middle"
                      style={{ fontSize: '13px', fontWeight: 900, fill: 'white' }}>
                      {pctStr
                        ? `${votes} votos · ${pctStr}`
                        : hasRealData ? '0 votos' : 'Vista previa'}
                    </text>
                  </g>
                )}

                {/* Value badge above bar (real data, not hovered) */}
                {pctStr && !isHov && (
                  <g>
                    <rect x={cx - 28} y={barTop - 26} width="56" height="20" rx="7"
                      fill={colorLt} />
                    <text x={cx} y={barTop - 12} textAnchor="middle"
                      style={{ fontSize: '11px', fontWeight: 800, fill: color }}>
                      {pctStr}
                    </text>
                  </g>
                )}

                {/* ── X-axis label — horizontal, wrapped in foreignObject ── */}
                <foreignObject
                  x={x - 6}
                  y={AXIS_Y + 10}
                  width={BAR_W + 12}
                  height={LABEL_H - 14}
                >
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      textAlign: 'center',
                      fontFamily: 'inherit',
                      fontSize: tipo === 'valoracion' ? '15px' : '12px',
                      fontWeight: 700,
                      color: isHov ? color : '#374151',
                      lineHeight: '1.35',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      padding: '0 2px',
                      transition: 'color 0.2s',
                    }}
                  >
                    {op}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* Live counter */}
        {hasRealData && (
          <div className="flex justify-center mt-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {totalVotes} respuesta{totalVotes !== 1 ? 's' : ''} en vivo
            </span>
          </div>
        )}
      </div>
    </div>
  );
}


/** Tarjeta contenedora para cada sección de inputs */
function DataCard({ icon, title, color, children }) {
  const palette = {
    slate: 'border-slate-100   bg-slate-50',
    blue: 'border-slate-100     bg-slate-100/30',
    emerald: 'border-emerald-50  bg-emerald-50/30',
    amber: 'border-amber-50    bg-amber-50/30',
  };
  const iconPalette = {
    slate: 'text-slate-500   bg-slate-100',
    blue: 'text-slate-900    bg-slate-200',
    emerald: 'text-emerald-600 bg-emerald-100',
    amber: 'text-amber-600   bg-amber-100',
  };
  return (
    <div className={`rounded-2xl border p-4 ${palette[color] || palette.slate}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconPalette[color]}`}>
          {icon}
        </span>
        <h4 className="font-black text-slate-800 text-sm">{title}</h4>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/** Campo de entrada estilo "smart panel" con badge lateral */
function SmartInputField({ label, value, onChange, badge, isDeduced, onMouseEnter, onMouseLeave }) {
  return (
    <div
      className="flex items-center gap-2 group"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <label className={`flex-1 text-xs font-semibold truncate transition-colors ${isDeduced ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'
        }`}>
        {label}
      </label>

      <div className={`flex items-center rounded-xl border overflow-hidden shadow-sm transition-all ${isDeduced
        ? 'border-emerald-300 ring-1 ring-emerald-200'
        : 'border-slate-200 group-hover:border-slate-300'
        }`}>
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-14 px-2 py-1.5 text-right font-mono font-bold text-sm focus:outline-none transition-colors ${isDeduced ? 'bg-emerald-50 text-emerald-800' : 'bg-white text-slate-800'
            }`}
          placeholder="0"
        />
        {badge && (
          <span className={`px-2 flex items-center justify-center h-full border-l text-xs ${isDeduced ? 'border-emerald-200 bg-emerald-100 text-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-400'
            }`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

export default App;
