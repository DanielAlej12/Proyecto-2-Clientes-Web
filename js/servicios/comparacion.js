const ServicioComparacion = {
  normalizarClave(texto) {
    return String(texto || '').trim().toLowerCase();
  },

  calcularComparacion(recetaA, recetaB) {
    // Etiquetas en común
    const mapaEtiquetasB = new Set(
      recetaB.etiquetas.map((e) => this.normalizarClave(e))
    );
    const etiquetasComunes = [];
    const vistasEtiquetas = new Set();

    for (const etq of recetaA.etiquetas) {
      const clave = this.normalizarClave(etq);
      if (mapaEtiquetasB.has(clave) && !vistasEtiquetas.has(clave)) {
        vistasEtiquetas.add(clave);
        etiquetasComunes.push(etq.trim());
      }
    }

    // Ingredientes en común y exclusivos
    const mapaIngA = new Map();
    for (const ing of recetaA.ingredientes) {
      const clave = this.normalizarClave(ing.nombre);
      if (clave && !mapaIngA.has(clave)) {
        mapaIngA.set(clave, ing.nombre.trim());
      }
    }

    const mapaIngB = new Map();
    for (const ing of recetaB.ingredientes) {
      const clave = this.normalizarClave(ing.nombre);
      if (clave && !mapaIngB.has(clave)) {
        mapaIngB.set(clave, ing.nombre.trim());
      }
    }

    const ingredientesComunes = [];
    const exclusivosA = [];
    const exclusivosB = [];

    for (const [clave, nombreOriginal] of mapaIngA.entries()) {
      if (mapaIngB.has(clave)) {
        ingredientesComunes.push(nombreOriginal);
      } else {
        exclusivosA.push(nombreOriginal);
      }
    }

    for (const [clave, nombreOriginal] of mapaIngB.entries()) {
      if (!mapaIngA.has(clave)) {
        exclusivosB.push(nombreOriginal);
      }
    }

    const totalDistintos =
      ingredientesComunes.length + exclusivosA.length + exclusivosB.length;
    const similitud =
      totalDistintos > 0
        ? Math.round((ingredientesComunes.length / totalDistintos) * 100)
        : 0;

    // Determinación de receta más sencilla
    let ganadora = 'EMPATE';
    let motivo = 'Ambas recetas empatan en ingredientes, pasos y extensión.';

    if (recetaA.cantidadIngredientes !== recetaB.cantidadIngredientes) {
      ganadora =
        recetaA.cantidadIngredientes < recetaB.cantidadIngredientes ? 'A' : 'B';
      motivo = 'Menor cantidad de ingredientes requeridos.';
    } else if (recetaA.cantidadPasos !== recetaB.cantidadPasos) {
      ganadora = recetaA.cantidadPasos < recetaB.cantidadPasos ? 'A' : 'B';
      motivo = 'Igual número de ingredientes, pero menor cantidad de pasos.';
    } else if (recetaA.palabrasInstrucciones !== recetaB.palabrasInstrucciones) {
      ganadora =
        recetaA.palabrasInstrucciones < recetaB.palabrasInstrucciones ? 'A' : 'B';
      motivo =
        'Igual número de ingredientes y pasos, pero instrucciones más breves.';
    }

    return {
      cantidadIngredientes: {
        a: recetaA.cantidadIngredientes,
        b: recetaB.cantidadIngredientes,
        menor:
          recetaA.cantidadIngredientes === recetaB.cantidadIngredientes
            ? 'IGUAL'
            : recetaA.cantidadIngredientes < recetaB.cantidadIngredientes
            ? 'A'
            : 'B'
      },
      cantidadPasos: {
        a: recetaA.cantidadPasos,
        b: recetaB.cantidadPasos,
        menor:
          recetaA.cantidadPasos === recetaB.cantidadPasos
            ? 'IGUAL'
            : recetaA.cantidadPasos < recetaB.cantidadPasos
            ? 'A'
            : 'B'
      },
      palabrasInstrucciones: {
        a: recetaA.palabrasInstrucciones,
        b: recetaB.palabrasInstrucciones,
        menor:
          recetaA.palabrasInstrucciones === recetaB.palabrasInstrucciones
            ? 'IGUAL'
            : recetaA.palabrasInstrucciones < recetaB.palabrasInstrucciones
            ? 'A'
            : 'B'
      },
      categoria: {
        a: recetaA.categoria,
        b: recetaB.categoria,
        coinciden:
          this.normalizarClave(recetaA.categoria) ===
          this.normalizarClave(recetaB.categoria)
      },
      origen: {
        a: recetaA.origen,
        b: recetaB.origen,
        coinciden:
          this.normalizarClave(recetaA.origen) ===
          this.normalizarClave(recetaB.origen)
      },
      video: {
        a: Boolean(recetaA.youtube),
        b: Boolean(recetaB.youtube)
      },
      etiquetasComunes,
      ingredientesComunes,
      exclusivosA,
      exclusivosB,
      similitud,
      veredicto: {
        ganadora,
        nombreGanadora:
          ganadora === 'A'
            ? recetaA.nombre
            : ganadora === 'B'
            ? recetaB.nombre
            : null,
        motivo
      }
    };
  }
};