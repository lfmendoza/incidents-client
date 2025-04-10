# Sistema de Gestión de Incidentes

Una aplicación web moderna para gestionar incidentes técnicos y solicitudes desarrollada con vanilla JavaScript utilizando Web Components, optimizada para rendimiento y usabilidad.

## Características

- Arquitectura basada en Web Components sin dependencias externas
- Patrón de arquitectura limpia y diseño atómico
- Uso de Web Workers para operaciones asíncronas sin bloquear el hilo principal
- Renderizado por lotes para optimizar rendimiento con grandes listas
- Sistema de enrutamiento SPA cliente
- Gestión de estado centralizada con patrón similar a Redux
- Caching inteligente de peticiones a la API
- Soporte para tema claro/oscuro
- Diseño responsive y accesible
- Componentes reutilizables y modulares

## Tecnologías utilizadas

- **Frontend**:

  - Vanilla JavaScript (ES6+)
  - Web Components nativos
  - Web Workers
  - ShadowDOM para encapsulación
  - Custom Events para comunicación entre componentes
  - CSS personalizado con variables

- **Backend**:
  - API RESTful (proporcionada)
  - PostgreSQL
  - Docker para contenerización

## Estructura de archivos

```
incidents-client/
├── src/
│   ├── app.js                  # Punto de entrada de la aplicación
│   ├── router.js               # Sistema de enrutamiento SPA
│   ├── config.js               # Configuración centralizada
│   ├── core/                   # Funcionalidades principales
│   │   ├── store/              # Gestión de estado centralizada
│   │   ├── services/           # Servicios (API, notificaciones)
│   │   └── workers/            # Web Workers para operaciones en segundo plano
│   ├── utils/                  # Utilidades y helpers
│   ├── components/             # Componentes web (Atomic Design)
│   │   ├── atoms/              # Componentes básicos (botones, inputs)
│   │   ├── molecules/          # Componentes compuestos (tarjetas, badges)
│   │   ├── organisms/          # Componentes complejos (formularios, listas)
│   │   └── templates/          # Plantillas de páginas
│   ├── pages/                  # Páginas de la aplicación
│   └── styles/                 # Estilos globales
├── assets/
│   └── icons/                  # Iconos y recursos visuales
├── docker-compose.yml          # Configuración Docker Compose
├── Dockerfile                  # Configuración de construcción
└── nginx.conf                  # Configuración de Nginx para SPA
```

## Requisitos

- Docker y Docker Compose

## Instalación y ejecución

1. Clonar el repositorio:

```bash
git clone <repo-url>
cd incidents-client
```

2. Ejecutar con Docker Compose:

```bash
docker-compose up -d
```

3. Acceder a la aplicación:

```
http://localhost:8080
```

## Arquitectura

### Web Components

La aplicación está construida completamente con Web Components, utilizando las APIs nativas del navegador:

- `CustomElements` para definir nuevos elementos HTML
- `ShadowDOM` para encapsulación de estilos y estructura
- `HTML Templates` para definir fragmentos de HTML reutilizables

### Patrón de Diseño Atómico

Los componentes siguen el patrón de Diseño Atómico:

- **Atoms**: Componentes básicos indivisibles (botones, inputs)
- **Molecules**: Combinaciones de átomos (tarjetas, badges, grupos de formularios)
- **Organisms**: Conjuntos funcionales complejos (formularios, listas de incidentes, cabeceras)
- **Templates**: Disposiciones específicas para cada página
- **Pages**: Implementación final de las pantallas de la aplicación

### Optimizaciones de rendimiento

La plataforma implementa varias técnicas para optimizar el rendimiento:

1. **Web Workers**: Para operaciones pesadas como peticiones API y procesamiento de datos, evitando bloquear el hilo principal.
2. **Renderizado por lotes**: Las listas largas se renderizan en lotes para mantener la interfaz responsive.
3. **Lazy Loading**: Los componentes se cargan solo cuando son necesarios.
4. **Intersection Observer**: Para detectar elementos visibles y optimizar el renderizado.
5. **Memorización**: Resultados de operaciones costosas son almacenados en caché.
6. **Debouncing y Throttling**: Para eventos frecuentes como scroll y resize.

### Store centralizado

Implementación ligera inspirada en Redux para gestión de estado:

- Estado centralizado para toda la aplicación
- Actualizaciones unidireccionales mediante acciones
- Suscripciones para reaccionar a cambios en el estado
- DevTools para depuración en desarrollo

### Sistema de rutas

Router SPA (Single Page Application) cliente:

- Navegación sin recargas completas de página
- Soporte para parámetros dinámicos en rutas
- Integración con la API History del navegador
- Gestión de vistas 404

### Servicio de API

Sistema de comunicación con el backend que:

- Utiliza Web Workers para operaciones en segundo plano
- Implementa estrategias de caché para reducir peticiones
- Gestiona automáticamente cancelaciones de peticiones
- Estandariza manejo de errores y validaciones

## Funcionalidades

- **Listado de incidentes**: Vista principal con listado paginado y opciones de filtrado/ordenación.
- **Detalle de incidente**: Vista completa con toda la información del incidente.
- **Creación de incidentes**: Formulario para reportar nuevos incidentes.
- **Actualización de estado**: Cambiar el estado de un incidente entre pendiente, en proceso y resuelto.
- **Eliminación de incidentes**: Eliminar incidentes con confirmación.
- **Tema claro/oscuro**: Cambiar entre temas con persistencia de preferencia.
- **Notificaciones**: Sistema de notificaciones para informar sobre acciones realizadas.
- **Navegación responsive**: Adaptación a diferentes tamaños de pantalla.

## Consideraciones técnicas

### Accesibilidad

La aplicación implementa prácticas de accesibilidad:

- Etiquetas ARIA para componentes interactivos
- Estructura semántica de HTML
- Suficiente contraste de colores
- Navegación por teclado
- Textos alternativos para contenido visual

### Seguridad

Medidas implementadas:

- Sanitización de entradas
- Protección contra XSS
- Headers de seguridad en configuración de Nginx
- Validación de datos tanto en cliente como en servidor

### Optimización para producción

El Dockerfile incluye:

- Minificación de assets
- Compresión gzip
- Configuración de caché para recursos estáticos
- Headers de seguridad

## Desarrollo

Para ejecutar en modo desarrollo (con recarga en caliente):

```bash
# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

Para construir la aplicación para producción:

```bash
npm run build
```

## Contribuir

1. Fork el repositorio
2. Crear una rama para tu característica (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add some amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo `LICENSE` para más detalles.
