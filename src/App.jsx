import { useState } from 'react'
import { useVoting } from './state/VotingContext.jsx'
import { AdministrationPage } from './components/Admin/AdministrationPage.jsx'
import { ElectionConfigForm } from './components/Election/ElectionConfigForm.jsx'
import {
  VotingPage,
  CampaignPage,
  ResultsPage,
} from './components/Election/ProcessPages.jsx'
import './App.css'
function App() {
  const v = useVoting(),
    [page, setPage] = useState('votacion')
  const org = v.organizations.find((o) => o.id === v.context.orgId)
  const navigate = (p) => {
    setPage(p)
    v.setError('')
  }
  return (
    <div className="app">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Participación · Decisión · Transparencia</p>
          <h1>Voto Electrónico</h1>
          <p>{org.name}</p>
        </div>
        <span className="phase-badge">
          {v.election?.phase || 'SIN PROCESO'}
        </span>
      </header>
      <details className="demo-context">
        <summary>Contexto de pruebas · datos en memoria</summary>
        <p>
          Elija una identidad precargada. No es un inicio de sesión. Al recargar
          se reinicia toda la demostración.
        </p>
        <div className="form-grid">
          <label>
            Organización
            <select
              aria-label="Organización"
              value={v.context.orgId}
              onChange={(e) => {
                const o = v.organizations.find((o) => o.id === e.target.value)
                v.changeIdentity(o.id, o.members[0].id)
                setPage('votacion')
              }}
            >
              {v.organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Identidad
            <select
              aria-label="Identidad"
              value={v.context.userId}
              onChange={(e) => v.changeIdentity(org.id, e.target.value)}
            >
              {org.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </details>
      <div className="process-selector">
        <label>
          Proceso electoral
          <select
            aria-label="Proceso electoral"
            value={v.electionId || ''}
            onChange={(e) => v.chooseElection(e.target.value)}
          >
            {v.elections.map((e) => (
              <option value={e.id} key={e.id}>
                {e.name} · {e.phase}
              </option>
            ))}
          </select>
        </label>
      </div>
      <nav className="process-nav" aria-label="Secciones del proceso">
        {[
          ['votacion', 'Votación'],
          ['campana', 'Campaña'],
          ['resultados', 'Resultados'],
          ...(v.election?.isAdmin
            ? [
                ['configuracion', 'Configuración'],
                ['administracion', 'Candidaturas'],
              ]
            : []),
        ].map(([id, name]) => (
          <button
            key={id}
            className={page === id ? 'active' : ''}
            onClick={() => navigate(id)}
          >
            {name}
          </button>
        ))}
      </nav>
      {v.error && (
        <p role="alert" className="error-message feedback">
          {v.error}
        </p>
      )}
      {v.notice && (
        <p role="status" className="success-message feedback">
          {v.notice === 'VOTO_REGISTRADO'
            ? 'Su voto fue registrado. Gracias por participar.'
            : v.notice}
        </p>
      )}
      <main key={`${v.electionId}-${v.context.userId}`}>
        {page === 'configuracion' && v.election?.isAdmin ? (
          <ElectionConfigForm />
        ) : page === 'administracion' && v.election?.isAdmin ? (
          <AdministrationPage />
        ) : page === 'campana' ? (
          <CampaignPage />
        ) : page === 'resultados' ? (
          <ResultsPage />
        ) : (
          <VotingPage />
        )}
      </main>
    </div>
  )
}
export default App
