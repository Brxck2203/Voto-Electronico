import { createContext, useContext, useEffect, useState } from 'react'
import { ElectoralSystem } from '../domain/ElectoralSystem.js'
import { createSeed } from './seed.js'
const VotingContext = createContext(null)
export function VotingProvider({ children }) {
  const [system] = useState(() => {
    const s = createSeed()
    return new ElectoralSystem(s.organizations, s.elections)
  })
  const organizations = system.identities()
  const [context, setContext] = useState({
    orgId: organizations[0].id,
    userId: organizations[0].members[0].id,
  })
  const [electionId, setElectionId] = useState(
    () => system.list(context)[0]?.id,
  )
  const [, refresh] = useState(0)
  const [session, setSession] = useState(null)
  const [selections, setSelections] = useState({})
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [clock, setClock] = useState(Date.now())
  const election = electionId ? system.view(context, electionId) : null
  const ballots = electionId ? system.ballots(context, electionId) : []
  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (
      session &&
      (clock >= session.expires || election?.phase !== 'ABIERTO')
    ) {
      setSession(null)
      setSelections({})
      setError(
        'SESION_VENCIDA: puede reingresar si la jornada continúa abierta y aún no emitió.',
      )
      setNotice('')
    }
  }, [clock, session, election?.phase])
  const clear = () => {
    setSession(null)
    setSelections({})
    setError('')
    setNotice('')
  }
  const changeIdentity = (orgId, userId) => {
    clear()
    const ctx = { orgId, userId }
    setContext(ctx)
    setElectionId(system.list(ctx)[0]?.id)
  }
  const chooseElection = (id) => {
    clear()
    setElectionId(id)
  }
  const read = (method, ...args) => system[method](context, electionId, ...args)
  const run = (method, ...args) => {
    const result = system[method](context, electionId, ...args)
    refresh((n) => n + 1)
    return result
  }
  const act = (method, ...args) => {
    try {
      const result = run(method, ...args)
      setError('')
      setNotice('Cambios aplicados.')
      return result ?? true
    } catch (e) {
      setError(e.message)
      setNotice('')
      return false
    }
  }
  const begin = () => {
    try {
      setSession(run('begin'))
      setClock(Date.now())
      setSelections(Object.fromEntries(ballots.map((b) => [b.id, []])))
      setError('')
      setNotice('')
    } catch (e) {
      setError(e.message)
    }
  }
  const emit = () => {
    try {
      const result = run('emit', session?.token, selections)
      clear()
      setNotice(result.status)
      return true
    } catch (e) {
      setError(e.message)
      return false
    }
  }
  const select = (ballotId, optionId) => {
    const b = ballots.find((b) => b.id === ballotId),
      current = selections[ballotId] || []
    if (!session || election.emitted || clock >= session.expires) return
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : b.max === 1
        ? [optionId]
        : [...current, optionId]
    if (next.length > b.max) {
      setError(`Puede seleccionar como máximo ${b.max} opciones en ${b.name}.`)
      return
    }
    setSelections((s) => ({ ...s, [ballotId]: next }))
    setError('')
  }
  const value = {
    organizations,
    context,
    electionId,
    election,
    ballots,
    session,
    selections,
    clock,
    notice,
    error,
    setError,
    changeIdentity,
    chooseElection,
    elections: system.list(context),
    read,
    run,
    act,
    begin,
    emit,
    select,
    createElection: (name, purpose) => {
      try {
        const id = system.create(context, name, purpose)
        chooseElection(id)
        refresh((n) => n + 1)
        return true
      } catch (e) {
        setError(e.message)
        return false
      }
    },
    // Adaptador para conservar la administración existente.
    puestos: election?.positions || [],
    candidaturas: election?.candidates || [],
    candidatos: ballots.flatMap((b) => b.options),
    jornadaIniciada: !election?.editable,
    crearPuesto: (data) => run('position', data),
    editarPuesto: (id, data) => run('position', data, id),
    eliminarPuesto: (id) => run('deletePosition', id),
    crearCandidatura: (data) => run('candidate', data),
    editarCandidatura: (id, data) => run('candidate', data, id),
    actualizarRequisito: (id, name, value) =>
      run('requirement', id, name, value),
    habilitarCandidatura: (id) => run('enableCandidate', id),
    retirarCandidatura: (id) => run('withdraw', id),
  }
  return (
    <VotingContext.Provider value={value}>{children}</VotingContext.Provider>
  )
}
export function useVoting() {
  return useContext(VotingContext)
}
