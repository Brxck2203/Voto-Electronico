import { useVoting } from '../../state/VotingContext.jsx'

// Pantalla final tras HU-06/HU-07: confirma el registro y permite demostrar
// que el sistema impide un segundo voto del mismo votante (regla de negocio).
export function SuccessScreen({ onNuevoVotante, onVolverAVotar }) {
  const { error } = useVoting()

  return (
    <section className="success-screen">
      <h2>Su voto ha sido emitido y registrado de manera segura y secreta.</h2>
      <p>Gracias por participar en el proceso electoral.</p>

      <div className="success-screen__demo">
        <p className="success-screen__demo-title">Modo demostración</p>
        <button type="button" className="btn btn--secondary" onClick={onVolverAVotar}>
          Intentar votar de nuevo (mismo votante)
        </button>
        <button type="button" className="btn btn--primary" onClick={onNuevoVotante}>
          Simular un nuevo votante
        </button>
        {error && <p className="error-message" role="alert">{error}</p>}
      </div>
    </section>
  )
}
