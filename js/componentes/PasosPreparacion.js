class PasosPreparacion {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.estado = {
      pasos: props.pasos || []
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
    titulo.textContent = `Pasos de preparación (${this.estado.pasos.length})`;
    this.elemento.appendChild(titulo);

    const ol = document.createElement('ol');
    ol.className = 'lista-pasos';

    this.estado.pasos.forEach((textoPaso, indice) => {
      const li = document.createElement('li');
      li.className = 'item-paso';

      const num = document.createElement('span');
      num.className = 'paso-numero';
      num.textContent = String(indice + 1);

      const p = document.createElement('p');
      p.textContent = textoPaso;

      li.appendChild(num);
      li.appendChild(p);
      ol.appendChild(li);
    });

    this.elemento.appendChild(ol);
  }

  configurarEventos() {}

  destruir() {
    if (this.elemento && this.elemento.parentNode) {
      this.elemento.parentNode.removeChild(this.elemento);
    }
    this.elemento = null;
  }
}