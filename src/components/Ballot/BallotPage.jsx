import { useState } from 'react'
import { useVoting } from '../../state/VotingContext.jsx'
import { CandidateGrid } from './CandidateGrid.jsx'
import { CandidateDetailModal } from './CandidateDetailModal.jsx'
import { ConfirmVoteModal } from '../Confirmation/ConfirmVoteModal.jsx'

export function BallotPage() {
  const { candidatos, seleccion, seleccionarCandidato, error } = useVoting()
  const [candidatoDetalle, setCandidatoDetalle] = useState(null)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  const candidatoSeleccionado = candidatos.find((candidato) => candidato.id === seleccion) ?? null

  const handleToggle = (candidatoId) => {
    seleccionarCandidato(seleccion === candidatoId ? null : candidatoId)
  }

  return (
    <section className="ballot-page">
      <CandidateGrid
        candidatos={candidatos}
        seleccion={seleccion}
        onToggle={handleToggle}
        onVerFoto={setCandidatoDetalle}
      />

      {error && <p className="error-message" role="alert">{error}</p>}

      <button
        type="button"
        className="btn btn--primary btn--votar"
        disabled={!candidatoSeleccionado}
        onClick={() => setMostrarConfirmacion(true)}
      >
        Votar
      </button>

      <CandidateDetailModal candidato={candidatoDetalle} onClose={() => setCandidatoDetalle(null)} />

      {mostrarConfirmacion && (
        <ConfirmVoteModal
          candidato={candidatoSeleccionado}
          onCancelar={() => setMostrarConfirmacion(false)}
          onConfirmado={() => setMostrarConfirmacion(false)}
        />
      )}
    </section>
  )
}
