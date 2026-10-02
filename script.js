// --- TRACKER DE ENERGÍA Y HÁBITOS ---

// Estado inicial guardado en el navegador
let metas = JSON.parse(localStorage.getItem('metas_tracker')) || [];
let historial = JSON.parse(localStorage.getItem('historial_tracker')) || [];

document.addEventListener('DOMContentLoaded', () => {
  renderizarMetas();
  renderizarCalendario();
});

// Guardar nueva meta desde el formulario de la página
function agregarMeta() {
  const input = document.querySelector('input[placeholder*="Ej. Taller"]');
  const select = document.querySelector('select');
  
  if (!input || !input.value.trim()) {
    alert("Por favor escribe una meta.");
    return;
  }

  const nuevaMeta = {
    id: Date.now(),
    texto: input.value.trim(),
    categoria: select.value.toLowerCase() // 'intenso', 'intermedio', 'ligero'
  };

  metas.push(nuevaMeta);
  localStorage.setItem('metas_tracker', JSON.stringify(metas));
  input.value = '';
  renderizarMetas();
}

// Renderizar la lista de metas en pantalla por categorías
function renderizarMetas() {
  const contenedor = document.getElementById('lista-metas') || document.querySelector('.card:last-child');
  // Si no existe un contenedor específico, aseguramos que cargue
  const tituloCargando = document.querySelector('h2, h3, .card h1');
}

// Renderizar Calendario y Mes Actual
function renderizarCalendario() {
  const ahora = new Date();
  const opciones = { month: 'long', year: 'numeric' };
  const mesAño = ahora.toLocaleDateString('es-ES', opciones);
  
  // Reemplazar texto "Cargando..." por el mes actual
  const elementoCargando = document.evaluate("//*[contains(text(), 'Cargando...')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  if (elementoCargando) {
    elementoCargando.textContent = mesAño.charAt(0).toUpperCase() + mesAño.slice(1);
  }

  calcularResumenMensual();
}

// --- NUEVA LÓGICA DE REGISTRO DIARIO Y PORCENTAJES ---

function guardarRegistro() {
  const nivelEnergiaPredominante = document.getElementById('energy-level')?.value || 'intenso';
  
  // Obtener todas las metas seleccionadas hoy
  const casillasMarcadas = document.querySelectorAll('#tracker-form input[type="checkbox"]:checked, .habit-checkbox:checked');
  const totalActividadesRealizadas = casillasMarcadas.length;

  if (totalActividadesRealizadas === 0) {
    alert("Por favor, selecciona al menos una actividad realizada hoy.");
    return;
  }

  let conteoPorCategoria = {
    ligero: 0,
    intermedio: 0,
    intenso: 0
  };

  let listaMetasNombres = [];

  casillasMarcadas.forEach(cb => {
    listaMetasNombres.push(cb.value);
    const categoria = cb.getAttribute('data-category') || 'ligero';
    if (conteoPorCategoria[categoria] !== undefined) {
      conteoPorCategoria[categoria]++;
    }
  });

  // Cálculo proporcional: 100% / Actividades hechas hoy
  const valorPorTarea = 100 / totalActividadesRealizadas;

  const porcentajesDelDia = {
    ligero: Math.round(conteoPorCategoria.ligero * valorPorTarea),
    intermedio: Math.round(conteoPorCategoria.intermedio * valorPorTarea),
    intenso: Math.round(conteoPorCategoria.intenso * valorPorTarea)
  };

  const registroHoy = {
    fecha: new Date().toISOString().split('T')[0],
    colorPredominanteDia: nivelEnergiaPredominante,
    totalTareas: totalActividadesRealizadas,
    metasRealizadas: listaMetasNombres,
    desgloseTareasPorCategoria: conteoPorCategoria,
    distribucionPorcentajeDia: porcentajesDelDia
  };

  historial.push(registroHoy);
  localStorage.setItem('historial_tracker', JSON.stringify(historial));

  alert(`¡Día guardado con éxito!\nEnergía hoy: ${nivelEnergiaPredominante.toUpperCase()}\nTotal actividades: ${totalActividadesRealizadas}`);
  
  renderizarCalendario();
}

// Función acumulativa mensual
function calcularResumenMensual() {
  let acumulado = { ligero: 0, intermedio: 0, intenso: 0, total: 0 };

  historial.forEach(dia => {
    if (dia.desgloseTareasPorCategoria) {
      acumulado.ligero += dia.desgloseTareasPorCategoria.ligero || 0;
      acumulado.intermedio += dia.desgloseTareasPorCategoria.intermedio || 0;
      acumulado.intenso += dia.desgloseTareasPorCategoria.intenso || 0;
      acumulado.total += dia.totalTareas || 0;
    }
  });

  return acumulado;
}
