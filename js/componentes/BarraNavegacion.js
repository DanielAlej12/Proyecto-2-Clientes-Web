class BarraNavegacion {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.estado = {
      vistaActiva: props.vistaActiva || 'inicio',
      cantidadComparador: props.cantidadComparador || 0
    };
    this.elemento = null;
    this.manejadorClick = null;

    this.crearElemento();
    this.renderizar();
    this.configurarEventos();
  }

  crearElemento() {
    this.elemento = document.createElement('nav');
    this.elemento.className = 'barra-nav';
    this.elemento.setAttribute('aria-label', 'Navegación principal');
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

    const botonMarca = document.createElement('button');
    botonMarca.type = 'button';
    botonMarca.className = 'marca-app';
    botonMarca.dataset.vista = 'inicio';

    const icono = document.createElement('span');
    icono.className = 'marca-icono';
    icono.textContent = 'GB';

    const textosMarca = document.createElement('div');
    const titulo = document.createElement('span');
    titulo.className = 'marca-titulo';
    titulo.textContent = 'GastroBitácora';

    const subtitulo = document.createElement('span');
    subtitulo.className = 'marca-subtitulo';
    subtitulo.textContent = 'Explorador y Comparador Culinario';

    textosMarca.appendChild(titulo);
    textosMarca.appendChild(subtitulo);
    botonMarca.appendChild(icono);
    botonMarca.appendChild(textosMarca);

    const ul = document.createElement('ul');
    ul.className = 'lista-nav';

    const items = [
      { id: 'inicio', texto: 'Inicio' },
      { id: 'explorar', texto: 'Explorar' },
      { id: 'categorias-origenes', texto: 'Categorías y orígenes' },
      { id: 'comparador', texto: 'Comparador', conContador: true }
    ];

    for (const item of items) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        this.estado.vistaActiva === item.id
          ? 'boton-nav activo'
          : 'boton-nav';
      btn.dataset.vista = item.id;

      const spanTexto = document.createElement('span');
      spanTexto.textContent = item.texto;
      btn.appendChild(spanTexto);

      if (item.conContador) {
        const insignia = document.createElement('span');
        insignia.className = 'insignia-comparador';
        insignia.textContent = String(this.estado.cantidadComparador);
        btn.appendChild(insignia);
      }

      li.appendChild(btn);
      ul.appendChild(li);
    }

    this.elemento.appendChild(botonMarca);
    this.elemento.appendChild(ul);
  }

  configurarEventos() {
    this.manejadorClick = (e) => {
      const btn = e.target.closest('[data-vista]');
      if (!btn) return;
      const vistaDestino = btn.dataset.vista;
      this.elemento.dispatchEvent(
        new CustomEvent('navegar-vista', {
          bubbles: true,
          detail: { vista: vistaDestino }
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