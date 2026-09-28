import { useVoting } from '../../state/VotingContext.jsx'

// Cubre HU-06 (confirmar el voto) y HU-07 (registro anonimizado, impedir doble voto).
export function ConfirmVoteScreen({ onBack, onConfirmed }) {
  const { candidatos, seleccion, confirmarVoto, error } = useVoting()
  const candidatoSeleccionado = candidatos.find((candidato) => candidato.id === seleccion) ?? null

  const handleConfirmar = () => {
    const exito = confirmarVoto()
    if (exito) onConfirmed()
  }

  return (
    <section className="confirm-vote-screen">
      <h2>Confirmar voto</h2>
      {candidatoSeleccionado ? (
        <p>
          Está a punto de emitir su voto por <strong>{candidatoSeleccionado.nombre}</strong> ({candidatoSeleccionado.agrupacion}).
          Esta acción no se puede deshacer.
        </p>
      ) : (
        <p className="error-message" role="alert">No hay una selección válida. Regrese a la papeleta.</p>
      )}

      {error && <p className="error-message" role="alert">{error}</p>}

      <div className="confirm-vote-screen__actions">
        <button type="button" className="btn btn--secondary" onClick={onBack}>
          Regresar
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleConfirmar}
          disabled={!candidatoSeleccionado}
        >
          Confirmar voto
        </button>
      </div>
    </section>
  )
}
