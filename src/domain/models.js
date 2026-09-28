export class Candidato {
  constructor(id, nombre, foto, propuesta, agrupacion) {
    this.id = id
    this.nombre = nombre
    this.foto = foto
    this.propuesta = propuesta
    this.agrupacion = agrupacion
  }
}

export class Eleccion {
  constructor(id, nombre, tipo, fechaInicio, fechaFin, maxSelecciones = 1) {
    this.id = id
    this.nombre = nombre
    this.tipo = tipo
    this.fechaInicio = fechaInicio
    this.fechaFin = fechaFin
    this.maxSelecciones = maxSelecciones
  }
}

export class Voto {
  constructor(candidatoId, timestamp = Date.now()) {
    this.candidatoId = candidatoId
    this.timestamp = timestamp
  }
}

export class VotanteYaVotoError extends Error {
  constructor() {
    super('Este votante ya emitió su voto.')
    this.name = 'VotanteYaVotoError'
  }
}

export class SeleccionInvalidaError extends Error {
  constructor(mensaje) {
    super(mensaje)
    this.name = 'SeleccionInvalidaError'
  }
}
