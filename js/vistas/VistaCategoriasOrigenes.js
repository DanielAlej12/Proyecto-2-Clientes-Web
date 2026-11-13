class VistaCategoriasOrigenes {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    const previo = props.estadoPrevio || null;

    this.estado = {
      pestanaActiva: previo
        ? previo.pestanaActiva
        : props.pestanaInicial || 'categorias',
      categorias: [],
      origenes: [],
      seleccionActual: previo
        ? previo.seleccionActual
        : props.categoriaInicial || null,
      recetasResumen: previo ? [...previo.recetasResumen] : [],
      paginaActual: previo ? previo.paginaActual : 1
    };

    this.elemento = null;
    this.zonaPestanas = null;
    this.zonaSelectorChips = null;
    this.zonaFicha = null;
    this.zonaResultados = null;
    this.zonaPaginador = null;

    this.componentesHijos = [];
    this.paginadorComp = null;
    this.destruida = false;
    this.tokenOperacion = 0;
    this.manejadorClick = null;
    this.manejadorCambioPagina = null;

    this.crearElemento();
    this.renderizarEstructura();
    this.configurarEventos();
    this.cargarCatalogoPestana();
  }

  obtenerEstadoParaHistorial() {
    return {
      pestanaActiva: this.estado.pestanaActiva,
      seleccionActual: this.estado.seleccionActual,
      recetasResumen: [...this.estado.recetasResumen],
      paginaActual: this.estado.paginaActual
    };
  }

  crearElemento() {
    this.elemento = document.createElement('div');
    this.elemento.className = 'vista-contenedor';
    this.contenedor.appendChild(this.elemento);
  }

  limpiarHijosDinamicos() {
    for (const c of this.componentesHijos) c.destruir();
    this.componentesHijos = [];
    if (this.paginadorComp) {
      this.paginadorComp.destruir();
      this.paginadorComp = null;
    }
  }

  renderizarEstructura() {
    while (this.elemento.firstChild) {
      this.elemento.removeChild(this.elemento.firstChild);
    }

    const enc = document.createElement('div');
    enc.className = 'encabezado-seccion';
    const h1 = document.createElement('h1');
    h1.className = 'titulo-seccion';
    h1.textContent = 'Catálogo de Categorías y Orígenes';
    enc.appendChild(h1);

    this.zonaPestanas = document.createElement('div');
    this.zonaPestanas.className = 'pestanas-barra';

    this.zonaSelectorChips = document.createElement('div');
    this.zonaFicha = document.createElement('div');
    this.zonaResultados = document.createElement('div');
    this.zonaPaginador = document.createElement('div');

    this.elemento.appendChild(enc);
    this.elemento.appendChild(this.zonaPestanas);
    this.elemento.appendChild(this.zonaSelectorChips);
    this.elemento.appendChild(this.zonaFicha);
    this.elemento.appendChild(this.zonaResultados);
    this.elemento.appendChild(this.zonaPaginador);

    this.renderizarBotonesPestanas();
  }

  renderizarBotonesPestanas() {
    while (this.zonaPestanas.firstChild) {
      this.zonaPestanas.removeChild(this.zonaPestanas.firstChild);
    }

    const btnCat = document.createElement('button');
    btnCat.type = 'button';
    btnCat.className =
      this.estado.pestanaActiva === 'categorias'
        ? 'boton-pestana activa'
        : 'boton-pestana';
    btnCat.dataset.pestana = 'categorias';
    btnCat.textContent = 'Categorías';

    const btnOri = document.createElement('button');
    btnOri.type = 'button';
    btnOri.className =
      this.estado.pestanaActiva === 'origenes'
        ? 'boton-pestana activa'
        : 'boton-pestana';
    btnOri.dataset.pestana = 'origenes';
    btnOri.textContent = 'Orígenes (Cocinas)';

    this.zonaPestanas.appendChild(btnCat);
    this.zonaPestanas.appendChild(btnOri);
  }

  async cargarCatalogoPestana() {
    const token = ++this.tokenOperacion;
    this.limpiarHijosDinamicos();
    while (this.zonaSelectorChips.firstChild) {
      this.zonaSelectorChips.removeChild(this.zonaSelectorChips.firstChild);
    }
    while (this.zonaFicha.firstChild) {
      this.zonaFicha.removeChild(this.zonaFicha.firstChild);
    }
    while (this.zonaResultados.firstChild) {
      this.zonaResultados.removeChild(this.zonaResultados.firstChild);
    }

    const loader = new EstadoCarga(this.zonaSelectorChips, {
      modo: 'carga',
      variante: 'panel'
    });
    this.componentesHijos.push(loader);

    try {
      if (this.estado.pestanaActiva === 'categorias') {
        const categorias = await ServicioApi.obtenerCategorias();
        if (this.destruida || token !== this.tokenOperacion) return;
        loader.destruir();
        this.estado.categorias = categorias;
        if (!this.estado.seleccionActual && categorias.length > 0) {
          this.estado.seleccionActual = categorias[0].nombre;
        }
        this.renderizarChips();
        if (this.estado.recetasResumen.length > 0) {
          this.renderizarFichaEncabezado();
          await this.mostrarPaginaRecetas(token);
        } else if (this.estado.seleccionActual) {
          await this.seleccionarElemento(this.estado.seleccionActual, 1);
        }
      } else {
        const origenes = await ServicioApi.obtenerOrigenes();
        if (this.destruida || token !== this.tokenOperacion) return;
        loader.destruir();
        this.estado.origenes = origenes;
        if (!this.estado.seleccionActual && origenes.length > 0) {
          this.estado.seleccionActual = origenes[0];
        }
        this.renderizarChips();
        if (this.estado.recetasResumen.length > 0) {
          this.renderizarFichaEncabezado();
          await this.mostrarPaginaRecetas(token);
        } else if (this.estado.seleccionActual) {
          await this.seleccionarElemento(this.estado.seleccionActual, 1);
        }
      }
    } catch (error) {
      if (this.destruida || token !== this.tokenOperacion) return;
      loader.destruir();
      const errComp = new EstadoCarga(this.zonaSelectorChips, {
        modo: 'error',
        titulo: 'Error al obtener el listado',
        mensaje: error.message,
        mostrarReintentar: true
      });
      errComp.elemento.dataset.reintento = 'catalogo';
      this.componentesHijos.push(errComp);
    }
  }

  renderizarChips() {
    while (this.zonaSelectorChips.firstChild) {
      this.zonaSelectorChips.removeChild(this.zonaSelectorChips.firstChild);
    }

    const contenedor = document.createElement('div');
    contenedor.className = 'chips-contenedor';

    const items =
      this.estado.pestanaActiva === 'categorias'
        ? this.estado.categorias.map((c) => c.nombre)
        : this.estado.origenes;

    for (const nombre of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        this.estado.seleccionActual === nombre
          ? 'boton-chip activo'
          : 'boton-chip';
      btn.dataset.seleccion = nombre;
      btn.textContent = nombre;
      contenedor.appendChild(btn);
    }

    this.zonaSelectorChips.appendChild(contenedor);
  }

  async seleccionarElemento(nombre, pagina = 1) {
    const token = ++this.tokenOperacion;
    this.estado.seleccionActual = nombre;
    this.estado.paginaActual = pagina;
    this.renderizarChips();

    this.limpiarHijosDinamicos();
    while (this.zonaFicha.firstChild) {
      this.zonaFicha.removeChild(this.zonaFicha.firstChild);
    }
    while (this.zonaResultados.firstChild) {
      this.zonaResultados.removeChild(this.zonaResultados.firstChild);
    }
    while (this.zonaPaginador.firstChild) {
      this.zonaPaginador.removeChild(this.zonaPaginador.firstChild);
    }

    const loader = new EstadoCarga(this.zonaResultados, {
      modo: 'carga',
      variante: 'tarjetas',
      cantidad: 6
    });
    this.componentesHijos.push(loader);

    try {
      const lista =
        this.estado.pestanaActiva === 'categorias'
          ? await ServicioApi.filtrarPorCategoria(nombre)
          : await ServicioApi.filtrarPorOrigen(nombre);

      if (this.destruida || token !== this.tokenOperacion) return;
      loader.destruir();

      lista.sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
      );
      this.estado.recetasResumen = lista;
      this.renderizarFichaEncabezado();
      await this.mostrarPaginaRecetas(token);
    } catch (error) {
      if (this.destruida || token !== this.tokenOperacion) return;
      loader.destruir();
      const errComp = new EstadoCarga(this.zonaResultados, {
        modo: 'error',
        titulo: `No se pudieron cargar las recetas de "${nombre}"`,
        mensaje: error.message,
        mostrarReintentar: true
      });
      errComp.elemento.dataset.reintento = 'seleccion';
      this.componentesHijos.push(errComp);
    }
  }

  renderizarFichaEncabezado() {
    while (this.zonaFicha.firstChild) {
      this.zonaFicha.removeChild(this.zonaFicha.firstChild);
    }

    const total = this.estado.recetasResumen.length;

    if (this.estado.pestanaActiva === 'categorias') {
      const objCat = this.estado.categorias.find(
        (c) => c.nombre === this.estado.seleccionActual
      );
      if (!objCat) return;

      const ficha = document.createElement('article');
      ficha.className = 'ficha-categoria';

      const img = document.createElement('img');
      img.className = 'ficha-categoria-img';
      img.src = objCat.imagen;
      img.alt = objCat.nombre;

      const info = document.createElement('div');
      const h2 = document.createElement('h2');
      h2.className = 'titulo-seccion';
      h2.textContent = `${objCat.nombre} (${total} recetas)`;

      const pDesc = document.createElement('p');
      pDesc.style.marginTop = '0.5rem';
      pDesc.textContent = objCat.descripcion;

      info.appendChild(h2);
      info.appendChild(pDesc);
      ficha.appendChild(img);
      ficha.appendChild(info);
      this.zonaFicha.appendChild(ficha);
    } else {
      const bloqueOri = document.createElement('div');
      bloqueOri.className = 'panel-busqueda';
      const h2 = document.createElement('h2');
      h2.className = 'titulo-seccion';
      h2.textContent = `Cocina de origen: ${this.estado.seleccionActual} (${total} recetas disponibles)`;
      bloqueOri.appendChild(h2);
      this.zonaFicha.appendChild(bloqueOri);
    }
  }

  async mostrarPaginaRecetas(tokenRecibido = null) {
    const token = tokenRecibido !== null ? tokenRecibido : ++this.tokenOperacion;
    this.limpiarHijosDinamicos();
    while (this.zonaResultados.firstChild) {
      this.zonaResultados.removeChild(this.zonaResultados.firstChild);
    }
    while (this.zonaPaginador.firstChild) {
      this.zonaPaginador.removeChild(this.zonaPaginador.firstChild);
    }

    const total = this.estado.recetasResumen.length;
    if (total === 0) {
      const vacio = new EstadoCarga(this.zonaResultados, {
        modo: 'vacio',
        titulo: 'Sin recetas disponibles',
        mensaje: 'No se encontraron recetas registradas en este grupo.'
      });
      this.componentesHijos.push(vacio);
      return;
    }

    const totalPaginas = Math.ceil(total / RESULTADOS_POR_PAGINA);
    const inicio = (this.estado.paginaActual - 1) * RESULTADOS_POR_PAGINA;
    const visibles = this.estado.recetasResumen.slice(
      inicio,
      inicio + RESULTADOS_POR_PAGINA
    );

    const contSkeleton = document.createElement('div');
    this.zonaResultados.appendChild(contSkeleton);
    const skel = new EstadoCarga(contSkeleton, {
      modo: 'carga',
      variante: 'tarjetas',
      cantidad: visibles.length
    });
    this.componentesHijos.push(skel);

    const detalles = await Promise.allSettled(
      visibles.map((r) => ServicioApi.obtenerRecetaPorId(r.id))
    );

    if (this.destruida || token !== this.tokenOperacion) return;
    skel.destruir();
    if (contSkeleton.parentNode) {
      contSkeleton.parentNode.removeChild(contSkeleton);
    }

    const grid = document.createElement('div');
    grid.className = 'cuadricula-tarjetas';
    this.zonaResultados.appendChild(grid);

    detalles.forEach((res, idx) => {
      if (res.status === 'fulfilled' && res.value) {
        const card = new TarjetaReceta(grid, {
          receta: res.value,
          falloDetalle: false
        });
        this.componentesHijos.push(card);
      } else {
        const cardInc = new TarjetaReceta(grid, {
          receta: visibles[idx],
          falloDetalle: true
        });
        this.componentesHijos.push(cardInc);
      }
    });

    this.paginadorComp = new Paginador(this.zonaPaginador, {
      paginaActual: this.estado.paginaActual,
      totalPaginas
    });
  }

  configurarEventos() {
    this.manejadorClick = (e) => {
      const btnPestana = e.target.closest('[data-pestana]');
      if (btnPestana) {
        const nueva = btnPestana.dataset.pestana;
        if (nueva !== this.estado.pestanaActiva) {
          this.estado.pestanaActiva = nueva;
          this.estado.seleccionActual = null;
          this.estado.recetasResumen = [];
          this.estado.paginaActual = 1;
          this.renderizarBotonesPestanas();
          this.cargarCatalogoPestana();
        }
        return;
      }

      const btnChip = e.target.closest('[data-seleccion]');
      if (btnChip) {
        const elegido = btnChip.dataset.seleccion;
        if (elegido !== this.estado.seleccionActual) {
          this.seleccionarElemento(elegido, 1);
        }
        return;
      }

      const btnReintentar = e.target.closest('[data-accion="reintentar"]');
      if (btnReintentar) {
        const ctx = btnReintentar.closest('[data-reintento]');
        if (!ctx) return;
        if (ctx.dataset.reintento === 'catalogo') {
          this.cargarCatalogoPestana();
        } else if (ctx.dataset.reintento === 'seleccion') {
          this.seleccionarElemento(
            this.estado.seleccionActual,
            this.estado.paginaActual
          );
        }
      }
    };

    this.manejadorCambioPagina = (e) => {
      this.estado.paginaActual = e.detail.pagina;
      this.mostrarPaginaRecetas();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    this.elemento.addEventListener('click', this.manejadorClick);
    this.elemento.addEventListener('cambio-pagina', this.manejadorCambioPagina);
    this.elemento.addEventListener('reintentar-detalle-tarjeta', async (e) => {
      const { id, tarjeta } = e.detail;
      tarjeta.actualizarEstado({ reintentando: true });
      try {
        const completa = await ServicioApi.obtenerRecetaPorId(id);
        if (!this.destruida && completa) {
          tarjeta.actualizarEstado({
            receta: completa,
            falloDetalle: false,
            reintentando: false
          });
        }
      } catch (_) {
        if (!this.destruida) tarjeta.actualizarEstado({ reintentando: false });
      }
    });
  }

  destruir() {
    this.destruida = true;
    this.tokenOperacion++;
    this.limpiarHijosDinamicos();
    if (this.elemento) {
      this.elemento.removeEventListener('click', this.manejadorClick);
      this.elemento.removeEventListener(
        'cambio-pagina',
        this.manejadorCambioPagina
      );
      if (this.elemento.parentNode) {
        this.elemento.parentNode.removeChild(this.elemento);
      }
    }
    this.elemento = null;
  }
}