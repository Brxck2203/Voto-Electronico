# Trazabilidad del prototipo

Correspondencia con los requerimientos del proyecto. La cobertura se refiere a la simulación en una pestaña, con identidades precargadas y sin base de datos.

| Requerimientos                                     | Implementación                                                                                                        | Verificación                                                                     |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| RF-01–RF-03: papeletas, selección y consulta       | `VotingPage`, detalle, límites, resumen y diálogo de confirmación; todas las opciones visibles                        | Pruebas de papeleta completa y selección múltiple; recorrido de UI               |
| RF-04–RF-09: puestos y candidaturas                | `position`, `deletePosition`, `candidate`, `requirement`, `enableCandidate`, `withdraw`; filtros y foto JPG/PNG ≤5 MB | Pruebas de requisitos, cambio de puesto, retiro, cascada e imágenes              |
| RF-10–RF-11: modalidad y opciones                  | `configure`, `option`, validación antes de cambiar modalidad                                                          | Prueba por grupos y publicación                                                  |
| RF-12: procesos                                    | `create`, `list`, selector por organización                                                                           | Borrador vacío no publicable y permisos                                          |
| RF-13: calendario y cierre de padrón               | `configure`, `setRoll`, calendario ordenado y zona horaria                                                            | Fronteras de apertura/cierre y padrón congelado                                  |
| RF-14–RF-16: sesión, límites y pesos               | `sessionSeconds`, `setLimits`, `setRoll`, ponderación en `emit`                                                       | Vencimiento, múltiples selecciones y peso decimal                                |
| RF-17–RF-19: grupos, requisitos y tribunal         | `group`, `setRequirements`, `setAdmins`                                                                               | Grupo completo, requisito opcional y dos administradores                         |
| RF-20–RF-22: consulta, publicación y sorteo        | `view`, `publicationErrors`, `publish`, `ballots`                                                                     | Permutación completa estable y copias sin mutación externa                       |
| RF-23: configuración bloqueada                     | `#editable`, apertura y cierre irreversible                                                                           | Intentos de edición/reapertura rechazados                                        |
| RF-24–RF-26: padrón, período y validación          | `begin`, `emit`, `#active`                                                                                            | Elector no habilitado, límites temporales y payload inválido                     |
| RF-27–RF-28: emisión única e inmutable             | Preparación completa, sustitución síncrona y participación separada                                                   | Doble envío y rechazo sin registro parcial                                       |
| RF-29–RF-31: vencimiento, reingreso y confirmación | Sesión con expiración; descarte de selección en UI; respuesta sin opciones                                            | Vencimiento exacto, reingreso y voto confirmado                                  |
| RF-32: resultados después del cierre               | `results`, `ResultsPage`                                                                                              | Consulta anticipada rechazada y conteo posterior                                 |
| RNF-01: separación elector/voto                    | Registros sin identidad/token/fecha, participación separada y resultados agregados                                    | Lecturas no exponen votos ni padrón al elector; limitaciones descritas en README |
| RNF-02: organizaciones independientes              | Contexto `{orgId, userId}`, validación de pertenencia en cada acceso                                                  | Rechazo de acceso y sesión cruzada; conteos independientes                       |
| Campaña del enunciado/entrevista                   | `post`, `question`, `answer`; texto, imagen y video en memoria                                                        | Propiedad del candidato, período, preguntas y respuestas                         |
| Resultados del enunciado/entrevista                | Vista resumida/detallada, participación, abstención y aviso de empate                                                 | Ponderación, blancos y empate                                                    |

## Decisiones de implementación

- Las siete candidaturas adicionales son Diego Vargas, Sofía Mora, Carlos Jiménez, Valeria Castro, Andrés Chaves, Daniela Rojas y Gabriel Núñez. Hay diez candidatos por organización, distribuidos en dos puestos para probar emisión múltiple.
- Una selección ponderada recibe el peso completo; los pesos aceptan hasta tres decimales. En grupos se elige una opción completa.
- El tribunal crea y mantiene candidaturas antes de la apertura; no se añade un flujo de autoinscripción. Las identidades, pesos y requisitos son datos de demostración, no reglas institucionales verificadas.
- Las pruebas automatizadas del motor se ejecutan con `npm test`; la compilación con `npm run build`.
- La seguridad de servidor, persistencia, coordinación entre navegadores y anonimato criptográfico quedan fuera de esta implementación en memoria.
