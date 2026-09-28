# Voto Electrónico – Prototipo Evolutivo

Proyecto académico del curso **IC-5821 Requerimientos de Software** (Instituto Tecnológico de Costa Rica, Campus Tecnológico Local San Carlos, II Semestre 2026).

**Equipo:** Joan Cordero Coto, Jason Martínez Gutiérrez, Brack Rivas Hernández

## Descripción

Plataforma de voto electrónico para organizaciones (asociaciones, sindicatos, solidaristas y colegios profesionales) que cubre el ciclo completo de un proceso de votación. Este repositorio contiene el **prototipo evolutivo funcional** exigido por el Proyecto 2 del curso: se construye en memoria, sin base de datos ni APIs externas, y madura sprint a sprint conforme se refinan los requerimientos con el profesor.

## Stack tecnológico: React + Vite

Se eligió **React** como librería de interfaz porque permite construir una sola aplicación web (SPA) accesible desde cualquier dispositivo (móvil, tablet, escritorio), tal como exige el RF-01 del documento de requerimientos, sin necesidad de desarrollar apps nativas separadas.

**Vite** se usa como herramienta de build porque:

- Levanta un servidor de desarrollo casi instantáneo (usa ESBuild + HMR nativo de módulos ES), ideal para iterar rápido en cada sprint.
- No requiere configuración compleja de Webpack; el proyecto arranca con un `vite.config.js` mínimo.
- Empaqueta para producción solo cuando se necesita (`vite build`), manteniendo el prototipo liviano.

El estado del sistema (candidatos, votos, padrón) vive completamente **en memoria** usando el Context API de React (`VotingContext`), respetando la restricción del curso de no conectar bases de datos ni APIs reales.

## Estructura de carpetas

```
voto-electronico/
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
├── ARCHITECTURE.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── domain/
    │   ├── models.js              # Entidades: Candidato, Eleccion, Voto, errores de dominio
    │   └── VotingRepository.js    # Interfaz del repositorio (contrato)
    ├── infrastructure/
    │   └── InMemoryVotingRepository.js  # Implementación en memoria del repositorio
    ├── state/
    │   └── VotingContext.jsx      # Context + estado global de la votación
    └── components/
        ├── Ballot/                # Alcance 6 (prioridad 1): papeleta y selección de voto
        ├── Confirmation/          # Alcance 6: confirmación y registro del voto
        ├── Election/              # Alcance 2: configuración de la elección
        └── Admin/                 # Alcance 4: administración de candidaturas
```

## Cómo ejecutar el proyecto localmente

1. Instalar Node.js 18 o superior.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Levantar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abrir la URL que indica la terminal (por defecto `http://localhost:5173`).
5. Para generar la versión de producción (opcional para el video demostrativo):
   ```bash
   npm run build
   npm run preview
   ```

## Estado actual del prototipo (Sprint 1)

Implementado: HU-01 (listar candidaturas) como base inicial del Alcance 6. Las historias HU-02 a HU-07 y los alcances de configuración de elección, administración de candidaturas y escrutinio se documentan en `ARCHITECTURE.md` y se implementarán en los siguientes sprints.

Ver la especificación completa de requerimientos, historias de usuario y criterios de aceptación en la carpeta de documentación del proyecto en Google Drive.
