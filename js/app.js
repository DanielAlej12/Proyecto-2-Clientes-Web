class AplicacionRecetario {
  constructor() {
    this.contenedorNav = document.getElementById('contenedor-navegacion');
    this.contenedorVista = document.getElementById('contenedor-vista');
    this.contenedorNotificaciones = document.getElementById(
      'contenedor-notificaciones'
    );
    this.contenedorModal = document.getElementById('contenedor-modal');

    this.estado = {
      vistaActualNombre: 'inicio',
      vistaInstancia: null,
      origenDetalle: null, // Guarda { nombreVista, estadoGuardado }
      comparador: {
        A: null,
        B: null
      }
    };

    this.barraNav = new BarraNavegacion(this.contenedorNav, {
      vistaActiva: 'inicio',
      cantidadComparador: 0
    });

    this.configurarEventosGlobales();
    this.cambiarVista('inicio');
  }

  contarRecetasComparador() {
    let cuenta = 0;
    if (this.estado.comparador.A) cuenta++;
    if (this.estado.comparador.B) cuenta++;
    return cuenta;
  }

  actualizarInsigniaNavegacion() {
    this.barraNav.actualizarEstado({
      vistaActiva: this.estado.vistaActualNombre,
      cantidadComparador: this.contarRecetasComparador()
    });
  }

  mostrarNotificacion(mensaje) {
    const aviso = document.createElement('div');
    aviso.className = 'aviso-flotante';
    aviso.textContent = mensaje;
    this.contenedorNotificaciones.appendChild(aviso);

    setTimeout(() => {
      if (aviso.parentNode) {
        aviso.parentNode.removeChild(aviso);
      }
    }, 3400);
  }

  mostrarModalReemplazoPanel(recetaNueva) {
    while (this.contenedorModal.firstChild) {
      this.contenedorModal.removeChild(this.contenedorModal.firstChild);
    }

    const fondo = document.createElement('div');
    fondo.className = 'modal-fondo';

    const caja = document.createElement('div');
    caja.className = 'modal-caja';
    caja.setAttribute('role', 'dialog');
    caja.setAttribute('aria-modal', 'true');

    const titulo = document.createElement('h3');
    titulo.className = 'titulo-seccion';
    titulo.style.fontSize = '1.3rem';
    titulo.textContent = 'Ambos paneles del comparador están ocupados';

    const desc = document.createElement('p');
    desc.textContent = `¿Qué panel deseas reemplazar con "${recetaNueva.nombre}"?`;

    const acciones = document.createElement('div');
    acciones.className = 'heroe-acciones';

    const btnPanelA = document.createElement('button');
    btnPanelA.type = 'button';
    btnPanelA.className = 'boton boton-primario';
    btnPanelA.textContent = `Reemplazar Panel A (${this.estado.comparador.A.nombre})`;

    const btnPanelB = document.createElement('button');
    btnPanelB.type = 'button';
    btnPanelB.className = 'boton boton-secundario';
    btnPanelB.textContent = `Reemplazar Panel B (${this.estado.comparador.B.nombre})`;

    const btnCancelar = document.createElement('button');
    btnCancelar.type = 'button';
    btnCancelar.className = 'boton';
    btnCancelar.textContent = 'Cancelar';

    const cerrarModal = () => {
      while (this.contenedorModal.firstChild) {
        this.contenedorModal.removeChild(this.contenedorModal.firstChild);
      }
    };

    btnPanelA.addEventListener('click', () => {
      this.estado.comparador.A = recetaNueva;
      cerrarModal();
      this.sincronizarComparador();
      this.mostrarNotificacion(
        `"${recetaNueva.nombre}" asignada al Panel A del comparador.`
      );
    });

    btnPanelB.addEventListener('click', () => {
      this.estado.comparador.B = recetaNueva;
      cerrarModal();
      this.sincronizarComparador();
      this.mostrarNotificacion(
        `"${recetaNueva.nombre}" asignada al Panel B del comparador.`
      );
    });

    btnCancelar.addEventListener('click', cerrarModal);

    acciones.appendChild(btnPanelA);
    acciones.appendChild(btnPanelB);
    acciones.appendChild(btnCancelar);

    caja.appendChild(titulo);
    caja.appendChild(desc);
    caja.appendChild(acciones);
    fondo.appendChild(caja);
    this.contenedorModal.appendChild(fondo);
  }

  async agregarRecetaAlComparador(idReceta, recetaPrevia = null, panelDestino = null) {
    let recetaCompleta = recetaPrevia && recetaPrevia.esCompleta ? recetaPrevia : null;

    if (!recetaCompleta) {
      try {
        this.mostrarNotificacion('Obteniendo datos completos para el comparador...');
        recetaCompleta = await ServicioApi.obtenerRecetaPorId(idReceta);
      } catch (error) {
        this.mostrarNotificacion(`No se pudo cargar la receta: ${error.message}`);
        return;
      }
    }

    if (!recetaCompleta) return;

    const idA = this.estado.comparador.A ? this.estado.comparador.A.id : null;
    const idB = this.estado.comparador.B ? this.estado.comparador.B.id : null;

    // Validar que no se compare una receta consigo misma
    if (idA === recetaCompleta.id || idB === recetaCompleta.id) {
      this.mostrarNotificacion(
        `Aviso: "${recetaCompleta.nombre}" ya está cargada en el comparador. No se puede comparar una receta consigo misma.`
      );
      return;
    }

    if (panelDestino === 'A' || panelDestino === 'B') {
      this.estado.comparador[panelDestino] = recetaCompleta;
      this.sincronizarComparador();
      this.mostrarNotificacion(
        `"${recetaCompleta.nombre}" cargada en el Panel ${panelDestino}.`
      );
      return;
    }

    if (!this.estado.comparador.A) {
      this.estado.comparador.A = recetaCompleta;
      this.sincronizarComparador();
      this.mostrarNotificacion(
        `"${recetaCompleta.nombre}" agregada al Panel A del comparador.`
      );
    } else if (!this.estado.comparador.B) {
      this.estado.comparador.B = recetaCompleta;
      this.sincronizarComparador();
      this.mostrarNotificacion(
        `"${recetaCompleta.nombre}" agregada al Panel B del comparador.`
      );
    } else {
      this.mostrarModalReemplazoPanel(recetaCompleta);
    }
  }

  sincronizarComparador() {
    this.actualizarInsigniaNavegacion();
    if (
      this.estado.vistaActualNombre === 'comparador' &&
      this.estado.vistaInstancia
    ) {
      this.estado.vistaInstancia.actualizarPaneles(
        this.estado.comparador.A,
        this.estado.comparador.B
      );
    }
  }

  cambiarVista(nombreVista, opciones = {}) {
    if (this.estado.vistaInstancia) {
      this.estado.vistaInstancia.destruir();
      this.estado.vistaInstancia = null;
    }

    this.estado.vistaActualNombre = nombreVista;
    this.actualizarInsigniaNavegacion();

    if (nombreVista === 'inicio') {
      this.estado.vistaInstancia = new VistaInicio(this.contenedorVista);
    } else if (nombreVista === 'explorar') {
      this.estado.vistaInstancia = new VistaExplorar(this.contenedorVista, {
        estadoPrevio: opciones.estadoPrevio || null
      });
    } else if (nombreVista === 'categorias-origenes') {
      this.estado.vistaInstancia = new VistaCategoriasOrigenes(
        this.contenedorVista,
        {
          estadoPrevio: opciones.estadoPrevio || null,
          pestanaInicial: opciones.pestanaInicial || 'categorias',
          categoriaInicial: opciones.categoriaInicial || null
        }
      );
    } else if (nombreVista === 'comparador') {
      this.estado.vistaInstancia = new VistaComparador(this.contenedorVista, {
        recetaA: this.estado.comparador.A,
        recetaB: this.estado.comparador.B
      });
    } else if (nombreVista === 'detalle') {
      this.estado.vistaInstancia = new VistaDetalle(this.contenedorVista, {
        idReceta: opciones.idReceta
      });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  abrirVistaDetalleConservandoOrigen(idReceta) {
    if (this.estado.vistaActualNombre !== 'detalle') {
      let estadoGuardado = null;
      if (
        this.estado.vistaInstancia &&
        typeof this.estado.vistaInstancia.obtenerEstadoParaHistorial ===
          'function'
      ) {
        estadoGuardado =
          this.estado.vistaInstancia.obtenerEstadoParaHistorial();
      }
      this.estado.origenDetalle = {
        nombreVista: this.estado.vistaActualNombre,
        estadoGuardado
      };
    }

    this.cambiarVista('detalle', { idReceta });
  }

  configurarEventosGlobales() {
    document.addEventListener('navegar-vista', (e) => {
      this.cambiarVista(e.detail.vista);
    });

    document.addEventListener('abrir-detalle', (e) => {
      this.abrirVistaDetalleConservandoOrigen(e.detail.id);
    });

    document.addEventListener('volver-vista-origen', () => {
      if (this.estado.origenDetalle) {
        const { nombreVista, estadoGuardado } = this.estado.origenDetalle;
        this.cambiarVista(nombreVista, { estadoPrevio: estadoGuardado });
      } else {
        this.cambiarVista('inicio');
      }
    });

    document.addEventListener('abrir-ficha-categoria', (e) => {
      this.cambiarVista('categorias-origenes', {
        pestanaInicial: 'categorias',
        categoriaInicial: e.detail.categoria
      });
    });

    document.addEventListener('agregar-al-comparador', (e) => {
      this.agregarRecetaAlComparador(e.detail.id, e.detail.receta);
    });

    document.addEventListener('seleccionar-receta-panel', (e) => {
      this.agregarRecetaAlComparador(
        e.detail.receta.id,
        e.detail.receta,
        e.detail.idPanel
      );
    });

    document.addEventListener('vaciar-panel-comparador', (e) => {
      const panel = e.detail.idPanel;
      this.estado.comparador[panel] = null;
      this.sincronizarComparador();
      this.mostrarNotificacion(`Se vació el Panel ${panel} del comparador.`);
    });

    document.addEventListener('intercambiar-recetas-comparador', () => {
      const temp = this.estado.comparador.A;
      this.estado.comparador.A = this.estado.comparador.B;
      this.estado.comparador.B = temp;
      this.sincronizarComparador();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AplicacionRecetario();
});