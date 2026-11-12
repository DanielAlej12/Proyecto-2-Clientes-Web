class TarjetaReceta {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.estado = {
      receta: props.receta,
      falloDetalle: Boolean(props.falloDetalle),
      reintentando: false
    };
    this.elemento = null;
    this.manejadorClick = null;

    this.crearElemento();
    this.renderizar();
    this.configurarEventos();
  }

  crearElemento() {
    this.elemento = document.createElement('article');
    this.contenedor.appendChild(this.elemento);
  }

  actualizarEstado(nuevoEstado) {
    this.estado = { ...this.estado, ...nuevoEstado };
    this.renderizar();
  }

  renderizar() {
    while (this.elemento.firstChild) {
      this.elemento.removeChild(this.elemento.firstChild);
    }

    const { receta, falloDetalle, reintentando } = this.estado;
    this.elemento.className = falloDetalle
      ? 'tarjeta tarjeta-incompleta'
      : 'tarjeta';

    const contenedorImg = document.createElement('div');
    contenedorImg.className = 'tarjeta-imagen-contenedor';

    const img = document.createElement('img');
    img.className = 'tarjeta-imagen';
    img.src = receta.imagen;
    img.alt = receta.nombre;
    img.loading = 'lazy';
    contenedorImg.appendChild(img);

    const cuerpo = document.createElement('div');
    cuerpo.className = 'tarjeta-cuerpo';

    const h3 = document.createElement('h3');
    h3.className = 'tarjeta-titulo';
    h3.textContent = receta.nombre;
    cuerpo.appendChild(h3);

    if (receta.esCompleta) {
      const filaPildoras = document.createElement('div');
      filaPildoras.className = 'etiquetas-fila';

      const pCat = document.createElement('span');
      pCat.className = 'pildora pildora-categoria';
      pCat.textContent = receta.categoria;

      const pOri = document.createElement('span');
      pOri.className = 'pildora pildora-origen';
      pOri.textContent = receta.origen;

      filaPildoras.appendChild(pCat);
      filaPildoras.appendChild(pOri);
      cuerpo.appendChild(filaPildoras);

      const meta = document.createElement('p');
      meta.className = 'tarjeta-meta';
      meta.textContent = `${receta.cantidadIngredientes} ingredientes`;
      cuerpo.appendChild(meta);
    } else if (falloDetalle) {
      const aviso = document.createElement('div');
      aviso.className = 'tarjeta-aviso-incompleto';

      const txt = document.createElement('span');
      txt.textContent = reintentando
        ? 'Reintentando...'
        : 'Ficha incompleta (falló carga)';

      const btnReintentar = document.createElement('button');
      btnReintentar.type = 'button';
      btnReintentar.className = 'boton';
      btnReintentar.style.padding = '0.25rem 0.55rem';
      btnReintentar.style.fontSize = '0.75rem';
      btnReintentar.dataset.accion = 'reintentar-tarjeta';
      btnReintentar.disabled = reintentando;
      btnReintentar.textContent = 'Reintentar';

      aviso.appendChild(txt);
      aviso.appendChild(btnReintentar);
      cuerpo.appendChild(aviso);
    }

    const acciones = document.createElement('div');
    acciones.className = 'tarjeta-acciones';

    const btnDetalle = document.createElement('button');
    btnDetalle.type = 'button';
    btnDetalle.className = 'boton boton-primario';
    btnDetalle.dataset.accion = 'ver-detalle';
    btnDetalle.textContent = 'Ver receta';

    const btnComparar = document.createElement('button');
    btnComparar.type = 'button';
    btnComparar.className = 'boton';
    btnComparar.dataset.accion = 'agregar-comparador';
    btnComparar.textContent = '+ Comparar';

    acciones.appendChild(btnDetalle);
    acciones.appendChild(btnComparar);
    cuerpo.appendChild(acciones);

    this.elemento.appendChild(contenedorImg);
    this.elemento.appendChild(cuerpo);
  }

  configurarEventos() {
    this.manejadorClick = (e) => {
      const boton = e.target.closest('[data-accion]');
      if (!boton) return;
      const accion = boton.dataset.accion;

      if (accion === 'ver-detalle') {
        this.elemento.dispatchEvent(
          new CustomEvent('abrir-detalle', {
            bubbles: true,
            detail: { id: this.estado.receta.id }
          })
        );
      } else if (accion === 'agregar-comparador') {
        this.elemento.dispatchEvent(
          new CustomEvent('agregar-al-comparador', {
            bubbles: true,
            detail: { id: this.estado.receta.id, receta: this.estado.receta }
          })
        );
      } else if (accion === 'reintentar-tarjeta') {
        this.elemento.dispatchEvent(
          new CustomEvent('reintentar-detalle-tarjeta', {
            bubbles: true,
            detail: { id: this.estado.receta.id, tarjeta: this }
          })
        );
      }
    };
    this.elemento.addEventListener('click', this.manejadorClick);
  }

  destruir() {
    if (this.elemento && this.manejadorClick) {
      this.elemento.removeEventListener('click', this.manejadorClick);
    }
    if (this.elemento && this.elemento.parentNode) {
      this.elemento.parentNode.removeChild(this.elemento);
    }
    this.elemento = null;
  }
}