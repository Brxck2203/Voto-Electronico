# Accesos ficticios para la demostración

**No se deben utilizar personas ni credenciales reales.** Toda la información procede de `data/database.json`, sin Firebase.

## Gestión electoral

- Correo: `tribunal@demo.local`
- Contraseña: `Tribunal2026!`

La contraseña se verifica en el servidor local contra un hash `scrypt` guardado en la base JSON.

## Votación

- Elección: **Junta directiva 2026 · Demostración** (se crea inicialmente como PUBLICADO y ABIERTO por un año a partir de la creación de la base).
- Cédula ficticia: `101000001`
- Código ficticio: `A91B2C3D4E5F60718293ABCD`

Para ver las otras nueve cédulas y códigos de prueba, ejecuta `npm run db:status`. También están definidos en `server/seed.js` y solamente se utilizan para generar datos ficticios.

Después de votar, `data/database.json` almacena un registro de participación y una papeleta por puesto. No es posible emitir otro voto con la misma cédula dentro del mismo proceso.

## Restaurar datos de demostración

`npm run db:reset -- --confirmar`

**Atención:** elimina todos los votos, actas y modificaciones realizados en esta base local. Antes de ejecutarlo, respalda `data/database.json` si deseas conservar información.
