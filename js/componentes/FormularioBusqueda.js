class FormularioBusqueda {
  constructor(contenedor, props = {}) {
    this.contenedor = contenedor;
    this.estado = {
      categorias: props.categorias || [],
      origenes: props.origenes || [],
      ingredientes: props.ingredientes || [],
      valores: {
        nombre: (props.valoresIniciales && props.valoresIniciales.nombre) || '',
        categoria:
          (props.valoresIniciales && props.valoresIniciales.categoria) || '',
        origen: (props.valoresIniciales && props.valoresIniciales.origen) || '',
        ingrediente:
          (props.valoresIniciales && props.valoresIniciales.ingrediente) || ''
      },
      sugerenciasIngrediente: [],
      mensajeError: ''
    };

    this.elemento = null;
    this.nodoSugerencias = null;
    this.nodoError = null;
    this.manejadorSubmit = null;
    this.manejadorInput = null;
    this.manejadorClick = null;

    this.crearElemento();
    this.renderizar();
    this.configurarEventos();
  }

  crearElemento() {
    this.elemento = document.createElement('form');
    this.elemento.className = 'panel-busqueda';
    this.elemento.noValidate = true;
    this.contenedor.appendChild(this.elemento);
  }

  renderizar() {
    while (this.elemento.firstChild) {
      this.elemento.removeChild(this.elemento.firstChild);
    }

    const grid = document.createElement('div');
    grid.className = 'formulario-grid';

    // 1. Campo Nombre
    const grupoNombre = document.createElement('div');
    grupoNombre.className = 'campo-grupo';
    const lblNombre = document.createElement('label');
    lblNombre.className = 'campo-etiqueta';
    lblNombre.setAttribute('for', 'campo-nombre');
    lblNombre.textContent = 'Nombre de la receta';

    const inputNombre = document.createElement('input');
    inputNombre.type = 'text';
    inputNombre.id = 'campo-nombre';
    inputNombre.name = 'nombre';
    inputNombre.className = 'campo-control';
    inputNombre.placeholder = 'Ej. Arrabiata, Tacos...';
    inputNombre.value = this.estado.valores.nombre;

    grupoNombre.appendChild(lblNombre);
    grupoNombre.appendChild(inputNombre);

    // 2. Selector Categoría
    const grupoCategoria = document.createElement('div');
    grupoCategoria.className = 'campo-grupo';
    const lblCategoria = document.createElement('label');
    lblCategoria.className = 'campo-etiqueta';
    lblCategoria.setAttribute('for', 'campo-categoria');
    lblCategoria.textContent = 'Categoría';

    const selectCategoria = document.createElement('select');
    selectCategoria.id = 'campo-categoria';
    selectCategoria.name = 'categoria';
    selectCategoria.className = 'selector-control';

    const opCatTodas = document.createElement('option');
    opCatTodas.value = '';
    opCatTodas.textContent = 'Todas las categorías';
    selectCategoria.appendChild(opCatTodas);

    for (const cat of this.estado.categorias) {
      const op = document.createElement('option');
      op.value = cat.nombre;
      op.textContent = cat.nombre;
      if (this.estado.valores.categoria === cat.nombre) op.selected = true;
      selectCategoria.appendChild(op);
    }

    grupoCategoria.appendChild(lblCategoria);
    grupoCategoria.appendChild(selectCategoria);

    // 3. Selector Origen
    const grupoOrigen = document.createElement('div');
    grupoOrigen.className = 'campo-grupo';
    const lblOrigen = document.createElement('label');
    lblOrigen.className = 'campo-etiqueta';
    lblOrigen.setAttribute('for', 'campo-origen');
    lblOrigen.textContent = 'Origen (Cocina)';

    const selectOrigen = document.createElement('select');
    selectOrigen.id = 'campo-origen';
    selectOrigen.name = 'origen';
    selectOrigen.className = 'selector-control';

    const opOriTodos = document.createElement('option');
    opOriTodos.value = '';
    opOriTodos.textContent = 'Todos los orígenes';
    selectOrigen.appendChild(opOriTodos);

    for (const ori of this.estado.origenes) {
      const op = document.createElement('option');
      op.value = ori;
      op.textContent = ori;
      if (this.estado.valores.origen === ori) op.selected = true;
      selectOrigen.appendChild(op);
    }

    grupoOrigen.appendChild(lblOrigen);
    grupoOrigen.appendChild(selectOrigen);

    // 4. Campo Ingrediente con sugerencias
    const grupoIngrediente = document.createElement('div');
    grupoIngrediente.className = 'campo-grupo';
    const lblIngrediente = document.createElement('label');
    lblIngrediente.className = 'campo-etiqueta';
    lblIngrediente.setAttribute('for', 'campo-ingrediente');
    lblIngrediente.textContent = 'Ingrediente principal';

    const inputIngrediente = document.createElement('input');
    inputIngrediente.type = 'text';
    inputIngrediente.id = 'campo-ingrediente';
    inputIngrediente.name = 'ingrediente';
    inputIngrediente.className = 'campo-control';
    inputIngrediente.autocomplete = 'off';
    inputIngrediente.placeholder = 'Escribe para ver sugerencias...';
    inputIngrediente.value = this.estado.valores.ingrediente;

    this.nodoSugerencias = document.createElement('ul');
    this.nodoSugerencias.className = 'lista-sugerencias';
    this.nodoSugerencias.style.display = 'none';

    grupoIngrediente.appendChild(lblIngrediente);
    grupoIngrediente.appendChild(inputIngrediente);
    grupoIngrediente.appendChild(this.nodoSugerencias);

    grid.appendChild(grupoNombre);
    grid.appendChild(grupoCategoria);
    grid.appendChild(grupoOrigen);
    grid.appendChild(grupoIngrediente);

    this.nodoError = document.createElement('p');
    this.nodoError.className = 'mensaje-validacion';
    this.nodoError.textContent = this.estado.mensajeError;
    this.nodoError.style.display = this.estado.mensajeError ? 'block' : 'none';

    const acciones = document.createElement('div');
    acciones.className = 'formulario-acciones';

    const btnLimpiar = document.createElement('button');
    btnLimpiar.type = 'button';
    btnLimpiar.className = 'boton';
    btnLimpiar.dataset.accion = 'limpiar';
    btnLimpiar.textContent = 'Limpiar';

    const btnBuscar = document.createElement('button');
    btnBuscar.type = 'submit';
    btnBuscar.className = 'boton boton-primario';
    btnBuscar.textContent = 'Aplicar filtros';

    acciones.appendChild(btnLimpiar);
    acciones.appendChild(btnBuscar);

    this.elemento.appendChild(grid);
    this.elemento.appendChild(this.nodoError);
    this.elemento.appendChild(acciones);
  }

  renderizarSugerencias() {
    if (!this.nodoSugerencias) return;
    while (this.nodoSugerencias.firstChild) {
      this.nodoSugerencias.removeChild(this.nodoSugerencias.firstChild);
    }

    if (this.estado.sugerenciasIngrediente.length === 0) {
      this.nodoSugerencias.style.display = 'none';
      return;
    }

    this.nodoSugerencias.style.display = 'block';
    for (const sug of this.estado.sugerenciasIngrediente) {
      const li = document.createElement('li');
      li.className = 'item-sugerencia';
      li.tabIndex = 0;
      li.dataset.sugerencia = sug;
      li.textContent = sug;
      this.nodoSugerencias.appendChild(li);
    }
  }

  mostrarErrorValidacion(mensaje) {
    this.estado.mensajeError = mensaje;
    if (this.nodoError) {
      this.nodoError.textContent = mensaje;
      this.nodoError.style.display = mensaje ? 'block' : 'none';
    }
  }

  configurarEventos() {
    this.manejadorInput = (e) => {
      const { name, value } = e.target;
      if (!name) return;
      this.estado.valores[name] = value;
      this.mostrarErrorValidacion('');

      if (name === 'ingrediente') {
        const termino = value.trim().toLowerCase();
        if (termino.length >= 1) {
          this.estado.sugerenciasIngrediente = this.estado.ingredientes
            .filter((ing) => ing.toLowerCase().includes(termino))
            .slice(0, 10);
        } else {
          this.estado.sugerenciasIngrediente = [];
        }
        this.renderizarSugerencias();
      }
    };

    this.manejadorClick = (e) => {
      const itemSugerencia = e.target.closest('[data-sugerencia]');
      if (itemSugerencia) {
        const valorElegido = itemSugerencia.dataset.sugerencia;
        this.estado.valores.ingrediente = valorElegido;
        const inputIng = this.elemento.querySelector('#campo-ingrediente');
        if (inputIng) inputIng.value = valorElegido;
        this.estado.sugerenciasIngrediente = [];
        this.renderizarSugerencias();
        return;
      }

      const btnLimpiar = e.target.closest('[data-accion="limpiar"]');
      if (btnLimpiar) {
        this.estado.valores = {
          nombre: '',
          categoria: '',
          origen: '',
          ingrediente: ''
        };
        this.estado.sugerenciasIngrediente = [];
        this.estado.mensajeError = '';
        this.renderizar();
        this.elemento.dispatchEvent(
          new CustomEvent('limpiar-filtros', { bubbles: true })
        );
      }
    };

    this.manejadorSubmit = (e) => {
      e.preventDefault();
      this.estado.sugerenciasIngrediente = [];
      this.renderizarSugerencias();

      const nombre = this.estado.valores.nombre.trim();
      const categoria = this.estado.valores.categoria.trim();
      const origen = this.estado.valores.origen.trim();
      const ingrediente = this.estado.valores.ingrediente.trim();

      if (!nombre && !categoria && !origen && !ingrediente) {
        this.mostrarErrorValidacion(
          'Debes seleccionar o escribir al menos un criterio de búsqueda.'
        );
        return;
      }

      if (nombre.length === 1) {
        this.mostrarErrorValidacion(
          'El nombre a buscar debe tener al menos 2 caracteres.'
        );
        return;
      }

      if (ingrediente.length === 1) {
        this.mostrarErrorValidacion(
          'El ingrediente debe tener al menos 2 caracteres.'
        );
        return;
      }

      this.mostrarErrorValidacion('');
      this.elemento.dispatchEvent(
        new CustomEvent('ejecutar-busqueda', {
          bubbles: true,
          detail: {
            criterios: { nombre, categoria, origen, ingrediente }
          }
        })
      );
    };

    this.elemento.addEventListener('input', this.manejadorInput);
    this.elemento.addEventListener('change', this.manejadorInput);
    this.elemento.addEventListener('click', this.manejadorClick);
    this.elemento.addEventListener('submit', this.manejadorSubmit);
  }

  destruir() {
    if (this.elemento) {
      this.elemento.removeEventListener('input', this.manejadorInput);
      this.elemento.removeEventListener('change', this.manejadorInput);
      this.elemento.removeEventListener('click', this.manejadorClick);
      this.elemento.removeEventListener('submit', this.manejadorSubmit);
      if (this.elemento.parentNode) {
        this.elemento.parentNode.removeChild(this.elemento);
      }
    }
    this.elemento = null;
  }
}