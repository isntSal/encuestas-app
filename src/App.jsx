import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente Supabase con variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseKey) : null;

function App() {
  const [activeTab, setActiveTab] = useState('names'); // 'names' | 'data'

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
  const [report, setReport] = useState([]); // Reportes de validación matemática
  const [deducedFields, setDeducedFields] = useState([]); // Campos auto-completados por el algoritmo

  // Álgebra de Conjuntos (Cálculos dinámicos)
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
      setDeducedFields(prev => prev.filter(k => k !== key)); // Clear highlight if user edits
    }
  };

  const handleClearData = () => {
    setInputs({
      Total: '', none: '', totalA: '', totalB: '', totalC: '',
      intAB: '', intAC: '', intBC: '', triple: ''
    });
    setReport([]);
    setDeducedFields([]);
  };

  const handleValidate = () => {
    let newReport = [];
    let currentInputNames = ['U', 'none', 'totalA', 'totalB', 'totalC', 'intAB', 'intAC', 'intBC', 'triple'];

    // MAPA DE ECUACIONES: Las 9 variables se definen por combinatorias sobre las 8 porciones atómicas del diagrama:
    // arrayIndex: [onlyA, onlyB, onlyC, excAB, excAC, excBC, triple, none]
    const EQ_MAP = {
        U:      [1, 1, 1, 1, 1, 1, 1, 1],
        none:   [0, 0, 0, 0, 0, 0, 0, 1],
        totalA: [1, 0, 0, 1, 1, 0, 1, 0],
        totalB: [0, 1, 0, 1, 0, 1, 1, 0],
        totalC: [0, 0, 1, 0, 1, 1, 1, 0],
        intAB:  [0, 0, 0, 1, 0, 0, 1, 0],
        intAC:  [0, 0, 0, 0, 1, 0, 1, 0],
        intBC:  [0, 0, 0, 0, 0, 1, 1, 0],
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
            validSystem = false; // Inconsistente (0 = K)
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
        
        // Reconstrucción del diccionario original en la variable "calc"
        let calc = {
            U: solutions[0]+solutions[1]+solutions[2]+solutions[3]+solutions[4]+solutions[5]+solutions[6]+solutions[7],
            none: solutions[7],
            totalA: solutions[0]+solutions[3]+solutions[4]+solutions[6],
            totalB: solutions[1]+solutions[3]+solutions[5]+solutions[6],
            totalC: solutions[2]+solutions[4]+solutions[5]+solutions[6],
            intAB: solutions[3]+solutions[6],
            intAC: solutions[4]+solutions[6],
            intBC: solutions[5]+solutions[6],
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
                validSystem = false; // Parche final de seguridad cruzada
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
        // Sub-sistema Indeterminado
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

  const svgRegions = [
    { key: 'onlyA', x: 100, y: 120, value: onlyA },
    { key: 'onlyB', x: 300, y: 120, value: onlyB },
    { key: 'onlyC', x: 200, y: 290, value: onlyC },
    { key: 'AB', x: 200, y: 110, value: excAB },
    { key: 'AC', x: 130, y: 210, value: excAC },
    { key: 'BC', x: 270, y: 210, value: excBC },
    { key: 'ABC', x: 200, y: 175, value: triple }
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 font-sans text-slate-100 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 overflow-hidden">
      {/* Tarjeta Glassmorphism clara sobre fondo oscuro */}
      <div className="relative z-10 bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-slate-700 shadow-2xl shadow-black/50 w-full max-w-7xl p-8 flex flex-col lg:flex-row gap-10">
        
        {/* Izquierda: MVP Visual (SVG) y Resultados */}
        <div className="flex-1 flex flex-col items-center text-slate-800">
          <div className="w-full text-center mb-8">
            <h1 className="text-5xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-emerald-500 to-teal-400 drop-shadow-sm">{surveyMeta.title || 'Encuesta '}</h1>
            <p className="text-slate-500 font-bold tracking-wide">{surveyMeta.description || '¿Qué problema tienes en mente?'}</p>
          </div>

          {/* SVG Wrapper */}
          <div className="relative w-full max-w-lg aspect-square mb-6 bg-slate-50 rounded-3xl p-6 shadow-inner border border-slate-200">
            <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-sm">
              {/* Universo (Exterior) y Elementos Fuera ajustados para que no se corten */}
              <text x="5" y="15" className="text-sm font-black fill-slate-800">Total: {U}</text>
              <text 
                x="360" y="380" 
                textAnchor="end" 
                className="text-sm font-black fill-rose-600 cursor-pointer pointer-events-auto transition-all"
                onMouseEnter={() => setHoveredRegion('none')} onMouseLeave={() => setHoveredRegion(null)}
              >
                Fuera: {getDisplayValue(none)}
              </text>

              {/* Nombres */}
              <text x="40" y="38" textAnchor="middle" className="text-sm font-bold fill-blue-900">{varNames.A || 'Variable A'}</text>
              <text x="360" y="38" textAnchor="middle" className="text-sm font-bold fill-emerald-800">{varNames.B || 'Variable B'}</text>
              <text x="200" y="380" textAnchor="middle" className="text-sm font-bold fill-slate-800">{varNames.C || 'Variable C'}</text>

              <g className="transition-all duration-300 hover:-translate-y-1" style={{ mixBlendMode: 'multiply' }}>
                <circle cx="150" cy="150" r="110" className={`stroke-blue-500 stroke-[2px] transition-all duration-300 ${['circleA', 'onlyA', 'AB', 'AC', 'ABC'].includes(hoveredRegion) ? 'fill-blue-500 hover:fill-blue-400' : 'fill-blue-300 hover:fill-blue-400'}`} fillOpacity={['circleA', 'onlyA', 'AB', 'AC', 'ABC'].includes(hoveredRegion) ? "0.8" : "0.6"} />
              </g>

              <g className="transition-all duration-300 hover:-translate-y-1" style={{ mixBlendMode: 'multiply' }}>
                <circle cx="250" cy="150" r="110" className={`stroke-emerald-500 stroke-[2px] transition-all duration-300 ${['circleB', 'onlyB', 'AB', 'BC', 'ABC'].includes(hoveredRegion) ? 'fill-emerald-500 hover:fill-emerald-400' : 'fill-emerald-300 hover:fill-emerald-400'}`} fillOpacity={['circleB', 'onlyB', 'AB', 'BC', 'ABC'].includes(hoveredRegion) ? "0.8" : "0.6"} />
              </g>

              <g className="transition-all duration-300 hover:-translate-y-1" style={{ mixBlendMode: 'multiply' }}>
                <circle cx="200" cy="236.6" r="110" className={`stroke-slate-500 stroke-[2px] transition-all duration-300 ${['circleC', 'onlyC', 'AC', 'BC', 'ABC'].includes(hoveredRegion) ? 'fill-slate-500 hover:fill-slate-400' : 'fill-slate-300 hover:fill-slate-400'}`} fillOpacity={['circleC', 'onlyC', 'AC', 'BC', 'ABC'].includes(hoveredRegion) ? "0.8" : "0.6"} />
              </g>

              {/* Valores interiores calculados */}
              {svgRegions.map((reg) => (
                <text 
                  key={reg.key}
                  x={reg.x} 
                  y={reg.y} 
                  textAnchor="middle" 
                  alignmentBaseline="middle"
                  className={`text-lg font-black cursor-pointer pointer-events-auto transition-all drop-shadow-md ${reg.value < 0 ? 'fill-red-600 animate-pulse' : 'fill-slate-900'}`}
                  onMouseEnter={() => setHoveredRegion(reg.key)}
                  onMouseLeave={() => setHoveredRegion(null)}
                >
                  {getDisplayValue(reg.value)}
                </text>
              ))}
            </svg>
          </div>

          {/* Reporte de Validación */}
          {report.length > 0 && (
            <div className="flex flex-col gap-2 mt-auto p-5 bg-slate-100 rounded-2xl border border-slate-300 w-full shadow-sm fade-in">
              <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-1 border-b border-slate-300 pb-2">Resultados</h4>
              {report.map((item, idx) => (
                <div key={idx} className={`p-3 rounded-lg text-sm font-semibold border ${
                  item.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                  item.type === 'warn' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {item.type === 'error' && <span className="mr-2">❌</span>}
                  {item.type === 'warn' && <span className="mr-2">⚠️</span>}
                  {item.type === 'success' && <span className="mr-2">✅</span>}
                  {item.msg}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Derecha: Pestañas e Inputs */}
        <div className="flex-1 flex flex-col bg-slate-50 border border-slate-200 p-8 rounded-3xl shadow-lg overflow-hidden">
          
          <div className="flex space-x-2 bg-slate-200/50 p-1 rounded-xl mb-6">
            <button 
              onClick={() => setActiveTab('names')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'names' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Definir Nombres
            </button>
            <button 
              onClick={() => setActiveTab('data')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'data' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Totales del Problema
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {activeTab === 'names' ? (
              <div className="space-y-4">
                <div className="flex flex-col mb-4 bg-slate-100/50 p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">📝</span>
                    <h4 className="font-black text-slate-800">Datos de la Encuesta</h4>
                  </div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2">Título del Estudio</label>
                  <input type="text" placeholder="Ej: Hábitos de Consumo 2026" value={surveyMeta.title} onChange={e => setSurveyMeta(prev => ({...prev, title: e.target.value}))} className="w-full px-4 py-3 mb-4 border border-slate-300 bg-white text-slate-900 font-bold rounded-xl focus:ring-2 focus:ring-slate-500 focus:outline-none placeholder-slate-400 shadow-sm" />
                  
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2">Breve Descripción</label>
                  <textarea rows="2" placeholder="Ej: Estudio sobre preferencias de postres en jóvenes..." value={surveyMeta.description} onChange={e => setSurveyMeta(prev => ({...prev, description: e.target.value}))} className="w-full px-4 py-3 border border-slate-300 bg-white text-slate-900 rounded-xl focus:ring-2 focus:ring-slate-500 focus:outline-none placeholder-slate-400 shadow-sm resize-none"></textarea>
                </div>
              
                <div className="flex flex-col">
                  <label className="text-xs font-black text-blue-900 uppercase tracking-widest mb-2"> Variable A</label>
                  <input type="text" maxLength="20" placeholder=" " value={varNames.A} onChange={e => handleNameChange('A', e.target.value)} className="w-full px-4 py-3 border border-slate-300 bg-white text-slate-900 font-bold rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 shadow-sm" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-2"> Variable B</label>
                  <input type="text" maxLength="20" placeholder=" " value={varNames.B} onChange={e => handleNameChange('B', e.target.value)} className="w-full px-4 py-3 border border-slate-300 bg-white text-slate-900 font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-400 shadow-sm" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest mb-2"> Variable C</label>
                  <input type="text" maxLength="20" placeholder=" " value={varNames.C} onChange={e => handleNameChange('C', e.target.value)} className="w-full px-4 py-3 border border-slate-300 bg-white text-slate-900 font-bold rounded-xl focus:ring-2 focus:ring-slate-500 focus:outline-none placeholder-slate-400 shadow-sm" />
                </div>
                <div className="mt-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-blue-900 font-medium">
                  Redacte los nombres de las variables para personalizar los eventos.
                </div>
              </div>
            ) : (
              <div className="space-y-6 relative pb-4">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200">
                  <span className="text-sm font-bold text-slate-500">Sección de valores</span>
                  <button 
                    onClick={handleClearData} 
                    className="text-xs text-rose-600 hover:text-white font-bold bg-rose-50 hover:bg-rose-500 px-3 py-1.5 rounded-lg transition-colors border border-rose-200 hover:border-rose-500 shadow-sm flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    Borrar Datos
                  </button>
                </div>

                {/* Sección 1: Universo */}
                <div className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200 transition-all hover:bg-slate-100 hover:shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl"></span>
                    <h4 className="font-black text-slate-800">1. Público Encuestado</h4>
                  </div>
                  <div className="space-y-1">
                    <InputField 
                      label="Muestra Total" 
                      value={inputs.U} 
                      onChange={v => handleInputChange('U', v)} 
                      highlight 
                      onMouseEnter={() => setHoveredRegion('none')}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                    <InputField 
                      label="Ninguna de las opciones" 
                      value={inputs.none} 
                      onChange={v => handleInputChange('none', v)} 
                      onMouseEnter={() => setHoveredRegion('none')}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2 px-1">Número de personas a las que encuestaste en total y aquellos que no eligieron opciones.</p>
                </div>

                {/* Sección 2: Totales */}
                <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100 transition-all hover:bg-blue-50/60 hover:shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl"></span>
                    <h4 className="font-black text-slate-800">2. Valores Totales</h4>
                  </div>
                  <div className="space-y-1">
                    <InputField 
                      label={`TOTAL ${varNames.A || 'A'} `} 
                      value={inputs.totalA} 
                      onChange={v => handleInputChange('totalA', v)} 
                      onMouseEnter={() => setHoveredRegion('onlyA')}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                    <InputField 
                      label={`TOTAL ${varNames.B || 'B'}`} 
                      value={inputs.totalB} 
                      onChange={v => handleInputChange('totalB', v)} 
                      onMouseEnter={() => setHoveredRegion('onlyB')}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                    <InputField 
                      label={`TOTAL ${varNames.C || 'C'}`} 
                      value={inputs.totalC} 
                      onChange={v => handleInputChange('totalC', v)} 
                      onMouseEnter={() => setHoveredRegion('onlyC')}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                  </div>
                </div>

                {/* Sección 3: Intersecciones */}
                <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100 transition-all hover:bg-emerald-50/60 hover:shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl"></span>
                    <h4 className="font-black text-slate-800">3. Cruces Totales</h4>
                  </div>
                  <div className="space-y-1">
                    <InputField 
                      label={`Total Ambos: ${varNames.A} y ${varNames.B}`} 
                      value={inputs.intAB} 
                      onChange={v => handleInputChange('intAB', v)} 
                      onMouseEnter={() => setHoveredRegion('AB')}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                    <InputField 
                      label={`Total Ambos: ${varNames.A} y ${varNames.C}`} 
                      value={inputs.intAC} 
                      onChange={v => handleInputChange('intAC', v)} 
                      onMouseEnter={() => setHoveredRegion('AC')}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                    <InputField 
                      label={`Total Ambos: ${varNames.B} y ${varNames.C}`} 
                      value={inputs.intBC} 
                      onChange={v => handleInputChange('intBC', v)} 
                      onMouseEnter={() => setHoveredRegion('BC')}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                  </div>
                </div>

                {/* Sección 4: Núcleo */}
                <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-100 transition-all hover:bg-amber-50/60 hover:shadow-md mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl"></span>
                    <h4 className="font-black text-amber-900">4. Núcleo</h4>
                  </div>
                  <InputField 
                    label="Elige las 3 opciones" 
                    value={inputs.triple} 
                    onChange={v => handleInputChange('triple', v)} 
                    highlight 
                    onMouseEnter={() => setHoveredRegion('ABC')}
                    onMouseLeave={() => setHoveredRegion(null)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            {status.message && (
              <span className={`text-sm font-bold mb-1 px-4 py-2 rounded-lg w-full text-center ${status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {status.message}
              </span>
            )}
            <div className="flex w-full gap-3">
              {activeTab === 'data' && (
                <>
                  <button
                    onClick={handleValidate}
                    className="flex-1 px-4 py-4 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm flex justify-center items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    Calcular y Verificar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={status.type === 'loading'}
                    className="flex-[2] px-6 py-4 bg-slate-900/90 hover:bg-black text-white rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-slate-400 transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-70"
                  >
                    {status.type === 'loading' ? 'Guardando...' : 'Guardar encuesta.'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, highlight, onMouseEnter, onMouseLeave, isDeduced }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 p-2.5 rounded-xl transition-all duration-300 ${highlight ? 'bg-white shadow-sm border border-slate-200' : 'hover:bg-white/60 border border-transparent'} ${isDeduced ? 'ring-2 ring-emerald-400 bg-emerald-50/50' : ''} relative overflow-hidden group`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Decorative dot to hint interactivity */}
      <div className={`absolute left-0 w-1 h-full rounded-r-full transition-all duration-300 opacity-0 group-hover:opacity-100 ${highlight ? 'bg-slate-800' : 'bg-blue-400'}`}></div>

      <label className={`text-sm ml-1 ${highlight ? 'font-black text-slate-800' : 'font-bold text-slate-600'} ${isDeduced ? 'text-emerald-800' : ''}`}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-20 lg:w-24 px-3 py-2 text-right font-mono font-bold text-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner ${isDeduced ? 'border-emerald-400 bg-emerald-100 text-emerald-900' : 'border-slate-300 bg-white'}`}
        placeholder="0"
      />
    </div>
  );
}

export default App;
