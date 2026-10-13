import { useState } from 'react'
import AdminPortal from './AdminPortal.jsx'
import VoterPortal from './VoterPortal.jsx'

/** El visitante elige el flujo ANTES de mostrar credenciales de gestión. */
export default function AccessChoice() {
  const [path, setPath] = useState(null)
  if (path === 'gestion') return <AdminPortal onBack={() => setPath(null)} />
  if (path === 'votar') return <VoterPortal onBack={() => setPath(null)} />
  return <div className="portal-scene"><div className="portal-shell access-shell">
    <header className="portal-top"><span className="brand-logo">V<span>·</span></span><span className="portal-top-label">VOTO ELECTRÓNICO</span><span className="top-end">Tu participación importa</span></header>
    <section className="access-intro"><p className="eyebrow">PLATAFORMA ELECTORAL</p><h1>Una elección.<br/><em>Tu decisión.</em></h1><p>Selecciona lo que deseas hacer. Un acceso claro para votar y otro para administrar los procesos electorales.</p></section>
    <div className="access-options">
      <button type="button" className="access-option" onClick={() => setPath('votar')}>
        <span className="access-option-icon" aria-hidden="true">✓</span><span className="access-option-kicker">PARA PERSONAS VOTANTES</span><strong>Ejercer mi voto</strong><span>Identifícate con tu número de cédula y tu código electoral.</span><span className="access-arrow">Continuar a votación ↗</span>
      </button>
      <button type="button" className="access-option" onClick={() => setPath('gestion')}>
        <span className="access-option-icon" aria-hidden="true">▤</span><span className="access-option-kicker">PARA EL TRIBUNAL ELECTORAL</span><strong>Gestionar elección</strong><span>Configura procesos, puestos, candidaturas y consulta la participación.</span><span className="access-arrow">Acceder a gestión ↗</span>
      </button>
    </div>
    <footer className="portal-footer">VOTO ELECTRÓNICO <span>PROTOTIPO LOCAL · DATOS FICTICIOS</span></footer>
  </div></div>
}
