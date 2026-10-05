# Arquitectura de Voto Electrónico

## Capas

- **`src/domain/`** contiene las entidades electorales, reglas y errores de dominio. `Candidato` conserva los campos que consume la papeleta; `administration.js` define la estructura de las candidaturas, requisitos y errores de validación.
- **`src/infrastructure/`** implementa `InMemoryVotingRepository`. El repositorio mantiene puestos, candidaturas, jornada y votos en memoria durante la ejecución.
- **`src/state/`** conecta el repositorio con React mediante `VotingContext`. Tanto Administración como Votación consultan y modifican el mismo repositorio.
- **`src/components/`** contiene las vistas. `Admin/AdministrationPage.jsx` administra puestos y candidaturas en una ruta separada; `Voting/VotingHomePage.jsx` es el inicio de votación con su menú lateral; `Ballot/BallotPage.jsx` muestra las candidaturas habilitadas devueltas por el estado compartido.

## Puestos y candidaturas

Un **Puesto** tiene identificador, nombre, descripción y estado activo. El repositorio exige un nombre no vacío y evita duplicados sin distinguir mayúsculas/minúsculas ni espacios externos.

Una **Candidatura** conserva identificador, nombre completo (`nombre` como alias compatible con la papeleta), fotografía (`foto` como alias), presentación (`propuesta` como alias), `puestoId`, estado y lista de requisitos. Los requisitos simulados son “Documentación presentada”, “Membresía activa” y “Sin sanciones vigentes”.

Los estados son:

- **Pendiente**: no está disponible en la papeleta.
- **Habilitado**: todos los requisitos están cumplidos y la candidatura se ofrece para votar.
- **Retirado**: se mantiene visible en Administración, pero no se puede editar ni votar.

Una candidatura nueva inicia como Pendiente. Para habilitarla, deben marcarse todos sus requisitos y luego confirmar la acción de habilitación. Si una candidatura habilitada pierde un requisito, vuelve a Pendiente y deja de aparecer en la papeleta. Eliminar un puesto elimina también sus candidaturas asociadas para no dejar referencias a puestos inexistentes.

No se impide que una misma persona registre candidaturas diferentes en más de un puesto; la unicidad de una persona entre puestos queda como una regla de negocio futura.

## Administración y páginas de votación

La aplicación separa Administración (`/administracion`), el inicio de votación (`/votacion`) y la papeleta (`/votacion/boleta`) mediante navegación cliente, sin añadir dependencias de enrutamiento. Esta navegación mantiene montado el estado global y el repositorio en memoria al cambiar de página. Los cambios efectuados en Administración se reflejan en la papeleta sin recarga. La papeleta filtra candidaturas por estado Habilitado y por asociación a un puesto activo. Cuando hay varios puestos, muestra secciones separadas con sus candidaturas habilitadas; con un puesto mantiene la presentación simple existente.

El inicio de votación presenta el estado “Votación activa” únicamente cuando la jornada se activó desde Administración. Desde esa pantalla, el menú lateral permite seleccionar Mis votaciones, Campaña y Resultados; Campaña y Resultados muestran solamente un estado informativo. La papeleta permite volver a Mis votaciones. Tras confirmar, el votante puede volver a consultar las candidaturas, pero se ocultan las acciones de selección y confirmación. El contexto mantiene la bandera de voto confirmado durante la navegación para impedir otro voto desde la interfaz; el repositorio también conserva la protección de voto único.

## Estado de jornada

La jornada comienza como **No iniciada** y puede simularse desde Administración. Al iniciarla se bloquean las operaciones de creación, edición y eliminación de puestos, edición o retiro de candidaturas y cambios de requisitos o estado. El repositorio aplica esta regla además de deshabilitar los controles de la interfaz. El control permite volver a marcar la jornada como no iniciada para fines de simulación.

## Errores de dominio

`PuestoInvalidoError`, `PuestoDuplicadoError`, `CandidaturaInvalidaError`, `OperacionNoPermitidaError` y `CandidatoNoHabilitadoError` representan entradas inválidas, duplicados, operaciones bloqueadas y requisitos pendientes. La interfaz muestra los mensajes al usuario sin ocultar los errores de las reglas de negocio. `VotanteYaVotoError` mantiene la protección de voto único.
