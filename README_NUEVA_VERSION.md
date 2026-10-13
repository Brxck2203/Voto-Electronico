## Nuevo acceso por cédula

La aplicación abre una pantalla con dos opciones: **Ejercer mi voto** (cédula + código electoral) y **Gestionar elección** (correo/contraseña únicamente del tribunal). Ver `docs/ACCESO_POR_CEDULA.md` antes de ejecutar. Reinicia los emuladores y vuelve a sembrar los datos para crear el índice de cédulas ficticias.

# Voto Electrónico — rediseño minimalista y avance hacia Firebase

Se conserva el motor de dominio de las HU-01 a HU-69, se implementan HU-70 a HU-83 en la **simulación** y se proponen HU-84 y HU-85 para autenticación/credencial. **85 pruebas unitarias**, pero sin build Vite ni despliegue Firebase verificados en este entorno.

## Inicio rápido

`npm install && npm run dev` y abrir la URL de Vite. Sin `.env.local`, muestra modo demostración; el selector de identidades **no autentica** personas.

Para modo seguro de Firebase, leer `docs/FIREBASE_PASO_A_PASO.md`; sin web app API key, App ID, Auth, App Check y funciones desplegadas NO funciona como plataforma multiusuario.

## Estructura

- `src/domain/ElectoralSystem.js`: motor local de pruebas con acta al cierre.
- `src/firebase/FirebasePortal.jsx`: portal de acceso + vistas separadas por rol.
- `src/firebase/client.js`: Firebase SDK oficial desde npm (`firebase/app`, `firebase/auth`, `firebase/functions`, `firebase/app-check`).
- `functions/index.js`: Cloud Functions con verificación de Auth, rol, padrón, código electoral y voto transaccional; escrutinio final server-side.
- `firestore.rules`: acceso directo a Firestore denegado.
- `scripts/seed-firebase.mjs`: datos ficticios y credenciales aleatorias para un **proyecto de demo**.
- `src/utils/officialPdf.js`: creación local de PDF sin datos de identidad.
- `docs/IMPLEMENTACION_HU70_HU85.md`: alcance, pruebas y pendientes.

## Precauciones

La clave de servicio entregada por el usuario **no se incluyó** en ningún archivo de esta distribución. Se recomienda revocarla y reemplazarla. Las normas de voto secreto/ponderado, auditoría y seguridad electoral real requieren validación independiente.

## Integración Firebase lista para configurar (12 de octubre de 2026)

Se agregó `.env.local` con la configuración **pública** del proyecto web `voto-electronico-9f636`; se reemplazó la importación del SDK por CDN con el SDK oficial `firebase` desde npm, y se habilitó un interruptor de emuladores para pruebas sin facturación.

**Primer paso en Windows:** lea `docs/INICIAR_FIREBASE_EN_WINDOWS.md`. Use `npm install` (no `npm install`: el lockfile se regenera por la nueva dependencia) y pruebe primero en emuladores. **No está desplegado** en tu proyecto de Firebase. Las reglas y Cloud Functions necesitan pruebas de integración y, para desplegar funciones, un plan con facturación compatible.
