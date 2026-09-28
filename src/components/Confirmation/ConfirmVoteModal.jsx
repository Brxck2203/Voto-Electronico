import { useVoting } from '../../state/VotingContext.jsx'

// Ventana emergente central: confirma el voto antes de registrarlo (irreversible).
export function ConfirmVoteModal({ candidato, onCancelar, onConfirmado }) {
  const { confirmarVoto, error } = useVoting()

  const handleConfirmar = () => {
    const exito = confirmarVoto()
    if (exito) onConfirmado()
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h2>Confirmar voto</h2>
        <p>
          ¿Confirma su voto por <strong>{candidato?.nombre}</strong>? Esta acción no se puede deshacer.
        </p>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="modal-card__actions">
          <button type="button" className="btn btn--secondary" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="button" className="btn btn--primary" onClick={handleConfirmar}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
