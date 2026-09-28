// Cubre HU-03 (ver la opción elegida) y HU-05 (modificar la selección).
export function SelectionSummary({ candidatoSeleccionado, onChangeSelection, onContinue, error }) {
  return (
    <div className="selection-summary">
      <h3>Resumen de selección</h3>
      {candidatoSeleccionado ? (
        <p>
          Ha seleccionado a <strong>{candidatoSeleccionado.nombre}</strong> ({candidatoSeleccionado.agrupacion}).
        </p>
      ) : (
        <p className="selection-summary__empty">Aún no ha seleccionado ninguna candidatura.</p>
      )}

      {error && <p className="error-message" role="alert">{error}</p>}

      <div className="selection-summary__actions">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={onChangeSelection}
          disabled={!candidatoSeleccionado}
        >
          Cambiar selección
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={onContinue}
          disabled={!candidatoSeleccionado}
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
