import { useState } from 'react'
import { useVoting } from '../../state/VotingContext.jsx'
import { CandidateGrid } from './CandidateGrid.jsx'
import { CandidateDetailModal } from './CandidateDetailModal.jsx'
import { ConfirmVoteModal } from '../Confirmation/ConfirmVoteModal.jsx'

export function BallotPage({ onVolver }) {
  const { candidatos, puestos, seleccion, seleccionarCandidato, error, votoConfirmado, jornadaIniciada } = useVoting()
  const [candidatoDetalle, setCandidatoDetalle] = useState(null)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  const candidatoSeleccionado = candidatos.find((candidato) => candidato.id === seleccion) ?? null
  const soloConsulta = votoConfirmado || !jornadaIniciada

  const handleToggle = (candidatoId) => {
    if (soloConsulta) return
    seleccionarCandidato(seleccion === candidatoId ? null : candidatoId)
  }
  const mostrarPuestos = puestos.length > 1

  return (
    <section className="ballot-page">
      <div className="ballot-page__topbar">
        <button type="button" className="btn btn--secondary" onClick={onVolver}>← Regresar a Mis votaciones</button>
        <span className={`election-status${jornadaIniciada ? ' election-status--active' : ''}`}>
          <span className="election-status__indicator" aria-hidden="true" />
          {jornadaIniciada ? 'Votación activa' : 'Votación no activa'}
        </span>
      </div>
      {votoConfirmado && <p className="vote-already-cast" role="status">Tu voto ya fue registrado. Esta papeleta está disponible únicamente para consulta.</p>}
      {!jornadaIniciada && <p className="admin-lock-message" role="status">La votación todavía no está activa. Puedes consultar las opciones disponibles.</p>}
      {mostrarPuestos ? puestos.map((puesto) => {
        const opciones = candidatos.filter((candidato) => candidato.puestoId === puesto.id)
        return (
          <section className="ballot-position" key={puesto.id} aria-labelledby={`ballot-position-${puesto.id}`}>
            <h2 id={`ballot-position-${puesto.id}`}>{puesto.nombre}</h2>
            {puesto.descripcion && <p>{puesto.descripcion}</p>}
            {opciones.length
              ? <CandidateGrid candidatos={opciones} seleccion={seleccion} onToggle={handleToggle} onVerFoto={setCandidatoDetalle} disabled={soloConsulta} />
              : <p className="empty-state">No hay candidaturas habilitadas para este puesto.</p>}
          </section>
        )
      }) : (
        <CandidateGrid
          candidatos={candidatos}
          seleccion={seleccion}
          onToggle={handleToggle}
          onVerFoto={setCandidatoDetalle}
          disabled={soloConsulta}
        />
      )}

      {error && <p className="error-message" role="alert">{error}</p>}

      {!soloConsulta && (
        <button
          type="button"
          className="btn btn--primary btn--votar"
          disabled={!candidatoSeleccionado}
          onClick={() => setMostrarConfirmacion(true)}
        >
          Votar
        </button>
      )}

      <CandidateDetailModal candidato={candidatoDetalle} onClose={() => setCandidatoDetalle(null)} />

      {mostrarConfirmacion && !soloConsulta && (
        <ConfirmVoteModal
          candidato={candidatoSeleccionado}
          onCancelar={() => setMostrarConfirmacion(false)}
          onConfirmado={() => setMostrarConfirmacion(false)}
        />
      )}
    </section>
  )
}
