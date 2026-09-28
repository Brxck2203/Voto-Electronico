import { useVoting } from '../../state/VotingContext.jsx'

// Cubre HU-01: como votante quiero ver las candidaturas para realizar mi elección.
export function CandidateList() {
  const { candidatos, seleccion, setSeleccion } = useVoting()

  return (
    <ul className="candidate-list">
      {candidatos.map((candidato) => (
        <li key={candidato.id}>
          <button
            onClick={() => setSeleccion(candidato.id)}
            aria-pressed={seleccion === candidato.id}
          >
            {candidato.nombre} - {candidato.agrupacion}
          </button>
        </li>
      ))}
    </ul>
  )
}
