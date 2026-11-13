class VistaComparador {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.estado = {
      recetaA: props.recetaA || null,
      recetaB: props.recetaB || null
    };

    this.elemento = null;
    this.zonaPaneles = null;
    this.zonaTabla = null;
    this.panelAComp = null;
    this.panelBComp = null;
    this.tablaComp = null;
    this.estadoVacioComp = null;
    this.manejadorClick = null;

    this.crearElemento();
    this.renderizar();
    this.configurarEventos();
  }

  crearElemento() {
    this.elemento = document.createElement('div');
    this.elemento.className = 'vista-contenedor';
    this.contenedor.appendChild(this.elemento);
  }

  actualizarPaneles(recetaA, recetaB) {
    this.estado.recetaA = recetaA;
    this.estado.recetaB = recetaB;
    if (this.panelAComp) this.panelAComp.actualizarReceta(recetaA);
    if (this.panelBComp) this.panelBComp.actualizarReceta(recetaB);
    this.renderizarZonaComparacion();
  }

  renderizar() {
    while (this.elemento.firstChild) {
      this.elemento.removeChild(this.elemento.firstChild);
    }

    const enc = document.createElement('div');
    enc.className = 'encabezado-seccion';
    const h1 = document.createElement('h1');
    h1.className = 'titulo-seccion';
    h1.textContent = 'Comparador Lado a Lado';

    const btnIntercambiar = document.createElement('button');
    btnIntercambiar.type = 'button';
    btnIntercambiar.className = 'boton boton-secundario';
    btnIntercambiar.dataset.accion = 'intercambiar-paneles';
    btnIntercambiar.textContent = '⇄ Intercambiar Panel A y Panel B';

    enc.appendChild(h1);
    enc.appendChild(btnIntercambiar);

    this.zonaPaneles = document.createElement('div');
    this.zonaPaneles.className = 'comparador-paneles';

    this.panelAComp = new PanelComparador(this.zonaPaneles, {
      idPanel: 'A',
      receta: this.estado.recetaA
    });

    this.panelBComp = new PanelComparador(this.zonaPaneles, {
      idPanel: 'B',
      receta: this.estado.recetaB
    });

    this.zonaTabla = document.createElement('div');

    this.elemento.appendChild(enc);
    this.elemento.appendChild(this.zonaPaneles);
    this.elemento.appendChild(this.zonaTabla);

    this.renderizarZonaComparacion();
  }

  renderizarZonaComparacion() {
    if (this.tablaComp) {
      this.tablaComp.destruir();
      this.tablaComp = null;
    }
    if (this.estadoVacioComp) {
      this.estadoVacioComp.destruir();
      this.estadoVacioComp = null;
    }
    while (this.zonaTabla.firstChild) {
      this.zonaTabla.removeChild(this.zonaTabla.firstChild);
    }

    if (this.estado.recetaA && this.estado.recetaB) {
      this.tablaComp = new TablaComparacion(this.zonaTabla, {
        recetaA: this.estado.recetaA,
        recetaB: this.estado.recetaB
      });
    } else {
      this.estadoVacioComp = new EstadoCarga(this.zonaTabla, {
        modo: 'vacio',
        titulo: 'Selecciona dos recetas para comparar',
        mensaje:
          'Cuando tanto el Panel A como el Panel B tengan una receta asignada, verás aquí la tabla de métricas, ingredientes en común, similitud y cuál es más sencilla.'
      });
    }
  }

  configurarEventos() {
    this.manejadorClick = (e) => {
      const btnSwap = e.target.closest('[data-accion="intercambiar-paneles"]');
      if (btnSwap) {
        this.elemento.dispatchEvent(
          new CustomEvent('intercambiar-recetas-comparador', { bubbles: true })
        );
      }
    };
    this.elemento.addEventListener('click', this.manejadorClick);
  }

  destruir() {
    if (this.panelAComp) this.panelAComp.destruir();
    if (this.panelBComp) this.panelBComp.destruir();
    if (this.tablaComp) this.tablaComp.destruir();
    if (this.estadoVacioComp) this.estadoVacioComp.destruir();

    if (this.elemento) {
      this.elemento.removeEventListener('click', this.manejadorClick);
      if (this.elemento.parentNode) {
        this.elemento.parentNode.removeChild(this.elemento);
      }
    }
    this.elemento = null;
  }
}