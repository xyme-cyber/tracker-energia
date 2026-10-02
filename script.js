// --- ESTADO GLOBAL Y MEMORIA LOCAL ---
let metas = JSON.parse(localStorage.getItem('tracker_metas')) || [];
let historial = JSON.parse(localStorage.getItem('tracker_historial')) || {};

let fechaNavegacion = new Date();
let fechaSeleccionadaModal = null;
let nivelEnergiaModal = null;

// Temas de Fondo Sutiles por Mes (Estilo Google Calendar)
const temasMeses = {
    0: 'linear-gradient(135deg, #e0f7fa 0%, #ffffff 100%)', // Enero
    1: 'linear-gradient(135deg, #fce4ec 0%, #ffffff 100%)', // Febrero
    2: 'linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%)', // Marzo
    3: 'linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)', // Abril
    4: 'linear-gradient(135deg, #f3e5f5 0%, #ffffff 100%)', // Mayo
    5: 'linear-gradient(135deg, #e1f5fe 0%, #ffffff 100%)', // Junio
    6: 'linear-gradient(135deg, #fffde7 0%, #ffffff 100%)', // Julio
    7: 'linear-gradient(135deg, #fbe9e7 0%, #ffffff 100%)', // Agosto
    8: 'linear-gradient(135deg, #e8eaf6 0%, #ffffff 100%)', // Septiembre
    9: 'linear-gradient(135deg, #f3e5f5 0%, #ffffff 100%)', // Octubre
    10: 'linear-gradient(135deg, #efebe9 0%, #ffffff 100%)', // Noviembre
    11: 'linear-gradient(135deg, #e0f2f1 0%, #ffffff 100%)'  // Diciembre
};

document.addEventListener('DOMContentLoaded', () => {
    inicializarEventos();
    renderizarMetas();
    renderizarCalendario();
});

function inicializarEventos() {
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        fechaNavegacion.setMonth(fechaNavegacion.getMonth() - 1);
        renderizarCalendario();
    });

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        fechaNavegacion.setMonth(fechaNavegacion.getMonth() + 1);
        renderizarCalendario();
    });

    document.getElementById('addHabitBtn').addEventListener('click', agregarMeta);

    document.getElementById('openTodayBtn').addEventListener('click', () => {
        const hoy = new Date();
        const fechaStr = formatearFecha(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
        abrirModal(fechaStr);
    });

    document.getElementById('closeModalBtn').addEventListener('click', cerrarModal);

    const energyBtns = document.querySelectorAll('.energy-btn');
    energyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            energyBtns.forEach(b => b.classList.remove('selected', 'active'));
            btn.classList.add('selected', 'active');
            nivelEnergiaModal = btn.getAttribute('data-energy');
            actualizarListaMetasModal();
        });
    });

    document.getElementById('saveDayBtn').addEventListener('click', guardarDiaDesdeModal);
}

// GESTIÓN DE METAS
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
        categoria: select.value.toLowerCase()
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
        contenedor.innerHTML = '<p style="color: #888; font-size: 0.85em; margin-top: 10px;">No has agregado metas aún.</p>';
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">';
    metas.forEach(m => {
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 8px 12px; border-radius: 8px; border: 1px solid #eee;">
                <span>${m.texto}</span>
                <span class="badge ${m.categoria}" style="text-transform: uppercase; font-size: 0.75em; padding: 2px 8px; border-radius: 10px;">${m.categoria}</span>
            </div>
        `;
    });
    html += '</div>';
    contenedor.innerHTML = html;
}

// RENDERIZADO DEL CALENDARIO
function renderizarCalendario() {
    const año = fechaNavegacion.getFullYear();
    const mes = fechaNavegacion.getMonth();

    const nombresMeses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    document.getElementById('currentMonthYear').textContent = `${nombresMeses[mes]} de ${año}`;

    // Aplicar Fondo Sutil de Mes en la Aplicación
    document.body.style.background = temasMeses[mes] || '#f4f6f9';

    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    // Alineación exacta del primer día de la semana
    const primerDiaSemana = new Date(año, mes, 1).getDay(); // 0: Dom, 1: Lun, 2: Mar, 3: Mié, 4: Jue...
    const totalDiasMes = new Date(año, mes + 1, 0).getDate();

    // Rellenar espacios vacíos
    for (let i = 0; i < primerDiaSemana; i++) {
        const vacio = document.createElement('div');
        vacio.className = 'day-cell empty';
        vacio.style.visibility = 'hidden';
        grid.appendChild(vacio);
    }

    // Dibujar días del mes
    for (let d = 1; d <= totalDiasMes; d++) {
        const fechaClave = formatearFecha(año, mes + 1, d);
        const reg = historial[fechaClave];

        const diaCell = document.createElement('div');
        diaCell.className = 'day-cell';

        let textoDesglose = '';
        let claseColor = '';

        if (reg) {
            if (reg.esDescanso) {
                claseColor = 'descanso';
                textoDesglose = '100% Descanso';
            } else {
                claseColor = reg.colorPredominante || 'intenso';

                let partes = [];
                if (reg.distribucion.intenso > 0) partes.push(`${reg.distribucion.intenso}% Int`);
                if (reg.distribucion.intermedio > 0) partes.push(`${reg.distribucion.intermedio}% Intm`);
                if (reg.distribucion.ligero > 0) partes.push(`${reg.distribucion.ligero}% Lig`);
                textoDesglose = partes.join('<br>');
            }
            diaCell.classList.add(claseColor);
        }

        diaCell.innerHTML = `
            <div style="font-weight: bold; font-size: 0.85em; margin-bottom: 2px;">${d}</div>
            <div class="day-percent-text">${textoDesglose}</div>
        `;

        diaCell.onclick = () => abrirModal(fechaClave);
        grid.appendChild(diaCell);
    }

    actualizarResumenMensual(año, mes);
}

// MODAL INTERACTIVO
function abrirModal(fechaClave) {
    fechaSeleccionadaModal = fechaClave;
    document.getElementById('modalDateTitle').textContent = `Registro: ${fechaClave}`;
    
    const reg = historial[fechaClave];
    nivelEnergiaModal = reg ? reg.colorPredominante : null;

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
        contenedorHabits.innerHTML = '<p style="color: #555; font-weight: bold;">¡Día de DESCANSO (100%)!</p>';
        labelPorcentaje.textContent = '100% Descanso';
        return;
    }

    if (metas.length === 0) {
        contenedorHabits.innerHTML = '<p style="color: #888;">No tienes metas registradas. Agrega algunas abajo en "Mis Metas".</p>';
        labelPorcentaje.textContent = '0%';
        return;
    }

    const reg = historial[fechaSeleccionadaModal];
    const marcadasPrevias = (reg && reg.metasCompletadas) ? reg.metasCompletadas : [];

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
            alert('Selecciona al menos una meta realizada o marca el día como Descanso.');
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

// RESUMEN MENSUAL Y BARRAS SUPERIORES
function actualizarResumenMensual(año, mes) {
    let acumulado = { intenso: 0, intermedio: 0, ligero: 0, total: 0 };
    let diasDescanso = 0;

    const prefijo = formatearFecha(año, mes + 1, 1).substring(0, 7);

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

    document.getElementById('pctIntenso').textContent = pInt;
    document.getElementById('pctIntermedio').textContent = pIntm;
    document.getElementById('pctLigero').textContent = pLig;
    document.getElementById('pctDescanso').textContent = diasDescanso;

    document.getElementById('barIntenso').style.width = `${pInt}%`;
    document.getElementById('barIntermedio').style.width = `${pIntm}%`;
    document.getElementById('barLigero').style.width = `${pLig}%`;
    document.getElementById('barDescanso').style.width = `${diasDescanso * 5}%`;
}

function formatearFecha(año, mes, dia) {
    return `${año}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}
