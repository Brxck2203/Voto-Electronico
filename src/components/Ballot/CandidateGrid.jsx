import { CandidateSquare } from './CandidateSquare.jsx'

// Mosaico de candidaturas, como una papeleta física.
export function CandidateGrid({ candidatos, seleccion, onToggle, onVerFoto }) {
  if (candidatos.length === 0) {
    return <p className="empty-state">No hay candidaturas registradas para esta elección.</p>
  }

  return (
    <div className="candidate-grid">
      {candidatos.map((candidato) => (
        <CandidateSquare
          key={candidato.id}
          candidato={candidato}
          seleccionado={seleccion === candidato.id}
          onToggle={onToggle}
          onVerFoto={onVerFoto}
        />
      ))}
    </div>
  )
}
