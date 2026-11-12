class EstadoCarga {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.estado = {
      modo: props.modo || 'carga', // 'carga' | 'vacio' | 'error'
      variante: props.variante || 'tarjetas', // 'heroe' | 'tarjetas' | 'detalle' | 'panel'
      cantidad: props.cantidad || 4,
      titulo: props.titulo || '',
      mensaje: props.mensaje || '',
      mostrarReintentar: Boolean(props.mostrarReintentar)
    };
    this.elemento = null;
    this.manejadorClick = null;

    this.crearElemento();
    this.renderizar();
    this.configurarEventos();
  }

  crearElemento() {
    this.elemento = document.createElement('div');
    this.contenedor.appendChild(this.elemento);
  }

  renderizar() {
    while (this.elemento.firstChild) {
      this.elemento.removeChild(this.elemento.firstChild);
    }

    if (this.estado.modo === 'carga') {
      if (this.estado.variante === 'heroe') {
        this.elemento.className = 'skeleton-pulso skeleton-heroe';
      } else if (this.estado.variante === 'detalle') {
        this.elemento.className = 'skeleton-pulso skeleton-detalle';
      } else if (this.estado.variante === 'panel') {
        this.elemento.className = 'skeleton-pulso skeleton-panel';
      } else {
        this.elemento.className = 'cuadricula-tarjetas';
        for (let i = 0; i < this.estado.cantidad; i++) {
          const item = document.createElement('div');
          item.className = 'skeleton-pulso skeleton-tarjeta';
          this.elemento.appendChild(item);
        }
      }
      return;
    }

    this.elemento.className =
      this.estado.modo === 'error'
        ? 'estado-contenedor estado-error'
        : 'estado-contenedor';

    if (this.estado.titulo) {
      const h3 = document.createElement('h3');
      h3.className = 'tarjeta-titulo';
      h3.textContent = this.estado.titulo;
      this.elemento.appendChild(h3);
    }

    if (this.estado.mensaje) {
      const p = document.createElement('p');
      p.style.marginTop = '0.45rem';
      p.textContent = this.estado.mensaje;
      this.elemento.appendChild(p);
    }

    if (this.estado.mostrarReintentar) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'boton boton-primario';
      btn.style.marginTop = '1rem';
      btn.dataset.accion = 'reintentar';
      btn.textContent = 'Reintentar consulta';
      this.elemento.appendChild(btn);
    }
  }

  configurarEventos() {
    this.manejadorClick = (e) => {
      const boton = e.target.closest('[data-accion="reintentar"]');
      if (boton) {
        this.elemento.dispatchEvent(
          new CustomEvent('reintentar-accion', { bubbles: true })
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
