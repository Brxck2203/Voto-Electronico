import { useEffect, useRef, useState } from 'react'
import { useVoting } from '../../state/VotingContext.jsx'
function Dialog({ title, children, close }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    d.showModal()
    return () => d.close()
  }, [])
  return (
    <dialog ref={ref} className="process-dialog" onCancel={close}>
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button
          className="btn btn--secondary"
          onClick={close}
          aria-label="Cerrar ventana"
        >
          Cerrar
        </button>
      </div>
      {children}
    </dialog>
  )
}
export function VotingPage() {
  const v = useVoting(),
    e = v.election,
    [confirm, setConfirm] = useState(false),
    [detail, setDetail] = useState(null)
  const valid =
    v.ballots.length > 0 &&
    v.ballots.every(
      (b) =>
        (v.selections[b.id] || []).length >= b.min &&
        (v.selections[b.id] || []).length <= b.max,
    )
  useEffect(() => {
    if (!v.session) setConfirm(false)
  }, [v.session])
  return (
    <section>
      <div className="panel">
        <p className="eyebrow">Su participación</p>
        <h2>{e.name}</h2>
        <p>{e.purpose}</p>
        {e.emitted ? (
          <p className="success-message">
            Ya participó en este proceso. Puede consultar las propuestas y los
            resultados cuando finalice.
          </p>
        ) : e.phase === 'ABIERTO' ? (
          v.session ? (
            <p role="timer" className="session-clock">
              Tiempo restante:{' '}
              {Math.max(0, Math.ceil((v.session.expires - v.clock) / 1000))} s
            </p>
          ) : (
            <button className="btn btn--primary" onClick={v.begin}>
              Ingresar a votar
            </button>
          )
        ) : (
          <p>
            {e.phase === 'CERRADO'
              ? 'La jornada ha finalizado. Consulte los resultados.'
              : 'La votación aún no está abierta. Puede consultar las candidaturas.'}
          </p>
        )}
      </div>
      {v.ballots.map((b) => (
        <section className="panel" key={b.id}>
          <h2>{b.name}</h2>
          <p>
            Seleccione {b.min === b.max ? b.min : `entre ${b.min} y ${b.max}`}{' '}
            {b.max === 1 ? 'opción' : 'opciones'}.
            {b.min === 0 ? ' Puede dejar esta papeleta sin selección.' : ''}
          </p>
          <div className="candidate-grid">
            {b.options.map((c, i) => {
              const marked = (v.selections[b.id] || []).includes(c.id)
              return (
                <article
                  className={`electoral-card ${marked ? 'electoral-card--selected' : ''}`}
                  key={c.id}
                >
                  <button
                    className={`portrait portrait-${i % 5}`}
                    onClick={() => setDetail(c)}
                    aria-label={`Ver propuestas de ${c.nombre}`}
                  >
                    {c.foto ? (
                      <img src={c.foto} alt={c.nombre} />
                    ) : (
                      <span>
                        {c.nombre
                          .split(' ')
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join('')}
                      </span>
                    )}
                  </button>
                  <h3>{c.nombre}</h3>
                  <p>{c.agrupacion}</p>
                  <button className="text-button" onClick={() => setDetail(c)}>
                    Ver propuesta
                  </button>
                  {v.session && !e.emitted && (
                    <label className="ballot-check">
                      <input
                        type="checkbox"
                        checked={marked}
                        onChange={() => v.select(b.id, c.id)}
                      />{' '}
                      {marked ? 'Seleccionado' : 'Seleccionar'}
                    </label>
                  )}
                </article>
              )
            })}
          </div>
          {!b.options.length && (
            <p>No hay opciones habilitadas para este puesto.</p>
          )}
        </section>
      ))}
      {v.session && !e.emitted && (
        <section className="panel selection-panel">
          <h2>Resumen de selección</h2>
          {v.ballots.map((b) => (
            <p key={b.id}>
              <strong>{b.name}:</strong>{' '}
              {(v.selections[b.id] || [])
                .map((id) => b.options.find((o) => o.id === id)?.nombre)
                .join(', ') || (b.min === 0 ? 'Sin selección' : 'Pendiente')}
            </p>
          ))}
          <button
            className="btn btn--primary"
            disabled={!valid}
            onClick={() => setConfirm(true)}
          >
            Revisar y emitir voto
          </button>
        </section>
      )}
      {detail && (
        <Dialog title={detail.nombre} close={() => setDetail(null)}>
          <p>{detail.agrupacion}</p>
          <p className="pre-wrap">{detail.propuesta}</p>
        </Dialog>
      )}
      {confirm && v.session && (
        <Dialog title="Confirmar emisión" close={() => setConfirm(false)}>
          <p>
            Revise todas las papeletas. Después de confirmar no podrá modificar
            su voto.
          </p>
          {v.ballots.map((b) => (
            <p key={b.id}>
              <strong>{b.name}:</strong>{' '}
              {(v.selections[b.id] || [])
                .map((id) => b.options.find((o) => o.id === id)?.nombre)
                .join(', ') || 'Sin selección'}
            </p>
          ))}
          <div className="action-row">
            <button
              className="btn btn--secondary"
              onClick={() => setConfirm(false)}
            >
              Regresar
            </button>
            <button
              className="btn btn--primary"
              onClick={() => {
                v.emit()
                setConfirm(false)
              }}
            >
              Confirmar voto
            </button>
          </div>
        </Dialog>
      )}
    </section>
  )
}
export function CampaignPage() {
  const v = useVoting(),
    e = v.election,
    [text, setText] = useState(''),
    [media, setMedia] = useState(null),
    [candidateId, setCandidateId] = useState(''),
    [busy, setBusy] = useState(false)
  const own = e.candidates.filter(
      (c) => c.ownerId === v.context.userId && c.estado === 'Habilitado',
    ),
    active =
      e.status === 'PUBLICADO' &&
      v.clock >= e.calendar.campaignStart &&
      v.clock < e.calendar.campaignEnd
  return (
    <section>
      <div className="panel">
        <p className="eyebrow">Antes de votar</p>
        <h2>Campaña electoral</h2>
        <p>Conozca las propuestas y consulte a las candidaturas.</p>
        {!active && (
          <p>
            La campaña está en modo consulta. Las publicaciones y preguntas se
            habilitan en el período publicado.
          </p>
        )}
      </div>
      {own.length > 0 && (
        <form
          className="panel"
          onSubmit={(event) => {
            event.preventDefault()
            if (v.act('post', candidateId || own[0].id, text, media)) {
              setText('')
              setMedia(null)
              event.target.reset()
            }
          }}
        >
          <h3>Publicar propuesta</h3>
          <fieldset disabled={!active || busy}>
            <label>
              Candidatura
              <select
                value={candidateId || own[0].id}
                onChange={(x) => setCandidateId(x.target.value)}
              >
                {own.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Propuesta
              <textarea
                required
                value={text}
                onChange={(x) => setText(x.target.value)}
                rows="4"
              />
            </label>
            <label>
              Imagen JPG/PNG o video MP4/WebM · máximo 25 MB
              <input
                type="file"
                accept="image/jpeg,image/png,video/mp4,video/webm"
                onChange={(x) => {
                  const f = x.target.files?.[0]
                  if (!f) return
                  if (
                    ![
                      'image/jpeg',
                      'image/png',
                      'video/mp4',
                      'video/webm',
                    ].includes(f.type) ||
                    f.size > 25 * 1024 * 1024
                  ) {
                    v.setError(
                      'Adjunte una imagen JPG/PNG o un video MP4/WebM de hasta 25 MB.',
                    )
                    x.target.value = ''
                    return
                  }
                  setBusy(true)
                  const r = new FileReader()
                  r.onload = () => {
                    setMedia({ type: f.type, url: String(r.result) })
                    setBusy(false)
                  }
                  r.onerror = () => {
                    setBusy(false)
                    v.setError('No se pudo leer el adjunto.')
                  }
                  r.readAsDataURL(f)
                }}
              />
            </label>
            <button className="btn btn--primary">Publicar</button>
          </fieldset>
        </form>
      )}
      <div className="campaign-feed">
        {e.posts
          .filter((p) =>
            e.candidates.some(
              (c) => c.id === p.candidateId && c.estado === 'Habilitado',
            ),
          )
          .map((p) => {
            const c = e.candidates.find((c) => c.id === p.candidateId)
            return (
              <article className="panel" key={p.id}>
                <p className="eyebrow">{c.agrupacion}</p>
                <h3>{c.nombre}</h3>
                <p className="pre-wrap">{p.text}</p>
                {p.media &&
                  (p.media.type.startsWith('image/') ? (
                    <img
                      className="campaign-media"
                      src={p.media.url}
                      alt={`Imagen de la propuesta de ${c.nombre}`}
                    />
                  ) : (
                    <video
                      className="campaign-media"
                      src={p.media.url}
                      controls
                      preload="metadata"
                    />
                  ))}
                <h4>Consultas</h4>
                {!p.questions.length && (
                  <p className="muted">Todavía no hay consultas.</p>
                )}
                {p.questions.map((q) => (
                  <div className="question" key={q.id}>
                    <strong>{q.author}</strong>
                    <p>{q.text}</p>
                    {q.answer ? (
                      <p className="answer">
                        <strong>Respuesta de {c.nombre}:</strong> {q.answer}
                      </p>
                    ) : c.ownerId === v.context.userId && active ? (
                      <TextAction
                        label="Responder"
                        onSubmit={(text) => v.act('answer', p.id, q.id, text)}
                      />
                    ) : (
                      <p className="muted">Pendiente de respuesta.</p>
                    )}
                  </div>
                ))}
                {active && (
                  <TextAction
                    label="Enviar consulta"
                    onSubmit={(text) => v.act('question', p.id, text)}
                  />
                )}
              </article>
            )
          })}
      </div>
    </section>
  )
}
function TextAction({ label, onSubmit }) {
  const [text, setText] = useState('')
  return (
    <form
      className="inline-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (onSubmit(text)) setText('')
      }}
    >
      <input
        aria-label={label}
        required
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button className="btn btn--secondary">{label}</button>
    </form>
  )
}
export function ResultsPage() {
  const v = useVoting(),
    [detail, setDetail] = useState(false)
  if (v.election.phase !== 'CERRADO')
    return (
      <section className="panel">
        <p className="eyebrow">Después de votar</p>
        <h2>Resultados disponibles al cierre</h2>
        <p>
          Los conteos por candidatura permanecen ocultos durante la jornada.
        </p>
        {v.election.isAdmin && (
          <p>
            Participación: {v.election.participationCount} de{' '}
            {v.election.eligibleCount} electores.
          </p>
        )}
      </section>
    )
  const result = v.read('results')
  return (
    <section>
      <div className="panel">
        <h2>Resultados · {result.name}</h2>
        <div className="metrics">
          <div>
            <strong>{result.participation}</strong>
            <span>Participaron</span>
          </div>
          <div>
            <strong>{result.abstentions}</strong>
            <span>No participaron</span>
          </div>
          <div>
            <strong>
              {result.eligible
                ? Math.round((result.participation / result.eligible) * 100)
                : 0}
              %
            </strong>
            <span>Participación</span>
          </div>
        </div>
        <p>
          {result.weighting === 'PONDERADO'
            ? 'Conteo ponderado: cada selección recibe el peso electoral completo.'
            : 'Conteo igualitario: cada selección tiene peso 1.'}
        </p>
        <button
          className="btn btn--secondary"
          onClick={() => setDetail(!detail)}
        >
          {detail ? 'Ocultar detalle' : 'Ver detalle del conteo'}
        </button>
      </div>
      {result.ballots.map((b) => (
        <section className="panel" key={b.id}>
          <h2>{b.name}</h2>
          {b.tie ? (
            <p className="tie-notice">
              Empate: {b.leaders.join(', ')}. La organización debe decidir el
              procedimiento de resolución.
            </p>
          ) : (
            <p>
              {b.leaders.length
                ? `Mayor puntuación: ${b.leaders[0]}`
                : 'No se registraron selecciones para esta papeleta.'}
            </p>
          )}
          {b.rows.map((r) => (
            <div className="result-row" key={r.id}>
              <span>{r.name}</span>
              <meter
                min="0"
                max={Math.max(1, ...b.rows.map((r) => r.weight))}
                value={r.weight}
              />
              <strong>{r.weight}</strong>
            </div>
          ))}
          {detail && (
            <>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Opción</th>
                      <th>Selecciones</th>
                      <th>Puntuación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.name}</td>
                        <td>{r.votes}</td>
                        <td>{r.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                Papeletas sin selección: {b.blank}. Los resultados son agregados
                y no incluyen identidades ni papeletas individuales.
              </p>
            </>
          )}
        </section>
      ))}
    </section>
  )
}
