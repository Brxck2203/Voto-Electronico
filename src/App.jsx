import { BallotPage } from './components/Ballot/BallotPage.jsx'
import { VoteRegisteredMessage } from './components/Confirmation/VoteRegisteredMessage.jsx'
import { useVoting } from './state/VotingContext.jsx'
import './App.css'

function App() {
  const { votoConfirmado } = useVoting()

  return (
    <div className="app">
      <header className="app__header">
        <h1>Voto Electrónico</h1>
      </header>

      <main className="app__main">
        {votoConfirmado ? <VoteRegisteredMessage /> : <BallotPage />}
      </main>
    </div>
  )
}

export default App
