# Estado técnico de la migración a JSON

**Alcance:** migración del flujo de acceso, votación y administración principal desde el prototipo anterior a un servidor Node y una sola base `data/database.json`.

**Interfaz reutilizada:** diseño minimalista y portada de dos caminos; la papeleta mantiene tarjetas de candidatos, propuestas y confirmación. Gestión permite crear procesos, configurar candidatos y puestos, establecer fechas, publicar, ver participación, escrutinio y PDF.

**Persistencia:** los usuarios de prueba, organizaciones, elecciones, roll, participación, papeletas y actas se leen y actualizan en JSON. Recargar React no borra votos.

**Historial:** se conservan `src/domain/ElectoralSystem.js` y sus pruebas para el alcance funcional anterior. No todos los métodos avanzados del motor están integrados al nuevo servidor JSON (por ejemplo, conformación de grupos, tribunal múltiple, campañas y verificación detallada de candidaturas). No debe declararse que las 85 HU se completaron sobre este backend.

**Pruebas:** ejecutar `npm test` para motor original y controles del servidor JSON. Es necesario realizar validación visual con Vite y navegador en el equipo del estudiante. No se pudo instalar Vite desde la caché de este entorno.

**Seguridad:** demo exclusivamente. El JSON es editable por el operador local; no debe exponerse por Internet ni utilizarse como urna electoral real.
