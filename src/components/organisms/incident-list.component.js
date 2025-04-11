/**
 * @fileoverview Componente de lista de incidentes
 * Muestra, filtra y ordena la lista de incidentes de forma optimizada
 */

import { ApiService } from "../../core/services/api.service.js";
import { store, actions } from "../../core/store/store.js";
import { CONFIG } from "../../config.js";

/**
 * Componente Incident List - Componente de organismo
 * @element incident-list
 *
 * @attr {string} filter - Filtro actual para mostrar incidentes (all, pending, in-progress, resolved)
 * @attr {string} sort - Criterio de ordenación (date-desc, date-asc, reporter)
 *
 * @fires incident-list:load - Cuando se cargan los incidentes
 * @fires incident-list:filter - Cuando se cambia el filtro
 * @fires incident-list:sort - Cuando se cambia el ordenamiento
 */
class IncidentListComponent extends HTMLElement {
  // Definir propiedades observadas para atributos
  static get observedAttributes() {
    return ["filter", "sort"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Estado interno
    this._filter = "all";
    this._sort = "date-desc";
    this._isLoading = false;
    this._incidents = [];
    this._filteredIncidents = [];
    this._currentPage = 1;
    this._itemsPerPage = 10;
    this._renderQueue = [];
    this._renderTimer = null;

    // Binding de métodos
    this._handleFilterChange = this._handleFilterChange.bind(this);
    this._handleSortChange = this._handleSortChange.bind(this);
    this._handleCreateClick = this._handleCreateClick.bind(this);
    this._handleRefresh = this._handleRefresh.bind(this);
    this._handlePagination = this._handlePagination.bind(this);
    this._handleStoreUpdate = this._handleStoreUpdate.bind(this);

    // Inicializar
    this._render();
  }

  // Lifecycle: Cuando el componente se conecta al DOM
  connectedCallback() {
    // Agregar event listeners
    this._addEventListeners();

    // Cargar incidentes
    this._loadIncidents();

    // Suscribirse al store para actualizaciones
    this._unsubscribeStore = store.subscribe(this._handleStoreUpdate);
  }

  // Lifecycle: Cuando el componente se desconecta del DOM
  disconnectedCallback() {
    // Limpiar event listeners
    this._removeEventListeners();

    // Cancelar render pendiente
    if (this._renderTimer) {
      window.cancelAnimationFrame(this._renderTimer);
      this._renderTimer = null;
    }

    // Cancelar suscripción al store
    if (this._unsubscribeStore) {
      this._unsubscribeStore();
    }
  }

  // Lifecycle: Cuando un atributo observado cambia
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case "filter":
        this._filter = newValue || "all";
        this._filterAndSortIncidents();
        break;
      case "sort":
        this._sort = newValue || "date-desc";
        this._filterAndSortIncidents();
        break;
    }
  }

  // Getters y setters
  get filter() {
    return this._filter;
  }

  set filter(value) {
    this.setAttribute("filter", value);
  }

  get sort() {
    return this._sort;
  }

  set sort(value) {
    this.setAttribute("sort", value);
  }

  /**
   * Maneja actualizaciones del store
   * @param {Object} state - Estado actual del store
   * @private
   */
  _handleStoreUpdate(state) {
    // Solo actualizar si cambian los incidentes
    if (state.incidents !== this._incidents) {
      this._incidents = state.incidents;
      this._filterAndSortIncidents();
    }

    // Actualizar estado de carga
    if (state.loading !== this._isLoading) {
      this._isLoading = state.loading;
      this._updateLoadingState();
    }
  }

  /**
   * Agregar event listeners
   * @private
   */
  _addEventListeners() {
    // Event listeners para controles de filtro y ordenación
    const filterSelect = this.shadowRoot.querySelector("#filter-select");
    const sortSelect = this.shadowRoot.querySelector("#sort-select");
    const createButton = this.shadowRoot.querySelector("#create-btn");
    const refreshButton = this.shadowRoot.querySelector("#refresh-btn");
    const paginationControls = this.shadowRoot.querySelector(
      ".pagination-controls"
    );

    if (filterSelect)
      filterSelect.addEventListener("change", this._handleFilterChange);
    if (sortSelect)
      sortSelect.addEventListener("change", this._handleSortChange);
    if (createButton)
      createButton.addEventListener("click", this._handleCreateClick);
    if (refreshButton)
      refreshButton.addEventListener("click", this._handleRefresh);
    if (paginationControls)
      paginationControls.addEventListener("click", this._handlePagination);
  }

  /**
   * Quitar event listeners
   * @private
   */
  _removeEventListeners() {
    const filterSelect = this.shadowRoot.querySelector("#filter-select");
    const sortSelect = this.shadowRoot.querySelector("#sort-select");
    const createButton = this.shadowRoot.querySelector("#create-btn");
    const refreshButton = this.shadowRoot.querySelector("#refresh-btn");
    const paginationControls = this.shadowRoot.querySelector(
      ".pagination-controls"
    );

    if (filterSelect)
      filterSelect.removeEventListener("change", this._handleFilterChange);
    if (sortSelect)
      sortSelect.removeEventListener("change", this._handleSortChange);
    if (createButton)
      createButton.removeEventListener("click", this._handleCreateClick);
    if (refreshButton)
      refreshButton.removeEventListener("click", this._handleRefresh);
    if (paginationControls)
      paginationControls.removeEventListener("click", this._handlePagination);
  }

  /**
   * Carga la lista de incidentes desde la API
   * @private
   */
  async _loadIncidents() {
    try {
      this._isLoading = true;
      this._updateLoadingState();

      // Comprobar si ya tenemos incidentes en el store
      const state = store.getState();
      if (state.incidents && state.incidents.length > 0) {
        this._incidents = state.incidents;
        this._filterAndSortIncidents();
      }

      // Cargar desde API de todos modos para asegurar datos actualizados
      const incidents = await ApiService.getIncidents();

      // Actualizar store
      store.dispatch(actions.setIncidents(incidents));

      // Actualizar componente
      this._incidents = incidents;
      this._filterAndSortIncidents();

      // Emitir evento
      this.dispatchEvent(
        new CustomEvent("incident-list:load", {
          bubbles: true,
          composed: true,
          detail: { incidents },
        })
      );
    } catch (error) {
      console.error("Error al cargar incidentes:", error);
      store.dispatch(
        actions.showErrorNotification("Error al cargar incidentes")
      );

      // Mostrar estado de error
      this._showErrorState();
    } finally {
      this._isLoading = false;
      this._updateLoadingState();
    }
  }

  /**
   * Filtra y ordena la lista de incidentes
   * @private
   */
  _filterAndSortIncidents() {
    if (!this._incidents || !this._incidents.length) {
      this._filteredIncidents = [];
      this._updateList();
      return;
    }

    // Filtrar incidentes
    this._filteredIncidents = this._incidents.filter((incident) => {
      if (this._filter === "all") return true;

      switch (this._filter) {
        case "pending":
          return incident.status === CONFIG.INCIDENT_STATUS.PENDING;
        case "in-progress":
          return incident.status === CONFIG.INCIDENT_STATUS.IN_PROGRESS;
        case "resolved":
          return incident.status === CONFIG.INCIDENT_STATUS.RESOLVED;
        default:
          return true;
      }
    });

    // Ordenar incidentes
    this._filteredIncidents.sort((a, b) => {
      switch (this._sort) {
        case "date-desc":
          return new Date(b.created_at) - new Date(a.created_at);
        case "date-asc":
          return new Date(a.created_at) - new Date(b.created_at);
        case "reporter":
          return a.reporter.localeCompare(b.reporter);
        default:
          return 0;
      }
    });

    // Resetear a primera página al cambiar filtro/ordenación
    this._currentPage = 1;

    // Actualizar lista
    this._updateList();
  }

  /**
   * Actualiza la lista de incidentes en el DOM de forma optimizada
   * @private
   */
  _updateList() {
    // Calcular incidentes a mostrar según paginación
    const startIndex = (this._currentPage - 1) * this._itemsPerPage;
    const endIndex = this._currentPage * this._itemsPerPage;
    const incidentsToShow = this._filteredIncidents.slice(startIndex, endIndex);

    // Referencia al contenedor de lista
    const listContainer = this.shadowRoot.querySelector(".incidents-list");
    if (!listContainer) return;

    // Vaciar contenedor actual
    listContainer.innerHTML = "";

    // Si no hay incidentes, mostrar mensaje
    if (!incidentsToShow.length) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "empty-message";
      emptyMessage.textContent = this._incidents.length
        ? "No hay incidentes que coincidan con los filtros seleccionados."
        : "No hay incidentes registrados.";
      listContainer.appendChild(emptyMessage);

      // Actualizar paginación
      this._updatePagination();
      return;
    }

    // Renderizar de forma optimizada en lotes
    const batchSize = CONFIG.PERFORMANCE.RENDER_BATCH_SIZE;
    this._renderQueue = [...incidentsToShow];

    const renderBatch = () => {
      const startTime = performance.now();

      // Procesar un lote
      const batch = this._renderQueue.splice(0, batchSize);

      batch.forEach((incident) => {
        const card = document.createElement("incident-card");
        card.setAttribute("incident-id", incident.id);
        card.setAttribute("reporter", incident.reporter);
        card.setAttribute("description", incident.description);
        card.setAttribute("status", incident.status);
        card.setAttribute("created-at", incident.created_at);

        listContainer.appendChild(card);
      });

      // Si quedan elementos en la cola, programar siguiente lote
      if (this._renderQueue.length > 0) {
        this._renderTimer = window.requestAnimationFrame(renderBatch);
      } else {
        // Actualizar paginación cuando termine el renderizado
        this._updatePagination();
      }

      const endTime = performance.now();
      console.log(
        `Renderizado lote de ${batch.length} incidentes en ${Math.round(
          endTime - startTime
        )}ms`
      );
    };

    // Iniciar renderizado por lotes
    this._renderTimer = window.requestAnimationFrame(renderBatch);
  }

  /**
   * Actualiza los controles de paginación
   * @private
   */
  _updatePagination() {
    const paginationContainer = this.shadowRoot.querySelector(
      ".pagination-controls"
    );
    if (!paginationContainer) return;

    // Calcular total de páginas
    const totalPages = Math.ceil(
      this._filteredIncidents.length / this._itemsPerPage
    );

    // Actualizar información de paginación
    const pageInfo = this.shadowRoot.querySelector(".pagination-info");
    if (pageInfo) {
      if (this._filteredIncidents.length === 0) {
        pageInfo.textContent = "No hay incidentes";
      } else {
        const startItem = (this._currentPage - 1) * this._itemsPerPage + 1;
        const endItem = Math.min(
          this._currentPage * this._itemsPerPage,
          this._filteredIncidents.length
        );
        pageInfo.textContent = `Mostrando ${startItem} - ${endItem} de ${this._filteredIncidents.length} incidentes`;
      }
    }

    // Actualizar botones de paginación
    const prevButton = this.shadowRoot.querySelector(".pagination-prev");
    const nextButton = this.shadowRoot.querySelector(".pagination-next");

    if (prevButton) {
      prevButton.disabled = this._currentPage <= 1;
    }

    if (nextButton) {
      nextButton.disabled = this._currentPage >= totalPages;
    }

    // Actualizar números de página
    const pagesContainer = this.shadowRoot.querySelector(".pagination-pages");
    if (pagesContainer) {
      pagesContainer.innerHTML = "";

      // Si hay pocas páginas, mostrar todas
      if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
          this._createPageButton(pagesContainer, i);
        }
      } else {
        // Mostrar primeras, actual y últimas con elipsis
        this._createPageButton(pagesContainer, 1);

        if (this._currentPage > 3) {
          const ellipsis = document.createElement("span");
          ellipsis.className = "pagination-ellipsis";
          ellipsis.textContent = "...";
          pagesContainer.appendChild(ellipsis);
        }

        // Páginas alrededor de la actual
        for (
          let i = Math.max(2, this._currentPage - 1);
          i <= Math.min(totalPages - 1, this._currentPage + 1);
          i++
        ) {
          this._createPageButton(pagesContainer, i);
        }

        if (this._currentPage < totalPages - 2) {
          const ellipsis = document.createElement("span");
          ellipsis.className = "pagination-ellipsis";
          ellipsis.textContent = "...";
          pagesContainer.appendChild(ellipsis);
        }

        if (totalPages > 1) {
          this._createPageButton(pagesContainer, totalPages);
        }
      }
    }
  }

  /**
   * Crea un botón de página para la paginación
   * @param {HTMLElement} container - Contenedor para el botón
   * @param {number} pageNumber - Número de página
   * @private
   */
  _createPageButton(container, pageNumber) {
    const button = document.createElement("button");
    button.className = "pagination-page";
    button.textContent = pageNumber;
    button.dataset.page = pageNumber;

    if (pageNumber === this._currentPage) {
      button.classList.add("active");
    }

    container.appendChild(button);
  }

  /**
   * Actualiza el estado de carga del componente
   * @private
   */
  _updateLoadingState() {
    const loader = this.shadowRoot.querySelector(".list-loader");
    const content = this.shadowRoot.querySelector(".list-content");

    if (loader) {
      loader.hidden = !this._isLoading;
    }

    if (content) {
      content.hidden = this._isLoading;
    }
  }

  /**
   * Muestra un estado de error
   * @private
   */
  _showErrorState() {
    const content = this.shadowRoot.querySelector(".list-content");
    if (!content) return;

    const errorElement = document.createElement("div");
    errorElement.className = "error-message";
    errorElement.innerHTML = `
      <p>Ocurrió un error al cargar los incidentes.</p>
      <button id="retry-btn" class="retry-btn">Reintentar</button>
    `;

    content.innerHTML = "";
    content.appendChild(errorElement);

    // Agregar listener al botón de reintentar
    const retryBtn = content.querySelector("#retry-btn");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        this._loadIncidents();
      });
    }
  }

  /**
   * Maneja cambio de filtro
   * @param {Event} event - Evento change
   * @private
   */
  _handleFilterChange(event) {
    const filter = event.target.value;
    this.filter = filter;

    // Emitir evento
    this.dispatchEvent(
      new CustomEvent("incident-list:filter", {
        bubbles: true,
        composed: true,
        detail: { filter },
      })
    );
  }

  /**
   * Maneja cambio de ordenación
   * @param {Event} event - Evento change
   * @private
   */
  _handleSortChange(event) {
    const sort = event.target.value;
    this.sort = sort;

    // Emitir evento
    this.dispatchEvent(
      new CustomEvent("incident-list:sort", {
        bubbles: true,
        composed: true,
        detail: { sort },
      })
    );
  }

  /**
   * Maneja clic en botón de crear incidente
   * @private
   */
  _handleCreateClick() {
    // Navegar a página de creación
    const router = window.router;
    if (router) {
      router.navigateToRoute("CREATE_INCIDENT");
    }
  }

  /**
   * Maneja clic en botón de refrescar
   * @private
   */
  _handleRefresh() {
    this._loadIncidents();
  }

  /**
   * Maneja interacciones con la paginación
   * @param {Event} event - Evento click
   * @private
   */
  _handlePagination(event) {
    // Identificar elemento clickeado
    const target = event.target;

    if (target.classList.contains("pagination-prev")) {
      // Página anterior
      if (this._currentPage > 1) {
        this._currentPage--;
        this._updateList();
      }
    } else if (target.classList.contains("pagination-next")) {
      // Página siguiente
      const totalPages = Math.ceil(
        this._filteredIncidents.length / this._itemsPerPage
      );
      if (this._currentPage < totalPages) {
        this._currentPage++;
        this._updateList();
      }
    } else if (target.classList.contains("pagination-page")) {
      // Página específica
      const page = parseInt(target.dataset.page, 10);
      if (page !== this._currentPage) {
        this._currentPage = page;
        this._updateList();
      }
    }
  }

  /**
   * Renderiza el componente completo
   * @private
   */
  _render() {
    // CSS
    const styles = `
      :host {
        display: block;
      }
      
      .list-container {
        background-color: white;
        border-radius: var(--border-radius-lg, 0.5rem);
        box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06));
        padding: 1.5rem;
        margin-bottom: 2rem;
      }
      
      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
      }
      
      .list-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--secondary-color, #475569);
        margin: 0;
      }
      
      .control-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      
      select {
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: var(--border-radius-md, 0.375rem);
        font-size: 0.875rem;
        background-color: white;
        min-width: 150px;
      }
      
      .incidents-list {
        display: grid;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      
      .btn {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        border-radius: var(--border-radius-md, 0.375rem);
        cursor: pointer;
        transition: all 0.15s ease-in-out;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .primary-btn {
        background-color: var(--primary-color, #3b82f6);
        color: white;
        border: none;
      }
      
      .primary-btn:hover {
        background-color: var(--primary-dark, #2563eb);
      }
      
      .icon-btn {
        background-color: transparent;
        border: 1px solid #e2e8f0;
        color: var(--secondary-color, #475569);
        padding: 0.5rem;
        border-radius: var(--border-radius-md, 0.375rem);
      }
      
      .icon-btn:hover {
        background-color: #f8fafc;
      }
      
      /* Loader */
      .list-loader {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 3rem 0;
      }
      
      .spinner {
        width: 2.5rem;
        height: 2.5rem;
        border: 3px solid #e2e8f0;
        border-radius: 50%;
        border-top-color: var(--primary-color, #3b82f6);
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      /* Mensaje vacío */
      .empty-message {
        text-align: center;
        padding: 3rem 0;
        color: var(--secondary-color, #475569);
        font-size: 1.125rem;
      }
      
      /* Error */
      .error-message {
        text-align: center;
        padding: 2rem 0;
        color: var(--error-color, #ef4444);
      }
      
      .retry-btn {
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background-color: var(--primary-color, #3b82f6);
        color: white;
        border: none;
        border-radius: var(--border-radius-md, 0.375rem);
        cursor: pointer;
      }
      
      /* Paginación */
      .pagination {
        margin-top: 2rem;
      }
      
      .pagination-info {
        text-align: center;
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
        color: var(--secondary-color, #475569);
      }
      
      .pagination-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.25rem;
      }
      
      .pagination-prev,
      .pagination-next,
      .pagination-page {
        padding: 0.5rem 0.75rem;
        border: 1px solid #e2e8f0;
        background-color: white;
        border-radius: var(--border-radius-md, 0.375rem);
        cursor: pointer;
        font-size: 0.875rem;
      }
      
      .pagination-prev:disabled,
      .pagination-next:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .pagination-page.active {
        background-color: var(--primary-color, #3b82f6);
        color: white;
        border-color: var(--primary-color, #3b82f6);
      }
      
      .pagination-ellipsis {
        padding: 0.5rem 0.25rem;
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .list-header {
          flex-direction: column;
          align-items: stretch;
        }
        
        .control-group {
          flex-wrap: wrap;
        }
      }
    `;

    // Template HTML
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="list-container">
        <div class="list-header">
          <h2 class="list-title">Incidentes</h2>
          
          <div class="control-group">
            <select id="filter-select" aria-label="Filtrar por estado">
              <option value="all" ${
                this._filter === "all" ? "selected" : ""
              }>Todos los estados</option>
              <option value="pending" ${
                this._filter === "pending" ? "selected" : ""
              }>Pendientes</option>
              <option value="in-progress" ${
                this._filter === "in-progress" ? "selected" : ""
              }>En proceso</option>
              <option value="resolved" ${
                this._filter === "resolved" ? "selected" : ""
              }>Resueltos</option>
            </select>
            
            <select id="sort-select" aria-label="Ordenar por">
              <option value="date-desc" ${
                this._sort === "date-desc" ? "selected" : ""
              }>Más recientes</option>
              <option value="date-asc" ${
                this._sort === "date-asc" ? "selected" : ""
              }>Más antiguos</option>
              <option value="reporter" ${
                this._sort === "reporter" ? "selected" : ""
              }>Reportador (A-Z)</option>
            </select>
            
            <button id="refresh-btn" class="icon-btn" title="Actualizar lista">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
                <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
              </svg>
            </button>
            
            <button id="create-btn" class="btn primary-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Nuevo Incidente
            </button>
          </div>
        </div>
        
        <div class="list-loader" ?hidden="${!this._isLoading}">
          <div class="spinner"></div>
        </div>
        
        <div class="list-content" ?hidden="${this._isLoading}">
          <div class="incidents-list"></div>
          
          <div class="pagination">
            <div class="pagination-info"></div>
            <div class="pagination-controls">
              <button class="pagination-prev" disabled>Anterior</button>
              <div class="pagination-pages"></div>
              <button class="pagination-next" disabled>Siguiente</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Registrar el componente
customElements.define("incident-list", IncidentListComponent);

export default IncidentListComponent;
