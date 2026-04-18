import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Groq from "groq-sdk";

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

  // ─── IA: Procesar descripción con Groq ───
  const handleAiProcess = async () => {
    if (!generalSurvey.descripcion) {
      alert("Por favor, ingresa el enunciado del problema en la descripción.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResults(null); // Limpiar resultados previos
    setStatus({ type: 'loading', message: 'Analizando con IA...' });

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Eres un motor de extracción estructurada para problemas de teoría de conjuntos. Analiza el enunciado en DOS CAPAS ESTRICTAS y devuelve ÚNICAMENTE un objeto JSON en texto plano.

REGLAS ABSOLUTAS:
1. Devuelve SOLO el JSON. NADA MÁS. Sin texto antes ni después.
2. PROHIBIDO usar bloques markdown (\`\`\`json o \`\`\`). Solo texto plano.
3. NO resuelvas el problema. Solo extrae y clasifica.

═══ CAPA 1: EXTRACCIÓN DE HECHOS CONFIRMADOS ═══
Identifica TODOS los valores numéricos explícitos del enunciado y asígnalos a su clave correcta usando este DICCIONARIO SEMÁNTICO ESTRICTO:

DICCIONARIO DE MAPEO (obligatorio):
- "encuestados", "personas", "total de la muestra", "universo" → U
- "prefieren A", "eligen A", "consumen A", "practican A" → totalA
- "prefieren B", "eligen B", "consumen B", "practican B" → totalB  
- "prefieren C", "eligen C", "consumen C", "practican C" → totalC
- "ambos A y B", "A y B simultáneamente", "A y B a la vez" → intAB
- "ambos A y C", "A y C simultáneamente" → intAC
- "ambos B y C", "B y C simultáneamente" → intBC
- "los tres", "las tres opciones", "los tres simultáneamente", "todas las categorías", "A, B y C a la vez" → triple
- "ninguno de los tres", "ninguna opción", "no pertenecen a ninguno", "fuera de los grupos", "no eligieron ninguno" → none

REGLA ANTI-PROXIMIDAD: Lee cada oración COMPLETA antes de asignar. Un número pertenece a la frase que lo contiene semánticamente, NO al sustantivo más cercano.

═══ CAPA 2: IDENTIFICACIÓN DE LA INCÓGNITA ═══
PRINCIPIO DE EXCLUSIÓN MUTUA: Una variable que ya recibió un valor numérico en Capa 1 tiene PROHIBIDO ser la incógnita. La incógnita DEBE ser una variable que quedó sin valor.

Claves válidas para incógnitas:
- onlyA, onlyB, onlyC = solo pertenecen a un grupo exclusivamente
- excAB, excAC, excBC = exactamente en esos dos pero no en el tercero
- triple = en los tres grupos
- none = en ningún grupo
- unionTotal = en al menos un grupo
- U, totalA, totalB, totalC, intAB, intAC, intBC = si no fueron dados

═══ ESTRUCTURA JSON DE SALIDA ═══
{
  "hechos_confirmados": {
    "U": <número>,
    "totalA": <número>,
    ...solo las claves que tienen valor numérico explícito en el texto
  },
  "variables_nulas": ["triple", "onlyA", ...],
  "incognita_objetivo": "triple",
  "nombres_conjuntos": {
    "A": "Nombre del primer grupo",
    "B": "Nombre del segundo grupo",
    "C": "Nombre del tercer grupo"
  },
  "analisis_enunciado": {
    "objetivo": "Qué busca resolver el problema",
    "hallazgos": ["Dato clave 1", "Dato clave 2"],
    "preguntas_detectadas": [
      {"pregunta": "Texto literal de la pregunta", "incognita": "clave_de_variable"}
    ]
  }
}

VALIDACIÓN FINAL antes de responder:
- ¿Cada valor en hechos_confirmados aparece LITERALMENTE como número en el texto? Si no, elimínalo.
- ¿La incognita_objetivo está ausente de hechos_confirmados? Si no, corrígelo.
- ¿Las claves en hechos_confirmados son del set {U, totalA, totalB, totalC, intAB, intAC, intBC, triple, none}? Si no, reclasifica.`
          },
          {
            role: "user",
            content: generalSurvey.descripcion
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0
      });

      // Limpieza defensiva: purgar markdown residual
      const rawContent = completion.choices[0].message.content;
      const cleanedContent = rawContent
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      console.log("Respuesta cruda de Groq:", rawContent);
      const parsed = JSON.parse(cleanedContent);
      console.log("Datos parseados:", parsed);

      // ─── Mapeo desde nueva estructura (con fallback a la vieja) ───
      const confirmedFacts = parsed.hechos_confirmados || parsed.datos_matriz || parsed;

      // Poblar inputs: hechos confirmados → string, todo lo demás → ''
      const inputKeys = ['U', 'totalA', 'totalB', 'totalC', 'intAB', 'intAC', 'intBC', 'triple', 'none'];
      setInputs(prev => {
        const updated = { ...prev };
        inputKeys.forEach(key => {
          if (confirmedFacts[key] != null) {
            updated[key] = String(confirmedFacts[key]);
          } else {
            updated[key] = '';
          }
        });
        return updated;
      });

      // Guardar resultados del análisis para el panel de UI
      if (parsed.analisis_enunciado) {
        // Inyectar la incógnita objetivo como primera pregunta si no está ya
        const analysis = { ...parsed.analisis_enunciado };
        if (parsed.incognita_objetivo && (!analysis.preguntas_detectadas || analysis.preguntas_detectadas.length === 0)) {
          analysis.preguntas_detectadas = [{
            pregunta: analysis.objetivo || '¿Cuál es el valor buscado?',
            incognita: parsed.incognita_objetivo
          }];
        }
        setAnalysisResults(analysis);
      }

      // Autocompletar nombres de conjuntos
      if (parsed.nombres_conjuntos) {
        const nc = parsed.nombres_conjuntos;
        setVarNames(prev => ({
          A: nc.A || prev.A,
          B: nc.B || prev.B,
          C: nc.C || prev.C
        }));
      }

      setDeducedFields([]);
      setActiveTab('data');

      // Log de diagnóstico
      if (parsed.incognita_objetivo) {
        console.log(`🎯 Incógnita objetivo: ${parsed.incognita_objetivo}`);
        console.log(`📋 Variables nulas: ${(parsed.variables_nulas || []).join(', ')}`);
      }

      setStatus({ type: 'success', message: '¡Análisis completado por la IA!' });
      setTimeout(() => setStatus({ type: '', message: '' }), 4000);

    } catch (error) {
      console.error("Fallo en la inferencia:", error);
      setStatus({ type: 'error', message: 'Error al contactar con la IA. Revisa la consola.' });
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
    <div className="min-h-screen flex flex-col lg:flex-row overflow-y-auto bg-white font-sans">

      {/* ══════════════════ LEFT PANEL — Light Venn (reference style) ══════════════════ */}
      <div className="flex-1 flex flex-col bg-white relative min-h-[60vh] lg:min-h-0">

        {activeSurveyMode === 'general' ? (
          <GeneralSurveyCanvas
            titulo={generalSurvey.titulo}
            descripcion={generalSurvey.descripcion}
            pregunta={generalSurvey.pregunta}
            tipo={generalSurvey.tipo}
            opciones={getOpcionesForType(generalSurvey.tipo, generalSurvey.opcionesCustom)}
            results={surveyResults}
            isPublished={!!publishedSurvey}
          />
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
            <div className="max-w-2xl w-full mx-auto mt-4 bg-slate-50/50 border border-slate-200 rounded-2xl p-5">
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

        {/* ── AI Analysis Results Panel ── */}
        {analysisResults && (
          <div className="w-full max-w-lg mt-6 fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              {/* Panel header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
                      <circle cx="12" cy="15" r="2" />
                    </svg>
                  </span>
                  <h3 className="font-black text-slate-800 text-sm tracking-tight">Análisis del Problema</h3>
                </div>
                <button
                  onClick={() => setAnalysisResults(null)}
                  className="text-slate-300 hover:text-slate-500 transition-colors"
                  title="Cerrar panel"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Objetivo */}
              {analysisResults.objetivo && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Objetivo</p>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed">{analysisResults.objetivo}</p>
                </div>
              )}

              {/* Hallazgos */}
              {analysisResults.hallazgos && analysisResults.hallazgos.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Datos Identificados</p>
                  <ul className="space-y-1.5">
                    {analysisResults.hallazgos.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">{i + 1}</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preguntas detectadas */}
              {analysisResults.preguntas_detectadas && analysisResults.preguntas_detectadas.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Preguntas del Problema</p>
                  <div className="space-y-2">
                    {analysisResults.preguntas_detectadas.map((q, i) => {
                      const resolvedValue = q.incognita && computedValues[q.incognita];
                      const hasData = filledCount >= 2;
                      return (
                        <div key={i} className="flex items-start gap-2 px-3 py-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                          <span className="text-indigo-500 shrink-0 mt-0.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700 font-semibold">{q.pregunta}</p>
                            {q.incognita && (
                              <div className="flex items-center gap-2 mt-1.5">
                                {hasData && resolvedValue !== undefined && resolvedValue !== null ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    R = {resolvedValue}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    ⏳ Pendiente de cálculo
                                  </span>
                                )}
                                <span className="text-[9px] font-mono text-slate-300">{q.incognita}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </>)}
      </div>

      {/* ══════════════════ RIGHT PANEL — Smart Panel ══════════════════ */}
      <div className="w-full lg:max-w-sm bg-white flex flex-col shadow-none lg:shadow-2xl lg:shadow-black/20 border-t border-slate-100 lg:border-t-0 relative z-10">

        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="font-black text-slate-900 text-lg tracking-tight">¿Qué tienes en mente?</h2>
          <button
            onClick={handleClearData}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            title="Reiniciar todo"
          >
            <IconTrash />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-2 pt-1">
          {[
            { id: 'nueva', label: 'Crear Encuesta' },
            { id: 'history', label: 'Historial' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 pb-2.5 pt-1 text-xs font-semibold transition-all border-b-2 ${activeTab === tab.id
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
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
                  className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                  Refrescar
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-10 text-center text-slate-400 text-sm animate-pulse">Cargando encuestas...</div>
              ) : history.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <p className="text-2xl">📋</p>
                  <p>No has publicado encuestas aún.</p>
                  <p className="text-[10px]">Crea una en el tab <strong>Crear Encuesta</strong>.</p>
                </div>
              ) : (
                history.map((survey) => {
                  const isActive = publishedSurvey?.id === survey.id;
                  const totalResp = isActive ? Object.values(surveyResults).reduce((a, b) => a + b, 0) : null;
                  return (
                    <div
                      key={survey.id}
                      onClick={() => loadSavedSurvey(survey)}
                      className={`relative p-4 rounded-2xl border transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-teal-50 border-teal-300 shadow-sm shadow-teal-100'
                          : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md hover:border-slate-200'
                      }`}
                    >
                      {/* Indicador activo */}
                      {isActive && (
                        <span className="absolute top-3 left-3 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                        </span>
                      )}

                      {/* Botón eliminar */}
                      <button
                        onClick={(e) => handleDeleteGeneralSurvey(survey.id, e)}
                        title="Eliminar encuesta"
                        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                      </button>

                      {/* Contenido */}
                      <h5 className={`font-bold text-sm mb-0.5 pr-8 ${isActive ? 'text-teal-700 pl-4' : 'text-slate-800 group-hover:text-teal-600'} transition-colors`}>
                        {survey.titulo}
                      </h5>
                      <p className="text-[10px] text-slate-400 mb-2 truncate pr-4">
                        {survey.pregunta}
                      </p>
                      <div className="flex gap-1.5 flex-wrap items-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          survey.tipo === 'si_no' ? 'bg-blue-100 text-blue-700'
                          : survey.tipo === 'valoracion' ? 'bg-amber-100 text-amber-700'
                          : 'bg-purple-100 text-purple-700'
                        }`}>
                          {survey.tipo === 'si_no' ? 'Sí/No' : survey.tipo === 'valoracion' ? 'Valoración' : 'Múltiple'}
                        </span>
                        {isActive && totalResp !== null && (
                          <span className="bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {totalResp} resp. en vivo
                          </span>
                        )}
                        <span className="text-[10px] text-slate-300 ml-auto">
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
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">📝</span>
                  <h4 className="font-black text-slate-800 text-sm">Datos del Estudio</h4>
                </div>

                {/* Título del estudio — se refleja en vivo en el panel izquierdo */}
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Título del Estudio</label>
                <input
                  id="general-titulo"
                  type="text"
                  placeholder="Ej: Hábitos de Consumo 2026"
                  value={generalSurvey.titulo}
                  onChange={e => setGeneralSurvey(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full px-3 py-2.5 mb-3 border border-slate-200 bg-white text-slate-900 font-semibold rounded-xl text-sm focus:ring-2 focus:ring-teal-400 focus:outline-none placeholder-slate-300 shadow-sm"
                />

                {/* Descripción — se refleja en vivo como tarjeta debajo del título */}
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Descripción</label>
                <textarea
                  id="general-descripcion"
                  rows="5"
                  placeholder="Ej: En una encuesta a 150 personas sobre preferencias de estudio..."
                  value={generalSurvey.descripcion}
                  onChange={e => setGeneralSurvey(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 bg-white text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-teal-400 focus:outline-none placeholder-slate-300 shadow-sm resize-none"
                />

                {/* Botón Solución del ejercicio — llama a la IA */}
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleAiProcess}
                    disabled={isAnalyzing}
                    className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-sm
                      ${isAnalyzing
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                      }`}
                  >
                    {isAnalyzing ? "Analizando..." : "Solución del ejercicio"}
                  </button>
                </div>
              </div>

              {/* ── Configurar Pregunta ── */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">📊</span>
                  <h4 className="font-black text-slate-800 text-sm">Configurar Pregunta</h4>
                </div>

                {/* Pregunta */}
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Pregunta</label>
                <textarea
                  id="general-pregunta"
                  rows="3"
                  placeholder="Ej: ¿Prefieres estudiar de forma presencial o virtual?"
                  value={generalSurvey.pregunta}
                  onChange={e => setGeneralSurvey(prev => ({ ...prev, pregunta: e.target.value }))}
                  className="w-full px-3 py-2.5 mb-4 border border-slate-200 bg-white text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-teal-400 focus:outline-none placeholder-slate-300 shadow-sm resize-none"
                />

                {/* Tipo de respuesta */}
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tipo de respuesta</label>
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                  {[
                    { value: 'si_no', label: 'Sí / No', icon: '✓' },
                    { value: 'valoracion', label: 'Valoración', icon: '★' },
                    { value: 'multiple', label: 'Múltiple', icon: '≡' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setGeneralSurvey(prev => ({ ...prev, tipo: opt.value }))}
                      className={`py-2.5 px-1 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-0.5 ${
                        generalSurvey.tipo === opt.value
                          ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-sm">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Opciones personalizadas (solo tipo múltiple) */}
                {generalSurvey.tipo === 'multiple' && (
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Opciones (máx. 4)</label>
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
                            className="flex-1 px-3 py-2 border border-slate-200 bg-white text-slate-800 text-sm rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none placeholder-slate-300"
                          />
                          {generalSurvey.opcionesCustom.length > 2 && (
                            <button
                              onClick={() => setGeneralSurvey(prev => ({ ...prev, opcionesCustom: prev.opcionesCustom.filter((_, i) => i !== idx) }))}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          )}
                        </div>
                      ))}
                      {generalSurvey.opcionesCustom.length < 4 && (
                        <button
                          onClick={() => setGeneralSurvey(prev => ({ ...prev, opcionesCustom: [...prev.opcionesCustom, ''] }))}
                          className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 mt-1"
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
                className={`w-full py-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                  showPreview
                    ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20'
                }`}
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
                <div className="bg-white rounded-2xl border-2 border-dashed border-teal-200 p-5 space-y-4 fade-in">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-md bg-teal-100 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-teal-600"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    </span>
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">Así verán los encuestados</span>
                  </div>

                  {/* Pregunta preview */}
                  <p className="text-sm font-bold text-slate-800 leading-relaxed">
                    {generalSurvey.pregunta || 'Tu pregunta aparecerá aquí...'}
                  </p>

                  {/* Opciones preview */}
                  <div className="space-y-2">
                    {getOpcionesForType(generalSurvey.tipo, generalSurvey.opcionesCustom).map((op, i) => (
                      <label key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 transition-all cursor-pointer group">
                        {generalSurvey.tipo === 'checkbox' || generalSurvey.tipo === 'multiple' ? (
                          <span className="w-4 h-4 rounded border-2 border-slate-300 group-hover:border-teal-400 transition-colors shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border-2 border-slate-300 group-hover:border-teal-400 transition-colors shrink-0" />
                        )}
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-teal-700 transition-colors">{op}</span>
                      </label>
                    ))}
                  </div>

                  {/* Disabled submit button */}
                  <button disabled className="w-full py-2.5 bg-teal-500/50 text-white rounded-xl text-sm font-bold cursor-not-allowed">
                    Enviar respuesta (solo vista previa)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Bottom action bar ── */}
        <div className="px-5 pb-6 pt-3 border-t border-slate-100 space-y-2.5 shrink-0">
          {status.message && (
            <div className={`text-xs font-semibold px-3 py-2 rounded-lg text-center fade-in ${status.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' :
              status.type === 'loading' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
              {status.message}
            </div>
          )}

          {activeTab === 'nueva' && (
            <>
              {/* ── Panel de encuesta publicada ── */}
              {publishedSurvey && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3 fade-in">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    </span>
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Encuesta activa</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-xl border border-emerald-200 px-3 py-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500 shrink-0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    <span className="flex-1 text-[10px] font-mono text-slate-600 truncate">{publishedSurvey.url}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(publishedSurvey.url);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2500);
                      }}
                      className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                        linkCopied ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                    >
                      {linkCopied ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">
                      {Object.values(surveyResults).reduce((a, b) => a + b, 0)} respuesta(s) · actualiza cada 5s
                    </span>
                    <a
                      href={publishedSurvey.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
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
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] disabled:opacity-60 bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/25"
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

/** Gráfico de barras para encuestas generales (vista previa del panel izquierdo) */
function GeneralSurveyCanvas({ titulo, descripcion, pregunta, tipo, opciones, results = {}, isPublished = false }) {
  const COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];
  const W = 400, H = 200;
  const count = opciones.length || 1;
  const BAR_W = Math.max(28, Math.floor((W - 60) / count) - 14);
  const gap = Math.floor((W - 60 - BAR_W * count) / (count + 1));
  const DEMO_H = [0.65, 0.35, 0.80, 0.45, 0.55];

  // Calcular alturas reales cuando hay resultados
  const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);
  const getBarH = (op, i) => {
    if (isPublished && totalVotes > 0) {
      return Math.max(8, Math.round(((results[op] || 0) / totalVotes) * H));
    }
    return Math.max(12, Math.round(DEMO_H[i % DEMO_H.length] * H));
  };
  const getBarLabel = (op) => {
    if (isPublished && totalVotes > 0) {
      const v = results[op] || 0;
      return `${v} (${Math.round((v / totalVotes) * 100)}%)`;
    }
    return isPublished ? '0 resp.' : 'Vista previa';
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-8">
      {/* Título — se refleja en vivo */}
      <h1
        className="text-3xl font-black tracking-tight uppercase leading-none text-center"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {titulo || 'Nueva Encuesta'}
      </h1>

      {/* Descripción — tarjeta que se refleja en vivo desde el panel derecho */}
      {descripcion && (
        <div className="max-w-2xl w-full mx-auto mt-4 bg-slate-50/50 border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-center gap-1.5 mb-2 text-slate-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
            <span className="text-xs font-bold uppercase tracking-widest">Descripción</span>
          </div>
          <div className="max-h-40 overflow-y-auto custom-scrollbar">
            <p className="text-sm text-slate-600 font-medium leading-relaxed text-center whitespace-pre-line">{descripcion}</p>
          </div>
        </div>
      )}

      {/* Pregunta */}
      {pregunta && (
        <div className="max-w-md w-full mx-auto mt-4 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-center">
          <p className="text-sm text-slate-600 font-semibold leading-relaxed">{pregunta}</p>
        </div>
      )}

      {/* Gráfico de barras SVG */}
      <div className="relative w-full max-w-lg mt-6">
        <svg viewBox={`0 0 ${W + 60} ${H + 70}`} className="w-full h-auto">
          {/* Ejes */}
          <line x1="40" y1="10" x2="40" y2={H + 15} stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
          <line x1="40" y1={H + 15} x2={W + 50} y2={H + 15} stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />

          {/* Grid horizontal */}
          {[0.25, 0.5, 0.75, 1].map((pct, i) => (
            <g key={i}>
              <line
                x1="40" y1={H + 15 - pct * H}
                x2={W + 50} y2={H + 15 - pct * H}
                stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4"
              />
              <text x="34" y={H + 15 - pct * H + 4} textAnchor="end"
                style={{ fontSize: '9px', fill: '#94a3b8', fontWeight: 600 }}>
                {Math.round(pct * 100)}%
              </text>
            </g>
          ))}

          {/* Barras */}
          {opciones.map((op, i) => {
            const bH = getBarH(op, i);
            const x = 40 + gap + i * (BAR_W + gap);
            const y = H + 15 - bH;
            const color = COLORS[i % COLORS.length];
            return (
              <g key={op}>
                <rect x={x + 3} y={y + 5} width={BAR_W} height={bH} rx="8" fill={color} opacity="0.10" />
                <rect x={x} y={y} width={BAR_W} height={bH} rx="8" fill={color} opacity="0.85" />
                <rect x={x + 5} y={y + 5} width={BAR_W - 10} height="6" rx="3" fill="rgba(255,255,255,0.22)" />
                <rect x={x} y={y - 22} width={BAR_W} height="18" rx="6" fill={color} opacity="0.12" />
                <text x={x + BAR_W / 2} y={y - 9} textAnchor="middle"
                  style={{ fontSize: '10px', fontWeight: 800, fill: color }}>
                  {getBarLabel(op)}
                </text>
                <text
                  x={x + BAR_W / 2} y={H + 32} textAnchor="middle"
                  style={{ fontSize: tipo === 'valoracion' ? '13px' : '10px', fontWeight: 700, fill: '#374151' }}
                >
                  {op.length > 9 ? op.slice(0, 8) + '…' : op}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Badge de tipo + estado real */}
        <div className="flex justify-center mt-1">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest ${
            isPublished && totalVotes > 0
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-slate-100 text-slate-500'
          }`}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
            {tipo === 'si_no' ? 'Sí / No' : tipo === 'valoracion' ? 'Valoración 1-5' : 'Opción múltiple'}
            {isPublished && totalVotes > 0
              ? ` · ${totalVotes} respuesta${totalVotes !== 1 ? 's' : ''} en vivo`
              : ' · Vista previa · Las respuestas aparecerán al publicar'}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Tarjeta contenedora para cada sección de inputs */
function DataCard({ icon, title, color, children }) {
  const palette = {
    slate: 'border-slate-100   bg-slate-50',
    blue: 'border-blue-50     bg-blue-50/30',
    emerald: 'border-emerald-50  bg-emerald-50/30',
    amber: 'border-amber-50    bg-amber-50/30',
  };
  const iconPalette = {
    slate: 'text-slate-500   bg-slate-100',
    blue: 'text-blue-600    bg-blue-100',
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
