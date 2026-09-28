import { useState } from 'react'
import { useVoting } from '../../state/VotingContext.jsx'
import { CandidateList } from './CandidateList.jsx'
import { CandidateDetailModal } from './CandidateDetailModal.jsx'
import { SelectionSummary } from './SelectionSummary.jsx'

export function BallotPage({ onContinue }) {
  const { candidatos, seleccion, seleccionarCandidato, error } = useVoting()
  const [candidatoDetalle, setCandidatoDetalle] = useState(null)

  const candidatoSeleccionado = candidatos.find((candidato) => candidato.id === seleccion) ?? null

  return (
    <section className="ballot-page">
      <h2>Papeleta de votación</h2>
      <p className="ballot-page__instructions">Seleccione una candidatura y confirme su voto.</p>

      <CandidateList
        candidatos={candidatos}
        seleccion={seleccion}
        onSelect={seleccionarCandidato}
        onViewDetail={setCandidatoDetalle}
      />

      <CandidateDetailModal candidato={candidatoDetalle} onClose={() => setCandidatoDetalle(null)} />

      <SelectionSummary
        candidatoSeleccionado={candidatoSeleccionado}
        onChangeSelection={() => seleccionarCandidato(null)}
        onContinue={onContinue}
        error={error}
      />
    </section>
  )
}
