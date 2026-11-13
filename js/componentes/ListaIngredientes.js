class ListaIngredientes {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.estado = {
      ingredientes: props.ingredientes || []
    };
    this.elemento = null;

    this.crearElemento();
    this.renderizar();
    this.configurarEventos();
  }

  crearElemento() {
    this.elemento = document.createElement('section');
    this.contenedor.appendChild(this.elemento);
  }

  renderizar() {
    while (this.elemento.firstChild) {
      this.elemento.removeChild(this.elemento.firstChild);
    }

    const titulo = document.createElement('h3');
    titulo.className = 'titulo-seccion';
    titulo.style.fontSize = '1.35rem';
    titulo.style.marginBottom = '1rem';
    titulo.textContent = `Ingredientes (${this.estado.ingredientes.length})`;
    this.elemento.appendChild(titulo);

    const ul = document.createElement('ul');
    ul.className = 'cuadricula-ingredientes';

    for (const item of this.estado.ingredientes) {
      const li = document.createElement('li');
      li.className = 'item-ingrediente';

      const img = document.createElement('img');
      img.className = 'ingrediente-miniatura';
      img.src = item.imagen;
      img.alt = item.nombre;
      img.loading = 'lazy';
      img.addEventListener(
        'error',
        () => {
          img.src = 'assets/ingrediente-default.svg';
        },
        { once: true }
      );

      const spanNombre = document.createElement('span');
      spanNombre.className = 'ingrediente-nombre';
      spanNombre.textContent = item.nombre;

      const spanMedida = document.createElement('span');
      spanMedida.className = 'ingrediente-medida';
      spanMedida.textContent = item.medida;

      li.appendChild(img);
      li.appendChild(spanNombre);
      li.appendChild(spanMedida);
      ul.appendChild(li);
    }

    this.elemento.appendChild(ul);
  }

  configurarEventos() {
    // Los eventos de fallback de imagen se asocian individualmente a cada nodo img
  }

  destruir() {
    if (this.elemento && this.elemento.parentNode) {
      this.elemento.parentNode.removeChild(this.elemento);
    }
    this.elemento = null;
  }
}