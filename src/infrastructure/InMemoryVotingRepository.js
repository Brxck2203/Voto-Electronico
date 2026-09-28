import { VotingRepository } from '../domain/VotingRepository.js'
import { Voto, VotanteYaVotoError } from '../domain/models.js'

export class InMemoryVotingRepository extends VotingRepository {
  constructor(candidatos = []) {
    super()
    this.candidatos = candidatos
    this.votos = []
    this.votantesQueVotaron = new Set()
  }

  obtenerCandidatos() {
    return this.candidatos
  }

  yaVoto(votanteId) {
    return this.votantesQueVotaron.has(votanteId)
  }

  registrarVoto(votanteId, candidatoId) {
    if (this.yaVoto(votanteId)) {
      throw new VotanteYaVotoError()
    }
    this.votos.push(new Voto(candidatoId))
    this.votantesQueVotaron.add(votanteId)
  }

  obtenerResultados() {
    return this.votos.reduce((conteo, voto) => {
      conteo[voto.candidatoId] = (conteo[voto.candidatoId] || 0) + 1
      return conteo
    }, {})
  }
}
