// --- ESTADO GLOBAL Y MEMORIA LOCAL ---
let metas = JSON.parse(localStorage.getItem('tracker_metas')) || [];
let historial = JSON.parse(localStorage.getItem('tracker_historial')) || {}; // Estructura: { "YYYY-MM-DD": { ... } }

let fechaNavegacion = new Date();
let fechaSeleccionadaModal = null;
let nivelEnergiaModal = null;

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    inicializarEventos();
    renderizarMetas();
    renderizarCalendario();
});

// --- 1. CONFIGURACIÓN DE EVENTOS EN TU HTML ---
function inicializarEventos() {
    // Navegación de meses
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        fechaNavegacion.setMonth(fechaNavegacion.getMonth() - 1);
        renderizarCalendario();
    });

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        fechaNavegacion.setMonth(fechaNavegacion.getMonth() + 1);
        renderizarCalendario();
    });

    // Agregar nueva meta
    document.getElementById('addHabitBtn').addEventListener('click', agregarMeta);

    // Atajo "Registrar Día" (Hoy)
    document.getElementById('openTodayBtn').addEventListener('click', () => {
        const hoy = new Date();
        const fechaStr = formatearFecha(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
        abrirModal(fechaStr);
    });

    // Cerrar modal
    document.getElementById('closeModalBtn').addEventListener('click', cerrarModal);

    // Botones de selección de energía en el Modal
    const energyBtns = document.querySelectorAll('.energy-btn');
    energyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            energyBtns.forEach(b => b.classList.remove('selected', 'active'));
            btn.classList.add('selected', 'active');
            nivelEnergiaModal = btn.getAttribute('data-energy');
            actualizarListaMetasModal();
        });
    });

    // Guardar Día desde Modal
    document.getElementById('saveDayBtn').addEventListener('click', guardarDiaDesdeModal);
}

// --- 2. GESTIÓN DE METAS ---
function agregarMeta() {
    const input = document.getElementById('newHabitText');
    const select = document.getElementById('newHabitEnergy');
    const texto = input.value.trim();

    if (!texto) {
        alert('Por favor escribe una meta.');
        return;
    }

    const nuevaMeta = {
        id: Date.now().toString(),
        texto: texto,
        categoria: select.value.toLowerCase() // 'intenso', 'intermedio', 'ligero'
    };

    metas.push(nuevaMeta);
    localStorage.setItem('tracker_metas', JSON.stringify(metas));
    input.value = '';
    renderizarMetas();
}

function renderizarMetas() {
    const contenedor = document.getElementById('customHabitsContainer');
    if (!contenedor) return;

    if (metas.length === 0) {
        contenedor.innerHTML = '<p style="color: #888; font-size: 0.85em; margin-top: 10px;">No has agregado metas. Registra tus actividades arriba.</p>';
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">';
    metas.forEach(m => {
        let badgeClass = m.categoria;
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 8px 12px; border-radius: 8px; border: 1px solid #eee;">
                <span>${m.texto}</span>
                <span class="badge ${badgeClass}" style="text-transform: uppercase; font-size: 0.75em; padding: 2px 8px; border-radius: 10px;">${m.categoria}</span>
            </div>
        `;
    });
    html += '</div>';
    contenedor.innerHTML = html;
}

// --- 3. RENDERIZADO DEL CALENDARIO Y PORCENTAJES MENSUALES ---
function renderizarCalendario() {
    const año = fechaNavegacion.getFullYear();
    const mes = fechaNavegacion.getMonth();

    const nombresMeses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    // Actualizar título de mes/año
    document.getElementById('currentMonthYear').textContent = `${nombresMeses[mes]} de ${año}`;

    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const primerDiaSemana = new Date(año, mes, 1).getDay(); // 0: Dom, 1: Lun...
    const totalDiasMes = new Date(año, mes + 1, 0).getDate();

    // Espacios vacíos para alinear el primer día de la semana
    for (let i = 0; i < primerDiaSemana; i++) {
        const vacio = document.createElement('div');
        vacio.className = 'day-cell empty';
        grid.appendChild(vacio);
    }

    // Dibujar días del mes
    for (let d = 1; d <= totalDiasMes; d++) {
        const fechaClave = formatearFecha(año, mes + 1, d);
        const reg = historial[fechaClave];

        const diaCell = document.createElement('div');
        diaCell.className = 'day-cell';
        diaCell.style.minHeight = '60px';
        diaCell.style.padding = '6px';
        diaCell.style.borderRadius = '8px';
        diaCell.style.cursor = 'pointer';
        diaCell.style.display = 'flex';
        diaCell.style.flexDirection = 'column';
        diaCell.style.justifyContent = 'space-between';
        diaCell.style.transition = 'transform 0.1s ease';

        let textoDesglose = '';
        let colorFondo = '#f9f9f9';
        let colorTexto = '#333';

        if (reg) {
            if (reg.esDescanso) {
                colorFondo = '#9e9e9e'; // Gris
                colorTexto = '#fff';
                textoDesglose = '100% Descanso';
            } else {
                if (reg.colorPredominante === 'intenso') colorFondo = '#9c27b0';
                else if (reg.colorPredominante === 'intermedio') colorFondo = '#2196f3';
                else if (reg.colorPredominante === 'ligero') colorFondo = '#4caf50';

                colorTexto = '#fff';

                let partes = [];
                if (reg.distribucion.intenso > 0) partes.push(`${reg.distribucion.intenso}% Int`);
                if (reg.distribucion.intermedio > 0) partes.push(`${reg.distribucion.intermedio}% Intm`);
                if (reg.distribucion.ligero > 0) partes.push(`${reg.distribucion.ligero}% Lig`);
                textoDesglose = partes.join('<br>');
            }
        }

        diaCell.style.backgroundColor = colorFondo;
        diaCell.style.color = colorTexto;

        diaCell.innerHTML = `
            <div style="font-weight: bold; font-size: 0.9em;">${d}</div>
            <div style="font-size: 0.68em; line-height: 1.1; margin-top: 2px;">${textoDesglose}</div>
        `;

        diaCell.onclick = () => abrirModal(fechaClave);
        grid.appendChild(diaCell);
    }

    actualizarResumenMensual(año, mes);
}

// --- 4. MODAL INTERACTIVO PARA REGISTRAR DÍAS ---
function abrirModal(fechaClave) {
    fechaSeleccionadaModal = fechaClave;
    document.getElementById('modalDateTitle').textContent = `Registro: ${fechaClave}`;
    
    // Cargar datos previos si existen
    const reg = historial[fechaClave];
    nivelEnergiaModal = reg ? reg.colorPredominante : null;

    // Resetear botones de energía
    const energyBtns = document.querySelectorAll('.energy-btn');
    energyBtns.forEach(btn => {
        btn.classList.remove('selected', 'active');
        if (reg && btn.getAttribute('data-energy') === reg.colorPredominante) {
            btn.classList.add('selected', 'active');
        }
    });

    document.getElementById('dayNotes').value = reg ? (reg.notas || '') : '';

    actualizarListaMetasModal();
    document.getElementById('dayModal').classList.remove('hidden');
}

function cerrarModal() {
    document.getElementById('dayModal').classList.add('hidden');
}

function actualizarListaMetasModal() {
    const contenedorHabits = document.getElementById('habitsList');
    const labelPorcentaje = document.getElementById('dailyPercentage');

    if (!nivelEnergiaModal) {
        contenedorHabits.innerHTML = '<p style="color: #888;">Selecciona un nivel de energía arriba.</p>';
        labelPorcentaje.textContent = '0%';
        return;
    }

    if (nivelEnergiaModal === 'descanso') {
        contenedorHabits.innerHTML = '<p style="color: #555; font-weight: bold;">¡Día configurado como DESCANSO (100%)! No se requieren actividades.</p>';
        labelPorcentaje.textContent = '100% Descanso';
        return;
    }

    if (metas.length === 0) {
        contenedorHabits.innerHTML = '<p style="color: #888;">No tienes metas agregadas aún. Cierra este cuadro y agrega metas en "Mis Metas".</p>';
        labelPorcentaje.textContent = '0%';
        return;
    }

    // Cargar metas previamente marcadas hoy
    const reg = historial[fechaSeleccionadaModal];
    const marcadasPrevias = (reg && reg.metasCompletadas) ? reg.metasCompletadas : [];

    // Muestra TODAS las metas (Intenso, Intermedio, Ligero) para poder elegirlas
    let html = '<div style="display: flex; flex-direction: column; gap: 6px; max-height: 180px; overflow-y: auto;">';
    metas.forEach(m => {
        const isChecked = marcadasPrevias.includes(m.id) ? 'checked' : '';
        html += `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9em; cursor: pointer; background: #f8f9fa; padding: 6px 10px; border-radius: 6px;">
                <input type="checkbox" class="modal-habit-check" data-id="${m.id}" data-category="${m.categoria}" ${isChecked} onchange="recalcularModalPorcentaje()">
                <span>${m.texto}</span>
                <span style="margin-left: auto; font-size: 0.75em; font-weight: bold; text-transform: uppercase;">(${m.categoria})</span>
            </label>
        `;
    });
    html += '</div>';
    contenedorHabits.innerHTML = html;

    recalcularModalPorcentaje();
}

function recalcularModalPorcentaje() {
    const checks = document.querySelectorAll('.modal-habit-check:checked');
    const labelPorcentaje = document.getElementById('dailyPercentage');

    if (nivelEnergiaModal === 'descanso') {
        labelPorcentaje.textContent = '100% Descanso';
        return;
    }

    const total = checks.length;
    if (total === 0) {
        labelPorcentaje.textContent = '0%';
        return;
    }

    let conteo = { ligero: 0, intermedio: 0, intenso: 0 };
    checks.forEach(chk => {
        const cat = chk.getAttribute('data-category');
        if (conteo[cat] !== undefined) conteo[cat]++;
    });

    const valorPorTarea = 100 / total;
    const pInt = Math.round(conteo.intenso * valorPorTarea);
    const pIntm = Math.round(conteo.intermedio * valorPorTarea);
    const pLig = Math.round(conteo.ligero * valorPorTarea);

    labelPorcentaje.textContent = `${pInt}% Int | ${pIntm}% Intm | ${pLig}% Lig`;
}

// Guardar los datos ingresados en el modal
function guardarDiaDesdeModal() {
    if (!nivelEnergiaModal) {
        alert('Por favor selecciona un nivel de energía.');
        return;
    }

    const notas = document.getElementById('dayNotes').value.trim();

    if (nivelEnergiaModal === 'descanso') {
        historial[fechaSeleccionadaModal] = {
            esDescanso: true,
            colorPredominante: 'descanso',
            totalActividades: 0,
            metasCompletadas: [],
            conteoPorCategoria: { ligero: 0, intermedio: 0, intenso: 0 },
            distribucion: { ligero: 0, intermedio: 0, ligero: 0 },
            notas: notas
        };
    } else {
        const checks = document.querySelectorAll('.modal-habit-check:checked');
        if (checks.length === 0) {
            alert('Por favor selecciona al menos una meta realizada o marca el día como Descanso.');
            return;
        }

        let idsCompletadas = [];
        let conteo = { ligero: 0, intermedio: 0, intenso: 0 };

        checks.forEach(chk => {
            const id = chk.getAttribute('data-id');
            const cat = chk.getAttribute('data-category');
            idsCompletadas.push(id);
            if (conteo[cat] !== undefined) conteo[cat]++;
        });

        const total = idsCompletadas.length;
        const valorPorTarea = 100 / total;

        const distribucion = {
            intenso: Math.round(conteo.intenso * valorPorTarea),
            intermedio: Math.round(conteo.intermedio * valorPorTarea),
            ligero: Math.round(conteo.ligero * valorPorTarea)
        };

        historial[fechaSeleccionadaModal] = {
            esDescanso: false,
            colorPredominante: nivelEnergiaModal,
            totalActividades: total,
            metasCompletadas: idsCompletadas,
            conteoPorCategoria: conteo,
            distribucion: distribucion,
            notas: notas
        };
    }

    localStorage.setItem('tracker_historial', JSON.stringify(historial));
    cerrarModal();
    renderizarCalendario();
}

// --- 5. RESUMEN ACUMULADO MENSUAL Y BARRAS DE PROGRESO ---
function actualizarResumenMensual(año, mes) {
    let acumulado = { intenso: 0, intermedio: 0, ligero: 0, total: 0 };
    let diasDescanso = 0;

    const prefijo = formatearFecha(año, mes + 1, 1).substring(0, 7); // "YYYY-MM"

    Object.keys(historial).forEach(fechaKey => {
        if (fechaKey.startsWith(prefijo)) {
            const reg = historial[fechaKey];
            if (reg.esDescanso) {
                diasDescanso++;
            } else if (reg.conteoPorCategoria) {
                acumulado.intenso += reg.conteoPorCategoria.intenso || 0;
                acumulado.intermedio += reg.conteoPorCategoria.intermedio || 0;
                acumulado.ligero += reg.conteoPorCategoria.ligero || 0;
                acumulado.total += reg.totalActividades || 0;
            }
        }
    });

    let pInt = 0, pIntm = 0, pLig = 0;
    if (acumulado.total > 0) {
        pInt = Math.round((acumulado.intenso / acumulado.total) * 100);
        pIntm = Math.round((acumulado.intermedio / acumulado.total) * 100);
        pLig = Math.round((acumulado.ligero / acumulado.total) * 100);
    }

    // Actualizar números en la leyenda del HTML
    document.getElementById('pctIntenso').textContent = pInt;
    document.getElementById('pctIntermedio').textContent = pIntm;
    document.getElementById('pctLigero').textContent = pLig;
    document.getElementById('pctDescanso').textContent = diasDescanso;

    // Actualizar las barras visuales en la parte superior
    document.getElementById('barIntenso').style.width = `${pInt}%`;
    document.getElementById('barIntermedio').style.width = `${pIntm}%`;
    document.getElementById('barLigero').style.width = `${pLig}%`;
    document.getElementById('barDescanso').style.width = `${diasDescanso * 5}%`; // Proporción visual para descansos
}

// Función auxiliar de fecha formato YYYY-MM-DD
function formatearFecha(año, mes, dia) {
    return `${año}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}
