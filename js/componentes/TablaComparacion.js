class TablaComparacion {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.estado = {
      recetaA: props.recetaA,
      recetaB: props.recetaB,
      metricas: ServicioComparacion.calcularComparacion(
        props.recetaA,
        props.recetaB
      )
    };
    this.elemento = null;

    this.crearElemento();
    this.renderizar();
    this.configurarEventos();
  }

  crearElemento() {
    this.elemento = document.createElement('section');
    this.elemento.className = 'bloque-comparacion';
    this.contenedor.appendChild(this.elemento);
  }

  renderizar() {
    while (this.elemento.firstChild) {
      this.elemento.removeChild(this.elemento.firstChild);
    }

    const { recetaA, recetaB, metricas } = this.estado;

    // Veredicto de receta más sencilla
    const banner = document.createElement('div');
    banner.className = 'banner-veredicto';

    const tituloVeredicto = document.createElement('h3');
    tituloVeredicto.className = 'tarjeta-titulo';
    if (metricas.veredicto.ganadora === 'EMPATE') {
      tituloVeredicto.textContent = 'Veredicto de sencillez: ¡Empate técnico!';
    } else {
      tituloVeredicto.textContent = `Receta más sencilla: ${metricas.veredicto.nombreGanadora} (Panel ${metricas.veredicto.ganadora})`;
    }

    const pMotivo = document.createElement('p');
    pMotivo.textContent = `${metricas.veredicto.motivo} | Índice de similitud de ingredientes: ${metricas.similitud}%`;

    banner.appendChild(tituloVeredicto);
    banner.appendChild(pMotivo);
    this.elemento.appendChild(banner);

    // Tabla de métricas
    const tabla = document.createElement('table');
    tabla.className = 'tabla-comparativa';

    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    const thMetrica = document.createElement('th');
    thMetrica.textContent = 'Métrica';
    const thA = document.createElement('th');
    thA.textContent = `Panel A: ${recetaA.nombre}`;
    const thB = document.createElement('th');
    thB.textContent = `Panel B: ${recetaB.nombre}`;
    const thObs = document.createElement('th');
    thObs.textContent = 'Observación';

    trHead.appendChild(thMetrica);
    trHead.appendChild(thA);
    trHead.appendChild(thB);
    trHead.appendChild(thObs);
    thead.appendChild(trHead);
    tabla.appendChild(thead);

    const tbody = document.createElement('tbody');

    const agregarFila = (nombreMetrica, valA, valB, obs, menor = null) => {
      const tr = document.createElement('tr');
      const tdM = document.createElement('td');
      tdM.style.fontWeight = '700';
      tdM.textContent = nombreMetrica;

      const tdA = document.createElement('td');
      tdA.textContent = String(valA);
      if (menor === 'A') tdA.className = 'valor-menor-resaltado';

      const tdB = document.createElement('td');
      tdB.textContent = String(valB);
      if (menor === 'B') tdB.className = 'valor-menor-resaltado';

      const tdO = document.createElement('td');
      tdO.textContent = obs;

      tr.appendChild(tdM);
      tr.appendChild(tdA);
      tr.appendChild(tdB);
      tr.appendChild(tdO);
      tbody.appendChild(tr);
    };

    agregarFila(
      'Cantidad de ingredientes',
      metricas.cantidadIngredientes.a,
      metricas.cantidadIngredientes.b,
      metricas.cantidadIngredientes.menor === 'IGUAL'
        ? 'Misma cantidad'
        : `Menor en Panel ${metricas.cantidadIngredientes.menor}`,
      metricas.cantidadIngredientes.menor
    );

    agregarFila(
      'Cantidad de pasos',
      metricas.cantidadPasos.a,
      metricas.cantidadPasos.b,
      metricas.cantidadPasos.menor === 'IGUAL'
        ? 'Misma cantidad'
        : `Menor en Panel ${metricas.cantidadPasos.menor}`,
      metricas.cantidadPasos.menor
    );

    agregarFila(
      'Extensión de instrucciones (palabras)',
      metricas.palabrasInstrucciones.a,
      metricas.palabrasInstrucciones.b,
      metricas.palabrasInstrucciones.menor === 'IGUAL'
        ? 'Misma extensión'
        : `Más breve en Panel ${metricas.palabrasInstrucciones.menor}`,
      metricas.palabrasInstrucciones.menor
    );

    agregarFila(
      'Categoría',
      metricas.categoria.a,
      metricas.categoria.b,
      metricas.categoria.coinciden ? 'Coinciden' : 'Distinta categoría'
    );

    agregarFila(
      'Origen',
      metricas.origen.a,
      metricas.origen.b,
      metricas.origen.coinciden ? 'Coinciden' : 'Distinto origen'
    );

    agregarFila(
      'Video de preparación',
      metricas.video.a ? 'Sí tiene video' : 'No tiene video',
      metricas.video.b ? 'Sí tiene video' : 'No tiene video',
      metricas.video.a && metricas.video.b
        ? 'Ambas cuentan con video'
        : 'Disponibilidad multimedia'
    );

    agregarFila(
      'Similitud de ingredientes',
      `${metricas.similitud}%`,
      `${metricas.similitud}%`,
      `${metricas.ingredientesComunes.length} ingredientes en común`
    );

    tabla.appendChild(tbody);
    this.elemento.appendChild(tabla);

    // Bloques de etiquetas e ingredientes en común / exclusivos
    const gridListas = document.createElement('div');
    gridListas.className = 'comparacion-listas-grid';

    const crearCajaLista = (tituloCaja, elementos, textoVacio) => {
      const caja = document.createElement('div');
      caja.className = 'caja-metricas-lista';

      const h4 = document.createElement('h4');
      h4.className = 'tarjeta-titulo';
      h4.style.marginBottom = '0.6rem';
      h4.textContent = `${tituloCaja} (${elementos.length})`;
      caja.appendChild(h4);

      if (elementos.length === 0) {
        const p = document.createElement('p');
        p.className = 'subtitulo-seccion';
        p.textContent = textoVacio;
        caja.appendChild(p);
      } else {
        const contenedorPildoras = document.createElement('div');
        contenedorPildoras.className = 'etiquetas-fila';
        for (const el of elementos) {
          const span = document.createElement('span');
          span.className = 'pildora';
          span.textContent = el;
          contenedorPildoras.appendChild(span);
        }
        caja.appendChild(contenedorPildoras);
      }
      return caja;
    };

    gridListas.appendChild(
      crearCajaLista(
        'Etiquetas en común',
        metricas.etiquetasComunes,
        'Sin etiquetas en común'
      )
    );
    gridListas.appendChild(
      crearCajaLista(
        'Ingredientes en común',
        metricas.ingredientesComunes,
        'Sin ingredientes en común'
      )
    );
    gridListas.appendChild(
      crearCajaLista(
        `Exclusivos de A (${recetaA.nombre})`,
        metricas.exclusivosA,
        'Ninguno exclusivo'
      )
    );
    gridListas.appendChild(
      crearCajaLista(
        `Exclusivos de B (${recetaB.nombre})`,
        metricas.exclusivosB,
        'Ninguno exclusivo'
      )
    );

    this.elemento.appendChild(gridListas);
  }

  configurarEventos() {}

  destruir() {
    if (this.elemento && this.elemento.parentNode) {
      this.elemento.parentNode.removeChild(this.elemento);
    }
    this.elemento = null;
  }
}