# Propuesta académica — HU-84 y HU-85

La versión JSON simplifica el acceso al prototipo. Estas historias adicionales requieren validación del profesor/cliente y **no representan una plataforma segura de producción**.

## HU-84 — Gestión electoral con acceso diferenciado

Como integrante autorizado del tribunal quiero iniciar sesión con una cuenta administrativa de demostración, para acceder a la gestión sin mostrarla a los votantes.

**Criterios:** contraseña verificada en el servidor Node, sesión HTTP-only, operaciones de gestión inaccesibles sin sesión, cierre de sesión invalida token. El archivo JSON conserva únicamente un hash de contraseña.

## HU-85 — Entrada del votante mediante cédula y código

Como elector quiero registrar mi cédula y código electoral de prueba para acceder a la papeleta de la elección correspondiente una sola vez.

**Criterios:** comprobar cédula y código con hashes en JSON; comprobar pertenencia al padrón; rechazar voto fuera de calendario, selección inválida, sesión vencida o participación duplicada; emitir comprobante que no revele la selección; separar participación de papeletas anónimas en el JSON.

**Advertencia:** un número de cédula y un código que pueden compartirse no constituyen comprobación robusta de identidad para procesos electorales reales; el operador del ordenador puede acceder y modificar el JSON. Estos flujos son solo para una demostración académica.
