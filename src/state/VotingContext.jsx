import { createContext, useContext, useMemo, useState } from 'react'
import { InMemoryVotingRepository } from '../infrastructure/InMemoryVotingRepository.js'
import { Candidato } from '../domain/models.js'

const candidatosIniciales = [
  new Candidato(
    1,
    'Ana Rodríguez',
    '',
    'Fortalecer la comunicación interna y digitalizar los trámites de la organización.',
    'Agrupación Renovación',
  ),
  new Candidato(
    2,
    'Luis Fernández',
    '',
    'Impulsar beneficios adicionales y transparencia financiera para los agremiados.',
    'Agrupación Unidad',
  ),
  new Candidato(
    3,
    'Mariana Solano',
    '',
    'Mejorar la atención al asociado y modernizar los servicios de la organización.',
    'Agrupación Avance',
  ),
]

const VotingContext = createContext(null)

export function VotingProvider({ children }) {
  const repository = useMemo(() => new InMemoryVotingRepository(candidatosIniciales), [])
  const [votanteId, setVotanteId] = useState(() => crypto.randomUUID())
  const [seleccion, setSeleccion] = useState(null)
  const [error, setError] = useState(null)
  const [votoConfirmado, setVotoConfirmado] = useState(false)

  const seleccionarCandidato = (candidatoId) => {
    setSeleccion(candidatoId)
    setError(null)
  }

  const confirmarVoto = () => {
    if (seleccion == null) {
      setError('Debe seleccionar una opción antes de confirmar su voto.')
      return false
    }
    try {
      repository.registrarVoto(votanteId, seleccion)
      setError(null)
      setVotoConfirmado(true)
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  const nuevaSesionVotante = () => {
    setVotanteId(crypto.randomUUID())
    setSeleccion(null)
    setError(null)
    setVotoConfirmado(false)
  }

  const reintentarConMismoVotante = () => {
    setSeleccion(null)
    setError(null)
    setVotoConfirmado(false)
  }

  const value = {
    candidatos: repository.obtenerCandidatos(),
    seleccion,
    seleccionarCandidato,
    confirmarVoto,
    nuevaSesionVotante,
    reintentarConMismoVotante,
    error,
    votoConfirmado,
    votanteId,
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
