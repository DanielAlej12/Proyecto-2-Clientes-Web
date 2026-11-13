class PanelComparador {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.estado = {
      idPanel: props.idPanel || 'A',
      receta: props.receta || null,
      terminoBusqueda: '',
      resultados: [],
      cargando: false,
      error: null,
      mensajeValidacion: ''
    };

    this.elemento = null;
    this.contenedorResultados = null;
    this.temporizadorDebounce = null;
    this.controladorAbort = null;
    this.manejadorInput = null;
    this.manejadorClick = null;

    this.crearElemento();
    this.renderizar();
    this.configurarEventos();
  }

  crearElemento() {
    this.elemento = document.createElement('section');
    this.elemento.className = 'panel-comparador';
    this.contenedor.appendChild(this.elemento);
  }

  actualizarReceta(nuevaReceta) {
    this.estado.receta = nuevaReceta;
    this.estado.resultados = [];
    this.estado.terminoBusqueda = '';
    this.estado.mensajeValidacion = '';
    this.estado.error = null;
    this.renderizar();
  }

  renderizar() {
    while (this.elemento.firstChild) {
      this.elemento.removeChild(this.elemento.firstChild);
    }

    const encabezado = document.createElement('div');
    encabezado.className = 'panel-encabezado';

    const titulo = document.createElement('h3');
    titulo.className = 'panel-etiqueta';
    titulo.textContent = `Panel ${this.estado.idPanel}`;
    encabezado.appendChild(titulo);

    if (this.estado.receta) {
      const btnVaciar = document.createElement('button');
      btnVaciar.type = 'button';
      btnVaciar.className = 'boton';
      btnVaciar.dataset.accion = 'vaciar-panel';
      btnVaciar.textContent = 'Vaciar panel';
      encabezado.appendChild(btnVaciar);
    }
    this.elemento.appendChild(encabezado);

    // Buscador interno
    const grupoBuscador = document.createElement('div');
    grupoBuscador.className = 'campo-grupo';

    const lbl = document.createElement('label');
    lbl.className = 'campo-etiqueta';
    lbl.setAttribute('for', `buscador-panel-${this.estado.idPanel}`);
    lbl.textContent = 'Buscar receta por nombre para este panel';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = `buscador-panel-${this.estado.idPanel}`;
    input.className = 'campo-control';
    input.placeholder = 'Escribe al menos 2 letras...';
    input.value = this.estado.terminoBusqueda;

    grupoBuscador.appendChild(lbl);
    grupoBuscador.appendChild(input);
    this.elemento.appendChild(grupoBuscador);

    this.contenedorResultados = document.createElement('div');
    this.elemento.appendChild(this.contenedorResultados);
    this.renderizarZonaResultados();

    // Ficha de la receta activa en el panel
    if (this.estado.receta) {
      const cajaActiva = document.createElement('div');
      cajaActiva.className = 'panel-receta-activa';

      const img = document.createElement('img');
      img.className = 'panel-receta-img';
      img.src = this.estado.receta.imagen;
      img.alt = this.estado.receta.nombre;

      const info = document.createElement('div');
      const h4 = document.createElement('h4');
      h4.className = 'tarjeta-titulo';
      h4.textContent = this.estado.receta.nombre;

      const pildoras = document.createElement('div');
      pildoras.className = 'etiquetas-fila';
      pildoras.style.marginTop = '0.4rem';

      const pCat = document.createElement('span');
      pCat.className = 'pildora pildora-categoria';
      pCat.textContent = this.estado.receta.categoria;

      const pOri = document.createElement('span');
      pOri.className = 'pildora pildora-origen';
      pOri.textContent = this.estado.receta.origen;

      pildoras.appendChild(pCat);
      pildoras.appendChild(pOri);
      info.appendChild(h4);
      info.appendChild(pildoras);

      cajaActiva.appendChild(img);
      cajaActiva.appendChild(info);
      this.elemento.appendChild(cajaActiva);
    } else {
      const vacio = document.createElement('div');
      vacio.className = 'estado-contenedor';
      vacio.style.padding = '1.25rem';
      const p = document.createElement('p');
      p.textContent = `El Panel ${this.estado.idPanel} está libre. Usa el buscador superior o agrega una receta desde otra vista.`;
      vacio.appendChild(p);
      this.elemento.appendChild(vacio);
    }
  }

  renderizarZonaResultados() {
    if (!this.contenedorResultados) return;
    while (this.contenedorResultados.firstChild) {
      this.contenedorResultados.removeChild(this.contenedorResultados.firstChild);
    }

    if (this.estado.mensajeValidacion) {
      const p = document.createElement('p');
      p.className = 'mensaje-validacion';
      p.textContent = this.estado.mensajeValidacion;
      this.contenedorResultados.appendChild(p);
      return;
    }

    if (this.estado.cargando) {
      new EstadoCarga(this.contenedorResultados, {
        modo: 'carga',
        variante: 'panel'
      });
      return;
    }

    if (this.estado.error) {
      new EstadoCarga(this.contenedorResultados, {
        modo: 'error',
        titulo: 'Error al buscar en el panel',
        mensaje: this.estado.error,
        mostrarReintentar: true
      });
      return;
    }

    if (
      this.estado.terminoBusqueda.trim().length >= 2 &&
      this.estado.resultados.length === 0
    ) {
      const p = document.createElement('p');
      p.className = 'subtitulo-seccion';
      p.textContent = 'No se encontraron recetas con ese nombre.';
      this.contenedorResultados.appendChild(p);
      return;
    }

    if (this.estado.resultados.length > 0) {
      const ul = document.createElement('ul');
      ul.className = 'panel-resultados-busqueda';

      for (const rec of this.estado.resultados) {
        const li = document.createElement('li');
        li.className = 'panel-resultado-item';

        const info = document.createElement('div');
        info.className = 'panel-resultado-info';

        const img = document.createElement('img');
        img.className = 'panel-resultado-thumb';
        img.src = rec.imagen;
        img.alt = rec.nombre;

        const txt = document.createElement('span');
        txt.style.fontWeight = '600';
        txt.style.fontSize = '0.88rem';
        txt.textContent = `${rec.nombre} (${rec.categoria})`;

        info.appendChild(img);
        info.appendChild(txt);

        const btnElegir = document.createElement('button');
        btnElegir.type = 'button';
        btnElegir.className = 'boton boton-primario';
        btnElegir.style.padding = '0.35rem 0.65rem';
        btnElegir.style.fontSize = '0.8rem';
        btnElegir.dataset.accion = 'seleccionar-receta-panel';
        btnElegir.dataset.id = rec.id;
        btnElegir.textContent = 'Elegir';

        li.appendChild(info);
        li.appendChild(btnElegir);
        ul.appendChild(li);
      }

      this.contenedorResultados.appendChild(ul);
    }
  }

  async ejecutarBusquedaConAbort(termino) {
    if (this.controladorAbort) {
      this.controladorAbort.abort();
    }
    this.controladorAbort = new AbortController();

    this.estado.cargando = true;
    this.estado.error = null;
    this.renderizarZonaResultados();

    try {
      const resultados = await ServicioApi.buscarPorNombre(termino, {
        signal: this.controladorAbort.signal
      });
      this.estado.cargando = false;
      this.estado.resultados = resultados.slice(0, 8);
      this.renderizarZonaResultados();
    } catch (error) {
      if (error.cancelada) {
        return; // Una petición cancelada con AbortController no se muestra como error
      }
      this.estado.cargando = false;
      this.estado.error = error.message;
      this.renderizarZonaResultados();
    }
  }

  configurarEventos() {
    this.manejadorInput = (e) => {
      if (e.target.tagName !== 'INPUT') return;
      const valor = e.target.value;
      this.estado.terminoBusqueda = valor;

      if (this.temporizadorDebounce) {
        clearTimeout(this.temporizadorDebounce);
      }
      if (this.controladorAbort) {
        this.controladorAbort.abort();
      }

      const limpio = valor.trim();
      if (limpio.length === 0) {
        this.estado.mensajeValidacion = '';
        this.estado.resultados = [];
        this.estado.cargando = false;
        this.estado.error = null;
        this.renderizarZonaResultados();
        return;
      }

      if (limpio.length === 1) {
        this.estado.mensajeValidacion =
          'Ingresa al menos 2 caracteres para consultar.';
        this.estado.resultados = [];
        this.estado.cargando = false;
        this.renderizarZonaResultados();
        return;
      }

      this.estado.mensajeValidacion = '';
      this.temporizadorDebounce = setTimeout(() => {
        this.ejecutarBusquedaConAbort(limpio);
      }, 400);
    };

    this.manejadorClick = (e) => {
      const btnVaciar = e.target.closest('[data-accion="vaciar-panel"]');
      if (btnVaciar) {
        this.elemento.dispatchEvent(
          new CustomEvent('vaciar-panel-comparador', {
            bubbles: true,
            detail: { idPanel: this.estado.idPanel }
          })
        );
        return;
      }

      const btnSeleccionar = e.target.closest(
        '[data-accion="seleccionar-receta-panel"]'
      );
      if (btnSeleccionar) {
        const idElegido = btnSeleccionar.dataset.id;
        const recetaElegida = this.estado.resultados.find(
          (r) => r.id === idElegido
        );
        if (recetaElegida) {
          this.elemento.dispatchEvent(
            new CustomEvent('seleccionar-receta-panel', {
              bubbles: true,
              detail: {
                idPanel: this.estado.idPanel,
                receta: recetaElegida
              }
            })
          );
        }
        return;
      }

      const btnReintentar = e.target.closest('[data-accion="reintentar"]');
      if (btnReintentar) {
        const limpio = this.estado.terminoBusqueda.trim();
        if (limpio.length >= 2) {
          this.ejecutarBusquedaConAbort(limpio);
        }
      }
    };

    this.elemento.addEventListener('input', this.manejadorInput);
    this.elemento.addEventListener('click', this.manejadorClick);
  }

  destruir() {
    if (this.temporizadorDebounce) {
      clearTimeout(this.temporizadorDebounce);
    }
    if (this.controladorAbort) {
      this.controladorAbort.abort();
    }
    if (this.elemento) {
      this.elemento.removeEventListener('input', this.manejadorInput);
      this.elemento.removeEventListener('click', this.manejadorClick);
      if (this.elemento.parentNode) {
        this.elemento.parentNode.removeChild(this.elemento);
      }
    }
    this.elemento = null;
  }
}