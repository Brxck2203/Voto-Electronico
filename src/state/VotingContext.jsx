import { createContext, useContext, useMemo, useState } from 'react'
import { InMemoryVotingRepository } from '../infrastructure/InMemoryVotingRepository.js'
import { Candidato } from '../domain/models.js'

const candidatosIniciales = [
  new Candidato(1, 'Candidato A', '', 'Propuesta A', 'Agrupación 1'),
  new Candidato(2, 'Candidato B', '', 'Propuesta B', 'Agrupación 2'),
]

const VotingContext = createContext(null)

export function VotingProvider({ children }) {
  const repository = useMemo(() => new InMemoryVotingRepository(candidatosIniciales), [])
  const [seleccion, setSeleccion] = useState(null)
  const [error, setError] = useState(null)

  const votar = (votanteId) => {
    try {
      repository.registrarVoto(votanteId, seleccion)
      setError(null)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const value = {
    candidatos: repository.obtenerCandidatos(),
    seleccion,
    setSeleccion,
    votar,
    error,
    obtenerResultados: () => repository.obtenerResultados(),
  }

  return <VotingContext.Provider value={value}>{children}</VotingContext.Provider>
}

export function useVoting() {
  const context = useContext(VotingContext)
  if (!context) {
    throw new Error('useVoting debe usarse dentro de un VotingProvider')
  }
  return context
}
