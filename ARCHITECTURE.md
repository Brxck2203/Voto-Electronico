# Arquitectura

## Componentes

| Ruta                                             | Responsabilidad                                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `src/domain/ElectoralSystem.js`                  | Estado privado y reglas de procesos, roles, calendario, requisitos, publicación, sesiones, emisión, campaña y resultados. |
| `src/state/seed.js`                              | Generador de dos organizaciones y diez candidatos por organización, con fechas relativas al inicio.                       |
| `src/state/VotingContext.jsx`                    | Instancia del motor por montaje, identidad simulada, sesión, selección temporal, reloj y errores de UI.                   |
| `src/components/Admin/AdministrationPage.jsx`    | Puestos, candidaturas, fotografías, requisitos, filtros y vista previa.                                                   |
| `src/components/Election/ElectionConfigForm.jsx` | Calendario, reglas, padrón, tribunal, grupos, publicación y cierre.                                                       |
| `src/components/Election/ProcessPages.jsx`       | Papeletas, confirmación, campaña con consultas y resultados agregados.                                                    |
| `tests/electoral.test.js`                        | Pruebas del dominio con reloj controlado.                                                                                 |

Se retiran el repositorio y las vistas anteriores que dependían de un voto individual y de una jornada reversible. La aplicación mantiene un único motor de reglas. La navegación entre secciones conserva el estado en memoria y no requiere rutas de servidor.

## Estado y publicación

Un proceso pertenece a una organización y tiene estados persistidos `BORRADOR`, `PUBLICADO` o `CERRADO`. Su fase visible se deriva también del reloj: `BORRADOR`, `PROGRAMADO`, `ABIERTO`, `CERRADO`. El intervalo de votación es `[apertura, cierre)`.

Toda modificación electoral requiere pertenecer al tribunal y ocurrir antes de la apertura. Modificar devuelve a borrador e invalida el orden anterior; publicar valida la configuración y guarda una permutación por papeleta. La apertura impide cambios incluso si la UI intentara enviarlos. El cierre manual no admite reversión. `start` adelanta apertura y cierre de campaña/padrón para demostrar el flujo; requiere que la campaña ya haya comenzado.

Las candidaturas transitan entre `Pendiente`, `Habilitado` y `Retirado`. Solo los requisitos obligatorios bloquean la habilitación. Cambiar de puesto o redefinir sus requisitos exige nueva verificación; retirar una candidatura deshabilita los grupos que la utilizan. Eliminar un puesto elimina sus candidaturas. Cada grupo contiene exactamente una candidatura habilitada por puesto.

## Emisión en memoria

1. `begin` verifica identidad, organización, proceso publicado, intervalo, padrón cerrado y ausencia de participación anterior.
2. La sesión se liga al elector, organización y proceso; expira como máximo en el cierre de jornada.
3. La selección permanece en React hasta confirmar. `emit` vuelve a validar período, sesión, participación y todas las papeletas, incluidos duplicados, opciones y límites.
4. Se construyen los registros de todas las papeletas y una copia del conjunto de participación antes de sustituir el estado. La operación es síncrona, sin `await`, dentro de una sola instancia JavaScript: un segundo envío encuentra la participación ya registrada.
5. Se revocan las sesiones de ese elector/proceso. La respuesta no incluye elecciones y la UI elimina selección y confirmación.

Cada voto contiene `ballotId`, `choices` y `weight`; no guarda identidad, sesión, fecha ni identificador común de emisión. El orden de los registros se mezcla. La participación se guarda en un conjunto independiente de identidades. Las consultas clonan datos para impedir mutaciones externas. El motor no expone votos individuales y oculta padrón y pesos al elector.

## Conteo y límites de simulación

`results` rechaza consultas anteriores al cierre. Por opción calcula número de selecciones y puntuación; los pesos se suman en milésimas para evitar errores decimales ordinarios. La abstención es padrón menos participantes. Una papeleta sin selección solo es válida cuando su mínimo es cero. El empate es igualdad positiva de mayor puntuación, sin adjudicación automática.

Las comprobaciones de organización están en cada acceso al proceso. Son aislamiento lógico en memoria, no una frontera de seguridad de servidor. Recargar, abrir otra pestaña o modificar la aplicación inicia o altera otra simulación. No se presenta este prototipo como plataforma electoral de producción.
