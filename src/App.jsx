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
  const [activeTab, setActiveTab] = useState('names'); // 'names' | 'data' | 'history'

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
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null); // Resultados extendidos de la IA

  // ─── IA: Procesar descripción con Groq ───
  const handleAiProcess = async () => {
    if (!surveyMeta.description) {
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
            content: surveyMeta.description
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

  const fetchHistory = async () => {
    if (!supabase) return;
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('problemas_conjuntos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (!error && data) {
      setHistory(data);
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const loadSavedSurvey = (survey) => {
    setSurveyMeta({ title: survey.title || '', description: survey.description || '' });
    setVarNames({ A: survey.var_a_name || '', B: survey.var_b_name || '', C: survey.var_c_name || '' });
    setInputs({
      U: survey.universe != null ? String(survey.universe) : '',
      none: survey.none != null ? String(survey.none) : '',
      totalA: survey.total_a != null ? String(survey.total_a) : '',
      totalB: survey.total_b != null ? String(survey.total_b) : '',
      totalC: survey.total_c != null ? String(survey.total_c) : '',
      intAB: survey.intersection_ab != null ? String(survey.intersection_ab + (survey.intersection_abc || 0)) : '',
      intAC: survey.intersection_ac != null ? String(survey.intersection_ac + (survey.intersection_abc || 0)) : '',
      intBC: survey.intersection_bc != null ? String(survey.intersection_bc + (survey.intersection_abc || 0)) : '',
      triple: survey.intersection_abc != null ? String(survey.intersection_abc) : ''
    });
    setReport([]);
    setDeducedFields([]);
    setActiveTab('data');
    setStatus({ type: 'success', message: '¡Encuesta cargada exitosamente!' });
    setTimeout(() => setStatus({ type: '', message: '' }), 3000);
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
    // Reinicia los inputs numéricos
    setInputs({
      Total: '', none: '', totalA: '', totalB: '', totalC: '',
      intAB: '', intAC: '', intBC: '', triple: ''
    });
    // Reinicia también los metadatos y los nombres de variables
    setSurveyMeta({ title: '', description: '' });
    setVarNames({ A: '', B: '', C: '' });
    setReport([]);
    setDeducedFields([]);
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

  const handleDeleteSurvey = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar esta encuesta permanentemente?')) return;

    setStatus({ type: 'loading', message: 'Eliminando encuesta...' });

    const { error } = await supabase
      .from('problemas_conjuntos')
      .delete()
      .eq('id', id);

    if (error) {
      setStatus({ type: 'error', message: `Error al eliminar: ${error.message}` });
    } else {
      setHistory(prev => prev.filter(s => s.id !== id));
      setStatus({ type: 'success', message: 'Encuesta eliminada.' });
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
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
            { id: 'names', label: 'Definir Nombres' },
            { id: 'data', label: 'Totales del Problema' },
            { id: 'history', label: 'Cargar Historial' },
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

          {/* ── TAB: Definir Nombres ── */}
          {activeTab === 'names' && (
            <div className="space-y-4 fade-in">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">📝</span>
                  <h4 className="font-black text-slate-800 text-sm">Datos de la Encuesta</h4>
                </div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Título del Estudio</label>
                <input
                  type="text"
                  placeholder="Ej: Hábitos de Consumo 2026"
                  value={surveyMeta.title}
                  onChange={e => setSurveyMeta(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2.5 mb-3 border border-slate-200 bg-white text-slate-900 font-semibold rounded-xl text-sm focus:ring-2 focus:ring-teal-400 focus:outline-none placeholder-slate-300 shadow-sm"
                />
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Descripción</label>
                <textarea
                  rows="7"
                  placeholder="Ej: En una encuesta a 150 personas, 80 prefieren A, 70 prefieren B, 60 prefieren C, 30 eligen A y B..."
                  value={surveyMeta.description}
                  onChange={e => setSurveyMeta(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 bg-white text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-teal-400 focus:outline-none placeholder-slate-300 shadow-sm resize-none"
                />
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
                    {isAnalyzing ? "Analizando..." : " Solución del ejercicio"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Totales del Problema (4 cards) ── */}
          {activeTab === 'data' && (
            <div className="space-y-3 fade-in">
              {/* Progress */}
              <div className="mb-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400 font-medium">{progressPct}% Completado</span>
                  <span className="text-xs text-slate-400">{filledCount}/{allInputKeys.length} campos</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 progress-shimmer"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Card 1 — Público Encuestado */}
              <DataCard icon={<IconUsers />} title="Público Encuestado" color="slate">
                <SmartInputField
                  label="Muestra Total"
                  fieldKey="U"
                  value={inputs.U}
                  onChange={v => handleInputChange('U', v)}
                  isDeduced={deducedFields.includes('U')}
                  badge={<span className="text-slate-400"><IconUsers /></span>}
                  onMouseEnter={() => setHoveredRegion('none')}
                  onMouseLeave={() => setHoveredRegion(null)}
                />
                <SmartInputField
                  label="Ninguna de las opciones"
                  fieldKey="none"
                  value={inputs.none}
                  onChange={v => handleInputChange('none', v)}
                  isDeduced={deducedFields.includes('none')}
                  badge={<IconCheck />}
                  onMouseEnter={() => setHoveredRegion('none')}
                  onMouseLeave={() => setHoveredRegion(null)}
                />
              </DataCard>

              {/* Card 2 — Valores Totales */}
              <DataCard icon={<IconBarChart />} title="Valores Totales" color="blue">
                <SmartInputField
                  label={`TOTAL ${varNames.A || 'A'}`}
                  fieldKey="totalA"
                  value={inputs.totalA}
                  onChange={v => handleInputChange('totalA', v)}
                  isDeduced={deducedFields.includes('totalA')}
                  badge={<span className="font-black text-blue-600 text-xs">A</span>}
                  onMouseEnter={() => setHoveredRegion('onlyA')}
                  onMouseLeave={() => setHoveredRegion(null)}
                />
                <SmartInputField
                  label={`TOTAL ${varNames.B || 'B'}`}
                  fieldKey="totalB"
                  value={inputs.totalB}
                  onChange={v => handleInputChange('totalB', v)}
                  isDeduced={deducedFields.includes('totalB')}
                  badge={<span className="font-black text-emerald-600 text-xs">B</span>}
                  onMouseEnter={() => setHoveredRegion('onlyB')}
                  onMouseLeave={() => setHoveredRegion(null)}
                />
                <SmartInputField
                  label={`TOTAL ${varNames.C || 'C'}`}
                  fieldKey="totalC"
                  value={inputs.totalC}
                  onChange={v => handleInputChange('totalC', v)}
                  isDeduced={deducedFields.includes('totalC')}
                  badge={<span className="font-black text-slate-500 text-xs">C</span>}
                  onMouseEnter={() => setHoveredRegion('onlyC')}
                  onMouseLeave={() => setHoveredRegion(null)}
                />
              </DataCard>

              {/* Card 3 — Cruces Totales */}
              <DataCard icon={<IconCross />} title="Cruces Totales" color="emerald">
                <SmartInputField
                  label={`Total Ambos: ${varNames.A || 'A'} y ${varNames.B || 'B'}`}
                  fieldKey="intAB"
                  value={inputs.intAB}
                  onChange={v => handleInputChange('intAB', v)}
                  isDeduced={deducedFields.includes('intAB')}
                  onMouseEnter={() => setHoveredRegion('AB')}
                  onMouseLeave={() => setHoveredRegion(null)}
                />
                <SmartInputField
                  label={`Total Ambos: ${varNames.B || 'B'} y ${varNames.C || 'C'}`}
                  fieldKey="intBC"
                  value={inputs.intBC}
                  onChange={v => handleInputChange('intBC', v)}
                  isDeduced={deducedFields.includes('intBC')}
                  onMouseEnter={() => setHoveredRegion('BC')}
                  onMouseLeave={() => setHoveredRegion(null)}
                />
                <SmartInputField
                  label={`Total Ambos: ${varNames.A || 'A'} y ${varNames.C || 'C'}`}
                  fieldKey="intAC"
                  value={inputs.intAC}
                  onChange={v => handleInputChange('intAC', v)}
                  isDeduced={deducedFields.includes('intAC')}
                  onMouseEnter={() => setHoveredRegion('AC')}
                  onMouseLeave={() => setHoveredRegion(null)}
                />
              </DataCard>

              {/* Card 4 — Núcleo */}
              <DataCard icon={<IconTarget />} title="Núcleo" color="amber">
                <SmartInputField
                  label="Elige las 3 opciones"
                  fieldKey="triple"
                  value={inputs.triple}
                  onChange={v => handleInputChange('triple', v)}
                  isDeduced={deducedFields.includes('triple')}
                  badge={<IconCheck />}
                  onMouseEnter={() => setHoveredRegion('ABC')}
                  onMouseLeave={() => setHoveredRegion(null)}
                />
              </DataCard>
            </div>
          )}

          {/* ── TAB: Historial ── */}
          {activeTab === 'history' && (
            <div className="space-y-3 fade-in">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-black text-slate-800 text-sm">Encuestas Guardadas</h4>
                <button
                  onClick={fetchHistory}
                  className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  <IconRefresh /> Refrescar
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-10 text-center text-slate-400 text-sm animate-pulse">Cargando base de datos...</div>
              ) : history.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100">
                  No hay encuestas guardadas aún.
                </div>
              ) : (
                history.map((survey) => (
                  <div
                    key={survey.id}
                    onClick={() => loadSavedSurvey(survey)}
                    className="relative p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group"
                  >
                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDeleteSurvey(survey.id, e)}
                      title="Eliminar encuesta"
                      className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" /><path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>

                    <h5 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-teal-600 transition-colors pr-8">
                      {survey.title || 'Encuesta sin título'}
                    </h5>
                    <p className="text-xs text-slate-400 mb-2 truncate pr-4">{survey.description || 'Sin descripción'}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">U: {survey.universe || 0}</span>
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{survey.var_a_name || 'A'}</span>
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{survey.var_b_name || 'B'}</span>
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{survey.var_c_name || 'C'}</span>
                    </div>
                  </div>
                ))
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

          {activeTab === 'data' && (
            <button
              id="btn-save"
              onClick={handleSave}
              disabled={status.type === 'loading'}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-60"
            >
              <IconSave />
              {status.type === 'loading' ? 'Guardando...' : 'Guardar encuesta'}
            </button>
          )}

        </div>

      </div>
    </div>
  );
}

/* ─────────────────────── SUB-COMPONENTS ─────────────────────── */

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
