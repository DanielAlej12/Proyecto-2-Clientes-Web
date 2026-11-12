const RESULTADOS_POR_PAGINA = 12;

class VistaExplorar {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    const estadoGuardado = props.estadoPrevio || null;

    this.estado = {
      criterios: estadoGuardado
        ? { ...estadoGuardado.criterios }
        : { nombre: '', categoria: '', origen: '', ingrediente: '' },
      resultadosBase: estadoGuardado ? [...estadoGuardado.resultadosBase] : [],
      paginaActual: estadoGuardado ? estadoGuardado.paginaActual : 1,
      busquedaRealizada: estadoGuardado
        ? estadoGuardado.busquedaRealizada
        : false,
      cargandoCatalogos: false,
      errorCatalogos: null,
      cargandoBusqueda: false,
      errorBusqueda: null
    };

    this.elemento = null;
    this.zonaFormulario = null;
    this.zonaResultados = null;
    this.zonaPaginador = null;

    this.formularioComp = null;
    this.paginadorComp = null;
    this.tarjetasActivas = [];
    this.estadosCargaActivos = [];

    this.destruida = false;
    this.tokenOperacion = 0;

    this.manejadorBusqueda = null;
    this.manejadorLimpiar = null;
    this.manejadorCambioPagina = null;
    this.manejadorReintentarTarjeta = null;
    this.manejadorReintentarGeneral = null;

    this.crearElemento();
    this.renderizar();
    this.configurarEventos();
    this.inicializarCatalogos();
  }

  obtenerEstadoParaHistorial() {
    return {
      criterios: { ...this.estado.criterios },
      resultadosBase: [...this.estado.resultadosBase],
      paginaActual: this.estado.paginaActual,
      busquedaRealizada: this.estado.busquedaRealizada
    };
  }

  crearElemento() {
    this.elemento = document.createElement('div');
    this.elemento.className = 'vista-contenedor';
    this.contenedor.appendChild(this.elemento);
  }

  renderizar() {
    while (this.elemento.firstChild) {
      this.elemento.removeChild(this.elemento.firstChild);
    }

    const enc = document.createElement('div');
    enc.className = 'encabezado-seccion';
    const h1 = document.createElement('h1');
    h1.className = 'titulo-seccion';
    h1.textContent = 'Exploración con Filtros Combinados';
    const sub = document.createElement('p');
    sub.className = 'subtitulo-seccion';
    sub.textContent =
      'Combina nombre, categoría, origen e ingrediente. Los resultados cumplen todos los criterios simultáneamente.';
    enc.appendChild(h1);
    enc.appendChild(sub);

    this.zonaFormulario = document.createElement('div');
    this.zonaResultados = document.createElement('div');
    this.zonaPaginador = document.createElement('div');

    this.elemento.appendChild(enc);
    this.elemento.appendChild(this.zonaFormulario);
    this.elemento.appendChild(this.zonaResultados);
    this.elemento.appendChild(this.zonaPaginador);
  }

  limpiarComponentesResultados() {
    for (const t of this.tarjetasActivas) t.destruir();
    this.tarjetasActivas = [];
    for (const e of this.estadosCargaActivos) e.destruir();
    this.estadosCargaActivos = [];
    if (this.paginadorComp) {
      this.paginadorComp.destruir();
      this.paginadorComp = null;
    }
  }

  async inicializarCatalogos() {
    this.estado.cargandoCatalogos = true;
    this.estado.errorCatalogos = null;
    while (this.zonaFormulario.firstChild) {
      this.zonaFormulario.removeChild(this.zonaFormulario.firstChild);
    }

    const cargaCat = new EstadoCarga(this.zonaFormulario, {
      modo: 'carga',
      variante: 'panel'
    });

    try {
      // Se requieren los tres catálogos para construir el formulario completo -> Promise.all
      const [categorias, origenes, ingredientes] = await Promise.all([
        ServicioApi.obtenerCategorias(),
        ServicioApi.obtenerOrigenes(),
        ServicioApi.obtenerIngredientes()
      ]);

      if (this.destruida) return;
      cargaCat.destruir();
      this.estado.cargandoCatalogos = false;

      if (this.formularioComp) this.formularioComp.destruir();
      this.formularioComp = new FormularioBusqueda(this.zonaFormulario, {
        categorias,
        origenes,
        ingredientes,
        valoresIniciales: this.estado.criterios
      });

      if (this.estado.busquedaRealizada) {
        this.mostrarPaginaActual();
      } else {
        this.mostrarEstadoInicialVacio();
      }
    } catch (error) {
      if (this.destruida) return;
      cargaCat.destruir();
      this.estado.cargandoCatalogos = false;
      this.estado.errorCatalogos = error.message;

      const errComp = new EstadoCarga(this.zonaFormulario, {
        modo: 'error',
        titulo: 'Error al cargar los selectores de filtros',
        mensaje: error.message,
        mostrarReintentar: true
      });
      errComp.elemento.dataset.reintento = 'catalogos';
      this.estadosCargaActivos.push(errComp);
    }
  }

  mostrarEstadoInicialVacio() {
    this.limpiarComponentesResultados();
    while (this.zonaResultados.firstChild) {
      this.zonaResultados.removeChild(this.zonaResultados.firstChild);
    }
    const vacio = new EstadoCarga(this.zonaResultados, {
      modo: 'vacio',
      titulo: 'Aplica al menos un criterio para explorar',
      mensaje:
        'Selecciona una categoría, un origen, un ingrediente o escribe el nombre de un platillo.'
    });
    this.estadosCargaActivos.push(vacio);
  }

  async ejecutarBusquedaCombinada(criterios) {
    const token = ++this.tokenOperacion;
    this.estado.criterios = { ...criterios };
    this.estado.paginaActual = 1;
    this.estado.busquedaRealizada = true;
    this.estado.cargandoBusqueda = true;
    this.estado.errorBusqueda = null;

    this.limpiarComponentesResultados();
    while (this.zonaResultados.firstChild) {
      this.zonaResultados.removeChild(this.zonaResultados.firstChild);
    }

    const loader = new EstadoCarga(this.zonaResultados, {
      modo: 'carga',
      variante: 'tarjetas',
      cantidad: 6
    });
    this.estadosCargaActivos.push(loader);

    try {
      const promesasCriterios = [];

      if (criterios.nombre) {
        promesasCriterios.push(ServicioApi.buscarPorNombre(criterios.nombre));
      }
      if (criterios.categoria) {
        promesasCriterios.push(
          ServicioApi.filtrarPorCategoria(criterios.categoria)
        );
      }
      if (criterios.origen) {
        promesasCriterios.push(ServicioApi.filtrarPorOrigen(criterios.origen));
      }
      if (criterios.ingrediente) {
        promesasCriterios.push(
          ServicioApi.filtrarPorIngrediente(criterios.ingrediente)
        );
      }

      // Todas las respuestas son necesarias para calcular la intersección -> Promise.all
      const listasResultados = await Promise.all(promesasCriterios);

      if (this.destruida || token !== this.tokenOperacion) return;

      // Intersección por id de receta
      let interseccion = listasResultados[0] || [];
      for (let i = 1; i < listasResultados.length; i++) {
        const conjuntoIds = new Set(listasResultados[i].map((r) => r.id));
        interseccion = interseccion.filter((r) => conjuntoIds.has(r.id));
      }

      // Ordenar alfabéticamente por nombre
      interseccion.sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
      );

      this.estado.resultadosBase = interseccion;
      this.estado.cargandoBusqueda = false;
      await this.mostrarPaginaActual(token);
    } catch (error) {
      if (this.destruida || token !== this.tokenOperacion) return;
      this.limpiarComponentesResultados();
      while (this.zonaResultados.firstChild) {
        this.zonaResultados.removeChild(this.zonaResultados.firstChild);
      }
      const errComp = new EstadoCarga(this.zonaResultados, {
        modo: 'error',
        titulo: 'Error al consultar las recetas',
        mensaje: error.message,
        mostrarReintentar: true
      });
      errComp.elemento.dataset.reintento = 'busqueda';
      this.estadosCargaActivos.push(errComp);
    }
  }

  async mostrarPaginaActual(tokenRecibido = null) {
    const token = tokenRecibido !== null ? tokenRecibido : ++this.tokenOperacion;
    this.limpiarComponentesResultados();
    while (this.zonaResultados.firstChild) {
      this.zonaResultados.removeChild(this.zonaResultados.firstChild);
    }
    while (this.zonaPaginador.firstChild) {
      this.zonaPaginador.removeChild(this.zonaPaginador.firstChild);
    }

    const totalResultados = this.estado.resultadosBase.length;
    if (totalResultados === 0) {
      const sinRes = new EstadoCarga(this.zonaResultados, {
        modo: 'vacio',
        titulo: 'Sin resultados para esta combinación',
        mensaje:
          'Ninguna receta cumple simultáneamente todos los filtros aplicados. Intenta con otros criterios.'
      });
      this.estadosCargaActivos.push(sinRes);
      return;
    }

    const totalPaginas = Math.ceil(totalResultados / RESULTADOS_POR_PAGINA);
    if (this.estado.paginaActual > totalPaginas) {
      this.estado.paginaActual = totalPaginas;
    }

    const inicio = (this.estado.paginaActual - 1) * RESULTADOS_POR_PAGINA;
    const fin = inicio + RESULTADOS_POR_PAGINA;
    const recetasPagina = this.estado.resultadosBase.slice(inicio, fin);

    // Encabezado con contador total
    const barraContador = document.createElement('div');
    barraContador.className = 'encabezado-seccion';
    const txtTotal = document.createElement('h2');
    txtTotal.className = 'titulo-seccion';
    txtTotal.style.fontSize = '1.25rem';
    txtTotal.textContent = `${totalResultados} receta(s) encontrada(s) — Ordenadas A-Z`;
    barraContador.appendChild(txtTotal);
    this.zonaResultados.appendChild(barraContador);

    const contenedorCargaPagina = document.createElement('div');
    this.zonaResultados.appendChild(contenedorCargaPagina);
    const skeletonPagina = new EstadoCarga(contenedorCargaPagina, {
      modo: 'carga',
      variante: 'tarjetas',
      cantidad: recetasPagina.length
    });
    this.estadosCargaActivos.push(skeletonPagina);

    // Resolver en paralelo el detalle de las recetas visibles con Promise.allSettled
    const resultadosDetalle = await Promise.allSettled(
      recetasPagina.map((r) => ServicioApi.obtenerRecetaPorId(r.id))
    );

    if (this.destruida || token !== this.tokenOperacion) return;

    skeletonPagina.destruir();
    if (contenedorCargaPagina.parentNode) {
      contenedorCargaPagina.parentNode.removeChild(contenedorCargaPagina);
    }

    const grid = document.createElement('div');
    grid.className = 'cuadricula-tarjetas';
    this.zonaResultados.appendChild(grid);

    resultadosDetalle.forEach((res, idx) => {
      const resumenOriginal = recetasPagina[idx];
      if (res.status === 'fulfilled' && res.value) {
        const tarjeta = new TarjetaReceta(grid, {
          receta: res.value,
          falloDetalle: false
        });
        this.tarjetasActivas.push(tarjeta);
      } else {
        const tarjetaIncompleta = new TarjetaReceta(grid, {
          receta: resumenOriginal,
          falloDetalle: true
        });
        this.tarjetasActivas.push(tarjetaIncompleta);
      }
    });

    this.paginadorComp = new Paginador(this.zonaPaginador, {
      paginaActual: this.estado.paginaActual,
      totalPaginas
    });
  }

  async reintentarDetalleIndividual(idReceta, componenteTarjeta) {
    componenteTarjeta.actualizarEstado({ reintentando: true });
    try {
      const recetaCompleta = await ServicioApi.obtenerRecetaPorId(idReceta);
      if (this.destruida) return;
      if (recetaCompleta) {
        componenteTarjeta.actualizarEstado({
          receta: recetaCompleta,
          falloDetalle: false,
          reintentando: false
        });
      } else {
        componenteTarjeta.actualizarEstado({ reintentando: false });
      }
    } catch (error) {
      if (this.destruida) return;
      componenteTarjeta.actualizarEstado({ reintentando: false });
    }
  }

  configurarEventos() {
    this.manejadorBusqueda = (e) => {
      this.ejecutarBusquedaCombinada(e.detail.criterios);
    };

    this.manejadorLimpiar = () => {
      this.tokenOperacion++;
      this.estado.criterios = {
        nombre: '',
        categoria: '',
        origen: '',
        ingrediente: ''
      };
      this.estado.resultadosBase = [];
      this.estado.paginaActual = 1;
      this.estado.busquedaRealizada = false;
      this.mostrarEstadoInicialVacio();
    };

    this.manejadorCambioPagina = (e) => {
      this.estado.paginaActual = e.detail.pagina;
      this.mostrarPaginaActual();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    this.manejadorReintentarTarjeta = (e) => {
      this.reintentarDetalleIndividual(e.detail.id, e.detail.tarjeta);
    };

    this.manejadorReintentarGeneral = (e) => {
      const nodo = e.target.closest('[data-reintento]');
      if (!nodo) return;
      if (nodo.dataset.reintento === 'catalogos') {
        this.inicializarCatalogos();
      } else if (nodo.dataset.reintento === 'busqueda') {
        this.ejecutarBusquedaCombinada(this.estado.criterios);
      }
    };

    this.elemento.addEventListener('ejecutar-busqueda', this.manejadorBusqueda);
    this.elemento.addEventListener('limpiar-filtros', this.manejadorLimpiar);
    this.elemento.addEventListener('cambio-pagina', this.manejadorCambioPagina);
    this.elemento.addEventListener(
      'reintentar-detalle-tarjeta',
      this.manejadorReintentarTarjeta
    );
    this.elemento.addEventListener(
      'reintentar-accion',
      this.manejadorReintentarGeneral
    );
  }

  destruir() {
    this.destruida = true;
    this.tokenOperacion++;
    this.limpiarComponentesResultados();
    if (this.formularioComp) {
      this.formularioComp.destruir();
      this.formularioComp = null;
    }

    if (this.elemento) {
      this.elemento.removeEventListener(
        'ejecutar-busqueda',
        this.manejadorBusqueda
      );
      this.elemento.removeEventListener(
        'limpiar-filtros',
        this.manejadorLimpiar
      );
      this.elemento.removeEventListener(
        'cambio-pagina',
        this.manejadorCambioPagina
      );
      this.elemento.removeEventListener(
        'reintentar-detalle-tarjeta',
        this.manejadorReintentarTarjeta
      );
      this.elemento.removeEventListener(
        'reintentar-accion',
        this.manejadorReintentarGeneral
      );
      if (this.elemento.parentNode) {
        this.elemento.parentNode.removeChild(this.elemento);
      }
    }
    this.elemento = null;
  }
}