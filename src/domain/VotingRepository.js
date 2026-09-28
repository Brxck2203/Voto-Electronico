// Contrato del repositorio de votación. Cualquier implementación
// (en memoria hoy, base de datos real en el futuro) debe cumplirlo,
// para no acoplar los componentes de UI a un mecanismo de almacenamiento concreto.
export class VotingRepository {
  obtenerCandidatos() {
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
