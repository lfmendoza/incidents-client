/**
 * @fileoverview Worker para operaciones de API
 * Maneja todas las peticiones HTTP en segundo plano para no bloquear el hilo principal
 */

// Cache para almacenar resultados de peticiones GET
const apiCache = new Map();

// Configuración por defecto para peticiones fetch
const defaultOptions = {
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

/**
 * Procesa una petición HTTP
 * @param {Object} request - Datos de la petición
 * @returns {Promise<Object>} Resultado de la petición
 */
async function processRequest(request) {
  const {
    url,
    method = "GET",
    body = null,
    headers = {},
    useCache = false,
    cacheTTL = 300000,
  } = request;

  try {
    // Si es una petición GET y está habilitado el cache, intentar retornar datos cacheados
    const cacheKey = `${method}:${url}`;
    if (method === "GET" && useCache && apiCache.has(cacheKey)) {
      const cachedData = apiCache.get(cacheKey);
      const isCacheValid = Date.now() - cachedData.timestamp < cacheTTL;

      if (isCacheValid) {
        return {
          success: true,
          data: cachedData.data,
          fromCache: true,
        };
      } else {
        // Cache expirado, eliminarlo
        apiCache.delete(cacheKey);
      }
    }

    // Preparar opciones para fetch
    const options = {
      ...defaultOptions,
      method,
      headers: {
        ...defaultOptions.headers,
        ...headers,
      },
    };

    // Agregar body si existe y no es GET
    if (body && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    // Ejecutar la petición
    const startTime = performance.now();
    const response = await fetch(url, options);
    const endTime = performance.now();

    // Obtener datos de respuesta
    let data;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Construir objeto de respuesta
    const result = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      responseTime: Math.round(endTime - startTime),
    };

    // Si la petición fue exitosa y es GET, guardar en cache si está habilitado
    if (response.ok && method === "GET" && useCache) {
      apiCache.set(cacheKey, {
        timestamp: Date.now(),
        data,
      });
    }

    return result;
  } catch (error) {
    // Error en la petición (red, CORS, etc)
    return {
      success: false,
      error: error.message,
      isNetworkError: true,
    };
  }
}

/**
 * Purga entradas de cache según diferentes estrategias
 * @param {Object} options - Opciones de purga
 */
function purgeCache(options = {}) {
  const { url, pattern, olderThan } = options;

  // Caso 1: Purgar una URL específica
  if (url) {
    const getKey = `GET:${url}`;
    apiCache.delete(getKey);
    return { purged: [getKey] };
  }

  // Caso 2: Purgar URLs que coincidan con un patrón
  if (pattern) {
    const regex = new RegExp(pattern);
    const purgedKeys = [];

    for (const key of apiCache.keys()) {
      if (regex.test(key)) {
        apiCache.delete(key);
        purgedKeys.push(key);
      }
    }

    return { purged: purgedKeys };
  }

  // Caso 3: Purgar entradas más antiguas que cierto tiempo
  if (olderThan && typeof olderThan === "number") {
    const threshold = Date.now() - olderThan;
    const purgedKeys = [];

    for (const [key, value] of apiCache.entries()) {
      if (value.timestamp < threshold) {
        apiCache.delete(key);
        purgedKeys.push(key);
      }
    }

    return { purged: purgedKeys };
  }

  // Si no se especificó ninguna opción, purgar todo el cache
  const allKeys = Array.from(apiCache.keys());
  apiCache.clear();

  return { purged: allKeys };
}

/**
 * Obtiene estadísticas del cache
 * @returns {Object} Estadísticas del cache
 */
function getCacheStats() {
  return {
    size: apiCache.size,
    keys: Array.from(apiCache.keys()),
    totalSize: Array.from(apiCache.values()).reduce(
      (total, item) => total + JSON.stringify(item).length,
      0
    ),
  };
}

// Listener para mensajes entrantes
self.addEventListener("message", async (event) => {
  const { id, action, payload } = event.data;

  let result;

  // Procesar según la acción solicitada
  switch (action) {
    case "request":
      result = await processRequest(payload);
      break;

    case "purgeCache":
      result = purgeCache(payload);
      break;

    case "getCacheStats":
      result = getCacheStats();
      break;

    default:
      result = {
        success: false,
        error: `Acción no soportada: ${action}`,
      };
  }

  // Enviar respuesta al hilo principal
  self.postMessage({
    id,
    result,
  });
});

// Mensaje de inicialización
self.postMessage({
  type: "init",
  message: "API Worker inicializado y listo para procesar peticiones",
});
