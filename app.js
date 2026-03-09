// ============================================================
// MISASI S.A.C. - App Main Logic (Live Google Sheets Connection)
// ============================================================

let currentPage = 'resumen';
let currentMonth = new Date().getMonth(); // Mes actual por defecto
let todasMetricas = [];

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initMonthSelector();

  // Mostrar estado de carga
  mostrarEstadoCarga('Conectando con Google Sheets...');

  // Cargar datos del Sheet
  const datos = await cargarDatosSheet();

  if (datos) {
    todasMetricas = calcularTodasLasMetricas();
    ocultarEstadoCarga();
    renderCurrentPage();

    // Auto-refrescar cada 5 minutos
    setInterval(async () => {
      await cargarDatosSheet();
      todasMetricas = calcularTodasLasMetricas();
      renderCurrentPage();
      actualizarTimestamp();
    }, 5 * 60 * 1000);

    actualizarTimestamp();
  } else {
    mostrarEstadoCarga('⚠️ Error conectando con Google Sheets. Verifica que el Sheet esté publicado.');
  }
});

function mostrarEstadoCarga(mensaje) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => {
    if (p.id === 'page-resumen') {
      p.classList.add('active');
      const kpiGrid = p.querySelector('.kpi-grid');
      if (kpiGrid) {
        kpiGrid.insertAdjacentHTML('beforebegin',
          `<div id="loading-indicator" class="card grid-full" style="text-align: center; padding: 40px;">
            <div style="font-size: 24px; margin-bottom: 12px;">⏳</div>
            <div style="font-size: 14px; color: var(--text-secondary);">${mensaje}</div>
          </div>`
        );
      }
    }
  });
}

function ocultarEstadoCarga() {
  const loading = document.getElementById('loading-indicator');
  if (loading) loading.remove();
}

function actualizarTimestamp() {
  const badge = document.querySelector('.live-badge');
  if (badge) {
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    badge.innerHTML = `<span class="live-dot"></span> ACTUALIZADO ${hora}`;
  }
}

// ==================== NAVIGATION ====================

function initNavigation() {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateTo(page);
    });
  });
}

function navigateTo(page) {
  currentPage = page;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Update page visibility
  document.querySelectorAll('.page').forEach(p => {
    p.classList.toggle('active', p.id === `page-${page}`);
  });

  // Update top bar title
  const titles = {
    resumen: { title: 'Resumen General', subtitle: 'Vista general del estado de la flota' },
    seguimiento: { title: 'Seguimiento Diario', subtitle: 'Estado diario de cada unidad' },
    metricas: { title: 'Métricas y Vueltas', subtitle: 'Análisis de rendimiento y comparativas' },
    paradas: { title: 'Análisis de Paradas', subtitle: 'Detalle de paradas y productividad' },
  };

  const t = titles[page] || titles.resumen;
  document.getElementById('page-title').textContent = t.title;
  document.getElementById('page-subtitle').textContent = t.subtitle;

  renderCurrentPage();
}

// ==================== MONTH SELECTOR ====================

function initMonthSelector() {
  const select = document.getElementById('month-select');
  if (!select) return;

  // Seleccionar el mes actual
  select.value = currentMonth;

  select.addEventListener('change', (e) => {
    currentMonth = parseInt(e.target.value);
    renderCurrentPage();
  });
}

function getMetricasActuales() {
  return calcularMetricasMes(currentMonth);
}

// ==================== RENDER PAGES ====================

function renderCurrentPage() {
  const metricas = getMetricasActuales();
  if (!metricas || metricas.unidades.length === 0) return;

  switch (currentPage) {
    case 'resumen':
      renderResumen(metricas);
      break;
    case 'seguimiento':
      renderSeguimiento(metricas);
      break;
    case 'metricas':
      renderMetricas(metricas);
      break;
    case 'paradas':
      renderParadas(metricas);
      break;
  }
}

// ==================== PAGE 1: RESUMEN GENERAL ====================

function renderResumen(metricas) {
  // KPIs
  document.getElementById('kpi-total-vueltas').textContent = metricas.totales.totalVueltas;
  document.getElementById('kpi-dias-ruta').textContent = metricas.totales.diasRuta;
  document.getElementById('kpi-dias-parados').textContent = metricas.totales.diasParados + metricas.totales.diasSinAsignar;
  document.getElementById('kpi-dias-mant').textContent = metricas.totales.diasMantenimiento;
  document.getElementById('kpi-operatividad').textContent = metricas.totales.operatividad.toFixed(1) + '%';
  document.getElementById('kpi-unidades').textContent = metricas.unidades.length;

  // Detalles KPIs
  document.getElementById('kpi-detail-hudbay').textContent = `HUDBAY: ${metricas.totales.vueltasHudbay}`;
  document.getElementById('kpi-detail-southern').textContent = `SOUTHERN: ${metricas.totales.vueltasSouthern}`;
  document.getElementById('kpi-detail-hierro').textContent = `HIERRO: ${metricas.totales.vueltasHierro}`;

  // Charts
  setTimeout(() => {
    renderDonutEstados('chart-donut-resumen', metricas);
    renderBarrasVueltas('chart-barras-resumen', metricas);
    resizeAllCharts();
  }, 500);

  // Fleet status cards
  renderFleetStatus(metricas);
}

function renderFleetStatus(metricas) {
  const container = document.getElementById('fleet-status-container');
  if (!container) return;

  container.innerHTML = metricas.unidades.map(u => `
    <div class="fleet-unit-card">
      <div class="fleet-unit-header">
        <div>
          <div class="fleet-unit-name">${u.tracto}</div>
          <div class="fleet-unit-empresa">${u.empresa}</div>
        </div>
        <span class="badge ${u.operatividad >= 70 ? 'badge-green' : u.operatividad >= 50 ? 'badge-yellow' : 'badge-red'}">
          ${u.operatividad.toFixed(0)}% Op.
        </span>
      </div>
      <div class="fleet-unit-stats">
        <div class="fleet-unit-stat">
          <div class="fleet-unit-stat-value text-blue">${u.totalVueltas}</div>
          <div class="fleet-unit-stat-label">Vueltas</div>
        </div>
        <div class="fleet-unit-stat">
          <div class="fleet-unit-stat-value text-green">${u.diasRuta}</div>
          <div class="fleet-unit-stat-label">Días Ruta</div>
        </div>
        <div class="fleet-unit-stat">
          <div class="fleet-unit-stat-value text-yellow">${u.diasParados}</div>
          <div class="fleet-unit-stat-label">Parados</div>
        </div>
        <div class="fleet-unit-stat">
          <div class="fleet-unit-stat-value text-red">${u.diasMantenimiento}</div>
          <div class="fleet-unit-stat-label">Mantenim.</div>
        </div>
      </div>
      <div style="margin-top: 12px;">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${u.operatividad}%"></div>
        </div>
      </div>
    </div>
  `).join('');
}

// ==================== PAGE 2: SEGUIMIENTO DIARIO ====================

function renderSeguimiento(metricas) {
  const container = document.getElementById('tracking-grid-body');
  if (!container) return;

  const diasEnMes = metricas.diasEnMes;

  // Render header
  const headerRow = document.getElementById('tracking-grid-header');
  let headerHTML = `
    <th class="col-fixed">N°</th>
    <th class="col-fixed">Empresa</th>
    <th class="col-fixed">Tracto</th>
  `;
  for (let d = 1; d <= diasEnMes; d++) {
    const fecha = new Date(AÑO, currentMonth, d);
    const diaSemana = ['D', 'L', 'M', 'X', 'J', 'V', 'S'][fecha.getDay()];
    const esFinDeSemana = fecha.getDay() === 0 || fecha.getDay() === 6;
    headerHTML += `<th style="${esFinDeSemana ? 'color: var(--accent-yellow);' : ''}">${d}<br><span style="font-size:8px">${diaSemana}</span></th>`;
  }
  headerRow.innerHTML = headerHTML;

  // Render body
  container.innerHTML = metricas.unidades.map(u => {
    let row = `
      <td class="col-fixed">${u.id}</td>
      <td class="col-fixed">${u.empresa}</td>
      <td class="col-fixed">${u.tracto}</td>
    `;
    for (let d = 0; d < diasEnMes; d++) {
      const code = u.dias[d] || '';
      row += `<td><span class="day-cell" data-code="${code}" title="Día ${d + 1}: ${code || 'Sin asignar'}">${code}</span></td>`;
    }
    return `<tr>${row}</tr>`;
  }).join('');

  // Update summary table
  renderSeguimientoResumen(metricas);
}

function renderSeguimientoResumen(metricas) {
  const container = document.getElementById('seguimiento-resumen-body');
  if (!container) return;

  container.innerHTML = metricas.unidades.map(u => `
    <tr>
      <td class="font-bold">${u.tracto}</td>
      <td class="text-center text-blue font-bold">${u.vueltasHudbay}</td>
      <td class="text-center text-green font-bold">${u.vueltasSouthern}</td>
      <td class="text-center text-yellow font-bold">${u.vueltasHierro}</td>
      <td class="text-center font-bold">${u.totalVueltas}</td>
      <td class="text-center">${u.diasRuta}</td>
      <td class="text-center">${u.diasParados}</td>
      <td class="text-center">${u.diasMantenimiento}</td>
      <td class="text-center">
        <span class="badge ${u.operatividad >= 70 ? 'badge-green' : u.operatividad >= 50 ? 'badge-yellow' : 'badge-red'}">
          ${u.operatividad.toFixed(1)}%
        </span>
      </td>
    </tr>
  `).join('');

  // Totals row
  const totalsRow = document.getElementById('seguimiento-resumen-totals');
  if (totalsRow) {
    totalsRow.innerHTML = `
      <td class="font-bold">TOTAL</td>
      <td class="text-center text-blue font-bold">${metricas.totales.vueltasHudbay}</td>
      <td class="text-center text-green font-bold">${metricas.totales.vueltasSouthern}</td>
      <td class="text-center text-yellow font-bold">${metricas.totales.vueltasHierro}</td>
      <td class="text-center font-bold">${metricas.totales.totalVueltas}</td>
      <td class="text-center">${metricas.totales.diasRuta}</td>
      <td class="text-center">${metricas.totales.diasParados}</td>
      <td class="text-center">${metricas.totales.diasMantenimiento}</td>
      <td class="text-center">
        <span class="badge badge-blue">${metricas.totales.operatividad.toFixed(1)}%</span>
      </td>
    `;
  }
}

// ==================== PAGE 3: METRICAS Y VUELTAS ====================

function renderMetricas(metricas) {
  // Monthly comparison cards
  renderMonthComparison();

  // Charts
  setTimeout(() => {
    renderComparativaMensual('chart-comparativa-mensual', todasMetricas);
    renderTendenciaMensual('chart-tendencia-mensual', todasMetricas);
    renderBarrasVueltas('chart-vueltas-metricas', metricas);
    renderRadarUnidad('chart-radar-unidades', metricas);
    resizeAllCharts();
  }, 500);
}

function renderMonthComparison() {
  const container = document.getElementById('month-comparison-container');
  if (!container) return;

  container.innerHTML = todasMetricas.map((m, i) => `
    <div class="month-comp-card ${i === currentMonth ? 'active-month' : ''}" onclick="changeMonth(${m.mesIndex})">
      <div class="month-comp-name">${m.mes.substring(0, 3)}</div>
      <div class="month-comp-value">${m.totales.totalVueltas}</div>
      <div class="month-comp-label">vueltas</div>
    </div>
  `).join('');
}

function changeMonth(mesIndex) {
  currentMonth = mesIndex;
  document.getElementById('month-select').value = mesIndex;
  renderCurrentPage();
}

// ==================== PAGE 4: ANÁLISIS DE PARADAS ====================

function renderParadas(metricas) {
  // Summary KPIs
  const totalDias = metricas.totales.diasRuta + metricas.totales.diasParados +
    metricas.totales.diasMantenimiento + metricas.totales.diasSinAsignar;

  document.getElementById('paradas-total-parados').textContent = metricas.totales.diasParados;
  document.getElementById('paradas-total-mant').textContent = metricas.totales.diasMantenimiento;
  document.getElementById('paradas-total-sinasignar').textContent = metricas.totales.diasSinAsignar;
  document.getElementById('paradas-pct-inactivo').textContent =
    totalDias > 0 ? ((metricas.totales.diasParados + metricas.totales.diasMantenimiento + metricas.totales.diasSinAsignar) / totalDias * 100).toFixed(1) + '%' : '0%';

  // Detail table
  const container = document.getElementById('paradas-detail-body');
  if (container) {
    container.innerHTML = metricas.unidades.map(u => {
      const totalDiasU = u.diasRuta + u.diasParados + u.diasMantenimiento + u.diasSinAsignar;
      const pctInactivo = totalDiasU > 0 ? ((u.diasParados + u.diasMantenimiento + u.diasSinAsignar) / totalDiasU * 100) : 0;

      return `
        <tr>
          <td class="font-bold">${u.tracto}</td>
          <td class="text-center">${u.empresa}</td>
          <td class="text-center text-green font-bold">${u.diasRuta}</td>
          <td class="text-center text-yellow font-bold">${u.diasParados}</td>
          <td class="text-center text-red font-bold">${u.diasMantenimiento}</td>
          <td class="text-center">${u.diasSinAsignar}</td>
          <td class="text-center font-bold">${totalDiasU}</td>
          <td class="text-center">
            <span class="badge ${pctInactivo <= 10 ? 'badge-green' : pctInactivo <= 25 ? 'badge-yellow' : 'badge-red'}">
              ${pctInactivo.toFixed(1)}%
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Charts
  setTimeout(() => {
    renderBarrasApiladas('chart-apiladas-paradas', metricas);
    renderOperatividad('chart-operatividad-paradas', metricas);
    renderDonutEstados('chart-donut-paradas', metricas);
    resizeAllCharts();
  }, 500);
}

function resizeAllCharts() {
  setTimeout(() => {
    Object.values(chartInstances).forEach(chart => {
      if (chart && chart.resize) {
        chart.resize();
      }
    });
  }, 100);
}

// ==================== BOTÓN REFRESCAR ====================
async function refrescarDatos() {
  const badge = document.querySelector('.live-badge');
  if (badge) badge.innerHTML = '<span class="live-dot"></span> ACTUALIZANDO...';

  await cargarDatosSheet();
  todasMetricas = calcularTodasLasMetricas();
  renderCurrentPage();
  actualizarTimestamp();
}
