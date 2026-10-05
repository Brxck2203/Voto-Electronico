import { useMemo, useState } from 'react'
import { useVoting } from '../../state/VotingContext.jsx'

const estadoClase = {
  Pendiente: 'admin-status--pending',
  Habilitado: 'admin-status--enabled',
  Retirado: 'admin-status--withdrawn',
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
        <button type="button" className="modal-card__close" onClick={onClose} aria-label="Cerrar">×</button>
        <h2 id="admin-modal-title">{title}</h2>
        {children}
      </section>
    </div>
  )
}

export function AdministrationPage() {
  const {
    puestos, candidaturas, jornadaIniciada, cambiarJornada,
    crearPuesto, editarPuesto, eliminarPuesto, crearCandidatura, editarCandidatura,
    actualizarRequisito, habilitarCandidatura, retirarCandidatura,
  } = useVoting()
  const [puestoDraft, setPuestoDraft] = useState({ nombre: '', descripcion: '' })
  const [puestoEnEdicion, setPuestoEnEdicion] = useState(null)
  const [candidatoDraft, setCandidatoDraft] = useState({ nombreCompleto: '', fotografia: '', presentacion: '', puestoId: '' })
  const [candidatoEnEdicion, setCandidatoEnEdicion] = useState(null)
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false)
  const [filtroPuesto, setFiltroPuesto] = useState('todos')
  const [candidatoDetalle, setCandidatoDetalle] = useState(null)
  const [confirmacion, setConfirmacion] = useState(null)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [erroresCampo, setErroresCampo] = useState({})

  const puestoPorId = useMemo(() => new Map(puestos.map((puesto) => [puesto.id, puesto])), [puestos])
  const candidaturasFiltradas = candidaturas.filter((candidatura) =>
    filtroPuesto === 'todos' || candidatura.puestoId === filtroPuesto)

  const informarError = (operacion) => {
    try {
      operacion()
      setError('')
      return true
    } catch (err) {
      setError(err.message || 'No fue posible completar la operación.')
      setExito('')
      return false
    }
  }

  const guardarPuesto = (event) => {
    event.preventDefault()
    const ok = informarError(() => {
      if (puestoEnEdicion) editarPuesto(puestoEnEdicion, puestoDraft)
      else crearPuesto(puestoDraft)
    })
    if (ok) {
      setPuestoDraft({ nombre: '', descripcion: '' })
      setPuestoEnEdicion(null)
      setExito(puestoEnEdicion ? 'Puesto actualizado.' : 'Puesto creado.')
    }
  }

  const prepararEdicionPuesto = (puesto) => {
    setPuestoEnEdicion(puesto.id)
    setPuestoDraft({ nombre: puesto.nombre, descripcion: puesto.descripcion })
    setError('')
    setExito('')
  }

  const cancelarEdicionPuesto = () => {
    setPuestoEnEdicion(null)
    setPuestoDraft({ nombre: '', descripcion: '' })
  }

  const iniciarNuevaCandidatura = () => {
    setCandidatoEnEdicion(null)
    setCandidatoDraft({ nombreCompleto: '', fotografia: '', presentacion: '', puestoId: '' })
    setErroresCampo({})
    setMostrarVistaPrevia(false)
    setError('')
  }

  const prepararEdicionCandidato = (candidatura) => {
    setCandidatoEnEdicion(candidatura.id)
    setCandidatoDraft({
      nombreCompleto: candidatura.nombreCompleto,
      fotografia: candidatura.fotografia,
      presentacion: candidatura.presentacion,
      puestoId: candidatura.puestoId,
    })
    setErroresCampo({})
    setMostrarVistaPrevia(false)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const validarCandidato = () => {
    const nuevosErrores = {}
    if (!candidatoDraft.nombreCompleto.trim()) nuevosErrores.nombreCompleto = 'El nombre completo es obligatorio.'
    if (!candidatoDraft.presentacion.trim()) nuevosErrores.presentacion = 'La presentación o propuesta es obligatoria.'
    if (!candidatoDraft.puestoId) nuevosErrores.puestoId = 'Seleccione un puesto.'
    setErroresCampo(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const guardarCandidatura = () => {
    const datos = { ...candidatoDraft }
    const ok = informarError(() => {
      if (candidatoEnEdicion) editarCandidatura(candidatoEnEdicion, datos)
      else crearCandidatura(datos)
    })
    if (ok) {
      setExito(candidatoEnEdicion ? 'Candidatura actualizada.' : 'Candidatura registrada en estado Pendiente.')
      iniciarNuevaCandidatura()
    }
  }

  const ejecutarConfirmacion = () => {
    if (!confirmacion) return
    const { tipo, id } = confirmacion
    const ok = informarError(() => {
      if (tipo === 'puesto') eliminarPuesto(id)
      else retirarCandidatura(id)
    })
    if (ok) {
      setExito(tipo === 'puesto' ? 'Puesto y candidaturas asociadas eliminados.' : 'Candidatura retirada; ya no aparece en la papeleta.')
      if (candidatoEnEdicion === id) iniciarNuevaCandidatura()
    }
    setConfirmacion(null)
  }

  const cambiarRequisito = (candidatura, requisito, cumplido) => {
    informarError(() => actualizarRequisito(candidatura.id, requisito, cumplido))
    setExito('')
  }

  const habilitar = (candidatura) => {
    const ok = informarError(() => habilitarCandidatura(candidatura.id))
    if (ok) setExito('Candidatura habilitada y disponible en la papeleta.')
  }

  return (
    <section className="administration-page">
      <div className="admin-heading">
        <div>
          <p className="admin-eyebrow">Administración electoral</p>
          <h2>Gestión de puestos y candidaturas</h2>
          <p>Configure las opciones que estarán disponibles en la papeleta.</p>
        </div>
        <div className={`journey-status${jornadaIniciada ? ' journey-status--started' : ''}`}>
          <span>Jornada: <strong>{jornadaIniciada ? 'Iniciada' : 'No iniciada'}</strong></span>
          <button type="button" className="btn btn--secondary" onClick={() => {
            const ok = informarError(() => cambiarJornada(!jornadaIniciada))
            if (ok) setExito(jornadaIniciada ? 'La jornada se marcó como no iniciada.' : 'La jornada inició. La administración quedó bloqueada.')
          }}>
            {jornadaIniciada ? 'Marcar como no iniciada' : 'Iniciar jornada'}
          </button>
        </div>
      </div>

      {jornadaIniciada && <p className="admin-lock-message" role="status">La jornada inició. Los puestos, candidaturas y requisitos no se pueden modificar.</p>}
      {error && <p className="error-message admin-feedback" role="alert">{error}</p>}
      {exito && <p className="success-message admin-feedback" role="status">{exito}</p>}

      <section className="admin-section" aria-labelledby="positions-title">
        <div className="admin-section__heading">
          <div><p className="admin-eyebrow">Puestos</p><h2 id="positions-title">Puestos en disputa</h2></div>
          <span className="admin-count">{puestos.length}</span>
        </div>
        <form className="admin-form position-form" noValidate onSubmit={guardarPuesto}>
          <label>Nombre del puesto
            <input value={puestoDraft.nombre} onChange={(event) => setPuestoDraft({ ...puestoDraft, nombre: event.target.value })} required disabled={jornadaIniciada} />
          </label>
          <label>Descripción
            <input value={puestoDraft.descripcion} onChange={(event) => setPuestoDraft({ ...puestoDraft, descripcion: event.target.value })} disabled={jornadaIniciada} />
          </label>
          <div className="admin-form__actions">
            <button type="submit" className="btn btn--primary" disabled={jornadaIniciada}>{puestoEnEdicion ? 'Guardar cambios' : 'Crear puesto'}</button>
            {puestoEnEdicion && <button type="button" className="btn btn--secondary" onClick={cancelarEdicionPuesto}>Cancelar</button>}
          </div>
        </form>
        {puestos.length === 0 ? <p className="empty-state">Todavía no hay puestos creados.</p> : (
          <ul className="admin-position-list">
            {puestos.map((puesto) => (
              <li key={puesto.id} className="admin-position-card">
                <div><h3>{puesto.nombre}</h3><p>{puesto.descripcion || 'Sin descripción.'}</p><small>{candidaturas.filter((item) => item.puestoId === puesto.id).length} candidaturas</small></div>
                <div className="admin-card-actions">
                  <button type="button" className="btn btn--secondary" onClick={() => prepararEdicionPuesto(puesto)} disabled={jornadaIniciada}>Editar</button>
                  <button type="button" className="btn btn--danger" onClick={() => setConfirmacion({ tipo: 'puesto', id: puesto.id })} disabled={jornadaIniciada}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-section" aria-labelledby="candidate-form-title">
        <div className="admin-section__heading">
          <div><p className="admin-eyebrow">Registro</p><h2 id="candidate-form-title">{candidatoEnEdicion ? 'Editar candidatura' : 'Nueva candidatura'}</h2></div>
        </div>
        {puestos.length === 0 && <p className="admin-lock-message">Cree un puesto antes de registrar candidaturas.</p>}
        <form className="admin-form candidate-form" noValidate onSubmit={(event) => {
          event.preventDefault()
          if (!jornadaIniciada && validarCandidato()) setMostrarVistaPrevia(true)
        }}>
          <label>Nombre completo
            <input value={candidatoDraft.nombreCompleto} onChange={(event) => setCandidatoDraft({ ...candidatoDraft, nombreCompleto: event.target.value })} required disabled={jornadaIniciada || !puestos.length} aria-invalid={Boolean(erroresCampo.nombreCompleto)} />
            {erroresCampo.nombreCompleto && <span className="field-error">{erroresCampo.nombreCompleto}</span>}
          </label>
          <label>Fotografía
            <input type="file" accept="image/*" disabled={jornadaIniciada || !puestos.length} onChange={(event) => {
              const archivo = event.target.files?.[0]
              if (archivo) setCandidatoDraft({ ...candidatoDraft, fotografia: URL.createObjectURL(archivo) })
            }} />
            {candidatoDraft.fotografia && <img className="admin-photo-preview" src={candidatoDraft.fotografia} alt="Vista previa de la fotografía seleccionada" />}
          </label>
          <label>Presentación o propuesta
            <textarea rows="4" value={candidatoDraft.presentacion} onChange={(event) => setCandidatoDraft({ ...candidatoDraft, presentacion: event.target.value })} required disabled={jornadaIniciada || !puestos.length} aria-invalid={Boolean(erroresCampo.presentacion)} />
            {erroresCampo.presentacion && <span className="field-error">{erroresCampo.presentacion}</span>}
          </label>
          <label>Puesto
            <select value={candidatoDraft.puestoId} onChange={(event) => setCandidatoDraft({ ...candidatoDraft, puestoId: event.target.value })} required disabled={jornadaIniciada || !puestos.length} aria-invalid={Boolean(erroresCampo.puestoId)}>
              <option value="">Seleccione un puesto</option>
              {puestos.map((puesto) => <option key={puesto.id} value={puesto.id}>{puesto.nombre}</option>)}
            </select>
            {erroresCampo.puestoId && <span className="field-error">{erroresCampo.puestoId}</span>}
          </label>
          <div className="candidate-initial-status"><span>{candidatoEnEdicion ? 'Estado actual' : 'Estado inicial'}</span><strong>{candidatoEnEdicion ? candidaturas.find((item) => item.id === candidatoEnEdicion)?.estado : 'Pendiente'}</strong></div>
          <div className="admin-form__actions">
            <button type="submit" className="btn btn--primary" disabled={jornadaIniciada || !puestos.length}>Vista previa</button>
            {candidatoEnEdicion && <button type="button" className="btn btn--secondary" onClick={iniciarNuevaCandidatura}>Cancelar edición</button>}
          </div>
        </form>
      </section>

      <section className="admin-section" aria-labelledby="candidate-list-title">
        <div className="admin-section__heading">
          <div><p className="admin-eyebrow">Consulta</p><h2 id="candidate-list-title">Candidaturas por puesto</h2></div>
          <label className="filter-control">Filtrar por puesto
            <select value={filtroPuesto} onChange={(event) => setFiltroPuesto(event.target.value)}>
              <option value="todos">Todos los puestos</option>
              {puestos.map((puesto) => <option key={puesto.id} value={puesto.id}>{puesto.nombre}</option>)}
            </select>
          </label>
        </div>
        {candidaturasFiltradas.length === 0 ? <p className="empty-state">No hay candidaturas para este puesto.</p> : (
          <div className="admin-candidate-list">
            {candidaturasFiltradas.map((candidatura) => (
              <article className="admin-candidate-card" key={candidatura.id}>
                <button type="button" className="admin-candidate-card__identity" onClick={() => setCandidatoDetalle(candidatura)}>
                  {candidatura.fotografia ? <img src={candidatura.fotografia} alt="" /> : <span className="admin-avatar" aria-hidden="true">{candidatura.nombreCompleto.charAt(0)}</span>}
                  <span><strong>{candidatura.nombreCompleto}</strong><small>{puestoPorId.get(candidatura.puestoId)?.nombre ?? 'Puesto no disponible'}</small></span>
                </button>
                <span className={`admin-status ${estadoClase[candidatura.estado]}`}>{candidatura.estado}</span>
                <div className="admin-card-actions">
                  <button type="button" className="btn btn--secondary" onClick={() => setCandidatoDetalle(candidatura)}>Ver detalle</button>
                  <button type="button" className="btn btn--secondary" onClick={() => prepararEdicionCandidato(candidatura)} disabled={jornadaIniciada || candidatura.estado === 'Retirado'}>Editar</button>
                  <button type="button" className="btn btn--danger" onClick={() => setConfirmacion({ tipo: 'candidatura', id: candidatura.id })} disabled={jornadaIniciada || candidatura.estado === 'Retirado'}>Retirar</button>
                </div>
                {candidatura.estado !== 'Retirado' && (
                  <div className="requirements-panel">
                    <strong>Verificación de requisitos</strong>
                    {candidatura.requisitos.map((requisito) => (
                      <label key={requisito.nombre} className="requirement-item">
                        <input type="checkbox" checked={requisito.cumplido} disabled={jornadaIniciada} onChange={(event) => cambiarRequisito(candidatura, requisito.nombre, event.target.checked)} />
                        {requisito.nombre}
                      </label>
                    ))}
                    {candidatura.estado === 'Pendiente' && (
                      <button type="button" className="btn btn--primary" onClick={() => habilitar(candidatura)} disabled={jornadaIniciada}>Habilitar candidatura</button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {mostrarVistaPrevia && (
        <Modal title={candidatoEnEdicion ? 'Revisar cambios' : 'Vista previa de la candidatura'} onClose={() => setMostrarVistaPrevia(false)}>
          <CandidateSummary draft={candidatoDraft} puesto={puestoPorId.get(candidatoDraft.puestoId)} estado={candidatoEnEdicion ? candidaturas.find((item) => item.id === candidatoEnEdicion)?.estado : 'Pendiente'} />
          <div className="admin-modal__actions">
            <button type="button" className="btn btn--secondary" onClick={() => setMostrarVistaPrevia(false)}>Editar</button>
            <button type="button" className="btn btn--primary" onClick={guardarCandidatura}>{candidatoEnEdicion ? 'Guardar cambios' : 'Guardar candidatura'}</button>
          </div>
        </Modal>
      )}

      {candidatoDetalle && (
        <Modal title="Detalle de candidatura" onClose={() => setCandidatoDetalle(null)}>
          <CandidateSummary draft={candidatoDetalle} puesto={puestoPorId.get(candidatoDetalle.puestoId)} estado={candidatoDetalle.estado} />
          <section className="detail-requirements"><h3>Requisitos</h3>
            {candidatoDetalle.requisitos.map((requisito) => <p key={requisito.nombre}>{requisito.cumplido ? '✓ Cumplido' : '○ Pendiente'} — {requisito.nombre}</p>)}
          </section>
        </Modal>
      )}

      {confirmacion && (
        <Modal title={confirmacion.tipo === 'puesto' ? 'Eliminar puesto' : 'Retirar candidatura'} onClose={() => setConfirmacion(null)}>
          <p>{confirmacion.tipo === 'puesto'
            ? 'Al eliminar este puesto, también se eliminarán las candidaturas asociadas. Esta acción no se puede deshacer.'
            : 'La candidatura dejará de estar disponible para votar y permanecerá en Administración con estado Retirado.'}</p>
          <div className="admin-modal__actions">
            <button type="button" className="btn btn--secondary" onClick={() => setConfirmacion(null)}>Cancelar</button>
            <button type="button" className="btn btn--danger" onClick={ejecutarConfirmacion}>{confirmacion.tipo === 'puesto' ? 'Eliminar puesto' : 'Retirar candidatura'}</button>
          </div>
        </Modal>
      )}
    </section>
  )
}

function CandidateSummary({ draft, puesto, estado }) {
  const nombre = draft.nombreCompleto ?? draft.nombre ?? ''
  const fotografia = draft.fotografia ?? draft.foto
  const presentacion = draft.presentacion ?? draft.propuesta ?? ''
  return (
    <div className="candidate-summary">
      {fotografia ? <img src={fotografia} alt={`Fotografía de ${nombre}`} /> : <span className="admin-avatar admin-avatar--large" aria-hidden="true">{nombre.charAt(0)}</span>}
      <div><h3>{nombre}</h3><p><strong>Puesto:</strong> {puesto?.nombre ?? 'No asignado'}</p><p><strong>Estado:</strong> <span className={`admin-status ${estadoClase[estado]}`}>{estado}</span></p><p>{presentacion}</p></div>
    </div>
  )
}
