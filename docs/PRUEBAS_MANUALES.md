# Pruebas de aceptación manuales (sin cambiar el diseño)

## Preparación

1. Descomprimir el ZIP, abrir la carpeta `voto-electronico`, ejecutar `npm ci`, `npm run dev` y abrir la dirección local que imprime Vite.
2. Expandir **Contexto de pruebas · datos en memoria** para seleccionar la organización y la identidad. Para administrar, elegir **Tribunal · Coordinación** de Asociación Horizonte. Para votar, una identidad de elector precargada.
3. Repetir cada escenario con una instancia nueva si hace falta, ya que los votos y configuraciones se mantienen solo mientras la aplicación siga abierta.

## Tribunal / Configuración

- HU-20/21: intentar cambiar modalidad con opciones habilitadas (rechazo). Deshabilitarlas y escoger modo grupos; conformar un grupo por puesto.
- HU-22/23: deshabilitar una candidatura; confirmar que desaparece de la papeleta pero no del registro. Intentar habilitar rechazada (rechazo).
- HU-24/25/40/41: crear un proceso electoral nuevo; observar parámetros PENDIENTE y errores de publicación hasta completar configuración.
- HU-26/27: guardar fechas válidas y UTC/Costa Rica; probar cierre de padrón igual a apertura (rechazo).
- HU-28/29: guardar duración positiva; probar 0 y decimal (rechazo).
- HU-30/31: cambiar límites dentro del número de opciones habilitadas; máximo excesivo (rechazo).
- HU-32/33: elegir ponderación, verificar pesos y probar peso cero (rechazo).
- HU-34/35: revisar la lista de grupos y su composición puesto–candidato; grupo incompleto (rechazo).
- HU-36/37: modificar requisito obligatorio y verificar que candidaturas quedan pendientes de nueva revisión.
- HU-38/39: guardar tribunal, intentar dejarlo vacío (rechazo) y revisar nombres autorizados.
- HU-42/43: intentar publicar configuración incompleta, corregir errores y publicar.
- HU-44/45: revisar vista previa publicada y el mensaje de orden sorteado sin opciones omitidas o duplicadas.
- HU-46/47: abrir la jornada, intentar editar cualquier parámetro y revisar mensaje de bloqueo.

## Votación / seguridad / auditoría

- HU-48/49: intentar votar con elector no incluido en el padrón o desde otra organización; verificar rechazo.
- HU-50/51: intentar ingresar antes de apertura y después de cierre; ambos rechazos.
- HU-52/53: escoger más opciones de las permitidas; impedir confirmación. Probar otra papeleta incompleta.
- HU-54/55: emitir una vez; volver a entrar con la misma identidad, ver mensaje de participación previa.
- HU-56/57: después de votar, intentar regresar a selección; no debe existir una edición del voto registrado.
- HU-58/59: configurar 40 segundos de sesión, ingresar y observar advertencia en últimos 30 segundos; dejarla vencer sin emitir.
- HU-60/61: intentar reingresar después de vencimiento antes del cierre (nueva sesión); después de emitir (rechazo).
- HU-62/63: confirmar un voto; comprobar acuse sin selección, sin candidato ni papelera de votación.
- HU-64/65: desde Configuración, abrir **Consultar participación** y **Revisar separación de datos**; no aparece ningún voto asociado a un elector.
- HU-66/67: cambiar contexto de organización y verificar que solo aparecen procesos de esa organización.
- HU-68/69: durante jornada abrir Resultados; no se presentan preferencias, únicamente el total de participación para administradores. Cerrar, volver y revisar conteo final.

## Resultado esperado

No se requiere alterar el diseño. Registrar por cada HU: fecha, navegador, identidad/rol, entrada, resultado observado, esperado, captura y aprobado/no aprobado. Una discrepancia se registra como defecto y no como HU terminada.
