/**
 * @fileoverview Componente de botón reutilizable
 * Implementa un botón personalizado con diferentes variantes y estados
 */

/**
 * Componente Botón - Componente atómico
 * @element app-button
 *
 * @attr {string} variant - Variante del botón (primary, secondary, danger, success, outline)
 * @attr {string} size - Tamaño del botón (small, medium, large)
 * @attr {boolean} disabled - Si el botón está deshabilitado
 * @attr {boolean} loading - Si el botón está en estado de carga
 *
 * @slot - Contenido del botón
 *
 * @fires click - Cuando se hace clic en el botón (si no está deshabilitado)
 * @fires app-button:click - Evento personalizado cuando se hace clic en el botón
 */
class ButtonComponent extends HTMLElement {
  // Definir propiedades observadas para atributos
  static get observedAttributes() {
    return ["variant", "size", "disabled", "loading", "icon"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Opciones por defecto
    this._variant = "primary";
    this._size = "medium";
    this._disabled = false;
    this._loading = false;
    this._icon = null;

    // Binding de métodos
    this._handleClick = this._handleClick.bind(this);

    // Inicializar
    this._render();
  }

  // Lifecycle: Cuando el componente se conecta al DOM
  connectedCallback() {
    // Agregar listener de click
    this.shadowRoot
      .querySelector("button")
      .addEventListener("click", this._handleClick);
  }

  // Lifecycle: Cuando el componente se desconecta del DOM
  disconnectedCallback() {
    // Limpiar listeners para evitar memory leaks
    this.shadowRoot
      .querySelector("button")
      .removeEventListener("click", this._handleClick);
  }

  // Lifecycle: Cuando un atributo observado cambia
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    // Actualizar propiedades internas
    switch (name) {
      case "variant":
        this._variant = newValue || "primary";
        break;
      case "size":
        this._size = newValue || "medium";
        break;
      case "disabled":
        this._disabled = newValue !== null;
        break;
      case "loading":
        this._loading = newValue !== null;
        break;
      case "icon":
        this._icon = newValue;
        break;
    }

    // Re-renderizar
    this._updateButton();
  }

  // Getters y setters para atributos
  get variant() {
    return this._variant;
  }

  set variant(value) {
    this.setAttribute("variant", value);
  }

  get size() {
    return this._size;
  }

  set size(value) {
    this.setAttribute("size", value);
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(value) {
    if (value) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }

  get loading() {
    return this._loading;
  }

  set loading(value) {
    if (value) {
      this.setAttribute("loading", "");
    } else {
      this.removeAttribute("loading");
    }
  }

  get icon() {
    return this._icon;
  }

  set icon(value) {
    this.setAttribute("icon", value);
  }

  /**
   * Procesa el evento de clic
   * @param {Event} event - Evento de clic original
   * @private
   */
  _handleClick(event) {
    // No procesar si está deshabilitado o en carga
    if (this._disabled || this._loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Emitir evento personalizado
    this.dispatchEvent(
      new CustomEvent("app-button:click", {
        bubbles: true,
        composed: true, // Permite que el evento atraviese el Shadow DOM
        detail: { originalEvent: event },
      })
    );
  }

  /**
   * Actualiza los atributos del botón
   * @private
   */
  _updateButton() {
    const button = this.shadowRoot.querySelector("button");

    // Actualizar clases según atributos
    button.className = `btn btn-${this._variant} btn-${this._size}`;
    button.disabled = this._disabled || this._loading;

    // Actualizar contenido según estado
    if (this._loading) {
      this._renderLoadingState(button);
    } else {
      this._renderNormalState(button);
    }
  }

  /**
   * Renderiza el estado de carga
   * @param {HTMLButtonElement} button - Elemento botón
   * @private
   */
  _renderLoadingState(button) {
    // Guardar contenido original si no está guardado
    if (!this._originalContent) {
      this._originalContent = button.innerHTML;
    }

    // Mostrar spinner de carga
    button.innerHTML = `
        <span class="spinner"></span>
        <span class="sr-only">Cargando...</span>
      `;
  }

  /**
   * Renderiza el estado normal
   * @param {HTMLButtonElement} button - Elemento botón
   * @private
   */
  _renderNormalState(button) {
    // Si tenemos contenido guardado, restaurarlo
    if (this._originalContent) {
      button.innerHTML = this._originalContent;
      this._originalContent = null;
    } else {
      // Renderizar con icono si existe
      if (this._icon) {
        button.innerHTML = `
            <span class="icon">${this._icon}</span>
            <span class="content"><slot></slot></span>
          `;
      } else {
        button.innerHTML = `<slot></slot>`;
      }
    }
  }

  /**
   * Renderiza el componente completo
   * @private
   */
  _render() {
    // CSS con variables y clases
    const styles = `
        :host {
          display: inline-block;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-family, system-ui, sans-serif);
          font-weight: 500;
          text-align: center;
          white-space: nowrap;
          vertical-align: middle;
          user-select: none;
          border: 1px solid transparent;
          border-radius: var(--border-radius-md, 0.375rem);
          transition: all 0.15s ease-in-out;
          cursor: pointer;
          outline: none;
        }
        
        .btn:focus-visible {
          outline: 2px solid var(--primary-color, #3b82f6);
          outline-offset: 2px;
        }
        
        .btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        
        /* Variantes */
        .btn-primary {
          background-color: var(--primary-color, #3b82f6);
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background-color: var(--primary-dark, #2563eb);
        }
        
        .btn-secondary {
          background-color: var(--secondary-color, #475569);
          color: white;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background-color: #334155;
        }
        
        .btn-danger {
          background-color: var(--error-color, #ef4444);
          color: white;
        }
        
        .btn-danger:hover:not(:disabled) {
          background-color: #dc2626;
        }
        
        .btn-success {
          background-color: var(--success-color, #22c55e);
          color: white;
        }
        
        .btn-success:hover:not(:disabled) {
          background-color: #16a34a;
        }
        
        .btn-outline {
          background-color: transparent;
          border-color: var(--primary-color, #3b82f6);
          color: var(--primary-color, #3b82f6);
        }
        
        .btn-outline:hover:not(:disabled) {
          background-color: var(--primary-color, #3b82f6);
          color: white;
        }
        
        /* Tamaños */
        .btn-small {
          padding: 0.25rem 0.75rem;
          font-size: 0.875rem;
        }
        
        .btn-medium {
          padding: 0.5rem 1rem;
          font-size: 1rem;
        }
        
        .btn-large {
          padding: 0.75rem 1.5rem;
          font-size: 1.125rem;
        }
        
        /* Spinner */
        .spinner {
          display: inline-block;
          width: 1em;
          height: 1em;
          border: 2px solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
          margin-right: 0.5rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Accesibilidad */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }
        
        /* Iconos */
        .icon {
          display: inline-flex;
          margin-right: 0.5rem;
        }
      `;

    // Template HTML
    this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <button class="btn btn-${this._variant} btn-${this._size}" ?disabled="${
      this._disabled || this._loading
    }">
          <slot></slot>
        </button>
      `;

    // Actualizar botón según atributos
    this._updateButton();
  }
}

// Registrar el componente
customElements.define("app-button", ButtonComponent);

export default ButtonComponent;
