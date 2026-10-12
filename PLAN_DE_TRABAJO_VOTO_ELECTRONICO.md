# Plan de trabajo y verificación · Voto Electrónico

## Propósito y alcance

Implementar y comprobar las HU-01 a HU-69 del documento dentro del prototipo académico existente, preservando la experiencia de **Votación** para el elector y de **Configuración / Candidaturas** para el tribunal. No se autorizó un rediseño de estilos ni cambio de tecnología.

## Trabajo completado (estado de la entrega)

| Etapa | HU | Actividad | Estado / evidencia |
|---|---|---|---|
| 1. Línea base | HU-01–HU-19 | Evaluar las papeletas, fichas, selección, candidaturas, requisitos, habilitación, edición/retiro | Iteración 1; 20 pruebas de dominio; `App.css` intacto |
| 2. Configuración | HU-20–HU-47 | Modalidades, grupos, reglas, tribunal, borradores pendientes, publicación, sorteo y bloqueo de configuración | Revisado y reforzado; 28 pruebas individuales |
| 3. Voto seguro *en memoria* | HU-48–HU-63 | Padrón, periodo electoral, validación completa, voto único, sesiones, acuse y vencimiento | Revisado y reforzado; 16 pruebas individuales |
| 4. Privacidad y monitoreo | HU-64–HU-69 | Estado sin selección, inspección de esquemas, aislamiento de organización, resultados hasta cierre | Revisado y reforzado; 6 pruebas individuales |
| 5. Regresión | HU-01–HU-69 | `npm test`, parse de JSX/JS, comparación de archivos del diseño | 70/70 pruebas exitosas; sin cambio de `App.css` ni `App.jsx` |

## Plan restante para aceptación del prototipo

| Prioridad | Tarea concreta | Criterio para cerrar | Dependencia / riesgo |
|---|---|---|---|
| P0 | Instalar dependencias en la computadora de desarrollo (`npm ci`), ejecutar `npm run build` y `npm run dev` | Compilación exitosa sin errores ni alertas de consola | Este entorno no dispone de todas las dependencias en caché |
| P0 | Ejecutar recorridos de electores y tribunal en navegador según `PRUEBAS_MANUALES.md` | Todos los pasos y mensajes coinciden con sus criterios de aceptación | Se debe validar con un navegador real |
| P0 | Probar flujo por puestos y flujo por grupos de extremo a extremo | Dos resultados correctos, sin revelar preferencias antes del cierre | Requiere configurar opciones, padrón y tiempo de apertura |
| P1 | Revisar accesibilidad en móvil, tablet y escritorio sin rediseñar la interfaz | Tarjetas legibles, modales navegables por teclado, controles y advertencias accesibles | Puede requerir ajustes puntuales de CSS, previamente autorizados |
| P1 | Confirmar con profesor/cliente las decisiones abiertas de RF-15 y RF-16 | Documentar reglas para papeletas con mínimo 0, múltiple selección y voto ponderado | Especificación no cierra el algoritmo ponderado ni la política de voto en blanco |
| P1 | Validar formalmente cada fila de la matriz con capturas/evidencias | 69 HU firmadas con criterios de aceptación, resultados y defectos registrados | Las pruebas unitarias no sustituyen la prueba manual |

## Trabajo necesario si se quisiera usar para elecciones reales (FUERA del alcance actual)

1. **Identidad y permisos:** autenticación real, sesiones de servidor, selección segura de organización activa, roles de elector, tribunal y auditor.
2. **Datos durables y transacciones:** base de datos con aislamiento por organización, padrón cerrado, unicidad por (organización, proceso, elector), confirmación atómica de emisión y tratamiento de reintentos/concurrencia.
3. **Secreto y privacidad:** cifrado y aislamiento de papeletas, modelo de anonimización verificable, prevención de correlación por pesos únicos, registros y metadatos de conexión, análisis de amenazas externo.
4. **Auditoría y trazabilidad:** evidencias verificables sin registrar vínculo elector→voto, permisos de auditor separados, pruebas de integridad y procedimientos de escrutinio reproducibles.
5. **Operación:** reloj y vencimiento en backend, respaldo, recuperación ante fallos, pruebas de carga, pruebas de intrusión, despliegue seguro y monitoreo.

## Definición de terminado

Una historia se considera **revisada en el prototipo** cuando su regla está representada en la capa lógica o la interfaz y su caso principal/negativo tiene prueba automatizada o manual. Se considera **aceptada** solo tras ejecutar los criterios completos en un navegador con dependencias instaladas; el código entregado no certifica la seguridad de una plataforma de votación real.
