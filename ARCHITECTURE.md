# Arquitectura del prototipo

## Capas

- **domain/**: entidades del negocio electoral (`Candidato`, `Eleccion`, `Voto`) y el contrato `VotingRepository`. No depende de React ni de ninguna infraestructura.
- **infrastructure/**: implementación concreta del repositorio (`InMemoryVotingRepository`) usando arreglos y `Set` en memoria, cumpliendo la restricción del curso de no usar base de datos ni APIs.
- **state/**: `VotingContext` conecta el repositorio con los componentes de React mediante el Context API, exponiendo datos y acciones sin que los componentes conozcan cómo se almacenan internamente.
- **components/**: interfaz dividida por alcance, para que cada historia de usuario tenga un lugar claro donde implementarse.

Esta separación aplica el principio de **inversión de dependencias**: si en el futuro se necesitara conectar una base de datos real, bastaría con crear una nueva clase que implemente `VotingRepository` sin modificar los componentes de UI.

## Mapeo de historias de usuario a componentes (Sprint 1 - Alcance 6, prioridad 1)

| Historia | Componente | Estado |
|---|---|---|
| HU-01 | `components/Ballot/CandidateList.jsx` | Implementado |
| HU-02 | `components/Ballot/CandidateDetailModal.jsx` (por crear) | Pendiente |
| HU-03, HU-05 | `components/Ballot/SelectionSummary.jsx` (por crear) | Pendiente |
| HU-04 | `components/Ballot/CandidateList.jsx` (selección) | Implementado parcialmente |
| HU-06 | `components/Confirmation/ConfirmVoteScreen.jsx` | Esqueleto creado |
| HU-07 | `infrastructure/InMemoryVotingRepository.js` (`registrarVoto`) | Implementado |

## Manejo de errores de dominio

- `VotanteYaVotoError`: se lanza si un votante intenta votar dos veces (soporta HU-07 y la regla de negocio de voto único).
- `SeleccionInvalidaError`: reservado para cuando se implemente el límite máximo de selecciones por elección (HU-04).

Ambos errores se capturan en `VotingContext` y se exponen a la UI mediante el estado `error`, evitando que fallos de negocio rompan la aplicación.
