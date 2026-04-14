// ============================================================
// MISASI S.A.C. - Data Layer (Google Sheets Live Connection)
// ============================================================

// ===== CONFIGURACIÓN DE CONEXIÓN =====
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSIRGrrRi5UJE5Xyh54JiPn7Dpv4cRJ_sO85QUTPYLuNMxu62wLsESsXsiw4ATp2qqZ6psYEpXPpaGL/pub?output=csv';

const AÑO = 2026;
const COL_FIJAS = 3; // N°, UNIDAD, EMPRESA
const FILA_DATOS_INICIO = 5; // Fila 6 en Sheet = índice 5 (0-indexed)
const NUM_FILAS_UNIDADES = 20;

// Meses y sus días
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_POR_MES = MESES.map((_, i) => new Date(AÑO, i + 1, 0).getDate());

// Offset acumulado de cada mes (columna donde empieza cada mes en los datos)
const OFFSET_MES = [];
let acum = 0;
for (let i = 0; i < 12; i++) {
  OFFSET_MES.push(acum);
  acum += DIAS_POR_MES[i];
}

// ===== OPERACIONES Y CÓDIGOS =====
const OPERACIONES = {
  SOUTHERN: { codigos: ['S1', 'S2'], triggerVuelta: 'S2', color: '#27ae60' },
  HUDBAY:   { codigos: ['H1', 'H2', 'H3'], triggerVuelta: 'H2', color: '#2980b9' },
  HIERRO:   { codigos: ['A1', 'A2', 'A3'], triggerVuelta: 'A2', color: '#f39c12' },
};

const CODIGOS_RUTA = ['S1', 'S2', 'H1', 'H2', 'H3', 'A1', 'A2', 'A3'];
const CODIGOS_MANT = ['M', 'T'];
const CODIGOS_PARADO = ['P'];

// ===== ESTADO GLOBAL =====
let datosSheet = null;
let cargandoDatos = false;
let errorCarga = null;

// ===== FETCH DATOS DEL GOOGLE SHEET =====
async function cargarDatosSheet() {
  cargandoDatos = true;
  errorCarga = null;

  try {
    const response = await fetch(SHEET_CSV_URL + '&_t=' + Date.now()); // Cache bust
    if (!response.ok) throw new Error('Error HTTP: ' + response.status);

    const csvText = await response.text();
    datosSheet = parsearCSV(csvText);
    cargandoDatos = false;
    return datosSheet;
  } catch (error) {
    console.error('Error cargando datos del Sheet:', error);
    errorCarga = error.message;
    cargandoDatos = false;
    return null;
  }
}

// ===== PARSEAR CSV =====
function parsearCSV(csvText) {
  const filas = [];
  let fila = [];
  let celda = '';
  let dentroComillas = false;

  for (let i = 0; i < csvText.length; i++) {
    const c = csvText[i];
    const next = csvText[i + 1];

    if (dentroComillas) {
      if (c === '"' && next === '"') {
        celda += '"';
        i++; // saltar siguiente comilla
      } else if (c === '"') {
        dentroComillas = false;
      } else {
        celda += c;
      }
    } else {
      if (c === '"') {
        dentroComillas = true;
      } else if (c === ',') {
        fila.push(celda.trim());
        celda = '';
      } else if (c === '\n' || (c === '\r' && next === '\n')) {
        fila.push(celda.trim());
        filas.push(fila);
        fila = [];
        celda = '';
        if (c === '\r') i++; // saltar \n
      } else {
        celda += c;
      }
    }
  }

  // Última fila
  if (celda || fila.length > 0) {
    fila.push(celda.trim());
    filas.push(fila);
  }

  return filas;
}

// ===== EXTRAER UNIDADES DEL SHEET =====
function extraerUnidades() {
  if (!datosSheet) return [];

  const unidades = [];

  for (let i = 0; i < NUM_FILAS_UNIDADES; i++) {
    const filaIdx = FILA_DATOS_INICIO + i;
    if (filaIdx >= datosSheet.length) break;

    const fila = datosSheet[filaIdx];
    const numero = fila[0] || '';
    const unidad = fila[1] || '';
    const empresa = fila[2] || '';

    // Solo incluir filas con datos de unidad
    if (!unidad && !empresa) continue;

    // Extraer todos los códigos diarios (365 columnas)
    const diasAnuales = [];
    for (let d = 0; d < acum; d++) {
      const colIdx = COL_FIJAS + d;
      const codigo = (fila[colIdx] || '').toUpperCase().trim();
      diasAnuales.push(codigo);
    }

    unidades.push({
      id: parseInt(numero) || (i + 1),
      tracto: unidad,
      empresa: empresa,
      diasAnuales: diasAnuales,
    });
  }

  return unidades;
}

// ===== CALCULAR MÉTRICAS POR MES =====
function calcularMetricasMes(mesIndex) {
  const unidades = extraerUnidades();
  if (unidades.length === 0) return null;

  const diasEnMes = DIAS_POR_MES[mesIndex];
  const offsetMes = OFFSET_MES[mesIndex];

  const resultados = unidades.map(u => {
    // Extraer los días de este mes
    const diasMes = u.diasAnuales.slice(offsetMes, offsetMes + diasEnMes);

    // Contar vueltas por operación
    const vueltas = contarVueltas(diasMes);

    // Contar tipos de días
    let diasRuta = 0, diasParados = 0, diasMant = 0, diasSinAsignar = 0;
    diasMes.forEach(code => {
      if (CODIGOS_RUTA.includes(code)) diasRuta++;
      else if (CODIGOS_MANT.includes(code)) diasMant++;
      else if (CODIGOS_PARADO.includes(code)) diasParados++;
      else diasSinAsignar++;
    });

    const totalDias = diasEnMes;
    const operatividad = totalDias > 0 ? (diasRuta / totalDias * 100) : 0;

    return {
      id: u.id,
      tracto: u.tracto,
      empresa: u.empresa,
      dias: diasMes,
      vueltasHudbay: vueltas.HUDBAY,
      vueltasSouthern: vueltas.SOUTHERN,
      vueltasHierro: vueltas.HIERRO,
      totalVueltas: vueltas.HUDBAY + vueltas.SOUTHERN + vueltas.HIERRO,
      diasRuta,
      diasParados,
      diasMantenimiento: diasMant,
      diasSinAsignar,
      operatividad,
    };
  });

  // Totales
  const totales = {
    vueltasHudbay: resultados.reduce((s, u) => s + u.vueltasHudbay, 0),
    vueltasSouthern: resultados.reduce((s, u) => s + u.vueltasSouthern, 0),
    vueltasHierro: resultados.reduce((s, u) => s + u.vueltasHierro, 0),
    totalVueltas: resultados.reduce((s, u) => s + u.totalVueltas, 0),
    diasRuta: resultados.reduce((s, u) => s + u.diasRuta, 0),
    diasParados: resultados.reduce((s, u) => s + u.diasParados, 0),
    diasMantenimiento: resultados.reduce((s, u) => s + u.diasMantenimiento, 0),
    diasSinAsignar: resultados.reduce((s, u) => s + u.diasSinAsignar, 0),
    operatividad: 0,
  };

  const totalDiasTodos = totales.diasRuta + totales.diasParados + totales.diasMantenimiento + totales.diasSinAsignar;
  totales.operatividad = totalDiasTodos > 0 ? (totales.diasRuta / totalDiasTodos * 100) : 0;

  return {
    mes: MESES[mesIndex],
    mesIndex: mesIndex,
    diasEnMes: diasEnMes,
    unidades: resultados,
    totales: totales,
  };
}

// ===== CONTAR VUELTAS =====
// Regla de negocio:
//   HUDBAY   → se contabiliza UNA vuelta cada vez que aparece H2 en el mes
//   SOUTHERN → se contabiliza UNA vuelta cada vez que aparece S2 en el mes
//   HIERRO   → se contabiliza UNA vuelta cada vez que aparece A2 en el mes
//
// H1/H3, S1, A1/A3 son días de tránsito de la misma vuelta;
// el "punto de conteo" es siempre el código intermedio/final de llegada.
function contarVueltas(diasMes) {
  const vueltas = { SOUTHERN: 0, HUDBAY: 0, HIERRO: 0 };

  for (const code of diasMes) {
    if (code === 'H2') vueltas.HUDBAY++;
    if (code === 'S2') vueltas.SOUTHERN++;
    if (code === 'A2') vueltas.HIERRO++;
  }

  return vueltas;
}

// ===== CALCULAR TODAS LAS MÉTRICAS (12 meses) =====
function calcularTodasLasMetricas() {
  const todas = [];
  for (let m = 0; m < 12; m++) {
    const metricas = calcularMetricasMes(m);
    if (metricas) todas.push(metricas);
  }
  return todas;
}
