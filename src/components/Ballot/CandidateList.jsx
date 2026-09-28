// Cubre HU-01 (ver candidaturas) y HU-04 (seleccionar candidatura).
export function CandidateList({ candidatos, seleccion, onSelect, onViewDetail }) {
  if (candidatos.length === 0) {
    return <p className="empty-state">No hay candidaturas registradas para esta elección.</p>
  }

  return (
    <ul className="candidate-list">
      {candidatos.map((candidato) => {
        const seleccionado = seleccion === candidato.id
        return (
          <li key={candidato.id} className={`candidate-card${seleccionado ? ' candidate-card--selected' : ''}`}>
            <div className="candidate-card__avatar" aria-hidden="true">
              {candidato.nombre.charAt(0)}
            </div>
            <div className="candidate-card__info">
              <h3>{candidato.nombre}</h3>
              <p className="candidate-card__agrupacion">{candidato.agrupacion}</p>
            </div>
            <div className="candidate-card__actions">
              <button type="button" className="btn btn--secondary" onClick={() => onViewDetail(candidato)}>
                Ver detalle
              </button>
              <button
                type="button"
                className={`btn ${seleccionado ? 'btn--selected' : 'btn--primary'}`}
                aria-pressed={seleccionado}
                onClick={() => onSelect(candidato.id)}
              >
                {seleccionado ? 'Seleccionado ✓' : 'Seleccionar'}
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
