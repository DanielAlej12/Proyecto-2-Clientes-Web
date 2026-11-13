const CacheMemoria = {
  recetasCompletas: new Map(),
  categorias: null,
  origenes: null,
  ingredientes: null,

  guardarReceta(recetaNormalizada) {
    if (recetaNormalizada && recetaNormalizada.id) {
      this.recetasCompletas.set(String(recetaNormalizada.id), recetaNormalizada);
    }
  },

  obtenerReceta(id) {
    return this.recetasCompletas.get(String(id)) || null;
  },

  tieneReceta(id) {
    return this.recetasCompletas.has(String(id));
  },

  guardarCategorias(lista) {
    this.categorias = lista;
  },

  obtenerCategorias() {
    return this.categorias;
  },

  guardarOrigenes(lista) {
    this.origenes = lista;
  },

  obtenerOrigenes() {
    return this.origenes;
  },

  guardarIngredientes(lista) {
    this.ingredientes = lista;
  },

  obtenerIngredientes() {
    return this.ingredientes;
  }
};
