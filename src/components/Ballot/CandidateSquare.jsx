// Representa una casilla de la papeleta: foto, nombre y casilla de marca.
export function CandidateSquare({ candidato, seleccionado, onToggle, onVerFoto }) {
  return (
    <div className={`candidate-square${seleccionado ? ' candidate-square--selected' : ''}`}>
      <button
        type="button"
        className="candidate-square__photo"
        onClick={() => onVerFoto(candidato)}
        aria-label={`Ver información de ${candidato.nombre}`}
      >
        {candidato.foto ? (
          <img src={candidato.foto} alt={candidato.nombre} />
        ) : (
          <span>{candidato.nombre.charAt(0)}</span>
        )}
      </button>

      <p className="candidate-square__nombre">{candidato.nombre}</p>

      <label className="candidate-square__checkbox">
        <input
          type="checkbox"
          checked={seleccionado}
          onChange={() => onToggle(candidato.id)}
          aria-label={`Marcar voto por ${candidato.nombre}`}
        />
        <span className="candidate-square__checkbox-box" aria-hidden="true" />
      </label>
    </div>
  )
}
