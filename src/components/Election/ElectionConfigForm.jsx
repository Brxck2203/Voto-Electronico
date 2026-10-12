import { useEffect, useState } from 'react'
import { useVoting } from '../../state/VotingContext.jsx'
const fields = [
  ['registrationStart', 'Inicio de inscripción'],
  ['registrationEnd', 'Fin de inscripción'],
  ['campaignStart', 'Inicio de campaña'],
  ['campaignEnd', 'Fin de campaña'],
  ['rollClose', 'Cierre del padrón'],
  ['open', 'Apertura de votación'],
  ['close', 'Cierre de votación'],
]
const dateInput = (ms) => new Date(ms).toISOString().slice(0, 16)
export function ElectionConfigForm() {
  const v = useVoting(),
    e = v.election,
    [draft, setDraft] = useState(e),
    [newName, setNewName] = useState(''),
    [purpose, setPurpose] = useState(''),
    [groupName, setGroupName] = useState(''),
    [members, setMembers] = useState({}),
    [roll, setRoll] = useState(e.roll || []),
    [admins, setAdmins] = useState(e.admins || [])
  const org = v.organizations.find((o) => o.id === v.context.orgId)
  useEffect(() => {
    setDraft(e)
    setRoll(e.roll || [])
    setAdmins(e.admins || [])
  }, [e.version, e.id])
  const errors = v.read('publicationErrors')
  const save = (event) => {
    event.preventDefault()
    v.act('configure', {
      name: draft.name,
      purpose: draft.purpose,
      mode: draft.mode,
      sessionSeconds: Number(draft.sessionSeconds),
      weighting: draft.weighting,
      calendar: draft.calendar,
    })
  }
  return (
    <div className="config-page">
      <section className="panel">
        <h2>Configuración del proceso</h2>
        <p>{e.purpose}</p>
        <div className="action-row">
          <button
            className="btn btn--primary"
            disabled={!e.editable}
            onClick={() => v.act('publish')}
          >
            Publicar configuración
          </button>
          <button
            className="btn btn--secondary"
            disabled={e.phase !== 'PROGRAMADO'}
            onClick={() => {
              if (
                window.confirm(
                  'Adelantar apertura y cierre del padrón a este momento. La jornada no podrá revertirse.',
                )
              )
                v.act('start')
            }}
          >
            Abrir ahora
          </button>
          <button
            className="btn btn--danger"
            disabled={e.phase !== 'ABIERTO'}
            onClick={() => {
              if (
                window.confirm(
                  'Cerrar definitivamente la jornada y habilitar los resultados agregados.',
                )
              )
                v.act('close')
            }}
          >
            Cerrar jornada
          </button>
        </div>
        <p className="muted">
          Abrir ahora adelanta el calendario para esta demostración. El cierre
          es irreversible. Editar una configuración publicada exige publicarla
          nuevamente.
        </p>
        {e.phase === 'BORRADOR' && (
          <div className="validation-list">
            <h3>Validación de publicación</h3>
            {errors.length ? (
              <ul>
                {errors.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            ) : (
              <p>Configuración completa. Puede publicar el proceso.</p>
            )}
          </div>
        )}
        <div className="metrics">
          <div>
            <strong>{e.participationCount}</strong>
            <span>Electores que participaron</span>
          </div>
          <div>
            <strong>{e.eligibleCount}</strong>
            <span>Electores habilitados</span>
          </div>
          <div>
            <strong>{e.version}</strong>
            <span>Versión de configuración</span>
          </div>
        </div>
      </section>
      <form className="panel" onSubmit={save}>
        <h2>Datos y reglas</h2>
        <fieldset disabled={!e.editable}>
          <div className="form-grid">
            <label>
              Nombre
              <input
                required
                value={draft.name}
                onChange={(x) => setDraft({ ...draft, name: x.target.value })}
              />
            </label>
            <label>
              Propósito
              <input
                required
                value={draft.purpose}
                onChange={(x) =>
                  setDraft({ ...draft, purpose: x.target.value })
                }
              />
            </label>
            <label>
              Modalidad
              <select
                value={draft.mode}
                onChange={(x) => setDraft({ ...draft, mode: x.target.value })}
              >
                <option value="POR_PUESTOS">Puestos individuales</option>
                <option value="POR_GRUPOS">Grupos de candidatos</option>
              </select>
            </label>
            <label>
              Duración de sesión (segundos)
              <input
                type="number"
                min="1"
                step="1"
                required
                value={draft.sessionSeconds}
                onChange={(x) =>
                  setDraft({ ...draft, sessionSeconds: x.target.value })
                }
              />
            </label>
            <label>
              Ponderación
              <select
                value={draft.weighting}
                onChange={(x) =>
                  setDraft({ ...draft, weighting: x.target.value })
                }
              >
                <option value="IGUALITARIO">Un elector, peso 1</option>
                <option value="PONDERADO">Peso configurado en el padrón</option>
              </select>
            </label>
            <label>
              Zona horaria de visualización
              <select
                value={draft.calendar.timezone}
                onChange={(x) =>
                  setDraft({
                    ...draft,
                    calendar: { ...draft.calendar, timezone: x.target.value },
                  })
                }
              >
                <option>America/Costa_Rica</option>
                <option>UTC</option>
              </select>
            </label>
          </div>
          <h3>Calendario</h3>
          <p className="muted">
            Edición en UTC. Debajo de cada campo se muestra la hora equivalente
            en {draft.calendar.timezone}. El padrón debe cerrarse antes de abrir
            la votación.
          </p>
          <div className="form-grid">
            {fields.map(([key, label]) => (
              <label key={key}>
                {label} (UTC)
                <input
                  type="datetime-local"
                  required
                  value={
                    Number.isFinite(draft.calendar[key])
                      ? dateInput(draft.calendar[key])
                      : ''
                  }
                  onChange={(x) =>
                    setDraft({
                      ...draft,
                      calendar: {
                        ...draft.calendar,
                        [key]: Date.parse(x.target.value + 'Z'),
                      },
                    })
                  }
                />
                <small>
                  {Number.isFinite(draft.calendar[key]) &&
                    new Intl.DateTimeFormat('es-CR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: draft.calendar.timezone,
                    }).format(draft.calendar[key])}
                </small>
              </label>
            ))}
          </div>
          <button className="btn btn--primary">Guardar configuración</button>
        </fieldset>
      </form>
      <section className="panel">
        <h2>Opciones habilitadas</h2>
        <p>
          Para cambiar de modalidad, deshabilite primero todas las opciones. La
          verificación de requisitos se realiza en Candidaturas.
        </p>
        <div className="option-list">
          {(e.mode === 'POR_PUESTOS' ? e.candidates : e.groups).map((o) => (
            <label key={o.id}>
              <input
                type="checkbox"
                checked={o.enabled}
                disabled={
                  !e.editable || (o.estado && o.estado !== 'Habilitado')
                }
                onChange={(x) => v.act('option', o.id, x.target.checked)}
              />
              {o.nombre || o.name}
              <span className="muted">{o.estado || 'Grupo'}</span>
            </label>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2>Límites y requisitos por puesto</h2>
        {e.positions.map((p) => (
          <PositionRules
            key={`${p.id}-${e.version}`}
            p={p}
            editable={e.editable}
            mode={e.mode}
            act={v.act}
          />
        ))}
      </section>
      {e.mode === 'POR_GRUPOS' && (
        <section className="panel">
          <h2>Conformar grupo</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (
                v.act(
                  'group',
                  groupName,
                  e.positions.map((p) => ({
                    positionId: p.id,
                    candidateId: members[p.id],
                  })),
                )
              ) {
                setGroupName('')
                setMembers({})
              }
            }}
          >
            <fieldset disabled={!e.editable}>
              <label>
                Nombre del grupo
                <input
                  value={groupName}
                  onChange={(x) => setGroupName(x.target.value)}
                  required
                />
              </label>
              <div className="form-grid">
                {e.positions.map((p) => (
                  <label key={p.id}>
                    {p.nombre}
                    <select
                      required
                      value={members[p.id] || ''}
                      onChange={(x) =>
                        setMembers({ ...members, [p.id]: x.target.value })
                      }
                    >
                      <option value="">Seleccione candidatura</option>
                      {e.candidates
                        .filter(
                          (c) =>
                            c.puestoId === p.id && c.estado === 'Habilitado',
                        )
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                    </select>
                  </label>
                ))}
              </div>
              <button className="btn btn--primary">Crear grupo</button>
            </fieldset>
          </form>
          {e.groups.map((g) => (
            <p key={g.id}>
              <strong>{g.name}</strong>:{' '}
              {g.members
                .map(
                  (m) =>
                    e.candidates.find((c) => c.id === m.candidateId)?.nombre,
                )
                .join(', ')}
            </p>
          ))}
        </section>
      )}
      <section className="panel">
        <h2>Tribunal electoral</h2>
        <fieldset disabled={!e.editable}>
          <div className="option-list">
            {org.members
              .filter((m) => m.canAdmin)
              .map((m) => (
                <label key={m.id}>
                  <input
                    type="checkbox"
                    checked={admins.includes(m.id)}
                    onChange={(x) =>
                      setAdmins(
                        x.target.checked
                          ? [...admins, m.id]
                          : admins.filter((id) => id !== m.id),
                      )
                    }
                  />
                  {m.name}
                </label>
              ))}
          </div>
          <button
            className="btn btn--primary"
            onClick={() => v.act('setAdmins', admins)}
          >
            Guardar tribunal
          </button>
        </fieldset>
      </section>
      <section className="panel">
        <h2>Padrón y pesos</h2>
        <p>
          Pesos positivos con hasta tres decimales. Cada opción seleccionada
          recibe el peso completo del elector; una papeleta sin selección cuenta
          como participación, sin sumar a ninguna opción.
        </p>
        <fieldset disabled={!e.editable || v.clock >= e.calendar.rollClose}>
          <div className="roll-grid">
            {org.members
              .filter((m) => !m.canAdmin)
              .map((m) => {
                const r = roll.find((r) => r.userId === m.id)
                return (
                  <div key={m.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={!!r}
                        onChange={(x) =>
                          setRoll(
                            x.target.checked
                              ? [...roll, { userId: m.id, weight: 1 }]
                              : roll.filter((r) => r.userId !== m.id),
                          )
                        }
                      />
                      {m.name}
                    </label>
                    {r && (
                      <input
                        aria-label={`Peso de ${m.name}`}
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={r.weight}
                        onChange={(x) =>
                          setRoll(
                            roll.map((r) =>
                              r.userId === m.id
                                ? { ...r, weight: x.target.value }
                                : r,
                            ),
                          )
                        }
                      />
                    )}
                  </div>
                )
              })}
          </div>
          <button
            className="btn btn--primary"
            onClick={() => v.act('setRoll', roll)}
          >
            Guardar padrón
          </button>
        </fieldset>
        {v.clock >= e.calendar.rollClose && (
          <p>Padrón cerrado: no admite cambios.</p>
        )}
      </section>
      <section className="panel">
        <h2>Vista previa de papeletas</h2>
        <p>
          Consultar esta vista no registra votos. Tras publicar, refleja el
          orden sorteado.
        </p>
        {v.ballots.map((b) => (
          <div key={b.id}>
            <h3>
              {b.name} · {b.min} a {b.max} selecciones
            </h3>
            <ol>
              {b.options.map((o) => (
                <li key={o.id}>{o.nombre}</li>
              ))}
            </ol>
          </div>
        ))}
      </section>
      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault()
          if (v.createElection(newName, purpose)) {
            setNewName('')
            setPurpose('')
          }
        }}
      >
        <h2>Nuevo proceso electoral</h2>
        <div className="form-grid">
          <label>
            Nombre
            <input
              required
              value={newName}
              onChange={(x) => setNewName(x.target.value)}
            />
          </label>
          <label>
            Propósito
            <input
              required
              value={purpose}
              onChange={(x) => setPurpose(x.target.value)}
            />
          </label>
        </div>
        <button className="btn btn--secondary">Crear borrador</button>
      </form>
    </div>
  )
}
function PositionRules({ p, editable, mode, act }) {
  const [min, setMin] = useState(p.min),
    [max, setMax] = useState(p.max),
    [requirements, setRequirements] = useState(p.requirements)
  return (
    <details className="position-rules">
      <summary>{p.nombre}</summary>
      <fieldset disabled={!editable}>
        {mode === 'POR_PUESTOS' && (
          <div className="inline-form">
            <label>
              Mínimo
              <input
                type="number"
                min="0"
                value={min}
                onChange={(x) => setMin(x.target.value)}
              />
            </label>
            <label>
              Máximo
              <input
                type="number"
                min="1"
                value={max}
                onChange={(x) => setMax(x.target.value)}
              />
            </label>
            <button
              className="btn btn--secondary"
              onClick={() => act('setLimits', p.id, Number(min), Number(max))}
            >
              Guardar límites
            </button>
          </div>
        )}
        <h3>Requisitos de inscripción</h3>
        {requirements.map((r, i) => (
          <div className="requirement-editor" key={i}>
            <input
              aria-label={`Requisito ${i + 1}`}
              value={r.nombre}
              onChange={(x) =>
                setRequirements(
                  requirements.map((r, j) =>
                    i === j ? { ...r, nombre: x.target.value } : r,
                  ),
                )
              }
            />
            <label>
              <input
                type="checkbox"
                checked={r.obligatorio}
                onChange={(x) =>
                  setRequirements(
                    requirements.map((r, j) =>
                      i === j ? { ...r, obligatorio: x.target.checked } : r,
                    ),
                  )
                }
              />
              Obligatorio
            </label>
            <button
              className="btn btn--secondary"
              onClick={() =>
                setRequirements(requirements.filter((_, j) => i !== j))
              }
            >
              Quitar
            </button>
          </div>
        ))}
        <div className="action-row">
          <button
            className="btn btn--secondary"
            onClick={() =>
              setRequirements([
                ...requirements,
                { nombre: '', obligatorio: true },
              ])
            }
          >
            Añadir requisito
          </button>
          <button
            className="btn btn--primary"
            onClick={() => {
              if (
                window.confirm(
                  'Guardar exige verificar nuevamente las candidaturas de este puesto.',
                )
              )
                act('setRequirements', p.id, requirements)
            }}
          >
            Guardar requisitos
          </button>
        </div>
      </fieldset>
    </details>
  )
}
