/** Validate the server response before letting React render its fields. */
export function timestampMs(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (value && typeof value === 'object') {
    if (typeof value.toMillis === 'function') {
      const result = value.toMillis()
      return Number.isFinite(result) ? result : null
    }
    const seconds = value.seconds ?? value._seconds
    const nanos = value.nanoseconds ?? value._nanoseconds ?? 0
    if (typeof seconds === 'number' && Number.isFinite(seconds) &&
        typeof nanos === 'number' && Number.isFinite(nanos)) {
      return seconds * 1000 + Math.floor(nanos / 1_000_000)
    }
  }
  return null
}

export function toLocalDateTime(value) {
  const ms = timestampMs(value)
  if (ms === null) return ''
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return ''
  const localTime = new Date(ms - date.getTimezoneOffset() * 60_000)
  return Number.isNaN(localTime.getTime()) ? '' : localTime.toISOString().slice(0, 16)
}

export function validateElectionResponse(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.ballots)) {
    throw new Error('La respuesta del servidor no contiene una elección con papeletas válidas.')
  }
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string' ||
      typeof raw.phase !== 'string') {
    throw new Error('La elección recibida está incompleta. Revise getElection en Functions.')
  }
  const openAt = timestampMs(raw.openAt)
  const closeAt = timestampMs(raw.closeAt)
  if (openAt === null || closeAt === null || openAt >= closeAt) {
    throw new Error('El calendario de la elección tiene fechas inválidas. Revise los valores openAt y closeAt.')
  }
  const ballots = raw.ballots.map((b, bi) => {
    if (!b || typeof b.id !== 'string' || typeof b.name !== 'string' ||
        !Array.isArray(b.options)) {
      throw new Error(`La papeleta ${bi + 1} está incompleta. Revise la configuración electoral.`)
    }
    return {
      ...b,
      options: b.options.map((o, oi) => {
        if (!o || typeof o.id !== 'string' || typeof o.nombre !== 'string') {
          throw new Error(`Candidatura ${oi + 1} de la papeleta ${b.name} incompleta.`)
        }
        return { ...o, agrupacion: typeof o.agrupacion === 'string' ? o.agrupacion : '',
          propuesta: typeof o.propuesta === 'string' ? o.propuesta : '' }
      }),
    }
  })
  return { ...raw, openAt, closeAt, ballots }
}
