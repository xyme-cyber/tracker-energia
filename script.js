// ==========================================
// TRACKER DE ENERGÍA Y HÁBITOS - LÓGICA COMPLETA
// ==========================================

// Estado global guardado en localStorage
let metas = JSON.parse(localStorage.getItem('metas_tracker')) || [];
let historial = JSON.parse(localStorage.getItem('historial_tracker')) || {}; // Estructura: { "YYYY-MM-DD": { ... } }

// Control de fecha actual en la vista del calendario
let fechaNavegacion = new Date();

document.addEventListener('DOMContentLoaded', () => {
  inicializarApp();
});

function inicializarApp() {
  renderizarCalendario();
  renderizarMetas();
  conectarBotonesInterfaz();
}

// ------------------------------------------
// 1. NAVEGACIÓN Y RENDERIZADO DEL CALENDARIO
// ------------------------------------------

function renderizarCalendario() {
  const año = fechaNavegacion.getFullYear();
  const mes = fechaNavegacion.getMonth();

  // Nombres de meses en español
  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Actualizar título de mes y año
  const elementoTitulo = document.querySelector('.card h2, .card h3, .card h1') || document.evaluate("//*[contains(text(), '202')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  
  // Buscar encabezado principal de la tarjeta de calendario
  const tituloMes = document.getElementById('titulo-mes') || document.querySelector('.card:nth-child(2) h2') || document.querySelector('h2');
  if (tituloMes) {
    tituloMes.textContent = `${nombresMeses[mes]} de ${año}`;
  }

  // Obtener primer día de la semana y total de días del mes
  // Note: getDay() -> 0: Dom, 1: Lun, 2: Mar, 3: Mié, 4: Jue, 5: Vie, 6: Sáb
  const primerDiaSemana = new Date(año, mes, 1).getDay();
  const totalDiasMes = new Date(año, mes + 1, 0).getDate();

  // Buscar o crear cuadrícula de días
  let grid = document.getElementById('grid-calendario');
  if (!grid) {
    const cardCalendario = document.querySelector('.card:nth-child(2)') || document.body;
    let divGrid = cardCalendario.querySelector('.dias-grid');
    if (!divGrid) {
      divGrid = document.createElement('div');
      divGrid.id = 'grid-calendario';
      divGrid.style.display = 'grid';
      divGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
      divGrid.style.gap = '8px';
      divGrid.style.marginTop = '15px';
      divGrid.style.textAlign = 'center';
      cardCalendario.appendChild(divGrid);
    }
    grid = divGrid;
  }

  grid.innerHTML = '';

  // Espacios en blanco para alinear el primer día de la semana
  for (let i = 0; i < primerDiaSemana; i++) {
    const vacio = document.createElement('div');
    vacio.className = 'dia-vacio';
    grid.appendChild(vacio);
  }

  // Dibujar días del mes
  for (let d = 1; d <= totalDiasMes; d++) {
    const fechaClave = `${año}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const reg = historial[fechaClave];

    const diaCard = document.createElement('div');
    diaCard.style.padding = '10px 4px';
    diaCard.style.borderRadius = '8px';
    diaCard.style.cursor = 'pointer';
    diaCard.style.minHeight = '65px';
    diaCard.style.display = 'flex';
    diaCard.style.flexDirection = 'column';
    diaCard.style.justifyContent = 'space-between';
    diaCard.style.fontSize = '0.85em';
    diaCard.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    diaCard.style.transition = 'all 0.2s ease';

    // Determinar color de fondo según nivel de energía o descanso
    let bg = '#f8f9fa';
    let colorTexto = '#333';
    let resumenText = '';

    if (reg) {
      if (reg.esDescanso) {
        bg = '#9e9e9e'; // Gris para descanso
        colorTexto = '#ffffff';
        resumenText = '100% Descanso';
      } else {
        if (reg.colorPredominante === 'intenso') bg = '#7e57c2'; // Morado / Intenso
        else if (reg.colorPredominante === 'intermedio') bg = '#42a5f5'; // Azul / Intermedio
        else if (reg.colorPredominante === 'ligero') bg = '#66bb6a'; // Verde / Ligero

        colorTexto = '#ffffff';

        // Mostrar desglose de porcentajes en la casilla del día
        let partes = [];
        if (reg.distribucion.intenso > 0) partes.push(`${reg.distribucion.intenso}% Int.`);
        if (reg.distribucion.intermedio > 0) partes.push(`${reg.distribucion.intermedio}% Intm.`);
        if (reg.distribucion.ligero > 0) partes.push(`${reg.distribucion.ligero}% Lig.`);
        resumenText = partes.join(' ');
      }
    }

    diaCard.style.backgroundColor = bg;
    diaCard.style.color = colorTexto;

    diaCard.innerHTML = `
      <div style="font-weight: bold; text-align: left; padding-left: 4px;">${d}</div>
      <div style="font-size: 0.72em; line-height: 1.1; margin-top: 4px;">${resumenText}</div>
    `;

    // Al hacer clic en cualquier día del calendario, abrir modal de registro para ese día
    diaCard.onclick = () => abrirModalRegistro(fechaClave, d);

    grid.appendChild(diaCard);
  }

  actualizarResumenMensual(año, mes);
}

// Botones de navegación de meses (< y >)
function mesAnterior() {
  fechaNavegacion.setMonth(fechaNavegacion.getMonth() - 1);
  renderizarCalendario();
}

function mesSiguiente() {
  fechaNavegacion.setMonth(fechaNavegacion.getMonth() + 1);
  renderizarCalendario();
}

// ------------------------------------------
// 2. GESTIÓN DE METAS (CLASIFICACIÓN)
// ------------------------------------------

function agregarMeta() {
  const input = document.querySelector('input[placeholder*="Ej. Taller"], input[type="text"]');
  const select = document.querySelector('select');

  if (!input || !input.value.trim()) {
    alert("Escribe una meta antes de agregar.");
    return;
  }

  const nuevaMeta = {
    id: Date.now(),
    texto: input.value.trim(),
    categoria: select ? select.value.toLowerCase() : 'intenso'
  };

  metas.push(nuevaMeta);
  localStorage.setItem('metas_tracker', JSON.stringify(metas));
  input.value = '';
  renderizarMetas();
}

function renderizarMetas() {
  let contenedor = document.getElementById('lista-metas-contenedor');
  
  if (!contenedor) {
    const cardMetas = document.querySelectorAll('.card')[document.querySelectorAll('.card').length - 1];
    if (cardMetas) {
      contenedor = cardMetas.querySelector('.lista-metas-render');
      if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.className = 'lista-metas-render';
        contenedor.style.marginTop = '15px';
        cardMetas.appendChild(contenedor);
      }
    }
  }

  if (!contenedor) return;

  if (metas.length === 0) {
    contenedor.innerHTML = '<p style="color: #888; font-size: 0.9em; margin-top: 10px;">No has registrado metas aún. Agrega tus actividades clasificadas arriba.</p>';
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">';
  metas.forEach(m => {
    let bgBadge = m.categoria === 'intenso' ? '#ede7f6' : (m.categoria === 'intermedio' ? '#e3f2fd' : '#e8f5e9');
    let colorBadge = m.categoria === 'intenso' ? '#512da8' : (m.categoria === 'intermedio' ? '#1976d2' : '#388e3c');

    html += `
      <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid #e0e0e0; padding: 10px 14px; border-radius: 8px;">
        <span style="font-weight: 500;">${m.texto}</span>
        <span style="background: ${bgBadge}; color: ${colorBadge}; font-size: 0.78em; padding: 3px 10px; border-radius: 12px; font-weight: bold; text-transform: uppercase;">${m.categoria}</span>
      </div>
    `;
  });
  html += '</div>';
  contenedor.innerHTML = html;
}

// ------------------------------------------
// 3. REGISTRO DIARIO (MODAL E INTERACCIÓN)
// ------------------------------------------

function abrirModalRegistro(fechaString = null, diaNumero = null) {
  // Si no se especifica fecha, se asume HOY
  const hoy = new Date();
  const fechaClave = fechaString || `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  const esDescanso = confirm(`¿El día ${fechaClave} fue día de DESCANSO (100%)?\n\n- Presiona ACEPTAR si fue Descanso.\n- Presiona CANCELAR si deseas registrar actividades realizadas.`);

  if (esDescanso) {
    historial[fechaClave] = {
      esDescanso: true,
      colorPredominante: 'descanso',
      totalActividades: 0,
      metasCompletadas: [],
      conteoPorCategoria: { ligero: 0, intermedio: 0, intenso: 0 },
      distribucion: { ligero: 0, intermedio: 0, intenso: 0 }
    };
    localStorage.setItem('historial_tracker', JSON.stringify(historial));
    renderizarCalendario();
    alert(`Día ${fechaClave} registrado como DESCANSO (100%).`);
    return;
  }

  if (metas.length === 0) {
    alert("Primero debes agregar metas en la sección 'Mis Metas' para poder marcarlas en el día.");
    return;
  }

  // Desplegar menú de metas para seleccionar
  let mensajePrompt = `REGISTRO DEL DÍA (${fechaClave})\n\nSelecciona las metas completadas introduciendo sus números separados por coma (ejemplo: 1, 3):\n\n`;
  metas.forEach((m, idx) => {
    mensajePrompt += `${idx + 1}. [${m.categoria.toUpperCase()}] ${m.texto}\n`;
  });

  let seleccion = prompt(mensajePrompt);
  if (seleccion === null) return; // Cancelado por el usuario

  let indices = seleccion.split(',')
    .map(n => parseInt(n.trim()) - 1)
    .filter(n => !isNaN(n) && metas[n]);

  if (indices.length === 0) {
    alert("No seleccionaste ninguna actividad válida.");
    return;
  }

  // Preguntar el Nivel de Energía Predominante del Día
  let nivelEnergia = prompt("¿Cuál fue tu nivel de energía PREDOMINANTE hoy?\nOpción: intenso, intermedio o ligero", "intenso");
  if (!nivelEnergia) nivelEnergia = "intenso";
  nivelEnergia = nivelEnergia.toLowerCase().trim();

  // Calcular conteo por categoría y porcentajes
  let conteo = { ligero: 0, intermedio: 0, intenso: 0 };
  let metasCompletadasNombres = [];

  indices.forEach(idx => {
    const meta = metas[idx];
    metasCompletadasNombres.push(meta.texto);
    if (conteo[meta.categoria] !== undefined) {
      conteo[meta.categoria]++;
    }
  });

  const totalRealizadas = indices.length;
  const valorPorTarea = 100 / totalRealizadas;

  const distribucionCalculada = {
    intenso: Math.round(conteo.intenso * valorPorTarea),
    intermedio: Math.round(conteo.intermedio * valorPorTarea),
    ligero: Math.round(conteo.ligero * valorPorTarea)
  };

  historial[fechaClave] = {
    esDescanso: false,
    colorPredominante: nivelEnergia,
    totalActividades: totalRealizadas,
    metasCompletadas: metasCompletadasNombres,
    conteoPorCategoria: conteo,
    distribucion: distribucionCalculada
  };

  localStorage.setItem('historial_tracker', JSON.stringify(historial));
  renderizarCalendario();

  alert(`¡Día ${fechaClave} guardado correctamente!\n\n` +
        `• Nivel del Día: ${nivelEnergia.toUpperCase()}\n` +
        `• Total de Actividades: ${totalRealizadas}\n` +
        `• Desglose Hoy:\n` +
        `  - Intenso: ${distribucionCalculada.intenso}%\n` +
        `  - Intermedio: ${distribucionCalculada.intermedio}%\n` +
        `  - Ligero: ${distribucionCalculada.ligero}%`);
}

// ------------------------------------------
// 4. CÁLCULO DE ACUMULADOS MENSUALES
// ------------------------------------------

function actualizarResumenMensual(año, mes) {
  let acumuladoActividades = { intenso: 0, intermedio: 0, ligero: 0, totalGeneral: 0 };
  let diasDescanso = 0;

  const prefijoMes = `${año}-${String(mes + 1).padStart(2, '0')}`;

  Object.keys(historial).forEach(fechaKey => {
    if (fechaKey.startsWith(prefijoMes)) {
      const reg = historial[fechaKey];
      if (reg.esDescanso) {
        diasDescanso++;
      } else if (reg.conteoPorCategoria) {
        acumuladoActividades.intenso += reg.conteoPorCategoria.intenso || 0;
        acumuladoActividades.intermedio += reg.conteoPorCategoria.intermedio || 0;
        acumuladoActividades.ligero += reg.conteoPorCategoria.ligero || 0;
        acumuladoActividades.totalGeneral += reg.totalActividades || 0;
      }
    }
  });

  // Calcular porcentaje mensual global
  let pctIntenso = 0, pctIntermedio = 0, pctLigero = 0;
  if (acumuladoActividades.totalGeneral > 0) {
    pctIntenso = Math.round((acumuladoActividades.intenso / acumuladoActividades.totalGeneral) * 100);
    pctIntermedio = Math.round((acumuladoActividades.intermedio / acumuladoActividades.totalGeneral) * 100);
    pctLigero = Math.round((acumuladoActividades.ligero / acumuladoActividades.totalGeneral) * 100);
  }

  // Buscar etiquetas de porcentaje en la franja superior y actualizarlas
  const spans = document.querySelectorAll('.card span, .card p, div');
  spans.forEach(el => {
    if (el.textContent.includes('Intenso:')) el.textContent = `Intenso: ${pctIntenso}%`;
    if (el.textContent.includes('Intermedio:')) el.textContent = `Intermedio: ${pctIntermedio}%`;
    if (el.textContent.includes('Ligero:')) el.textContent = `Ligero: ${pctLigero}%`;
    if (el.textContent.includes('Descanso:')) el.textContent = `Descanso: ${diasDescanso} días`;
  });
}

// ------------------------------------------
// 5. EVENTOS DE BOTONES DE LA INTERFAZ
// ------------------------------------------

function conectarBotonesInterfaz() {
  // Botones de navegación de mes (< y >)
  const botonesFlechas = document.querySelectorAll('.card:nth-child(2) button, button');
  botonesFlechas.forEach(btn => {
    if (btn.textContent.trim() === '<') btn.onclick = mesAnterior;
    if (btn.textContent.trim() === '>') btn.onclick = mesSiguiente;
    if (btn.textContent.includes('Agregar Meta')) btn.onclick = agregarMeta;
    if (btn.textContent.includes('Registrar Día')) btn.onclick = () => abrirModalRegistro();
  });
}
