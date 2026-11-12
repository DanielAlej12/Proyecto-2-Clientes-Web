class VistaInicio {
  constructor(contenedor) {
    this.contenedor = contenedor;
    this.estado = {
      recetaDestacada: null,
      categorias: [],
      cargandoReceta: false,
      errorReceta: null,
      cargandoCategorias: false,
      errorCategorias: null
    };

    this.elemento = null;
    this.seccionReceta = null;
    this.seccionCategorias = null;
    this.componentesHijos = [];
    this.destruida = false;
    this.idPeticionReceta = 0;
    this.idPeticionCategorias = 0;
    this.manejadorClick = null;

    this.crearElemento();
    this.renderizar();
    this.configurarEventos();
    this.cargarDatosInicialesEnParalelo();
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

    // Bloque Receta Destacada
    const bloqueHeroe = document.createElement('section');
    bloqueHeroe.className = 'seccion-bloque';

    const encHeroe = document.createElement('div');
    encHeroe.className = 'encabezado-seccion';
    const titHeroe = document.createElement('h1');
    titHeroe.className = 'titulo-seccion';
    titHeroe.textContent = 'Sugerencia del Chef al Azar';
    encHeroe.appendChild(titHeroe);

    this.seccionReceta = document.createElement('div');
    bloqueHeroe.appendChild(encHeroe);
    bloqueHeroe.appendChild(this.seccionReceta);

    // Bloque Categorías
    const bloqueCat = document.createElement('section');
    bloqueCat.className = 'seccion-bloque';

    const encCat = document.createElement('div');
    encCat.className = 'encabezado-seccion';
    const titCat = document.createElement('h2');
    titCat.className = 'titulo-seccion';
    titCat.textContent = 'Explorar por Categorías';
    encCat.appendChild(titCat);

    this.seccionCategorias = document.createElement('div');
    bloqueCat.appendChild(encCat);
    bloqueCat.appendChild(this.seccionCategorias);

    this.elemento.appendChild(bloqueHeroe);
    this.elemento.appendChild(bloqueCat);
  }

  async cargarDatosInicialesEnParalelo() {
    this.estado.cargandoReceta = true;
    this.estado.cargandoCategorias = true;
    this.estado.errorReceta = null;
    this.estado.errorCategorias = null;
    this.renderizarSeccionReceta();
    this.renderizarSeccionCategorias();

    const tokenReceta = ++this.idPeticionReceta;
    const tokenCategorias = ++this.idPeticionCategorias;

    const [resReceta, resCategorias] = await Promise.allSettled([
      ServicioApi.obtenerRecetaAleatoria(),
      ServicioApi.obtenerCategorias()
    ]);

    if (this.destruida) return;

    if (tokenReceta === this.idPeticionReceta) {
      this.estado.cargandoReceta = false;
      if (resReceta.status === 'fulfilled') {
        this.estado.recetaDestacada = resReceta.value;
      } else {
        this.estado.errorReceta = resReceta.reason.message;
      }
      this.renderizarSeccionReceta();
    }

    if (tokenCategorias === this.idPeticionCategorias) {
      this.estado.cargandoCategorias = false;
      if (resCategorias.status === 'fulfilled') {
        this.estado.categorias = resCategorias.value;
      } else {
        this.estado.errorCategorias = resCategorias.reason.message;
      }
      this.renderizarSeccionCategorias();
    }
  }

  async solicitarOtraRecetaAleatoria() {
    const idActual = this.estado.recetaDestacada
      ? this.estado.recetaDestacada.id
      : null;
    this.estado.cargandoReceta = true;
    this.estado.errorReceta = null;
    this.renderizarSeccionReceta();

    const token = ++this.idPeticionReceta;
    try {
      const nueva = await ServicioApi.obtenerRecetaAleatoria(idActual);
      if (this.destruida || token !== this.idPeticionReceta) return;
      this.estado.cargandoReceta = false;
      this.estado.recetaDestacada = nueva;
      this.renderizarSeccionReceta();
    } catch (error) {
      if (this.destruida || token !== this.idPeticionReceta) return;
      this.estado.cargandoReceta = false;
      this.estado.errorReceta = error.message;
      this.renderizarSeccionReceta();
    }
  }

  async reintentarCategorias() {
    this.estado.cargandoCategorias = true;
    this.estado.errorCategorias = null;
    this.renderizarSeccionCategorias();

    const token = ++this.idPeticionCategorias;
    try {
      const lista = await ServicioApi.obtenerCategorias();
      if (this.destruida || token !== this.idPeticionCategorias) return;
      this.estado.cargandoCategorias = false;
      this.estado.categorias = lista;
      this.renderizarSeccionCategorias();
    } catch (error) {
      if (this.destruida || token !== this.idPeticionCategorias) return;
      this.estado.cargandoCategorias = false;
      this.estado.errorCategorias = error.message;
      this.renderizarSeccionCategorias();
    }
  }

  renderizarSeccionReceta() {
    while (this.seccionReceta.firstChild) {
      this.seccionReceta.removeChild(this.seccionReceta.firstChild);
    }

    if (this.estado.cargandoReceta) {
      const comp = new EstadoCarga(this.seccionReceta, {
        modo: 'carga',
        variante: 'heroe'
      });
      this.componentesHijos.push(comp);
      return;
    }

    if (this.estado.errorReceta) {
      const comp = new EstadoCarga(this.seccionReceta, {
        modo: 'error',
        titulo: 'No se pudo cargar la receta destacada',
        mensaje: this.estado.errorReceta,
        mostrarReintentar: true
      });
      comp.elemento.dataset.contextoReintento = 'receta';
      this.componentesHijos.push(comp);
      return;
    }

    const r = this.estado.recetaDestacada;
    if (!r) return;

    const heroe = document.createElement('article');
    heroe.className = 'heroe-destacado';

    const envImg = document.createElement('div');
    envImg.className = 'heroe-imagen-envoltorio';
    const img = document.createElement('img');
    img.className = 'heroe-imagen';
    img.src = r.imagen;
    img.alt = r.nombre;
    envImg.appendChild(img);

    const cont = document.createElement('div');
    cont.className = 'heroe-contenido';

    const pildoras = document.createElement('div');
    pildoras.className = 'etiquetas-fila';

    const pCat = document.createElement('span');
    pCat.className = 'pildora pildora-categoria';
    pCat.textContent = r.categoria;

    const pOri = document.createElement('span');
    pOri.className = 'pildora pildora-origen';
    pOri.textContent = r.origen;

    pildoras.appendChild(pCat);
    pildoras.appendChild(pOri);

    const h2 = document.createElement('h2');
    h2.className = 'heroe-titulo';
    h2.textContent = r.nombre;

    const acciones = document.createElement('div');
    acciones.className = 'heroe-acciones';

    const btnDetalle = document.createElement('button');
    btnDetalle.type = 'button';
    btnDetalle.className = 'boton boton-primario';
    btnDetalle.dataset.accion = 'ver-detalle-heroe';
    btnDetalle.textContent = 'Ver preparación completa';

    const btnOtra = document.createElement('button');
    btnOtra.type = 'button';
    btnOtra.className = 'boton boton-secundario';
    btnOtra.dataset.accion = 'otra-receta';
    btnOtra.textContent = 'Otra receta al azar';

    const btnComp = document.createElement('button');
    btnComp.type = 'button';
    btnComp.className = 'boton';
    btnComp.dataset.accion = 'comparar-heroe';
    btnComp.textContent = '+ Comparador';

    acciones.appendChild(btnDetalle);
    acciones.appendChild(btnOtra);
    acciones.appendChild(btnComp);

    cont.appendChild(pildoras);
    cont.appendChild(h2);
    cont.appendChild(acciones);

    heroe.appendChild(envImg);
    heroe.appendChild(cont);
    this.seccionReceta.appendChild(heroe);
  }

  renderizarSeccionCategorias() {
    while (this.seccionCategorias.firstChild) {
      this.seccionCategorias.removeChild(this.seccionCategorias.firstChild);
    }

    if (this.estado.cargandoCategorias) {
      const comp = new EstadoCarga(this.seccionCategorias, {
        modo: 'carga',
        variante: 'tarjetas',
        cantidad: 6
      });
      this.componentesHijos.push(comp);
      return;
    }

    if (this.estado.errorCategorias) {
      const comp = new EstadoCarga(this.seccionCategorias, {
        modo: 'error',
        titulo: 'No se pudo cargar el catálogo de categorías',
        mensaje: this.estado.errorCategorias,
        mostrarReintentar: true
      });
      comp.elemento.dataset.contextoReintento = 'categorias';
      this.componentesHijos.push(comp);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'cuadricula-tarjetas';

    for (const cat of this.estado.categorias) {
      const card = document.createElement('article');
      card.className = 'tarjeta';

      const imgWrap = document.createElement('div');
      imgWrap.className = 'tarjeta-imagen-contenedor';
      imgWrap.style.padding = '1rem';
      const img = document.createElement('img');
      img.className = 'tarjeta-imagen';
      img.style.objectFit = 'contain';
      img.src = cat.imagen;
      img.alt = cat.nombre;
      img.loading = 'lazy';
      imgWrap.appendChild(img);

      const cuerpo = document.createElement('div');
      cuerpo.className = 'tarjeta-cuerpo';

      const h3 = document.createElement('h3');
      h3.className = 'tarjeta-titulo';
      h3.textContent = cat.nombre;

      const desc = document.createElement('p');
      desc.className = 'tarjeta-descripcion';
      const primeros120 = cat.descripcion.slice(0, 120).trim();
      desc.textContent = `${primeros120}...`;

      const acciones = document.createElement('div');
      acciones.className = 'tarjeta-acciones';
      const btnAbrir = document.createElement('button');
      btnAbrir.type = 'button';
      btnAbrir.className = 'boton boton-primario';
      btnAbrir.dataset.categoria = cat.nombre;
      btnAbrir.textContent = 'Abrir ficha de categoría';
      acciones.appendChild(btnAbrir);

      cuerpo.appendChild(h3);
      cuerpo.appendChild(desc);
      cuerpo.appendChild(acciones);

      card.appendChild(imgWrap);
      card.appendChild(cuerpo);
      grid.appendChild(card);
    }

    this.seccionCategorias.appendChild(grid);
  }

  configurarEventos() {
    this.manejadorClick = (e) => {
      const btnAccion = e.target.closest('[data-accion]');
      if (btnAccion) {
        const accion = btnAccion.dataset.accion;
        if (accion === 'otra-receta') {
          this.solicitarOtraRecetaAleatoria();
        } else if (
          accion === 'ver-detalle-heroe' &&
          this.estado.recetaDestacada
        ) {
          this.elemento.dispatchEvent(
            new CustomEvent('abrir-detalle', {
              bubbles: true,
              detail: { id: this.estado.recetaDestacada.id }
            })
          );
        } else if (
          accion === 'comparar-heroe' &&
          this.estado.recetaDestacada
        ) {
          this.elemento.dispatchEvent(
            new CustomEvent('agregar-al-comparador', {
              bubbles: true,
              detail: {
                id: this.estado.recetaDestacada.id,
                receta: this.estado.recetaDestacada
              }
            })
          );
        }
        return;
      }

      const btnCat = e.target.closest('[data-categoria]');
      if (btnCat) {
        this.elemento.dispatchEvent(
          new CustomEvent('abrir-ficha-categoria', {
            bubbles: true,
            detail: { categoria: btnCat.dataset.categoria }
          })
        );
        return;
      }

      const btnReintentar = e.target.closest('[data-accion="reintentar"]');
      if (btnReintentar) {
        const contenedorEstado = btnReintentar.closest(
          '[data-contexto-reintento]'
        );
        if (!contenedorEstado) return;
        if (contenedorEstado.dataset.contextoReintento === 'receta') {
          this.solicitarOtraRecetaAleatoria();
        } else if (
          contenedorEstado.dataset.contextoReintento === 'categorias'
        ) {
          this.reintentarCategorias();
        }
      }
    };

    this.elemento.addEventListener('click', this.manejadorClick);
  }

  destruir() {
    this.destruida = true;
    for (const comp of this.componentesHijos) {
      comp.destruir();
    }
    this.componentesHijos = [];

    if (this.elemento) {
      this.elemento.removeEventListener('click', this.manejadorClick);
      if (this.elemento.parentNode) {
        this.elemento.parentNode.removeChild(this.elemento);
      }
    }
    this.elemento = null;
  }
}
