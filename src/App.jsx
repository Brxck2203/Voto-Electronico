import { useEffect, useState } from 'react'
import { BallotPage } from './components/Ballot/BallotPage.jsx'
import { AdministrationPage } from './components/Admin/AdministrationPage.jsx'
import { VotingHomePage } from './components/Voting/VotingHomePage.jsx'
import './App.css'

function App() {
  const [ruta, setRuta] = useState(() => window.location.pathname)

  useEffect(() => {
    const actualizarRuta = () => setRuta(window.location.pathname)
    window.addEventListener('popstate', actualizarRuta)
    return () => window.removeEventListener('popstate', actualizarRuta)
  }, [])

  const navegar = (nuevaRuta) => {
    if (window.location.pathname !== nuevaRuta) window.history.pushState({}, '', nuevaRuta)
    setRuta(nuevaRuta)
  }

  const esAdministracion = ruta === '/administracion'
  const esBoleta = ruta === '/votacion/boleta'

  return (
    <div className="app">
      <header className="app__header">
        <button type="button" className="app__brand" onClick={() => navegar('/votacion')}>Voto Electrónico</button>
        {esAdministracion && <button type="button" className="btn btn--secondary" onClick={() => navegar('/votacion')}>Volver a votación</button>}
      </header>

      <main className="app__main">
        {esAdministracion
          ? <AdministrationPage />
          : esBoleta
            ? <BallotPage onVolver={() => navegar('/votacion')} />
            : <VotingHomePage
                onAbrirBoleta={() => navegar('/votacion/boleta')}
                onAbrirAdministracion={() => navegar('/administracion')}
              />}
      </main>
    </div>
  )
}

export default App
