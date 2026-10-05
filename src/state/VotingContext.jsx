import { createContext, useContext, useMemo, useState } from 'react'
import { InMemoryVotingRepository } from '../infrastructure/InMemoryVotingRepository.js'
import { Candidato } from '../domain/models.js'

const puestosIniciales = [
  { id: 'puesto-representacion', nombre: 'Representación general', descripcion: 'Representación de las personas asociadas.', activo: true },
]

const candidatosIniciales = [
  new Candidato(1, 'Ana Rodríguez', '', 'Fortalecer la comunicación interna y digitalizar los trámites de la organización.', 'Agrupación Renovación'),
  new Candidato(2, 'Luis Fernández', '', 'Impulsar beneficios adicionales y transparencia financiera para los agremiados.', 'Agrupación Unidad'),
  new Candidato(3, 'Mariana Solano', '', 'Mejorar la atención al asociado y modernizar los servicios de la organización.', 'Agrupación Avance'),
]

const VotingContext = createContext(null)

export function VotingProvider({ children }) {
  const repository = useMemo(() => new InMemoryVotingRepository(candidatosIniciales, puestosIniciales), [])
  const [votanteId] = useState(() => crypto.randomUUID())
  const [seleccion, setSeleccion] = useState(null)
  const [error, setError] = useState(null)
  const [votoConfirmado, setVotoConfirmado] = useState(false)
  const [, actualizarVista] = useState(0)

  const refrescarDatos = () => actualizarVista((version) => version + 1)

  const ejecutarAdministracion = (operacion, ...argumentos) => {
    const resultado = repository[operacion](...argumentos)
    refrescarDatos()
    return resultado
  }

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

  const value = {
    candidatos: repository.obtenerCandidatos(),
    candidaturas: repository.obtenerCandidaturas(),
    puestos: repository.obtenerPuestos(),
    jornadaIniciada: repository.obtenerJornadaIniciada(),
    seleccion,
    seleccionarCandidato,
    confirmarVoto,
    error,
    votoConfirmado,
    obtenerResultados: () => repository.obtenerResultados(),
    crearPuesto: (datos) => ejecutarAdministracion('guardarPuesto', datos),
    editarPuesto: (id, datos) => ejecutarAdministracion('guardarPuesto', datos, id),
    eliminarPuesto: (id) => ejecutarAdministracion('eliminarPuesto', id),
    crearCandidatura: (datos) => ejecutarAdministracion('guardarCandidatura', datos),
    editarCandidatura: (id, datos) => ejecutarAdministracion('guardarCandidatura', datos, id),
    actualizarRequisito: (id, requisito, cumplido) => ejecutarAdministracion('actualizarRequisito', id, requisito, cumplido),
    habilitarCandidatura: (id) => ejecutarAdministracion('habilitarCandidatura', id),
    retirarCandidatura: (id) => ejecutarAdministracion('retirarCandidatura', id),
    cambiarJornada: (iniciada) => ejecutarAdministracion('cambiarJornada', iniciada),
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
