// Motor del prototipo. El contexto representa una identidad precargada, no autenticación real.
const copy = (v) => structuredClone(v)
const uid = () => crypto.randomUUID()
const fail = (message) => {
  throw new Error(message)
}
const positive = (n) => Number.isFinite(Number(n)) && Number(n) > 0
const shuffle = (items) => {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const bound = i + 1,
      limit = Math.floor(2 ** 32 / bound) * bound
    let value
    do {
      value = crypto.getRandomValues(new Uint32Array(1))[0]
    } while (value >= limit)
    const j = value % bound
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
export function validateImage(file, max = 5 * 1024 * 1024) {
  if (!['image/jpeg', 'image/png'].includes(file.type))
    fail('La fotografía debe ser JPG o PNG.')
  if (file.size > max) fail('La fotografía supera el máximo de 5 MB.')
}
export class ElectoralSystem {
  #organizations
  #elections
  #sessions = new Map()
  #now
  constructor(organizations, elections, now = () => Date.now()) {
    this.#organizations = copy(organizations)
    this.#elections = copy(elections).map((e) => ({
      ...e,
      participation: new Set(),
      votes: [],
      order: {},
      version: 0,
    }))
    this.#now = now
  }
  identities() {
    return copy(this.#organizations)
  }
  #member(ctx) {
    const org = this.#organizations.find((o) => o.id === ctx?.orgId)
    const member = org?.members.find((m) => m.id === ctx?.userId)
    if (!member)
      fail('ACCESO_DENEGADO: identidad u organización no autorizada.')
    return member
  }
  #election(ctx, id) {
    this.#member(ctx)
    const e = this.#elections.find((e) => e.id === id && e.orgId === ctx.orgId)
    if (!e) fail('ACCESO_DENEGADO: proceso no disponible en esta organización.')
    return e
  }
  #admin(ctx, e) {
    if (!e.admins.includes(this.#member(ctx).id))
      fail('ACCESO_DENEGADO: se requiere un integrante del tribunal.')
  }
  #editable(ctx, e) {
    this.#admin(ctx, e)
    if (e.status === 'CERRADO' || this.#now() >= e.calendar.open)
      fail('CONFIGURACION_BLOQUEADA: la apertura ya fue alcanzada.')
  }
  #changed(e) {
    e.status = 'BORRADOR'
    e.order = {}
    e.version++
  }
  #active(e) {
    if (
      e.status !== 'PUBLICADO' ||
      this.#now() < e.calendar.open ||
      this.#now() >= e.calendar.close
    )
      fail('FUERA_DE_PERIODO: la votación no está abierta.')
  }
  phase(e) {
    if (
      e.status === 'CERRADO' ||
      (e.status === 'PUBLICADO' && this.#now() >= e.calendar.close)
    )
      return 'CERRADO'
    if (e.status === 'BORRADOR') return 'BORRADOR'
    return this.#now() < e.calendar.open ? 'PROGRAMADO' : 'ABIERTO'
  }
  list(ctx) {
    this.#member(ctx)
    return this.#elections
      .filter((e) => e.orgId === ctx.orgId)
      .map((e) => ({ id: e.id, name: e.name, phase: this.phase(e) }))
  }
  view(ctx, id) {
    const e = this.#election(ctx, id),
      { votes, participation, ...publicData } = e
    const admin = e.admins.includes(ctx.userId)
    const result = copy(publicData)
    // No se entregan padrones, pesos individuales ni datos administrativos a votantes.
    if (!admin) {
      delete result.roll
      delete result.admins
    }
    return {
      ...result,
      phase: this.phase(e),
      isAdmin: admin,
      emitted: participation.has(ctx.userId),
      participationCount: admin ? participation.size : undefined,
      eligibleCount: admin ? e.roll.length : undefined,
      editable:
        admin && this.#now() < e.calendar.open && e.status !== 'CERRADO',
    }
  }
  create(ctx, name, purpose) {
    if (!this.#member(ctx).canAdmin)
      fail('ACCESO_DENEGADO: solo administradores pueden crear procesos.')
    if (!name.trim() || !purpose.trim())
      fail('Nombre y propósito son obligatorios.')
    const now = this.#now(),
      day = 86400000
    const e = {
      id: uid(),
      orgId: ctx.orgId,
      name: name.trim(),
      purpose: purpose.trim(),
      status: 'BORRADOR',
      mode: 'POR_PUESTOS',
      sessionSeconds: 180,
      weighting: 'IGUALITARIO',
      admins: [ctx.userId],
      calendar: {
        registrationStart: now - 3 * day,
        registrationEnd: now - 2 * day,
        campaignStart: now - day,
        campaignEnd: now + day,
        rollClose: now + day,
        open: now + 2 * day,
        close: now + 3 * day,
        timezone: 'America/Costa_Rica',
      },
      positions: [],
      candidates: [],
      groups: [],
      roll: [],
      posts: [],
      participation: new Set(),
      votes: [],
      order: {},
      version: 0,
    }
    this.#elections.push(e)
    return e.id
  }
  configure(ctx, id, changes) {
    const e = this.#election(ctx, id)
    this.#editable(ctx, e)
    const allowed = [
      'name',
      'purpose',
      'calendar',
      'sessionSeconds',
      'weighting',
      'mode',
    ]
    if (Object.keys(changes).some((k) => !allowed.includes(k)))
      fail('Parámetro de configuración no permitido.')
    const next = { ...copy(e), ...copy(changes) }
    if (!next.name.trim() || !next.purpose.trim())
      fail('Nombre y propósito son obligatorios.')
    if (!['POR_PUESTOS', 'POR_GRUPOS'].includes(next.mode))
      fail('Modalidad inválida.')
    if (
      next.mode !== e.mode &&
      (e.candidates.some((c) => c.enabled) || e.groups.some((g) => g.enabled))
    )
      fail('Deshabilite las opciones antes de cambiar la modalidad.')
    if (!Number.isInteger(next.sessionSeconds) || next.sessionSeconds <= 0)
      fail('La sesión requiere un entero positivo en segundos.')
    if (!['IGUALITARIO', 'PONDERADO'].includes(next.weighting))
      fail('Esquema de ponderación inválido.')
    this.#validateCalendar(next.calendar)
    if (next.calendar.open <= this.#now()) fail('La apertura debe ser futura.')
    if (
      this.#now() >= e.calendar.rollClose &&
      next.calendar.rollClose !== e.calendar.rollClose
    )
      fail('El cierre del padrón ya ocurrió y no puede trasladarse.')
    Object.assign(e, copy(changes))
    this.#changed(e)
  }
  #validateCalendar(c) {
    const keys = [
      'registrationStart',
      'registrationEnd',
      'campaignStart',
      'campaignEnd',
      'rollClose',
      'open',
      'close',
    ]
    if (!c || keys.some((k) => !Number.isFinite(c[k])))
      fail('Complete todas las fechas del calendario.')
    if (!(
      c.registrationStart < c.registrationEnd &&
      c.registrationEnd <= c.campaignStart &&
      c.campaignStart < c.campaignEnd &&
      c.campaignEnd <= c.open &&
      c.rollClose < c.open &&
      c.open < c.close
    ))
      fail(
        'Calendario inválido: inscripción → campaña → votación; cierre del padrón anterior a apertura.',
      )
    try {
      new Intl.DateTimeFormat('es', { timeZone: c.timezone }).format()
    } catch {
      fail('Zona horaria inválida.')
    }
  }
  position(ctx, id, data, positionId) {
    const e = this.#election(ctx, id)
    this.#editable(ctx, e)
    const name = data.nombre?.trim()
    if (!name) fail('El nombre del puesto es obligatorio.')
    if (
      e.positions.some(
        (p) =>
          p.id !== positionId &&
          p.nombre.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    )
      fail('Ya existe un puesto con ese nombre.')
    if (positionId) {
      const p = e.positions.find((p) => p.id === positionId)
      if (!p) fail('Puesto inexistente.')
      p.nombre = name
      p.descripcion = data.descripcion?.trim() || ''
    } else
      e.positions.push({
        id: uid(),
        nombre: name,
        descripcion: data.descripcion?.trim() || '',
        activo: true,
        min: 1,
        max: 1,
        requirements: [
          'Documentación presentada',
          'Membresía activa',
          'Sin sanciones vigentes',
        ].map((nombre) => ({ id: uid(), nombre, obligatorio: true })),
      })
    this.#changed(e)
  }
  deletePosition(ctx, id, positionId) {
    const e = this.#election(ctx, id)
    this.#editable(ctx, e)
    if (!e.positions.some((p) => p.id === positionId))
      fail('Puesto inexistente.')
    e.positions = e.positions.filter((p) => p.id !== positionId)
    e.candidates = e.candidates.filter((c) => c.puestoId !== positionId)
    e.groups.forEach((g) => {
      g.enabled = false
      g.members = g.members.filter((m) => m.positionId !== positionId)
    })
    this.#changed(e)
  }
  setLimits(ctx, id, positionId, min, max) {
    const e = this.#election(ctx, id)
    this.#editable(ctx, e)
    const p = e.positions.find((p) => p.id === positionId)
    if (!p) fail('Puesto inexistente.')
    const count = e.candidates.filter(
      (c) => c.puestoId === p.id && c.enabled && c.estado === 'Habilitado',
    ).length
    if (
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min < 0 ||
      max < 1 ||
      min > max ||
      max > count
    )
      fail('Límites inválidos: 0 ≤ mínimo ≤ máximo ≤ opciones habilitadas.')
    p.min = min
    p.max = max
    this.#changed(e)
  }
  setRequirements(ctx, id, positionId, requirements) {
    const e = this.#election(ctx, id)
    this.#editable(ctx, e)
    const p = e.positions.find((p) => p.id === positionId)
    if (!p) fail('Puesto inexistente.')
    if (
      !requirements.length ||
      requirements.some(
        (r) => !r.nombre?.trim() || typeof r.obligatorio !== 'boolean',
      )
    )
      fail(
        'Defina al menos un requisito con descripción e indicador obligatorio.',
      )
    if (
      new Set(requirements.map((r) => r.nombre.trim().toLocaleLowerCase()))
        .size !== requirements.length
    )
      fail('No repita nombres de requisitos.')
    p.requirements = requirements.map((r) => ({
      id: uid(),
      nombre: r.nombre.trim(),
      obligatorio: r.obligatorio,
    }))
    e.candidates
      .filter((c) => c.puestoId === p.id && c.estado !== 'Retirado')
      .forEach((c) => {
        c.requisitos = p.requirements.map((r) => ({ ...r, cumplido: false }))
        c.estado = 'Pendiente'
        c.enabled = false
      })
    e.groups.forEach((g) => {
      g.enabled = false
    })
    this.#changed(e)
  }
  candidate(ctx, id, data, candidateId) {
    const e = this.#election(ctx, id)
    this.#editable(ctx, e)
    const p = e.positions.find((p) => p.id === data.puestoId)
    if (!data.nombreCompleto?.trim() || !data.presentacion?.trim() || !p)
      fail('Nombre, propuesta y puesto existente son obligatorios.')
    if (
      data.fotografia &&
      !/^data:image\/(png|jpeg);base64,/.test(data.fotografia)
    )
      fail('La fotografía debe ser un archivo JPG o PNG.')
    if (data.fotografia?.length > Math.ceil((5 * 1024 * 1024 * 4) / 3) + 100)
      fail('La fotografía supera 5 MB.')
    let c = e.candidates.find((c) => c.id === candidateId)
    if (candidateId && (!c || c.estado === 'Retirado'))
      fail('Candidatura no editable.')
    const ownerId = data.ownerId ?? c?.ownerId
    if (
      !this.#organizations
        .find((o) => o.id === e.orgId)
        .members.some((m) => m.id === ownerId)
    )
      fail('Seleccione la identidad del candidato en esta organización.')
    if (!c) {
      c = { id: uid(), estado: 'Pendiente', enabled: false }
      e.candidates.push(c)
    }
    if (c.puestoId !== p.id) {
      c.estado = 'Pendiente'
      c.enabled = false
      c.requisitos = p.requirements.map((r) => ({ ...r, cumplido: false }))
    }
    Object.assign(c, {
      ownerId,
      nombreCompleto: data.nombreCompleto.trim(),
      nombre: data.nombreCompleto.trim(),
      fotografia: data.fotografia || '',
      foto: data.fotografia || '',
      presentacion: data.presentacion.trim(),
      propuesta: data.presentacion.trim(),
      puestoId: p.id,
      agrupacion: data.agrupacion?.trim() || c.agrupacion || 'Independiente',
    })
    e.groups.forEach((g) => {
      if (g.members.some((m) => m.candidateId === c.id)) g.enabled = false
    })
    this.#changed(e)
  }
  requirement(ctx, id, candidateId, name, value) {
    const e = this.#election(ctx, id)
    this.#editable(ctx, e)
    const c = e.candidates.find(
        (c) => c.id === candidateId && c.estado !== 'Retirado',
      ),
      r = c?.requisitos.find((r) => r.nombre === name)
    if (!r) fail('Requisito inexistente.')
    r.cumplido = Boolean(value)
    if (c.requisitos.some((r) => r.obligatorio && !r.cumplido)) {
      c.estado = 'Pendiente'
      c.enabled = false
      e.groups.forEach((g) => {
        if (g.members.some((m) => m.candidateId === c.id)) g.enabled = false
      })
    }
    this.#changed(e)
  }
  enableCandidate(ctx, id, candidateId) {
    const e = this.#election(ctx, id)
    this.#editable(ctx, e)
    const c = e.candidates.find(
      (c) => c.id === candidateId && c.estado !== 'Retirado',
    )
    if (
      !c ||
      !c.requisitos.length ||
      c.requisitos.some((r) => r.obligatorio && !r.cumplido)
    )
      fail('La candidatura tiene requisitos obligatorios pendientes.')
    c.estado = 'Habilitado'
    c.enabled = e.mode === 'POR_PUESTOS'
    this.#changed(e)
  }
  withdraw(ctx, id, candidateId) {
    const e = this.#election(ctx, id)
    this.#editable(ctx, e)
    const c = e.candidates.find((c) => c.id === candidateId)
    if (!c) fail('Candidatura inexistente.')
    c.estado = 'Retirado'
    c.enabled = false
    e.groups.forEach((g) => {
      if (g.members.some((m) => m.candidateId === c.id)) g.enabled = false
    })
    this.#changed(e)
  }
  option(ctx, id, optionId, enabled) {
    const e = this.#election(ctx, id)
    this.#editable(ctx, e)
    const o = (e.mode === 'POR_PUESTOS' ? e.candidates : e.groups).find(
      (o) => o.id === optionId,
    )
    if (!o) fail('Opción inexistente.')
    if (enabled && e.mode === 'POR_PUESTOS' && o.estado !== 'Habilitado')
      fail('Candidatura no habilitada.')
    if (enabled && e.mode === 'POR_GRUPOS') this.#validateGroup(e, o)
    o.enabled = Boolean(enabled)
    this.#changed(e)
  }
  group(ctx, id, name, members) {
    const e = this.#election(ctx, id)
    this.#editable(ctx, e)
    if (e.mode !== 'POR_GRUPOS' || !name.trim())
      fail('Seleccione modalidad por grupos e indique un nombre.')
    const g = {
      id: uid(),
      name: name.trim(),
      members: copy(members),
      enabled: false,
    }
    this.#validateGroup(e, g)
    e.groups.push(g)
    this.#changed(e)
  }
  #validateGroup(e, g) {
    if (
      !e.positions.length ||
      g.members.length !== e.positions.length ||
      new Set(g.members.map((m) => m.positionId)).size !== e.positions.length
    )
      fail('El grupo requiere exactamente una candidatura por puesto.')
    for (const p of e.positions) {
      const m = g.members.find((m) => m.positionId === p.id)
      if (
        !e.candidates.some(
          (c) =>
            c.id === m?.candidateId &&
            c.puestoId === p.id &&
            c.estado === 'Habilitado',
        )
      )
        fail('El grupo contiene una candidatura inválida o no habilitada.')
    }
  }
  setAdmins(ctx, id, admins) {
    const e = this.#election(ctx, id)
    this.#editable(ctx, e)
    const members = this.#organizations.find((o) => o.id === e.orgId).members
    if (
      !admins.length ||
      new Set(admins).size !== admins.length ||
      admins.some((id) => !members.some((m) => m.id === id && m.canAdmin))
    )
      fail('Seleccione al menos un administrador disponible sin duplicados.')
    e.admins = [...admins]
    this.#changed(e)
  }
  setRoll(ctx, id, roll) {
    const e = this.#election(ctx, id)
    this.#editable(ctx, e)
    if (this.#now() >= e.calendar.rollClose)
      fail('PADRON_CERRADO: no se admiten cambios.')
    const members = this.#organizations.find((o) => o.id === e.orgId).members
    if (
      new Set(roll.map((r) => r.userId)).size !== roll.length ||
      roll.some((r) => !members.some((m) => m.id === r.userId))
    )
      fail('Electores ajenos o duplicados en el padrón.')
    if (
      roll.some(
        (r) =>
          !positive(r.weight) ||
          !Number.isSafeInteger(Math.round(Number(r.weight) * 1000)),
      )
    )
      fail('Los pesos deben ser positivos, con hasta tres decimales.')
    if (
      roll.some(
        (r) =>
          Math.abs(
            Number(r.weight) * 1000 - Math.round(Number(r.weight) * 1000),
          ) > 1e-7,
      )
    )
      fail('Máximo tres decimales por peso.')
    e.roll = roll.map((r) => ({ userId: r.userId, weight: Number(r.weight) }))
    this.#changed(e)
  }
  #ballots(e) {
    if (e.mode === 'POR_GRUPOS')
      return [
        {
          id: 'grupos',
          name: 'Papeletas de grupos',
          min: 1,
          max: 1,
          options: e.groups
            .filter((g) => g.enabled)
            .map((g) => ({
              id: g.id,
              nombre: g.name,
              propuesta: g.members
                .map(
                  (m) =>
                    `${e.positions.find((p) => p.id === m.positionId)?.nombre}: ${e.candidates.find((c) => c.id === m.candidateId)?.nombre}`,
                )
                .join(' · '),
              agrupacion: g.name,
            })),
        },
      ]
    return e.positions.map((p) => ({
      id: p.id,
      name: p.nombre,
      min: p.min,
      max: p.max,
      options: e.candidates.filter(
        (c) => c.puestoId === p.id && c.enabled && c.estado === 'Habilitado',
      ),
    }))
  }
  publicationErrors(ctx, id) {
    const e = this.#election(ctx, id)
    this.#admin(ctx, e)
    const errors = []
    try {
      this.#validateCalendar(e.calendar)
    } catch (err) {
      errors.push(err.message)
    }
    if (this.#now() >= e.calendar.open)
      errors.push('La apertura debe ser futura.')
    if (!e.roll.length) errors.push('El padrón está vacío.')
    if (!e.positions.length) errors.push('Faltan puestos.')
    if (!e.admins.length) errors.push('Falta tribunal.')
    if (e.weighting === 'PONDERADO' && e.roll.some((r) => !positive(r.weight)))
      errors.push('Hay pesos inválidos.')
    for (const b of this.#ballots(e))
      if (
        !b.options.length ||
        b.min < 0 ||
        b.max < 1 ||
        b.min > b.max ||
        b.max > b.options.length
      )
        errors.push(`Opciones o límites inválidos: ${b.name}.`)
    if (e.mode === 'POR_GRUPOS')
      for (const g of e.groups.filter((g) => g.enabled))
        try {
          this.#validateGroup(e, g)
        } catch (err) {
          errors.push(err.message)
        }
    return errors
  }
  publish(ctx, id) {
    const e = this.#election(ctx, id)
    this.#editable(ctx, e)
    const errors = this.publicationErrors(ctx, id)
    if (errors.length) fail(errors.join('\n'))
    e.order = Object.fromEntries(
      this.#ballots(e).map((b) => [b.id, shuffle(b.options.map((o) => o.id))]),
    )
    e.status = 'PUBLICADO'
    e.version++
  }
  start(ctx, id) {
    const e = this.#election(ctx, id)
    this.#admin(ctx, e)
    if (this.phase(e) !== 'PROGRAMADO')
      fail('Publique primero un proceso programado.')
    // Adelanto explícito de calendario para la demostración, nunca revierte una jornada.
    const now = this.#now()
    if (e.calendar.campaignStart >= now)
      fail('La campaña debe haber comenzado antes de adelantar la apertura.')
    e.calendar.campaignEnd = now
    e.calendar.rollClose = Math.min(e.calendar.rollClose, now - 1)
    e.calendar.open = now
    e.version++
  }
  close(ctx, id) {
    const e = this.#election(ctx, id)
    this.#admin(ctx, e)
    if (this.phase(e) !== 'ABIERTO')
      fail('Solo se puede cerrar una jornada abierta.')
    e.calendar.close = this.#now()
    e.status = 'CERRADO'
    e.version++
    for (const [token, s] of this.#sessions)
      if (s.electionId === id) this.#sessions.delete(token)
  }
  ballots(ctx, id) {
    const e = this.#election(ctx, id)
    return copy(
      this.#ballots(e).map((b) => ({
        ...b,
        options: e.order[b.id]
          ? e.order[b.id]
              .map((id) => b.options.find((o) => o.id === id))
              .filter(Boolean)
          : b.options,
      })),
    )
  }
  begin(ctx, id) {
    const e = this.#election(ctx, id)
    this.#active(e)
    if (
      this.#now() < e.calendar.rollClose ||
      !e.roll.some((r) => r.userId === ctx.userId)
    )
      fail('NO_HABILITADO: elector ausente del padrón cerrado.')
    if (e.participation.has(ctx.userId))
      fail('YA_EMITIDO: ya participó en este proceso.')
    const existing = [...this.#sessions].find(
      ([, s]) =>
        s.orgId === ctx.orgId &&
        s.userId === ctx.userId &&
        s.electionId === id &&
        s.expires > this.#now(),
    )
    if (existing) return { token: existing[0], expires: existing[1].expires }
    const token = uid(),
      expires = Math.min(
        this.#now() + e.sessionSeconds * 1000,
        e.calendar.close,
      )
    this.#sessions.set(token, { ...copy(ctx), electionId: id, expires })
    return { token, expires }
  }
  emit(ctx, id, token, selections) {
    const e = this.#election(ctx, id)
    this.#active(e)
    if (e.participation.has(ctx.userId))
      fail('YA_EMITIDO: ya participó en este proceso.')
    const session = this.#sessions.get(token)
    if (!session || session.expires <= this.#now()) {
      this.#sessions.delete(token)
      fail('SESION_VENCIDA: vuelva a ingresar si la jornada continúa abierta.')
    }
    if (
      session.orgId !== ctx.orgId ||
      session.userId !== ctx.userId ||
      session.electionId !== id
    )
      fail('ACCESO_DENEGADO: sesión ajena al elector o proceso.')
    const elector = e.roll.find((r) => r.userId === ctx.userId)
    if (!elector || this.#now() < e.calendar.rollClose)
      fail('NO_HABILITADO: padrón no válido.')
    const ballots = this.#ballots(e)
    if (
      !selections ||
      Object.keys(selections).length !== ballots.length ||
      ballots.some((b) => !Object.hasOwn(selections, b.id))
    )
      fail('PAPELETA_INVALIDA: incluya todas las papeletas del proceso.')
    const pending = []
    for (const b of ballots) {
      const selected = selections[b.id]
      if (
        !Array.isArray(selected) ||
        selected.length < b.min ||
        selected.length > b.max ||
        new Set(selected).size !== selected.length ||
        selected.some((id) => !b.options.some((o) => o.id === id))
      )
        fail(`PAPELETA_INVALIDA: revise las opciones y límites de ${b.name}.`)
      pending.push({
        ballotId: b.id,
        choices: [...selected],
        weight: e.weighting === 'IGUALITARIO' ? 1 : elector.weight,
      })
    }
    // Preparar todas las estructuras antes de reemplazar el estado. No guardar identidad ni timestamp en votos.
    const votes = shuffle([...e.votes, ...pending]),
      participation = new Set(e.participation)
    participation.add(ctx.userId)
    e.votes = votes
    e.participation = participation
    for (const [key, s] of this.#sessions)
      if (s.electionId === id && s.userId === ctx.userId)
        this.#sessions.delete(key)
    return { status: 'VOTO_REGISTRADO', electionId: id }
  }
  results(ctx, id) {
    const e = this.#election(ctx, id)
    if (this.phase(e) !== 'CERRADO')
      fail('RESULTADOS_NO_DISPONIBLES: espere al cierre electoral.')
    const ballots = this.#ballots(e).map((b) => {
      const votes = e.votes.filter((v) => v.ballotId === b.id)
      const rows = b.options.map((o) => ({
        id: o.id,
        name: o.nombre,
        votes: votes.filter((v) => v.choices.includes(o.id)).length,
        weight:
          votes
            .filter((v) => v.choices.includes(o.id))
            .reduce((n, v) => n + Math.round(v.weight * 1000), 0) / 1000,
      }))
      const max = Math.max(0, ...rows.map((r) => r.weight)),
        leaders =
          max > 0 ? rows.filter((r) => r.weight === max).map((r) => r.name) : []
      return {
        id: b.id,
        name: b.name,
        rows,
        blank: votes.filter((v) => !v.choices.length).length,
        tie: leaders.length > 1,
        leaders,
      }
    })
    return {
      name: e.name,
      eligible: e.roll.length,
      participation: e.participation.size,
      abstentions: e.roll.length - e.participation.size,
      weighting: e.weighting,
      ballots,
    }
  }
  #campaign(ctx, id) {
    const e = this.#election(ctx, id)
    if (
      e.status !== 'PUBLICADO' ||
      this.#now() < e.calendar.campaignStart ||
      this.#now() >= e.calendar.campaignEnd
    )
      fail('La campaña no admite publicaciones o consultas en este momento.')
    return e
  }
  post(ctx, id, candidateId, text, media) {
    const e = this.#campaign(ctx, id),
      c = e.candidates.find(
        (c) =>
          c.id === candidateId &&
          c.ownerId === ctx.userId &&
          c.estado === 'Habilitado',
      )
    if (!c)
      fail('Solo puede publicar el candidato habilitado desde su identidad.')
    if (!text.trim()) fail('La propuesta debe contener texto.')
    if (
      media &&
      (!/^(image\/(jpeg|png)|video\/(mp4|webm))$/.test(media.type) ||
        !media.url.startsWith(`data:${media.type};base64,`) ||
        media.url.length > Math.ceil((25 * 1024 * 1024 * 4) / 3) + 100)
    )
      fail('Adjunto inválido o mayor de 25 MB.')
    e.posts.unshift({
      id: uid(),
      candidateId,
      text: text.trim(),
      media: media ? copy(media) : null,
      questions: [],
    })
  }
  question(ctx, id, postId, text) {
    const e = this.#campaign(ctx, id),
      p = e.posts.find((p) => p.id === postId)
    if (!e.roll.some((r) => r.userId === ctx.userId) || !p || !text.trim())
      fail('Consulta inválida o elector fuera del padrón.')
    p.questions.push({
      id: uid(),
      text: text.trim(),
      author: this.#member(ctx).name,
      answer: '',
    })
  }
  answer(ctx, id, postId, questionId, text) {
    const e = this.#campaign(ctx, id),
      p = e.posts.find((p) => p.id === postId),
      c = e.candidates.find((c) => c.id === p?.candidateId)
    if (c?.ownerId !== ctx.userId || !text.trim())
      fail('Solo el candidato autor puede responder.')
    const q = p.questions.find((q) => q.id === questionId)
    if (!q) fail('Consulta inexistente.')
    q.answer = text.trim()
  }
}
