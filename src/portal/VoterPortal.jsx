import { useEffect, useState } from 'react'
import { localServices } from './localApi.js'
import { validateElectionResponse } from './portalData.js'
import { downloadOfficialPdf } from '../utils/officialPdf.js'

/** Cédula y código se validan en el servidor local JSON. No se guardan en el navegador. */
export default function CedulaVoterPortal({ onBack }) {
  const [svc, setSvc] = useState(null)
  const [elections, setElections] = useState([])
  const [electionId, setElectionId] = useState('')
  const [election, setElection] = useState(null)
  const [cedula, setCedula] = useState('')
  const [credential, setCredential] = useState('')
  const [session, setSession] = useState(null)
  const [selections, setSelections] = useState({})
  const [confirming, setConfirming] = useState(false)
  const [receipt, setReceipt] = useState(false)
  const [detail, setDetail] = useState(null)
  const [act, setAct] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [clock, setClock] = useState(Date.now())
  const [step, setStep] = useState('cedula')
  useEffect(() => {
    let active = true
    localServices().then(async service => {
      if (!active) return
      setSvc(service)
      const data = await service.call('listPublicElections')
      if (!active) return
      const options = data.elections || []
      setElections(options)
      setElectionId(options[0]?.id || '')
    }).catch(e => { if (active) setError(e.message || 'No se pudieron cargar las elecciones.') })
    return () => { active = false }
  }, [])
  useEffect(() => {
    let active = true
    setElection(null); setSession(null); setSelections({}); setReceipt(false); setStep('cedula'); setCedula(''); setCredential(''); setAct(null)
    if (svc && electionId) svc.call('getPublicElection', { electionId }).then(data => {
      if (active) setElection(validateElectionResponse(data))
    }).catch(e => { if (active) setError(e.message) })
    return () => { active = false }
  }, [svc, electionId])
  useEffect(() => { const h = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(h) }, [])
  useEffect(() => {
    if (session && clock >= session.expiresAt) {
      setSession(null); setSelections({}); setConfirming(false); setStep('cedula'); setCredential('')
      setError('Tu sesión venció sin registrar el voto. Puedes volver a identificarte mientras la jornada siga abierta.')
    }
  }, [clock, session])
  const call = async (action) => {
    setBusy(true); setError('')
    try { await action() } catch(e) { setError(e?.message || 'No se pudo completar esta acción.') }
    finally { setBusy(false) }
  }
  const identify = (event) => {
    event.preventDefault()
    if (!/^\d{9,12}$/.test(cedula.replace(/[\s-]/g, ''))) {
      setError('Ingresa una cédula de 9 a 12 dígitos.'); return
    }
    setError(''); setStep('codigo')
  }
  const begin = (event) => {
    event.preventDefault()
    call(async () => {
      const result = await svc.call('startCedulaVoting', { electionId, cedula, credential: credential.trim() })
      setSession(result)
      setCedula(''); setCredential(''); setStep('papeleta')
      setSelections(Object.fromEntries(election.ballots.map(b => [b.id, []])))
    })
  }
  const toggle = (b, id) => {
    const current = selections[b.id] || []
    const next = current.includes(id) ? current.filter(x => x !== id) : b.max === 1 ? [id] : [...current, id]
    if (next.length > b.max) { setError(`Se permiten máximo ${b.max} opciones.`); return }
    setSelections(s => ({ ...s, [b.id]: next })); setError('')
  }
  const valid = election?.ballots?.length > 0 && election.ballots.every(b =>
    (selections[b.id] || []).length >= b.min && (selections[b.id] || []).length <= b.max)
  const cast = () => call(async () => {
    const r = await svc.call('castCedulaVote', { electionId, sessionToken: session.token, selections })
    if (r.status !== 'VOTO_REGISTRADO') throw new Error('El voto aún no fue confirmado por el servidor.')
    setReceipt(true); setSession(null); setSelections({}); setConfirming(false); setStep('comprobante')
  })
  const showResults = () => call(async () => setAct(await svc.call('getPublicResults', { electionId })))
  const remaining = session ? Math.max(0, Math.ceil((session.expiresAt - clock) / 1000)) : 0
  return <div className="portal-scene"><div className="portal-shell portal-dashboard">
    <header className="portal-top"><span className="brand-logo">V<span>·</span></span><span className="portal-top-label">EJERCER MI VOTO</span><button type="button" className="top-logout" onClick={onBack}>← Inicio</button></header>
    <main className="voter-main">
      <div className="voter-head"><p className="eyebrow">PROCESO ELECTORAL</p><h1>Tu voto cuenta.</h1><p>Verifica tu participación de forma privada y sencilla.</p></div>
      {error && <p className="error-message feedback" role="alert">{error}</p>}
      {!svc && !error && <section className="panel"><p>Cargando datos locales…</p></section>}
      {svc && !elections.length && <section className="panel"><h2>No hay elecciones publicadas</h2><p>El tribunal debe publicar una elección antes de que puedas participar.</p></section>}
      {elections.length > 0 && <section className="panel"><label>Elección disponible<select value={electionId} disabled={busy || !!session || receipt} onChange={e=>setElectionId(e.target.value)}>{elections.map(x=><option key={x.id} value={x.id}>{x.name} · {x.phase}</option>)}</select></label></section>}
      {election && !receipt && <section className="panel welcome-panel"><div><p className="eyebrow">{election.phase}</p><h2>{election.name}</h2><p>{election.purpose}</p></div><div className="panel-symbol" aria-hidden="true">✦</div></section>}
      {election && election.phase === 'ABIERTO' && !receipt && !session && step === 'cedula' && <form className="panel voter-auth" onSubmit={identify}>
        <p className="eyebrow">PASO 1 DE 2 · IDENTIFICACIÓN</p><h2>Introduce tu cédula</h2><p>Comprobaremos tus datos con el padrón electoral de esta elección.</p>
        <label>Número de cédula<input autoFocus required inputMode="numeric" autoComplete="off" placeholder="Ejemplo: 1-0100-0003" value={cedula} onChange={e=>setCedula(e.target.value)} maxLength={18}/></label>
        <button className="btn btn--primary" type="submit">Continuar →</button>
      </form>}
      {election && election.phase === 'ABIERTO' && !receipt && !session && step === 'codigo' && <form className="panel voter-auth" onSubmit={begin}>
        <p className="eyebrow">PASO 2 DE 2 · SEGURIDAD</p><h2>Confirma tu identidad</h2><p>La cédula sola no es una credencial segura. Escribe el código electoral privado que te proporcionó la organización.</p>
        <label>Código electoral<input autoFocus type="password" required autoComplete="off" placeholder="Tu código electoral" value={credential} onChange={e=>setCredential(e.target.value)} minLength={12}/></label>
        <div className="action-row"><button type="button" className="btn btn--secondary" onClick={()=>{setStep('cedula');setError('')}}>← Volver</button><button type="submit" className="btn btn--primary" disabled={busy || !credential.trim()}>Validar y votar →</button></div>
      </form>}
      {election && election.phase !== 'ABIERTO' && !receipt && <section className="panel"><h2>{election.phase === 'CERRADO' ? 'La elección ha finalizado' : 'La jornada todavía no está abierta'}</h2><p>{election.phase === 'CERRADO' ? 'Puedes consultar los resultados oficiales.' : 'Espera al período indicado por la organización.'}</p>{election.phase === 'CERRADO' && <button className="btn btn--primary" disabled={busy} onClick={showResults}>Ver resultados →</button>}</section>}
      {session && !receipt && <><div className="session-notice" role="status">Sesión verificada · {remaining} segundos disponibles</div>
      {election.ballots.map(b=><section className="panel" key={b.id}><p className="eyebrow">PAPELETA DIGITAL</p><h2>{b.name}</h2><p>Selecciona {b.min===b.max?b.min:`entre ${b.min} y ${b.max}`} opciones.</p><div className="candidate-grid">{b.options.map((o,i)=><article key={o.id} className={'electoral-card '+((selections[b.id]||[]).includes(o.id)?'electoral-card--selected':'')}><div className={`portrait portrait-${i%5}`}><span>{o.nombre.split(' ').map(x=>x[0]).slice(0,2).join('')}</span></div><h3>{o.nombre}</h3><p>{o.agrupacion}</p><button className="text-button" onClick={()=>setDetail(o)}>Ver propuesta ↗</button><label className="ballot-check"><input type="checkbox" checked={(selections[b.id]||[]).includes(o.id)} onChange={()=>toggle(b,o.id)}/> Seleccionar</label></article>)}</div></section>)}
      <section className="panel"><h2>Resumen de tu selección</h2>{election.ballots.map(b=><p key={b.id}><strong>{b.name}: </strong>{(selections[b.id]||[]).map(id=>b.options.find(o=>o.id===id)?.nombre).join(', ')||'Sin selección'}</p>)}<button className="btn btn--primary" onClick={()=>setConfirming(true)} disabled={busy||!valid}>Revisar y emitir voto →</button></section></>}
      {receipt && <section className="panel receipt-panel"><span className="receipt-icon">✓</span><h2>VOTO_REGISTRADO</h2><p>Tu participación fue confirmada. El comprobante no revela tu selección.</p><button className="btn btn--secondary" onClick={onBack}>Volver al inicio</button></section>}
      {act && <section className="panel"><h2>Resultados oficiales</h2><div className="metrics"><div><strong>{act.participation}</strong><span>Participaron</span></div><div><strong>{act.participationPercentage}%</strong><span>Participación</span></div><div><strong>{act.abstentionPercentage}%</strong><span>Abstención</span></div></div>{act.ballots?.map(b=><div key={b.id} className="results-group"><h3>{b.name}</h3>{b.rows.map(r=><div className="result-row" key={r.id}><span>{r.name}</span><strong>{r.votes} · {r.percentage}%</strong></div>)}</div>)}<button className="btn btn--secondary" onClick={()=>downloadOfficialPdf(act)}>Descargar acta PDF ↓</button></section>}
    </main>
    {confirming && <div className="modal-layer"><section className="panel confirm-modal"><p className="eyebrow">ÚLTIMO PASO</p><h2>Confirma tu voto</h2>{election.ballots.map(b=><p key={b.id}><strong>{b.name}: </strong>{(selections[b.id]||[]).map(id=>b.options.find(o=>o.id===id)?.nombre).join(', ')||'Sin selección'}</p>)}<p>Esta acción es irreversible.</p><div className="action-row"><button className="btn btn--secondary" onClick={()=>setConfirming(false)}>Regresar</button><button className="btn btn--primary" disabled={busy} onClick={cast}>Confirmar y registrar</button></div></section></div>}
    {detail && <div className="modal-layer"><section className="panel confirm-modal"><button className="top-logout" onClick={()=>setDetail(null)}>Cerrar ×</button><p className="eyebrow">{detail.agrupacion}</p><h2>{detail.nombre}</h2><p>{detail.propuesta}</p></section></div>}
    <footer className="portal-footer">VOTO ELECTRÓNICO <span>UNA PERSONA · UN VOTO · CONFIDENCIALIDAD</span></footer>
  </div></div>
}
