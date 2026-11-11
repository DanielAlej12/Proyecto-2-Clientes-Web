const ServicioRecetas = {
  obtenerUrlImagenIngrediente(nombreIngrediente) {
    const limpio = String(nombreIngrediente || '').trim();
    return `https://www.themealdb.com/images/ingredients/${encodeURIComponent(limpio)}.png`;
  },

  extraerIngredientes(meal) {
    const lista = [];
    for (let i = 1; i <= 20; i++) {
      const nombreCrudo = meal[`strIngredient${i}`];
      const medidaCruda = meal[`strMeasure${i}`];
      if (nombreCrudo && String(nombreCrudo).trim() !== '') {
        const nombre = String(nombreCrudo).trim();
        const medida = medidaCruda ? String(medidaCruda).trim() : 'Al gusto';
        lista.push({
          nombre,
          medida,
          imagen: this.obtenerUrlImagenIngrediente(nombre)
        });
      }
    }
    return lista;
  },

  extraerPasos(instruccionesCrudas) {
    if (!instruccionesCrudas) return [];
    const lineas = String(instruccionesCrudas).split(/\r?\n/);
    const pasos = [];

    // Descarta líneas que solo contienen numeración o encabezados como "STEP 1", "Step 2:", "1.", "1)"
    const patronEncabezadoPaso = /^(step\s*\d+[:.)\-\s]*|\d+[:.)\-]+)$/i;

    for (const linea of lineas) {
      const limpia = linea.trim();
      if (limpia.length > 0 && !patronEncabezadoPaso.test(limpia)) {
        pasos.push(limpia);
      }
    }
    return pasos;
  },

  extraerEtiquetas(tagsCrudos) {
    if (!tagsCrudos) return [];
    return String(tagsCrudos)
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  },

  contarPalabras(texto) {
    if (!texto || String(texto).trim() === '') return 0;
    return String(texto).trim().split(/\s+/).length;
  },

  normalizarRecetaCompleta(meal) {
    if (!meal) return null;
    const ingredientes = this.extraerIngredientes(meal);
    const pasos = this.extraerPasos(meal.strInstructions);
    const etiquetas = this.extraerEtiquetas(meal.strTags);
    const instrucciones = meal.strInstructions ? String(meal.strInstructions).trim() : '';

    return {
      id: String(meal.idMeal),
      nombre: meal.strMeal ? String(meal.strMeal).trim() : 'Sin nombre',
      imagen: meal.strMealThumb || '',
      categoria: meal.strCategory ? String(meal.strCategory).trim() : 'Sin categoría',
      origen: meal.strArea ? String(meal.strArea).trim() : 'Sin origen',
      instrucciones,
      palabrasInstrucciones: this.contarPalabras(instrucciones),
      etiquetas,
      youtube: meal.strYoutube && String(meal.strYoutube).trim() !== '' ? String(meal.strYoutube).trim() : null,
      ingredientes,
      cantidadIngredientes: ingredientes.length,
      pasos,
      cantidadPasos: pasos.length,
      esCompleta: true
    };
  },

  normalizarRecetaResumida(meal) {
    if (!meal) return null;
    return {
      id: String(meal.idMeal),
      nombre: meal.strMeal ? String(meal.strMeal).trim() : 'Sin nombre',
      imagen: meal.strMealThumb || '',
      categoria: null,
      origen: null,
      cantidadIngredientes: null,
      esCompleta: false
    };
  }
};