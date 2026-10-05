import { useState } from 'react'
import { useVoting } from '../../state/VotingContext.jsx'

const secciones = [
  { id: 'votaciones', label: 'Mis votaciones' },
  { id: 'campana', label: 'Campaña' },
  { id: 'resultados', label: 'Resultados' },
]

export function VotingHomePage({ onAbrirBoleta, onAbrirAdministracion }) {
  const { jornadaIniciada, votoConfirmado } = useVoting()
  const [seccionActiva, setSeccionActiva] = useState('votaciones')

  return (
    <div className="voting-shell">
      <aside className="voting-sidebar" aria-label="Menú de votación">
        <p className="voting-sidebar__title">Mi espacio</p>
        <nav className="voting-sidebar__nav" aria-label="Secciones">
          {secciones.map((seccion) => (
            <button
              type="button"
              key={seccion.id}
              className={`voting-sidebar__link${seccionActiva === seccion.id ? ' voting-sidebar__link--active' : ''}`}
              aria-current={seccionActiva === seccion.id ? 'page' : undefined}
              onClick={() => setSeccionActiva(seccion.id)}
            >
              {seccion.label}
            </button>
          ))}
        </nav>
        <button type="button" className="voting-sidebar__admin" onClick={onAbrirAdministracion}>
          Administración
        </button>
      </aside>

      <section className="voting-dashboard" aria-label="Contenido de votación">
        {seccionActiva === 'votaciones' ? (
          <>
            <div className="voting-dashboard__heading">
              <div>
                <p className="admin-eyebrow">Mi espacio</p>
                <h2>Mis votaciones</h2>
                <p>Consulta el estado de la votación y revisa sus opciones.</p>
              </div>
            </div>
            <section className="active-election-card" aria-labelledby="election-status-title">
              <div className="active-election-card__heading">
                <div>
                  <p className="admin-eyebrow">Elección</p>
                  <h3 id="election-status-title">Votación general</h3>
                </div>
                <span className={`election-status${jornadaIniciada ? ' election-status--active' : ''}`}>
                  <span className="election-status__indicator" aria-hidden="true" />
                  {jornadaIniciada ? 'Votación activa' : 'Votación no activa'}
                </span>
              </div>
              <p>{jornadaIniciada
                ? 'La jornada está activa. Puedes consultar las candidaturas disponibles.'
                : 'La votación aparecerá aquí cuando la jornada sea activada.'}</p>
              {votoConfirmado && <p className="vote-already-cast" role="status">Tu voto ya fue registrado. Puedes volver a ver la votación, pero no emitir otro voto.</p>}
              <button type="button" className="btn btn--primary" onClick={onAbrirBoleta} disabled={!jornadaIniciada}>
                {votoConfirmado ? 'Ver votación' : 'Ir a la votación'}
              </button>
            </section>
          </>
        ) : (
          <section className="voting-placeholder" aria-live="polite">
            <h2>{secciones.find((seccion) => seccion.id === seccionActiva)?.label}</h2>
            <p>Esta sección estará disponible próximamente.</p>
          </section>
        )}
      </section>
    </div>
  )
}
