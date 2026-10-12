import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ElectoralSystem,
  validateImage,
} from '../src/domain/ElectoralSystem.js'
import { createSeed } from '../src/state/seed.js'
const initial = Date.UTC(2026, 9, 12, 12)
const admin = { orgId: 'org-1', userId: 'o0-admin1' }
const voter = (n) => ({ orgId: 'org-1', userId: `o0-elector${n}` })
const id = 'o0-eleccion'
function fixture() {
  let now = initial
  const seed = createSeed(now),
    s = new ElectoralSystem(seed.organizations, seed.elections, () => now)
  return {
    s,
    advance: (ms) => {
      now += ms
    },
    open: () => {
      s.publish(admin, id)
      s.start(admin, id)
    },
  }
}
function selections(s, offset = 0) {
  return Object.fromEntries(
    s.ballots(voter(1), id).map((b) => [b.id, [b.options[offset].id]]),
  )
}
function vote(s, n, selection = selections(s)) {
  const session = s.begin(voter(n), id)
  return s.emit(voter(n), id, session.token, selection)
}

test('precarga diez candidatos, dos puestos y dos organizaciones aisladas', () => {
  const { s } = fixture()
  assert.equal(s.view(admin, id).candidates.length, 10)
  assert.deepEqual(
    s.ballots(admin, id).map((b) => b.options.length),
    [5, 5],
  )
  assert.throws(
    () => s.view({ orgId: 'org-2', userId: 'o1-admin1' }, id),
    /ACCESO_DENEGADO/,
  )
  assert.equal(s.list(voter(1)).length, 1)
  assert.throws(
    () => s.configure(voter(1), id, { name: 'Otra' }),
    /ACCESO_DENEGADO/,
  )
  assert.throws(() => s.create(voter(1), 'Otra', 'Prueba'), /ACCESO_DENEGADO/)
})
test('la publicación valida y fija una permutación completa para todos los electores', () => {
  const { s } = fixture()
  s.publish(admin, id)
  const order = s.ballots(voter(1), id)
  assert.deepEqual(s.ballots(voter(2), id), order)
  for (const b of order)
    assert.equal(new Set(b.options.map((c) => c.id)).size, 5)
  s.configure(admin, id, { name: 'Versión nueva' })
  assert.equal(s.view(admin, id).status, 'BORRADOR')
  s.option(admin, id, order[0].options[0].id, false)
  s.setLimits(admin, id, order[0].id, 1, 4)
  s.option(admin, id, order[0].options[1].id, false)
  assert.throws(() => s.publish(admin, id), /límites/)
})
test('el calendario y el padrón se validan antes de mutar el estado', () => {
  const { s, advance } = fixture(),
    old = s.view(admin, id)
  assert.throws(
    () =>
      s.configure(admin, id, { calendar: { ...old.calendar, close: initial } }),
    /Calendario/,
  )
  assert.throws(
    () =>
      s.configure(admin, id, {
        calendar: {
          ...old.calendar,
          campaignEnd: initial - 2,
          rollClose: initial - 1,
          open: initial,
        },
      }),
    /apertura debe ser futura/,
  )
  assert.deepEqual(s.view(admin, id).calendar, old.calendar)
  for (const weight of [0, -1, Infinity, 0.0001])
    assert.throws(() =>
      s.setRoll(admin, id, [{ userId: voter(1).userId, weight }]),
    )
  assert.throws(
    () => s.setRoll(admin, id, [{ userId: 'o1-elector1', weight: 1 }]),
    /ajenos/,
  )
  assert.throws(
    () => s.setRoll(admin, id, [old.roll[0], old.roll[0]]),
    /duplicados/,
  )
  s.setRoll(admin, id, [{ userId: voter(1).userId, weight: 1.001 }])
  advance(old.calendar.rollClose - initial)
  assert.throws(() => s.setRoll(admin, id, old.roll), /PADRON_CERRADO/)
  assert.throws(
    () =>
      s.configure(admin, id, {
        calendar: { ...old.calendar, rollClose: old.calendar.rollClose + 1 },
      }),
    /no puede trasladarse/,
  )
})
test('apertura automática y cierre usan intervalos inclusivo/exclusivo', () => {
  const { s, advance } = fixture(),
    e = s.view(admin, id)
  s.publish(admin, id)
  assert.throws(() => s.begin(voter(1), id), /FUERA_DE_PERIODO/)
  advance(e.calendar.open - initial)
  assert.equal(s.view(admin, id).phase, 'ABIERTO')
  const session = s.begin(voter(1), id)
  advance(e.calendar.close - e.calendar.open)
  assert.throws(
    () => s.emit(voter(1), id, session.token, selections(s)),
    /FUERA_DE_PERIODO/,
  )
  assert.equal(s.results(voter(1), id).participation, 0)
})
test('el voto exige padrón, sesión propia y todas las papeletas válidas sin registrar parcialmente', () => {
  const { s, open } = fixture()
  open()
  assert.throws(() => s.begin(admin, id), /NO_HABILITADO/)
  const token = s.begin(voter(1), id).token,
    all = selections(s),
    keys = Object.keys(all)
  assert.throws(() => s.emit(voter(2), id, token, all), /ACCESO_DENEGADO/)
  for (const bad of [
    {},
    { [keys[0]]: all[keys[0]] },
    { ...all, extra: [] },
    { ...all, [keys[1]]: [] },
    { ...all, [keys[1]]: ['inexistente'] },
    { ...all, [keys[1]]: [all[keys[1]][0], all[keys[1]][0]] },
  ]) {
    assert.throws(() => s.emit(voter(1), id, token, bad), /PAPELETA_INVALIDA/)
    assert.equal(s.view(admin, id).participationCount, 0)
  }
  assert.deepEqual(s.emit(voter(1), id, token, all), {
    status: 'VOTO_REGISTRADO',
    electionId: id,
  })
  assert.equal(s.view(admin, id).participationCount, 1)
})
test('dos envíos del mismo elector registran una sola participación y no permiten modificarla', async () => {
  const { s, open } = fixture()
  open()
  const token = s.begin(voter(1), id).token,
    all = selections(s)
  const attempts = await Promise.allSettled(
    [0, 1].map(() =>
      Promise.resolve().then(() => s.emit(voter(1), id, token, all)),
    ),
  )
  assert.deepEqual(
    attempts.map((a) => a.status),
    ['fulfilled', 'rejected'],
  )
  assert.throws(() => s.begin(voter(1), id), /YA_EMITIDO/)
  s.close(admin, id)
  assert.equal(s.results(admin, id).participation, 1)
  assert.ok(
    s
      .results(admin, id)
      .ballots.every((b) => b.rows.reduce((n, r) => n + r.votes, 0) === 1),
  )
})
test('una sesión vence exactamente en su límite y permite reingreso sin voto previo', () => {
  const { s, open, advance } = fixture()
  s.configure(admin, id, { sessionSeconds: 2 })
  open()
  const a = s.begin(voter(1), id)
  assert.deepEqual(s.begin(voter(1), id), a)
  advance(2000)
  assert.throws(
    () => s.emit(voter(1), id, a.token, selections(s)),
    /SESION_VENCIDA/,
  )
  const b = s.begin(voter(1), id)
  assert.notEqual(a.token, b.token)
  s.emit(voter(1), id, b.token, selections(s))
  assert.equal(s.view(voter(1), id).emitted, true)
})
test('jornada abierta y cerrada bloquean edición y reapertura', () => {
  const { s, open } = fixture()
  open()
  const e = s.view(admin, id)
  for (const call of [
    () =>
      s.configure(admin, id, {
        calendar: { ...e.calendar, open: initial + 99999 },
      }),
    () => s.position(admin, id, { nombre: 'Vocalía' }),
    () => s.withdraw(admin, id, e.candidates[0].id),
    () => s.setAdmins(admin, id, ['o0-admin2']),
    () => s.publish(admin, id),
  ])
    assert.throws(call, /CONFIGURACION_BLOQUEADA/)
  s.close(admin, id)
  assert.throws(() => s.start(admin, id), /Publique primero/)
  assert.throws(
    () => s.configure(admin, id, { name: 'Reabrir' }),
    /CONFIGURACION_BLOQUEADA/,
  )
  assert.throws(() => s.begin(voter(1), id), /FUERA_DE_PERIODO/)
})
test('resultados ocultos hasta el cierre; votos y padrón no se entregan al elector', () => {
  const { s, open } = fixture()
  open()
  vote(s, 1)
  assert.throws(() => s.results(admin, id), /RESULTADOS_NO_DISPONIBLES/)
  const view = s.view(voter(2), id)
  for (const key of ['votes', 'roll', 'participation', 'admins'])
    assert.equal(Object.hasOwn(view, key), false)
  assert.equal(view.participationCount, undefined)
  view.candidates[0].nombre = 'Alterado'
  assert.notEqual(s.view(admin, id).candidates[0].nombre, 'Alterado')
  s.close(admin, id)
  assert.equal(s.results(voter(2), id).abstentions, 9)
})
test('ponderación decimal, selección múltiple, papeleta en blanco y empate', () => {
  const { s, open } = fixture(),
    e = s.view(admin, id)
  s.configure(admin, id, { weighting: 'PONDERADO' })
  s.setRoll(
    admin,
    id,
    e.roll.map((r) => ({ ...r, weight: 1.001 })),
  )
  s.setLimits(admin, id, e.positions[0].id, 0, 2)
  open()
  const a = selections(s),
    b = selections(s, 1),
    first = e.positions[0].id
  vote(s, 1, { ...a, [first]: [a[first][0], b[first][0]] })
  vote(s, 2, { ...b, [first]: [] })
  s.close(admin, id)
  const result = s.results(admin, id)
  assert.equal(result.ballots[0].blank, 1)
  assert.equal(result.ballots[0].tie, true)
  assert.equal(
    result.ballots[0].rows.reduce((n, r) => n + r.weight, 0),
    2.002,
  )
  assert.equal(result.ballots[1].tie, true)
})
test('candidatura nueva no acepta habilitación inyectada y cambiar puesto exige verificar nuevamente', () => {
  const { s } = fixture(),
    e = s.view(admin, id),
    a = e.candidates[0]
  s.candidate(admin, id, {
    ...a,
    fotografia: '',
    estado: 'Habilitado',
    enabled: true,
  })
  const added = s.view(admin, id).candidates.at(-1)
  assert.equal(added.estado, 'Pendiente')
  assert.throws(() => s.enableCandidate(admin, id, added.id), /pendientes/)
  for (const r of added.requisitos)
    s.requirement(admin, id, added.id, r.nombre, true)
  s.enableCandidate(admin, id, added.id)
  s.candidate(admin, id, { ...added, puestoId: e.positions[1].id }, added.id)
  const moved = s.view(admin, id).candidates.at(-1)
  assert.equal(moved.estado, 'Pendiente')
  assert.equal(moved.enabled, false)
  assert.ok(moved.requisitos.every((r) => !r.cumplido))
  assert.throws(
    () => s.candidate(admin, id, { ...a, ownerId: 'o1-elector1' }),
    /identidad/,
  )
})
test('requisitos opcionales no impiden habilitar y nombres repetidos se rechazan', () => {
  const { s } = fixture(),
    e = s.view(admin, id),
    c = e.candidates[0]
  assert.throws(
    () =>
      s.setRequirements(admin, id, c.puestoId, [
        { nombre: 'X', obligatorio: true },
        { nombre: 'x', obligatorio: false },
      ]),
    /repita/,
  )
  s.setRequirements(admin, id, c.puestoId, [
    { nombre: 'Obligatorio', obligatorio: true },
    { nombre: 'Opcional', obligatorio: false },
  ])
  s.requirement(admin, id, c.id, 'Obligatorio', true)
  s.enableCandidate(admin, id, c.id)
  assert.equal(s.view(admin, id).candidates[0].estado, 'Habilitado')
})
test('grupos requieren un candidato habilitado por puesto y se votan como unidad', () => {
  const { s, open } = fixture(),
    e = s.view(admin, id)
  assert.throws(
    () => s.configure(admin, id, { mode: 'POR_GRUPOS' }),
    /Deshabilite/,
  )
  e.candidates.forEach((c) => s.option(admin, id, c.id, false))
  s.configure(admin, id, { mode: 'POR_GRUPOS' })
  assert.throws(() => s.group(admin, id, 'Incompleto', []), /exactamente/)
  s.group(
    admin,
    id,
    'Equipo A',
    e.positions.map((p) => ({
      positionId: p.id,
      candidateId: e.candidates.find((c) => c.puestoId === p.id).id,
    })),
  )
  const g = s.view(admin, id).groups[0]
  s.option(admin, id, g.id, true)
  open()
  assert.equal(s.ballots(voter(1), id).length, 1)
  vote(s, 1, { grupos: [g.id] })
  s.close(admin, id)
  assert.equal(s.results(admin, id).ballots[0].rows[0].votes, 1)
})
test('la campaña permite propuesta, consulta y respuesta del dueño dentro de su período', () => {
  const { s } = fixture(),
    c = s.view(admin, id).candidates[0]
  assert.throws(() => s.post(voter(1), id, c.id, 'Texto'), /campaña/)
  s.publish(admin, id)
  assert.throws(() => s.post(voter(2), id, c.id, 'Texto'), /candidato/)
  s.post(voter(1), id, c.id, 'Nueva propuesta')
  const post = s.view(voter(2), id).posts[0]
  s.question(voter(2), id, post.id, '¿Cuándo?')
  const q = s.view(voter(1), id).posts[0].questions[0]
  assert.throws(() => s.answer(voter(2), id, post.id, q.id, 'Mañana'), /autor/)
  s.answer(voter(1), id, post.id, q.id, 'En noviembre')
  assert.equal(
    s.view(voter(2), id).posts[0].questions[0].answer,
    'En noviembre',
  )
  s.start(admin, id)
  assert.throws(() => s.question(voter(2), id, post.id, 'Otra'), /campaña/)
})
test('sesiones no cruzan procesos y el conteo queda separado por organización', () => {
  const { s, open } = fixture()
  open()
  const secondAdmin = { orgId: 'org-2', userId: 'o1-admin1' },
    other = { orgId: 'org-2', userId: 'o1-elector1' }
  s.publish(secondAdmin, 'o1-eleccion')
  s.start(secondAdmin, 'o1-eleccion')
  const session = s.begin(voter(1), id)
  assert.throws(
    () => s.emit(other, 'o1-eleccion', session.token, selections(s)),
    /ACCESO_DENEGADO/,
  )
  vote(s, 1)
  s.close(secondAdmin, 'o1-eleccion')
  assert.equal(s.results(other, 'o1-eleccion').participation, 0)
})
test('dos administradores, retiro y cascada de puestos; borrador vacío no se publica', () => {
  const { s } = fixture(),
    second = { ...admin, userId: 'o0-admin2' }
  s.configure(second, id, { name: 'Compartida' })
  const e = s.view(admin, id)
  s.withdraw(second, id, e.candidates[0].id)
  assert.equal(s.ballots(admin, id)[0].options.length, 4)
  s.deletePosition(admin, id, e.positions[0].id)
  assert.equal(s.view(admin, id).candidates.length, 5)
  const fresh = s.create(admin, 'Nuevo', 'Otra elección')
  assert.throws(() => s.publish(admin, fresh), /padrón/)
  assert.throws(() => s.setAdmins(admin, id, []), /al menos/)
})
test('las entradas de configuración no conservan referencias externas y las imágenes tienen límites', () => {
  const { s } = fixture(),
    calendar = s.view(admin, id).calendar
  s.configure(admin, id, { calendar })
  calendar.open = 0
  assert.notEqual(s.view(admin, id).calendar.open, 0)
  validateImage({ type: 'image/png', size: 5 * 1024 * 1024 })
  assert.throws(
    () => validateImage({ type: 'image/svg+xml', size: 1 }),
    /JPG o PNG/,
  )
  assert.throws(
    () => validateImage({ type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 }),
    /5 MB/,
  )
})
