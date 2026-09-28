// Cubre HU-02: ver la información detallada de una candidatura.
export function CandidateDetailModal({ candidato, onClose }) {
  if (!candidato) return null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-card__close" onClick={onClose} aria-label="Cerrar">
          &times;
        </button>
        <h2>{candidato.nombre}</h2>
        <p className="modal-card__agrupacion">{candidato.agrupacion}</p>
        <p>{candidato.propuesta}</p>
        <button type="button" className="btn btn--secondary" onClick={onClose}>
          Volver a la papeleta
        </button>
      </div>
    </div>
  )
}
