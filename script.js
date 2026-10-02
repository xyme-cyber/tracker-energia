// --- LÓGICA DEL HABIT TRACKER CON PORCENTAJES Y ACUMULADOS ---

// Objeto global para almacenar el historial de los días (simulación de base de datos)
let historialMensual = [];

function guardarRegistro() {
  // 1. Obtener el nivel de energía predominante seleccionado para pintar el día
  const nivelEnergiaPredominante = document.getElementById('energy-level').value;
  
  // 2. Obtener todas las casillas marcadas
  const casillasMarcadas = document.querySelectorAll('#tracker-form input[type="checkbox"]:checked');
  const totalActividadesRealizadas = casillasMarcadas.length;

  // Validación: si no se marcó ninguna actividad
  if (totalActividadesRealizadas === 0) {
    alert("Por favor, selecciona al menos una actividad realizada hoy.");
    return;
  }

  // 3. Contar cuántas actividades se hicieron por cada categoría
  let conteoPorCategoria = {
    ligero: 0,
    intermedio: 0,
    intenso: 0
  };

  let listaMetasNombres = [];

  casillasMarcadas.forEach(cb => {
    listaMetasNombres.push(cb.value);
    const categoria = cb.getAttribute('data-category');
    if (conteoPorCategoria[categoria] !== undefined) {
      conteoPorCategoria[categoria]++;
    }
  });

  // 4. Calcular el Porcentaje Diarios (Cada actividad vale: 100% / Total de actividades)
  const valorPorTarea = 100 / totalActividadesRealizadas;

  const porcentajesDelDia = {
    ligero: Math.round(conteoPorCategoria.ligero * valorPorTarea),
    intermedio: Math.round(conteoPorCategoria.intermedio * valorPorTarea),
    intenso: Math.round(conteoPorCategoria.intenso * valorPorTarea)
  };

  // 5. Estructura del registro del día
  const registroHoy = {
    fecha: new Date().toLocaleDateString('es-MX'),
    colorPredominanteDia: nivelEnergiaPredominante, // Determina el color en el calendario
    totalTareas: totalActividadesRealizadas,
    metasRealizadas: listaMetasNombres,
    desgloseTareasPorCategoria: conteoPorCategoria, // Para la suma total mensual (cantidades)
    distribucionPorcentajeDia: porcentajesDelDia // Para los porcentajes diarios (% del 100% de hoy)
  };

  // Guardar en el historial
  historialMensual.push(registroHoy);

  // 6. Calcular el acumulado global del mes
  const acumuladoMensual = calcularResumenMensual(historialMensual);

  // Confirmación visual en consola y alerta al usuario
  console.log("Día registrado con éxito:", registroHoy);
  console.log("Acumulado global del mes actualizado:", acumuladoMensual);

  alert(`¡Día guardado exitosamente!\n` +
        `• Color del día: ${nivelEnergiaPredominante.toUpperCase()}\n` +
        `• Total de actividades hoy: ${totalActividadesRealizadas}\n\n` +
        `Distribución de hoy:\n` +
        `- Ligero: ${porcentajesDelDia.ligero}%\n` +
        `- Intermedio: ${porcentajesDelDia.intermedio}%\n` +
        `- Intenso: ${porcentajesDelDia.intenso}%`);
}

// Función auxiliar para sumar TODAS las actividades hechas en el mes (sin importar el día)
function calcularResumenMensual(historial) {
  let totalesAbsolutosMensuales = {
    ligero: 0,
    intermedio: 0,
    intenso: 0,
    totalGeneralActividades: 0
  };

  historial.forEach(dia => {
    totalesAbsolutosMensuales.ligero += dia.desgloseTareasPorCategoria.ligero;
    totalesAbsolutosMensuales.intermedio += dia.desgloseTareasPorCategoria.intermedio;
    totalesAbsolutosMensuales.intenso += dia.desgloseTareasPorCategoria.intenso;
    totalesAbsolutosMensuales.totalGeneralActividades += dia.totalTareas;
  });

  return totalesAbsolutosMensuales;
}
