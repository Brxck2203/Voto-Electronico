// Contrato del repositorio de votación. Cualquier implementación
// (en memoria hoy, base de datos real en el futuro) debe cumplirlo,
// para no acoplar los componentes de UI a un mecanismo de almacenamiento concreto.
export class VotingRepository {
  obtenerCandidatos() {
    throw new Error('No implementado')
  }

  obtenerCandidaturas() {
    throw new Error('No implementado')
  }

  obtenerPuestos() {
    throw new Error('No implementado')
  }

  guardarPuesto() {
    throw new Error('No implementado')
  }

  eliminarPuesto() {
    throw new Error('No implementado')
  }

  guardarCandidatura() {
    throw new Error('No implementado')
  }

  actualizarRequisito() {
    throw new Error('No implementado')
  }

  habilitarCandidatura() {
    throw new Error('No implementado')
  }

  retirarCandidatura() {
    throw new Error('No implementado')
  }

  obtenerJornadaIniciada() {
    throw new Error('No implementado')
  }

  cambiarJornada() {
    throw new Error('No implementado')
  }

  registrarVoto(votanteId, candidatoId) {
    throw new Error('No implementado')
  }

  yaVoto(votanteId) {
    throw new Error('No implementado')
  }

  obtenerResultados() {
    throw new Error('No implementado')
  }
}
