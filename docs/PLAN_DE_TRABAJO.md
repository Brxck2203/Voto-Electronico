# Plan de trabajo — Versión JSON local

## Implementado

- Portada con dos accesos: **Ejercer mi voto** y **Gestionar elección**.
- Servidor Node.js que lee y escribe `data/database.json` sin servicios de terceros.
- Datos ficticios de electores, tribunal, candidaturas y elecciones en borrador y publicada.
- Acceso de gestión mediante contraseña de demostración, con sesiones locales HTTP-only.
- Entrada del votante mediante cédula + código electoral y sesión temporal.
- Validación de papeletas, emisión única por elector, persistencia y bloqueo de resultados antes del cierre.
- Escrutinio, conciliación, estadísticas, acta guardada y descarga PDF.

## Por verificar o completar

1. Compilar y ejecutar React con `npm install`, `npm run build` y `npm run dev` en Windows.
2. Recorrido en navegador con cuenta del tribunal, creación de proceso y publicación.
3. Recorrido de votante con cédula y código, intento duplicado, expiración y reingreso.
4. Comprobar visualmente la interfaz responsive y los mensajes de error.
5. Integrar a la API JSON los módulos avanzados existentes en el motor académico: grupos, tribunal múltiple, requisitos detallados y campañas.
6. Mantener trazabilidad del alcance documentado hasta HU-83; las HU-84/85 de acceso fueron propuestas posteriores y deben validarse con el profesor/cliente.
7. No utilizar este prototipo para votaciones oficiales: una base JSON local no ofrece autenticación real, auditoría independiente ni anonimato criptográfico.
