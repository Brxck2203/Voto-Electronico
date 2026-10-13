# Voto Electrónico — Prototipo con base JSON

Aplicación de curso, completamente local. **No utiliza Firebase, emuladores, cuenta de Google, scripts PowerShell ni conexión a una base externa**.

La pantalla principal permite elegir entre **Ejercer mi voto** y **Gestionar elección**. Se mantiene el diseño minimalista del prototipo anterior.

## Requisitos

- Node.js 22 o superior
- npm

## Ejecutar en Windows / VS Code

Desde la carpeta `voto-electronico`:

```powershell
npm install
npm run dev
```

Abre la dirección que muestra Vite (normalmente `http://127.0.0.1:5173`). El mismo comando inicia **Vite** y el servidor local **Node en el puerto 8787**.

## Prueba rápida

- Gestión: correo `tribunal@demo.local`, contraseña `Tribunal2026!`.
- Votación: cédula `101000001`, código electoral `A91B2C3D4E5F60718293ABCD`.
- Primero prueba la elección publicada `Junta directiva 2026 · Demostración`.
- Hay un segundo proceso en `BORRADOR` para probar la edición y publicación.

Consulta más ejemplos en [docs/CUENTAS_DEMO.md](docs/CUENTAS_DEMO.md), o ejecuta `npm run db:status`.

## Dónde se guardan los datos

El archivo **`data/database.json`** incluye organizaciones, cuentas administrativas (contraseñas con hash), electores (cédulas y códigos con hash), padrón, procesos electorales, candidaturas, participación, papeletas y actas finales. El servidor es quien lee y actualiza el JSON. **Recargar la página no borra los cambios.**

Para respaldar la información, copia `data/database.json` con el servidor detenido. Para reiniciar todo de cero:

```powershell
npm run db:reset -- --confirmar
```

Esto elimina irrevocablemente las participaciones, votos y cambios locales existentes.

## Comandos

- `npm run dev`: servidor de datos + React.
- `npm test`: pruebas automatizadas.
- `npm run build`: genera la interfaz compilada (requiere dependencias instaladas).
- `npm start`: sirve la versión compilada y la API local desde `http://127.0.0.1:8787`.
- `npm run db:status`: muestra el contenido general y los accesos ficticios.

## Limitaciones importantes

Esta aplicación es un **prototipo educativo**, no una plataforma de votación apta para elecciones reales. Un JSON editable por quien controla la computadora **no proporciona integridad criptográfica ni anonimato resistente a auditorías**. La seguridad de la cuenta y la cédula se simulan con contraseña/código y validación en Node; no se verifica una identidad real. No publiques este servidor en Internet ni introduzcas información personal auténtica. La única instancia Node debe escribir en el archivo; no compartas el archivo para edición simultánea.

Se conserva el motor histórico `src/domain/ElectoralSystem.js` y sus pruebas como referencia del alcance funcional. Las pantallas JSON de esta versión implementan el flujo principal de configuración, participación, escrutinio y resultados; los módulos avanzados del motor académico no están todos integrados al nuevo backend JSON.
