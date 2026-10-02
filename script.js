// MEMORIA LOCAL Y ESTADO GLOBAL
let metas = JSON.parse(localStorage.getItem('tracker_metas')) || [];
let historial = JSON.parse(localStorage.getItem('tracker_historial')) || {};

let fechaNavegacion = new Date();
let fechaSeleccionadaModal = null;
let nivelEnergiaModal = null;

const temasMeses = {
    0: 'linear-gradient(135deg, #e0f7fa 0%, #ffffff 100%)',
    1: 'linear-gradient(135deg, #fce4ec 0%, #ffffff 100%)',
    2: 'linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%)',
    3: 'linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)',
    4: 'linear-gradient(135deg, #f3e5f5 0%, #ffffff 100%)',
    5: 'linear-gradient(135deg, #e1f5fe 0%, #ffffff 100%)',
    6: 'linear-gradient(135deg, #fffde7 0%, #ffffff 100%)',
    7: 'linear-gradient(135deg, #fbe9e7 0%, #ffffff 100%)',
    8: 'linear-gradient(135deg, #e8eaf6 0%, #ffffff 100%)',
    9: 'linear-gradient(135deg, #f3e5f5 0%, #ffffff 100%)',
    10: 'linear-gradient(135deg, #efebe9 0%, #ffffff 100%)',
    11: 'linear-gradient(135deg, #e0f2f1 0%, #ffffff 100%)'
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

    // Botón "Registrar Día" abre correctamente el Modal flotante con la fecha de hoy
    document.getElementById('openTodayBtn').addEventListener('click', () => {
        const hoy = new Date();
        const fechaStr = formatearFecha(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
        abrirModal(fechaStr);
    });

    document.getElementById('closeModalBtn').addEventListener('click', cerrarModal);

    const energyBtns = document.querySelectorAll('.energy-btn');
    energyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            energyBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            nivelEnergiaModal = btn.getAttribute('data-energy');
            actualizarListaMetasModal();
        });
    });

    document.getElementById('saveDayBtn').addEventListener('click', guardarDiaDesdeModal);
}

// METAS
function agregarMeta() {
    const input = document.getElementById('newHabitText');
    const select = document.getElementById('newHabitEnergy');
    const texto = input.value.trim();

    if (!texto) {
        alert('Escribe una meta primero.');
        return;
    }

    metas.push({
        id: Date.now().toString(),
        texto: texto,
        categoria: select.value.toLowerCase()
    });

    localStorage.setItem('tracker_metas', JSON.stringify(metas));
    input.value = '';
    renderizarMetas();
}

function renderizarMetas() {
    const contenedor = document.getElementById('customHabitsContainer');
    if (!contenedor) return;

    if (metas.length === 0) {
        contenedor.innerHTML = '<p class="subtitle">No has agregado metas todavía.</p>';
        return;
    }

    let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
    metas.forEach(m => {
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:8px 12px; border-radius:8px; border:1px solid #e2e8f0; font-size:0.9rem;">
                <span>${m.texto}</span>
                <span class="badge-tag" style="text-transform:uppercase;">${m.categoria}</span>
            </div>
        `;
    });
    html += '</div>';
    contenedor.innerHTML = html;
}

// CALENDARIO
function renderizarCalendario() {
    const año = fechaNavegacion.getFullYear();
    const mes = fechaNavegacion.getMonth();

    const nombresMeses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    document.getElementById('currentMonthYear').textContent = `${nombresMeses[mes]} de ${año}`;
    document.body.style.background = temasMeses[mes] || '#f4f5f9';

    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const primerDiaSemana = new Date(año, mes, 1).getDay();
    const totalDiasMes = new Date(año, mes + 1, 0).getDate();

    for (let i = 0; i < primerDiaSemana; i++) {
        const vacio = document.createElement('div');
        vacio.style.visibility = 'hidden';
        grid.appendChild(vacio);
    }

    for (let d = 1; d <= totalDiasMes; d++) {
        const fechaClave = formatearFecha(año, mes + 1, d);
        const reg = historial[fechaClave];

        const diaCell = document.createElement('div');
        diaCell.className = 'day-cell';

        let textoDesglose = '';

        if (reg) {
            if (reg.esDescanso) {
                diaCell.classList.add('descanso');
                textoDesglose = '100% Descanso';
            } else {
                diaCell.classList.add(reg.colorPredominante || 'intenso');
                let partes = [];
                if (reg.distribucion.intenso > 0) partes.push(`${reg.distribucion.intenso}% Int`);
                if (reg.distribucion.intermedio > 0) partes.push(`${reg.distribucion.intermedio}% Intm`);
                if (reg.distribucion.ligero > 0) partes.push(`${reg.distribucion.ligero}% Lig`);
                textoDesglose = partes.join('<br>');
            }
        }

        diaCell.innerHTML = `
            <div class="day-num">${d}</div>
            <div class="day-text">${textoDesglose}</div>
        `;

        diaCell.onclick = () => abrirModal(fechaClave);
        grid.appendChild(diaCell);
    }

    actualizarResumenMensual(año, mes);
}

// MODAL Y REGISTRO
function abrirModal(fechaClave) {
    fechaSeleccionadaModal = fechaClave;
    document.getElementById('modalDateTitle').textContent = `Registro: ${fechaClave}`;
    
    const reg = historial[fechaClave];
    nivelEnergiaModal = reg ? reg.colorPredominante : null;

    const energyBtns = document.querySelectorAll('.energy-btn');
    energyBtns.forEach(btn => {
        btn.classList.remove('selected');
        if (reg && btn.getAttribute('data-energy') === reg.colorPredominante) {
            btn.classList.add('selected');
        }
    });

    document.getElementById('dayNotes').value = reg ? (reg.notas || '') : '';
    actualizarListaMetasModal();

    // Muestra la ventana flotante en el centro de la pantalla
    document.getElementById('dayModal').classList.remove('hidden');
}

function cerrarModal() {
    document.getElementById('dayModal').classList.add('hidden');
}

function actualizarListaMetasModal() {
    const contenedorHabits = document.getElementById('habitsList');
    const labelPorcentaje = document.getElementById('dailyPercentage');

    if (!nivelEnergiaModal) {
        contenedorHabits.innerHTML = '<p class="subtitle">Selecciona tu nivel de energía arriba.</p>';
        labelPorcentaje.textContent = '(0%)';
        return;
    }

    if (nivelEnergiaModal === 'descanso') {
        contenedorHabits.innerHTML = '<p style="font-weight:bold; color:var(--text-secondary);">Día configurado como Descanso (100%).</p>';
        labelPorcentaje.textContent = '100% Descanso';
        return;
    }

    if (metas.length === 0) {
        contenedorHabits.innerHTML = '<p class="subtitle">Agrega metas primero en la sección de abajo.</p>';
        labelPorcentaje.textContent = '(0%)';
        return;
    }

    const reg = historial[fechaSeleccionadaModal];
    const marcadasPrevias = (reg && reg.metasCompletadas) ? reg.metasCompletadas : [];

    let html = '';
    metas.forEach(m => {
        const isChecked = marcadasPrevias.includes(m.id) ? 'checked' : '';
        html += `
            <label style="display:flex; align-items:center; gap:8px; font-size:0.85rem; cursor:pointer;">
                <input type="checkbox" class="modal-habit-check" data-id="${m.id}" data-category="${m.categoria}" ${isChecked} onchange="recalcularModalPorcentaje()">
                <span>${m.texto}</span>
            </label>
        `;
    });
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
        labelPorcentaje.textContent = '(0%)';
        return;
    }

    let conteo = { ligero: 0, intermedio: 0, intenso: 0 };
    checks.forEach(chk => {
        const cat = chk.getAttribute('data-category');
        if (conteo[cat] !== undefined) conteo[cat]++;
    });

    const valor = 100 / total;
    const pInt = Math.round(conteo.intenso * valor);
    const pIntm = Math.round(conteo.intermedio * valor);
    const pLig = Math.round(conteo.ligero * valor);

    labelPorcentaje.textContent = `${pInt}% Int | ${pIntm}% Intm | ${pLig}% Lig`;
}

function guardarDiaDesdeModal() {
    if (!nivelEnergiaModal) {
        alert('Selecciona un nivel de energía.');
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
            alert('Selecciona al menos una meta realizada o marca Descanso.');
            return;
        }

        let idsCompletadas = [];
        let conteo = { ligero: 0, intermedio: 0, intenso: 0 };

        checks.forEach(chk => {
            idsCompletadas.push(chk.getAttribute('data-id'));
            const cat = chk.getAttribute('data-category');
            if (conteo[cat] !== undefined) conteo[cat]++;
        });

        const total = idsCompletadas.length;
        const valor = 100 / total;

        historial[fechaSeleccionadaModal] = {
            esDescanso: false,
            colorPredominante: nivelEnergiaModal,
            totalActividades: total,
            metasCompletadas: idsCompletadas,
            conteoPorCategoria: conteo,
            distribucion: {
                intenso: Math.round(conteo.intenso * valor),
                intermedio: Math.round(conteo.intermedio * valor),
                ligero: Math.round(conteo.ligero * valor)
            },
            notas: notas
        };
    }

    localStorage.setItem('tracker_historial', JSON.stringify(historial));
    
    // Cierra modal
    cerrarModal();
    
    // Actualiza visualmente el calendario
    renderizarCalendario();

    // Muestra alerta de éxito flotante y mueve suavemente la pantalla al calendario
    mostrarToast();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function mostrarToast() {
    const toast = document.getElementById('toastNotification');
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

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
