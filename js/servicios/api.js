const URL_BASE_API = 'https://www.themealdb.com/api/json/v1/1/';

const ServicioApi = {
  async peticionCentralizada(endpoint, opciones = {}) {
    try {
      const respuesta = await fetch(`${URL_BASE_API}${endpoint}`, {
        signal: opciones.signal
      });

      if (!respuesta.ok) {
        const errorServicio = new Error(
          `El servidor respondió con el código de estado HTTP ${respuesta.status}.`
        );
        errorServicio.tipo = 'SERVIDOR';
        errorServicio.estadoHttp = respuesta.status;
        throw errorServicio;
      }

      const datos = await respuesta.json();
      return datos;
    } catch (error) {
      if (error.name === 'AbortError') {
        const errorCancelado = new Error('Petición cancelada');
        errorCancelado.cancelada = true;
        throw errorCancelado;
      }

      if (error.tipo === 'SERVIDOR') {
        throw error;
      }

      const errorRed = new Error(
        'No fue posible conectar con el servidor. Verifica tu conexión a internet.'
      );
      errorRed.tipo = 'CONEXION';
      throw errorRed;
    }
  },

  // 1. search.php?s={nombre}
  async buscarPorNombre(nombre, opciones = {}) {
    const termino = encodeURIComponent(String(nombre).trim());
    const datos = await this.peticionCentralizada(`search.php?s=${termino}`, opciones);
    if (!datos.meals) return [];

    return datos.meals.map((meal) => {
      const normalizada = ServicioRecetas.normalizarRecetaCompleta(meal);
      CacheMemoria.guardarReceta(normalizada);
      return normalizada;
    });
  },

  // 2. lookup.php?i={id}
  async obtenerRecetaPorId(id, opciones = {}) {
    const enCache = CacheMemoria.obtenerReceta(id);
    if (enCache) return enCache;

    const datos = await this.peticionCentralizada(
      `lookup.php?i=${encodeURIComponent(id)}`,
      opciones
    );
    if (!datos.meals || datos.meals.length === 0) {
      return null;
    }

    const normalizada = ServicioRecetas.normalizarRecetaCompleta(datos.meals[0]);
    CacheMemoria.guardarReceta(normalizada);
    return normalizada;
  },

  // 3. random.php
  async obtenerRecetaAleatoria(idExcluir = null) {
    let intentos = 0;
    let receta = null;

    while (intentos < 5) {
      intentos++;
      const datos = await this.peticionCentralizada('random.php');
      if (datos.meals && datos.meals.length > 0) {
        receta = ServicioRecetas.normalizarRecetaCompleta(datos.meals[0]);
        CacheMemoria.guardarReceta(receta);
        if (!idExcluir || receta.id !== String(idExcluir)) {
          return receta;
        }
      }
    }
    return receta;
  },

  // 4. categories.php
  async obtenerCategorias() {
    const enCache = CacheMemoria.obtenerCategorias();
    if (enCache) return enCache;

    const datos = await this.peticionCentralizada('categories.php');
    const lista = (datos.categories || []).map((cat) => ({
      id: String(cat.idCategory),
      nombre: String(cat.strCategory).trim(),
      imagen: cat.strCategoryThumb || '',
      descripcion: cat.strCategoryDescription ? String(cat.strCategoryDescription).trim() : ''
    }));

    CacheMemoria.guardarCategorias(lista);
    return lista;
  },

  // 5. list.php?a=list
  async obtenerOrigenes() {
    const enCache = CacheMemoria.obtenerOrigenes();
    if (enCache) return enCache;

    const datos = await this.peticionCentralizada('list.php?a=list');
    const lista = (datos.meals || [])
      .map((item) => String(item.strArea).trim())
      .filter(Boolean);

    CacheMemoria.guardarOrigenes(lista);
    return lista;
  },

  // 6. list.php?i=list
  async obtenerIngredientes() {
    const enCache = CacheMemoria.obtenerIngredientes();
    if (enCache) return enCache;

    const datos = await this.peticionCentralizada('list.php?i=list');
    const lista = (datos.meals || [])
      .map((item) => String(item.strIngredient).trim())
      .filter(Boolean);

    CacheMemoria.guardarIngredientes(lista);
    return lista;
  },

  // 7. filter.php?c={categoría}
  async filtrarPorCategoria(categoria) {
    const datos = await this.peticionCentralizada(
      `filter.php?c=${encodeURIComponent(String(categoria).trim())}`
    );
    if (!datos.meals) return [];
    return datos.meals.map((m) => ServicioRecetas.normalizarRecetaResumida(m));
  },

  // 8. filter.php?a={origen}
  async filtrarPorOrigen(origen) {
    const datos = await this.peticionCentralizada(
      `filter.php?a=${encodeURIComponent(String(origen).trim())}`
    );
    if (!datos.meals) return [];
    return datos.meals.map((m) => ServicioRecetas.normalizarRecetaResumida(m));
  },

  // 9. filter.php?i={ingrediente}
  async filtrarPorIngrediente(ingrediente) {
    const datos = await this.peticionCentralizada(
      `filter.php?i=${encodeURIComponent(String(ingrediente).trim())}`
    );
    if (!datos.meals) return [];
    return datos.meals.map((m) => ServicioRecetas.normalizarRecetaResumida(m));
  }
};