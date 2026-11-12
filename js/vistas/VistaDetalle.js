class VistaDetalle {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.estado = {
      idReceta: props.idReceta,
      receta: null,
      cargandoPrincipal: false,
      errorPrincipal: null,
      relacionadasCategoria: [],
      errorRelCategoria: null,
      relacionadasOrigen: [],
      errorRelOrigen: null
    };

    this.elemento = null;
    this.zonaPrincipal = null;
    this.zonaRelCategoria = null;
    this.zonaRelOrigen = null;

    this.componentesHijos = [];
    this.destruida = false;
    this.tokenCarga = 0;
    this.manejadorClick = null;

    this.crearElemento();
    this.renderizarEstructuraBase();
    this.configurarEventos();
    this.cargarRecetaYRelacionadas();
  }

  crearElemento() {
    this.elemento = document.createElement('div');
    this.elemento.className = 'vista-contenedor';
    this.contenedor.appendChild(this.elemento);
  }

  limpiarHijos() {
    for (const c of this.componentesHijos) {
      c.destruir();
    }
    this.componentesHijos = [];
  }

  renderizarEstructuraBase() {
    while (this.elemento.firstChild) {
      this.elemento.removeChild(this.elemento.firstChild);
    }

    const cabecera = document.createElement('div');
    cabecera.className = 'detalle-cabecera';

    const btnVolver = document.createElement('button');
    btnVolver.type = 'button';
    btnVolver.className = 'boton';
    btnVolver.dataset.accion = 'volver-origen';
    btnVolver.textContent = '← Volver a la vista anterior';

    cabecera.appendChild(btnVolver);

    this.zonaPrincipal = document.createElement('div');
    this.zonaRelCategoria = document.createElement('section');
    this.zonaRelCategoria.className = 'seccion-bloque';
    this.zonaRelOrigen = document.createElement('section');
    this.zonaRelOrigen.className = 'seccion-bloque';

    this.elemento.appendChild(cabecera);
    this.elemento.appendChild(this.zonaPrincipal);
    this.elemento.appendChild(this.zonaRelCategoria);
    this.elemento.appendChild(this.zonaRelOrigen);
  }

  async cargarRecetaYRelacionadas() {
    const token = ++this.tokenCarga;
    this.limpiarHijos();
    while (this.zonaPrincipal.firstChild) {
      this.zonaPrincipal.removeChild(this.zonaPrincipal.firstChild);
    }
    while (this.zonaRelCategoria.firstChild) {
      this.zonaRelCategoria.removeChild(this.zonaRelCategoria.firstChild);
    }
    while (this.zonaRelOrigen.firstChild) {
      this.zonaRelOrigen.removeChild(this.zonaRelOrigen.firstChild);
    }

    const loader = new EstadoCarga(this.zonaPrincipal, {
      modo: 'carga',
      variante: 'detalle'
    });
    this.componentesHijos.push(loader);

    try {
      const receta = await ServicioApi.obtenerRecetaPorId(this.estado.idReceta);
      if (this.destruida || token !== this.tokenCarga) return;

      loader.destruir();
      if (!receta) {
        const vacio = new EstadoCarga(this.zonaPrincipal, {
          modo: 'vacio',
          titulo: 'Receta no encontrada',
          mensaje: 'No existe información para el identificador solicitado.'
        });
        this.componentesHijos.push(vacio);
        return;
      }

      this.estado.receta = receta;
      this.renderizarFichaReceta(receta);
      await this.cargarRelacionadasEnParalelo(receta, token);
    } catch (error) {
      if (this.destruida || token !== this.tokenCarga) return;
      loader.destruir();
      const errComp = new EstadoCarga(this.zonaPrincipal, {
        modo: 'error',
        titulo: 'Error al cargar el detalle de la receta',
        mensaje: error.message,
        mostrarReintentar: true
      });
      errComp.elemento.dataset.reintento = 'principal';
      this.componentesHijos.push(errComp);
    }
  }

  renderizarFichaReceta(receta) {
    while (this.zonaPrincipal.firstChild) {
      this.zonaPrincipal.removeChild(this.zonaPrincipal.firstChild);
    }

    const contenedor = document.createElement('article');
    contenedor.className = 'detalle-principal';

    const hero = document.createElement('div');
    hero.className = 'detalle-hero';

    const img = document.createElement('img');
    img.className = 'detalle-imagen';
    img.src = receta.imagen;
    img.alt = receta.nombre;

    const info = document.createElement('div');
    info.className = 'detalle-info';

    const pildoras = document.createElement('div');
    pildoras.className = 'etiquetas-fila';

    const pCat = document.createElement('span');
    pCat.className = 'pildora pildora-categoria';
    pCat.textContent = `Categoría: ${receta.categoria}`;

    const pOri = document.createElement('span');
    pOri.className = 'pildora pildora-origen';
    pOri.textContent = `Origen: ${receta.origen}`;

    pildoras.appendChild(pCat);
    pildoras.appendChild(pOri);

    const h1 = document.createElement('h1');
    h1.className = 'detalle-titulo';
    h1.textContent = receta.nombre;

    info.appendChild(pildoras);
    info.appendChild(h1);

    // Etiquetas (strTags separadas por coma)
    if (receta.etiquetas.length > 0) {
      const filaTags = document.createElement('div');
      filaTags.className = 'etiquetas-fila';
      for (const tag of receta.etiquetas) {
        const spanTag = document.createElement('span');
        spanTag.className = 'pildora';
        spanTag.textContent = `#${tag}`;
        filaTags.appendChild(spanTag);
      }
      info.appendChild(filaTags);
    }

    const acciones = document.createElement('div');
    acciones.className = 'heroe-acciones';

    const btnComparar = document.createElement('button');
    btnComparar.type = 'button';
    btnComparar.className = 'boton boton-primario';
    btnComparar.dataset.accion = 'comparar-actual';
    btnComparar.textContent = '+ Agregar al comparador';
    acciones.appendChild(btnComparar);

    if (receta.youtube) {
      const enlaceVideo = document.createElement('a');
      enlaceVideo.className = 'boton boton-secundario';
      enlaceVideo.href = receta.youtube;
      enlaceVideo.target = '_blank';
      enlaceVideo.rel = 'noopener noreferrer';
      enlaceVideo.textContent = 'Ver video de preparación ↗';
      acciones.appendChild(enlaceVideo);
    }

    info.appendChild(acciones);
    hero.appendChild(img);
    hero.appendChild(info);

    const cuerpo = document.createElement('div');
    cuerpo.className = 'detalle-cuerpo';

    const colIngredientes = document.createElement('div');
    const colPasos = document.createElement('div');

    const compIng = new ListaIngredientes(colIngredientes, {
      ingredientes: receta.ingredientes
    });
    const compPasos = new PasosPreparacion(colPasos, {
      pasos: receta.pasos
    });
    this.componentesHijos.push(compIng, compPasos);

    cuerpo.appendChild(colIngredientes);
    cuerpo.appendChild(colPasos);

    contenedor.appendChild(hero);
    contenedor.appendChild(cuerpo);
    this.zonaPrincipal.appendChild(contenedor);
  }

  async cargarRelacionadasEnParalelo(receta, token) {
    // Ambas consultas en paralelo con Promise.allSettled para que el fallo de una no bloquee la otra
    const [resCat, resOri] = await Promise.allSettled([
      ServicioApi.filtrarPorCategoria(receta.categoria),
      ServicioApi.filtrarPorOrigen(receta.origen)
    ]);

    if (this.destruida || token !== this.tokenCarga) return;

    this.renderizarSeccionRelacionada(
      this.zonaRelCategoria,
      `Más recetas de la categoría "${receta.categoria}"`,
      resCat,
      receta.id,
      'categoria'
    );

    this.renderizarSeccionRelacionada(
      this.zonaRelOrigen,
      `Más recetas de cocina "${receta.origen}"`,
      resOri,
      receta.id,
      'origen'
    );
  }

  async renderizarSeccionRelacionada(
    contenedorSeccion,
    tituloTexto,
    resultadoPromesa,
    idActual,
    tipoRelacion
  ) {
    while (contenedorSeccion.firstChild) {
      contenedorSeccion.removeChild(contenedorSeccion.firstChild);
    }

    const enc = document.createElement('div');
    enc.className = 'encabezado-seccion';
    const h2 = document.createElement('h2');
    h2.className = 'titulo-seccion';
    h2.textContent = tituloTexto;
    enc.appendChild(h2);
    contenedorSeccion.appendChild(enc);

    if (resultadoPromesa.status === 'rejected') {
      const errComp = new EstadoCarga(contenedorSeccion, {
        modo: 'error',
        titulo: 'Fallo al obtener recetas relacionadas',
        mensaje: resultadoPromesa.reason.message,
        mostrarReintentar: true
      });
      errComp.elemento.dataset.reintento = tipoRelacion;
      this.componentesHijos.push(errComp);
      return;
    }

    const filtradas = (resultadoPromesa.value || [])
      .filter((r) => r.id !== String(idActual))
      .slice(0, 6);

    if (filtradas.length === 0) {
      const vacio = new EstadoCarga(contenedorSeccion, {
        modo: 'vacio',
        titulo: 'Sin recetas relacionadas adicionales',
        mensaje: 'No hay otras recetas registradas en este grupo.'
      });
      this.componentesHijos.push(vacio);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'cuadricula-tarjetas';
    contenedorSeccion.appendChild(grid);

    const detalles = await Promise.allSettled(
      filtradas.map((r) => ServicioApi.obtenerRecetaPorId(r.id))
    );

    if (this.destruida) return;

    detalles.forEach((det, i) => {
      if (det.status === 'fulfilled' && det.value) {
        const card = new TarjetaReceta(grid, {
          receta: det.value,
          falloDetalle: false
        });
        this.componentesHijos.push(card);
      } else {
        const cardInc = new TarjetaReceta(grid, {
          receta: filtradas[i],
          falloDetalle: true
        });
        this.componentesHijos.push(cardInc);
      }
    });
  }

  configurarEventos() {
    this.manejadorClick = async (e) => {
      const btnVolver = e.target.closest('[data-accion="volver-origen"]');
      if (btnVolver) {
        this.elemento.dispatchEvent(
          new CustomEvent('volver-vista-origen', { bubbles: true })
        );
        return;
      }

      const btnComp = e.target.closest('[data-accion="comparar-actual"]');
      if (btnComp && this.estado.receta) {
        this.elemento.dispatchEvent(
          new CustomEvent('agregar-al-comparador', {
            bubbles: true,
            detail: { id: this.estado.receta.id, receta: this.estado.receta }
          })
        );
        return;
      }

      const btnReintentar = e.target.closest('[data-accion="reintentar"]');
      if (btnReintentar) {
        const ctx = btnReintentar.closest('[data-reintento]');
        if (!ctx) return;
        const tipo = ctx.dataset.reintento;
        if (tipo === 'principal') {
          this.cargarRecetaYRelacionadas();
        } else if (tipo === 'categoria' && this.estado.receta) {
          const [resCat] = await Promise.allSettled([
            ServicioApi.filtrarPorCategoria(this.estado.receta.categoria)
          ]);
          if (!this.destruida) {
            this.renderizarSeccionRelacionada(
              this.zonaRelCategoria,
              `Más recetas de la categoría "${this.estado.receta.categoria}"`,
              resCat,
              this.estado.receta.id,
              'categoria'
            );
          }
        } else if (tipo === 'origen' && this.estado.receta) {
          const [resOri] = await Promise.allSettled([
            ServicioApi.filtrarPorOrigen(this.estado.receta.origen)
          ]);
          if (!this.destruida) {
            this.renderizarSeccionRelacionada(
              this.zonaRelOrigen,
              `Más recetas de cocina "${this.estado.receta.origen}"`,
              resOri,
              this.estado.receta.id,
              'origen'
            );
          }
        }
      }
    };

    this.elemento.addEventListener('click', this.manejadorClick);
    this.elemento.addEventListener('reintentar-detalle-tarjeta', async (e) => {
      const { id, tarjeta } = e.detail;
      tarjeta.actualizarEstado({ reintentando: true });
      try {
        const rec = await ServicioApi.obtenerRecetaPorId(id);
        if (!this.destruida && rec) {
          tarjeta.actualizarEstado({
            receta: rec,
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
    this.tokenCarga++;
    this.limpiarHijos();
    if (this.elemento) {
      this.elemento.removeEventListener('click', this.manejadorClick);
      if (this.elemento.parentNode) {
        this.elemento.parentNode.removeChild(this.elemento);
      }
    }
    this.elemento = null;
  }
}