import { useState } from 'react'
import { BallotPage } from './components/Ballot/BallotPage.jsx'
import { ConfirmVoteScreen } from './components/Confirmation/ConfirmVoteScreen.jsx'
import { SuccessScreen } from './components/Confirmation/SuccessScreen.jsx'
import { useVoting } from './state/VotingContext.jsx'
import './App.css'

function App() {
  const [paso, setPaso] = useState('papeleta')
  const { nuevaSesionVotante, reintentarConMismoVotante, votoConfirmado } = useVoting()

  const irAConfirmacion = () => setPaso('confirmacion')
  const irAPapeleta = () => setPaso('papeleta')
  const irAExito = () => setPaso('exito')

  const handleNuevoVotante = () => {
    nuevaSesionVotante()
    setPaso('papeleta')
  }

  const handleReintentarMismoVotante = () => {
    reintentarConMismoVotante()
    setPaso('papeleta')
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Voto Electrónico</h1>
        <p>Prototipo evolutivo &mdash; Alcance 6: Jornada de votación</p>
      </header>

      <main className="app__main">
        {paso === 'papeleta' && <BallotPage onContinue={irAConfirmacion} />}
        {paso === 'confirmacion' && (
          <ConfirmVoteScreen
            onBack={irAPapeleta}
            onConfirmed={votoConfirmado ? irAExito : irAExito}
          />
        )}
        {paso === 'exito' && (
          <SuccessScreen onNuevoVotante={handleNuevoVotante} onVolverAVotar={handleReintentarMismoVotante} />
        )}
      </main>
    </div>
  )
}

export default App
