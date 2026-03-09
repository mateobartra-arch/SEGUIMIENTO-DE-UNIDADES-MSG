// ============================================================
// MISASI S.A.C. - Datos de Ejemplo para Dashboard
// ============================================================
// Estos datos simulan la información que vendría del Google Sheets.
// Para producción, se pueden vincular con Google Sheets API.

const UNIDADES = [
  { id: 1, empresa: 'DONGFENG', tracto: 'CFF841, 2025', año: 2025 },
  { id: 2, empresa: 'DONGFENG', tracto: 'CFG704, 2025', año: 2025 },
  { id: 3, empresa: 'FOTON',    tracto: 'CDI829, 2026', año: 2026 },
  { id: 4, empresa: 'FOTON',    tracto: 'BWW797, 2023', año: 2023 },
  { id: 5, empresa: 'FOTON',    tracto: 'BWU917, 2023', año: 2023 },
  { id: 6, empresa: 'FOTON',    tracto: 'CDJ712, 2026', año: 2026 },
];

const OPERACIONES = {
  SOUTHERN: { codigo: 'S', pasos: ['S1', 'S2'], color: '#27AE60', colorLight: '#A9DFBF' },
  HUDBAY:   { codigo: 'H', pasos: ['H1', 'H2', 'H3'], color: '#2980B9', colorLight: '#AED6F1' },
  HIERRO:   { codigo: 'A', pasos: ['A1', 'A2', 'A3'], color: '#F39C12', colorLight: '#F9E79F' },
};

const CODIGOS_ESTADO = {
  S1: { op: 'SOUTHERN', color: '#27AE60', label: 'Southern Día 1' },
  S2: { op: 'SOUTHERN', color: '#27AE60', label: 'Southern Día 2' },
  H1: { op: 'HUDBAY',   color: '#2980B9', label: 'Hudbay Día 1' },
  H2: { op: 'HUDBAY',   color: '#2980B9', label: 'Hudbay Día 2' },
  H3: { op: 'HUDBAY',   color: '#2980B9', label: 'Hudbay Día 3' },
  A1: { op: 'HIERRO',   color: '#F39C12', label: 'Hierro Día 1' },
  A2: { op: 'HIERRO',   color: '#F39C12', label: 'Hierro Día 2' },
  A3: { op: 'HIERRO',   color: '#F39C12', label: 'Hierro Día 3' },
  M:  { op: 'MANT',     color: '#E74C3C', label: 'Mantenimiento' },
  T:  { op: 'TALLER',   color: '#C0392B', label: 'Taller' },
  P:  { op: 'PARADA',   color: '#E67E22', label: 'Sin Conductor' },
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Generar datos de ejemplo para 3 meses (Enero, Febrero, Marzo)
function generarDatosEjemplo() {
  const data = {};
  const codigosRuta = ['S1','S2','H1','H2','H3','A1','A2','A3'];
  const codigosParada = ['M','T','P',''];
  
  const patrones = {
    0: [ // Enero
      ['S1','S2','S1','S2','H1','H2','H3','S1','S2','H1','H2','H3','S1','S2','','S1','S2','H1','H2','H3','S1','S2','H1','H2','H3','S1','S2','M','S1','S2','H1'],
      ['H1','H2','H3','H1','H2','H3','M','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','H1','H2','H3','P','P','H1','H2','H3','H1','H2','H3','S1','S2'],
      ['H1','H2','H3','T','H1','H2','H3','H1','H2','H3','H1','H2','H3','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','H1','H2','H3','P','P','P','H1'],
      ['H1','H2','M','M','H3','H1','H2','H3','S1','S2','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','H1','H2','H3','H1','H2','H3','P','H1','H2','H3'],
      ['A1','A2','A3','M','M','M','M','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','S1','S2'],
      ['A1','A2','A3','H1','H2','H3','H1','H2','H3','S1','S2','P','P','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','H1','H2','H3','H1','H2','H3','S1'],
    ],
    1: [ // Febrero
      ['S1','S2','S1','S2','T','H1','H2','H3','S1','S2','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','S1','S2','H1','H2','H3','H1','H2'],
      ['H1','H2','H3','M','H1','H2','H3','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','P','P','P','H1','H2','H3','H1','H2','H3','S1'],
      ['H1','H2','H3','T','H1','H2','H3','H1','H2','H3','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2'],
      ['H1','H2','M','M','S1','S2','H1','H2','H3','S1','S2','H1','H2','H3','H1','H2','H3','P','H1','H2','H3','S1','S2','H1','H2','H3','H1','H2'],
      ['A1','A2','A3','M','M','S1','S2','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','S1','S2'],
      ['A1','A2','A3','H1','H2','H3','S1','S2','H1','H2','H3','P','P','H1','H2','H3','S1','S2','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2'],
    ],
    2: [ // Marzo
      ['H1','H2','H3','S1','S2','H1','H2','H3','S1','S2','H1','H2','H3','S1','S2','','','H1','H2','H3','S1','S2','H1','H2','H3','S1','S2','H1','H2','H3','S1'],
      ['H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','P','P','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2'],
      ['S1','S2','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','H1','H2','H3','S1','S2','M','M','H1','H2','H3'],
      ['H1','H2','H3','S1','S2','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','P','P','H1','H2','H3','S1','S2'],
      ['M','M','H1','H2','H3','S1','S2','H1','H2','H3','S1','S2','H1','H2','H3','S1','S2','H1','H2','H3','S1','S2','H1','H2','H3','S1','S2','H1','H2','H3','S1'],
      ['H1','H2','H3','H1','H2','H3','S1','S2','H1','H2','H3','S1','S2','H1','H2','H3','S1','S2','H1','H2','H3','S1','S2','H1','H2','H3','T','T','H1','H2','H3'],
    ],
  };
  
  return patrones;
}

const DATOS_MENSUALES = generarDatosEjemplo();

// Funciones de cálculo
function contarVueltas(diasArray, operacion) {
  const ultimoPaso = OPERACIONES[operacion].pasos[OPERACIONES[operacion].pasos.length - 1];
  return diasArray.filter(d => d === ultimoPaso).length;
}

function contarDiasRuta(diasArray) {
  const codigosRuta = ['S1','S2','H1','H2','H3','A1','A2','A3'];
  return diasArray.filter(d => codigosRuta.includes(d)).length;
}

function contarDiasParados(diasArray) {
  return diasArray.filter(d => d === 'P').length;
}

function contarDiasMantenimiento(diasArray) {
  return diasArray.filter(d => d === 'M' || d === 'T').length;
}

function contarDiasSinAsignar(diasArray) {
  return diasArray.filter(d => d === '' || d === undefined).length;
}

// Calcular métricas por mes
function calcularMetricasMes(mesIndex) {
  if (!DATOS_MENSUALES[mesIndex]) return null;
  
  const metricas = {
    mes: MESES[mesIndex],
    mesIndex: mesIndex,
    unidades: [],
    totales: {
      vueltasHudbay: 0,
      vueltasSouthern: 0,
      vueltasHierro: 0,
      totalVueltas: 0,
      diasRuta: 0,
      diasParados: 0,
      diasMantenimiento: 0,
      diasSinAsignar: 0,
    }
  };
  
  UNIDADES.forEach((unidad, i) => {
    const dias = DATOS_MENSUALES[mesIndex][i] || [];
    const vueltasH = contarVueltas(dias, 'HUDBAY');
    const vueltasS = contarVueltas(dias, 'SOUTHERN');
    const vueltasA = contarVueltas(dias, 'HIERRO');
    
    const uMetricas = {
      ...unidad,
      dias: dias,
      vueltasHudbay: vueltasH,
      vueltasSouthern: vueltasS,
      vueltasHierro: vueltasA,
      totalVueltas: vueltasH + vueltasS + vueltasA,
      diasRuta: contarDiasRuta(dias),
      diasParados: contarDiasParados(dias),
      diasMantenimiento: contarDiasMantenimiento(dias),
      diasSinAsignar: contarDiasSinAsignar(dias),
    };
    uMetricas.operatividad = dias.length > 0 ? (uMetricas.diasRuta / dias.length * 100) : 0;
    
    metricas.unidades.push(uMetricas);
    metricas.totales.vueltasHudbay += vueltasH;
    metricas.totales.vueltasSouthern += vueltasS;
    metricas.totales.vueltasHierro += vueltasA;
    metricas.totales.totalVueltas += vueltasH + vueltasS + vueltasA;
    metricas.totales.diasRuta += uMetricas.diasRuta;
    metricas.totales.diasParados += uMetricas.diasParados;
    metricas.totales.diasMantenimiento += uMetricas.diasMantenimiento;
    metricas.totales.diasSinAsignar += uMetricas.diasSinAsignar;
  });
  
  const totalDias = metricas.totales.diasRuta + metricas.totales.diasParados + 
                    metricas.totales.diasMantenimiento + metricas.totales.diasSinAsignar;
  metricas.totales.operatividad = totalDias > 0 ? (metricas.totales.diasRuta / totalDias * 100) : 0;
  
  return metricas;
}

// Calcular métricas para todos los meses disponibles
function calcularTodasLasMetricas() {
  const todas = [];
  for (let i = 0; i < 12; i++) {
    const m = calcularMetricasMes(i);
    if (m) todas.push(m);
  }
  return todas;
}
