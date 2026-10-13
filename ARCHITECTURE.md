# Arquitectura del prototipo JSON

- `src/portal/AccessChoice.jsx`: portada y elección entre gestión y votación.
- `src/portal/VoterPortal.jsx`: cédula, código, papeleta, confirmación, resultados.
- `src/portal/AdminPortal.jsx`: contraseña administrativa, edición de puestos/candidaturas, publicación, métricas y acta.
- `src/portal/localApi.js`: cliente HTTP mismo origen hacia `/api/*`.
- `server/index.js`: servidor Node local (API JSON y archivos compilados).
- `server/api.js`: validaciones y reglas de los endpoints; únicas operaciones sobre la urna.
- `server/store.js`: carga y escritura atómica de `data/database.json`.
- `server/seed.js`: datos ficticios y generación de base inicial.
- `data/database.json`: registros persistentes; la interfaz **no** importa el archivo directamente.

## Separación de datos

`participation[]` contiene `electionId, electorId, status`. `votes[]` contiene `electionId, ballotId, choices, weight` sin identidad. No existe un identificador compartido entre ambos. Las sesiones de votación temporales se mantienen en memoria del servidor. La versión JSON no asegura secreto efectivo ante el operador del equipo ni resuelve riesgos de correlación temporal.

## Persistencia y concurrencia

Cada emisión se valida y se guarda en una sola actualización del JSON. La API usa un proceso Node para secuenciar las operaciones; la escritura se hace mediante archivo temporal y renombrado. No es transaccional a nivel de sistemas distribuidos ni soporta varias instancias de servidor compartiendo el mismo JSON.
