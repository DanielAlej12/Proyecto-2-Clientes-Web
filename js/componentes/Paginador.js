class Paginador {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.estado = {
      paginaActual: props.paginaActual || 1,
      totalPaginas: props.totalPaginas || 1
    };
    this.elemento = null;
    this.manejadorClick = null;

    this.crearElemento();
    this.renderizar();
    this.configurarEventos();
  }

  crearElemento() {
    this.elemento = document.createElement('div');
    this.elemento.className = 'paginador';
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

    if (this.estado.totalPaginas <= 1) {
      this.elemento.style.display = 'none';
      return;
    }
    this.elemento.style.display = 'flex';

    const btnAnterior = document.createElement('button');
    btnAnterior.type = 'button';
    btnAnterior.className = 'boton';
    btnAnterior.dataset.pagina = String(this.estado.paginaActual - 1);
    btnAnterior.disabled = this.estado.paginaActual <= 1;
    btnAnterior.textContent = 'Anterior';

    const info = document.createElement('span');
    info.className = 'paginador-info';
    info.textContent = `Página ${this.estado.paginaActual} de ${this.estado.totalPaginas}`;

    const btnSiguiente = document.createElement('button');
    btnSiguiente.type = 'button';
    btnSiguiente.className = 'boton';
    btnSiguiente.dataset.pagina = String(this.estado.paginaActual + 1);
    btnSiguiente.disabled =
      this.estado.paginaActual >= this.estado.totalPaginas;
    btnSiguiente.textContent = 'Siguiente';

    this.elemento.appendChild(btnAnterior);
    this.elemento.appendChild(info);
    this.elemento.appendChild(btnSiguiente);
  }

  configurarEventos() {
    this.manejadorClick = (e) => {
      const btn = e.target.closest('[data-pagina]');
      if (!btn || btn.disabled) return;
      const nuevaPagina = Number(btn.dataset.pagina);
      this.elemento.dispatchEvent(
        new CustomEvent('cambio-pagina', {
          bubbles: true,
          detail: { pagina: nuevaPagina }
        })
      );
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