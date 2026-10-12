# Voto Electrónico

Prototipo académico en **React + Vite**, con configuración, campaña, votación y resultados. Todos los datos viven en memoria de la pestaña: no utiliza base de datos, backend, `localStorage` ni servicios de autenticación. Recargar reinicia los datos; otras pestañas no comparten la elección.

## Ejecutar

Requiere Node.js 22 o posterior.

```bash
npm ci
npm run dev
```

```bash
npm test
npm run build
npm run preview
```

## Recorrido de demostración

1. En **Configuración**, revise el proceso precargado y pulse **Publicar configuración**. Las fechas iniciales ubican la campaña en el momento actual y la votación al día siguiente.
2. Abra **Contexto de pruebas · datos en memoria** y seleccione una identidad de candidato. En **Campaña** puede publicar propuestas con texto, JPG/PNG o MP4/WebM. Las identidades del padrón pueden consultar; el candidato autor puede responder.
3. Regrese a **Tribunal · Coordinación** o **Tribunal · Secretaría**. En **Configuración**, pulse **Abrir ahora** para adelantar el calendario en la demostración. También puede esperar la apertura programada. El padrón se cierra y las reglas quedan bloqueadas.
4. Seleccione un elector y entre en **Votación → Ingresar a votar**. Marque una opción en Presidencia y otra en Tesorería; revise ambas y confirme. Una sola emisión registra todas las papeletas.
5. Cambie de elector para repetir las pruebas. Un elector que ya participó no puede emitir nuevamente. Si expira la sesión sin emitir, puede reingresar mientras la jornada siga abierta; las selecciones anteriores se descartan.
6. El tribunal puede consultar participación sin conteos por candidato y **Cerrar jornada** de forma irreversible. En **Resultados** se muestran conteos, pesos, abstención y empates. El cierre programado produce el mismo cambio de disponibilidad.

## Configuración y datos de prueba

- Dos organizaciones independientes, cada una con dos integrantes de tribunal y diez electores precargados.
- **Diez candidatos: los tres iniciales más siete adicionales**, distribuidos en cinco por puesto. No hay paginación de papeletas. Nombres, propuestas y afiliaciones están en `src/state/seed.js`.
- Candidaturas nuevas pendientes, verificación de requisitos obligatorios y opcionales, fotografía JPG/PNG de hasta 5 MB, vista previa, filtros por puesto/estado y retiro.
- La identidad asignada a una candidatura determina quién puede publicar y responder en su campaña.
- Calendario de inscripción, campaña, cierre de padrón y votación. Los campos se editan en UTC y muestran su equivalencia en la zona horaria seleccionada.
- Sesión configurable en segundos; mínimo/máximo de selecciones por puesto; padrón con pesos positivos de hasta tres decimales.
- Votación por puestos o por grupos completos. Para cambiar modalidad, primero deshabilite las opciones. Cree grupos con un candidato habilitado por puesto y habilítelos antes de publicar.
- Los cambios previos a apertura devuelven el proceso a borrador. Cada publicación sortea el orden y lo conserva para todas las consultas de esa versión.
- En ponderación, cada opción seleccionada recibe el peso completo del elector. Si el mínimo es cero, la papeleta puede quedar sin selección: cuenta en participación y no añade puntuación a ninguna opción. En grupos se selecciona exactamente uno.
- Los empates de mayor puntuación se señalan; el sistema no decide su resolución.

## Alcance del prototipo

El selector de identidades simula actores: **no autentica usuarios**. La unicidad, los permisos y el aislamiento se aplican en el motor durante la misma ejecución. No constituyen controles contra manipulación del navegador ni unicidad entre dispositivos.

La participación y las selecciones se almacenan por separado. Los registros de votos no tienen elector, token ni fecha, y solo se exponen resultados agregados después del cierre. Esto demuestra separación lógica; no garantiza anonimato criptográfico. Los pesos distintivos y las muestras pequeñas pueden permitir inferencias.

Las fechas de inscripción son parte del calendario; el tribunal mantiene las candidaturas y verifica requisitos antes de la apertura. No se incorpora autoinscripción ni autenticación real. Las reglas institucionales para desempate, elegibilidad y asignación de pesos corresponden a la organización.

Consulte [arquitectura](ARCHITECTURE.md) y [trazabilidad de implementación](docs/TRAZABILIDAD.md).


## Continuación por historias de usuario (HU-01 a HU-69)

Esta versión parte de `Voto-Electronico-main.zip` y continúa la Iteración 1, sin modificar los estilos ni la navegación principal. La especificación, matriz y plan están en `docs/`.

- `npm ci` — instalar dependencias (requiere acceso a paquetes npm).
- `npm test` — ejecutar 70 pruebas del dominio; HU-20 a HU-69 tienen 50 pruebas identificadas.
- `npm run dev` — abrir la aplicación local.
- `npm run build` — comprobar compilación de producción en el entorno con dependencias.

**Aviso:** Prototipo académico en memoria. La identidad seleccionable desde la demostración no autentica personas; no usar para elecciones reales sin arquitectura, seguridad y auditoría adicionales.
