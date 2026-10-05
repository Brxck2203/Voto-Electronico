export const REQUISITOS_CANDIDATURA = [
  'Documentación presentada',
  'Membresía activa',
  'Sin sanciones vigentes',
]

export class PuestoInvalidoError extends Error {
  constructor(mensaje = 'El nombre del puesto es obligatorio.') {
    super(mensaje)
    this.name = 'PuestoInvalidoError'
  }
}

export class PuestoDuplicadoError extends Error {
  constructor() {
    super('Ya existe un puesto con ese nombre.')
    this.name = 'PuestoDuplicadoError'
  }
}

export class CandidaturaInvalidaError extends Error {
  constructor(mensaje) {
    super(mensaje)
    this.name = 'CandidaturaInvalidaError'
  }
}

export class OperacionNoPermitidaError extends Error {
  constructor(mensaje = 'Esta operación no está permitida porque la jornada electoral ya inició.') {
    super(mensaje)
    this.name = 'OperacionNoPermitidaError'
  }
}

export class CandidatoNoHabilitadoError extends Error {
  constructor(requisitosPendientes) {
    super(`No se puede habilitar la candidatura. Requisitos pendientes: ${requisitosPendientes.join(', ')}.`)
    this.name = 'CandidatoNoHabilitadoError'
    this.requisitosPendientes = requisitosPendientes
  }
}

export function crearCandidatura(datos) {
  return {
    id: datos.id ?? crypto.randomUUID(),
    nombreCompleto: datos.nombreCompleto.trim(),
    nombre: datos.nombreCompleto.trim(),
    fotografia: datos.fotografia ?? '',
    foto: datos.fotografia ?? '',
    presentacion: datos.presentacion.trim(),
    propuesta: datos.presentacion.trim(),
    puestoId: datos.puestoId,
    estado: datos.estado ?? 'Pendiente',
    requisitos: datos.requisitos ?? REQUISITOS_CANDIDATURA.map((nombre) => ({ nombre, cumplido: false })),
  }
}

export function validarDatosCandidatura(datos) {
  if (!datos.nombreCompleto?.trim()) {
    throw new CandidaturaInvalidaError('El nombre completo es obligatorio.')
  }
  if (!datos.presentacion?.trim()) {
    throw new CandidaturaInvalidaError('La presentación o propuesta es obligatoria.')
  }
  if (!datos.puestoId) {
    throw new CandidaturaInvalidaError('Debe seleccionar un puesto.')
  }
}
