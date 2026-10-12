export function createSeed(now = Date.now()) {
  const names = [
    'Ana Rodríguez',
    'Luis Fernández',
    'Mariana Solano',
    'Diego Vargas',
    'Sofía Mora',
    'Carlos Jiménez',
    'Valeria Castro',
    'Andrés Chaves',
    'Daniela Rojas',
    'Gabriel Núñez',
  ]
  const proposals = [
    'Digitalizar trámites y ampliar la comunicación.',
    'Publicar informes de gestión y rendición de cuentas.',
    'Mejorar la atención a las personas asociadas.',
    'Organizar capacitaciones y becas de formación.',
    'Promover la participación de todas las sedes.',
    'Presentar presupuestos participativos.',
    'Revisar gastos y publicar balances periódicos.',
    'Financiar proyectos comunitarios.',
    'Establecer un fondo de apoyo solidario.',
    'Modernizar los procesos de tesorería.',
  ]
  const orgs = ['Asociación Horizonte', 'Cooperativa Bosque'].map(
    (name, index) => ({
      id: `org-${index + 1}`,
      name,
      members: [
        {
          id: `o${index}-admin1`,
          name: 'Tribunal · Coordinación',
          canAdmin: true,
        },
        {
          id: `o${index}-admin2`,
          name: 'Tribunal · Secretaría',
          canAdmin: true,
          canAudit: true,
        },
        ...names.map((name, n) => ({
          id: `o${index}-elector${n + 1}`,
          name,
          canAdmin: false,
        })),
      ],
    }),
  )
  const elections = orgs.map((org, index) => {
    const prefix = `o${index}`,
      day = 86400000
    const positions = ['Presidencia', 'Tesorería'].map((nombre, i) => ({
      id: `${prefix}-puesto${i}`,
      nombre,
      descripcion: i
        ? 'Administración de los recursos de la organización.'
        : 'Representación de las personas asociadas.',
      activo: true,
      min: 1,
      max: 1,
      requirements: [
        'Documentación presentada',
        'Membresía activa',
        'Sin sanciones vigentes',
      ].map((nombre, r) => ({
        id: `${prefix}-r${i}-${r}`,
        nombre,
        obligatorio: true,
      })),
    }))
    const candidates = names.map((nombre, n) => ({
      id: `${prefix}-c${n}`,
      ownerId: `${prefix}-elector${n + 1}`,
      nombre,
      nombreCompleto: nombre,
      propuesta: proposals[n],
      presentacion: proposals[n],
      fotografia: '',
      foto: '',
      agrupacion: ['Renovación', 'Unidad', 'Avance', 'Encuentro', 'Futuro'][
        n % 5
      ],
      biografia: '', // Información no proporcionada: no inventar trayectorias de candidatos.
      puestoId: positions[n < 5 ? 0 : 1].id,
      estado: 'Habilitado',
      verificacion: 'Aprobado',
      enabled: true,
      requisitos: positions[n < 5 ? 0 : 1].requirements.map((r) => ({
        ...r,
        cumplido: true,
      })),
    }))
    return {
      id: `${prefix}-eleccion`,
      orgId: org.id,
      name: 'Junta directiva 2026',
      purpose: 'Elegir la presidencia y tesorería de la organización.',
      status: 'BORRADOR',
      mode: 'POR_PUESTOS',
      weighting: 'IGUALITARIO',
      sessionSeconds: 180,
      admins: org.members.filter((m) => m.canAdmin).map((m) => m.id),
      positions,
      candidates,
      groups: [],
      roll: org.members
        .filter((m) => !m.canAdmin)
        .map((m, n) => ({ userId: m.id, weight: (n % 3) + 1 })),
      calendar: {
        registrationStart: now - 5 * day,
        registrationEnd: now - 3 * day,
        campaignStart: now - 2 * day,
        campaignEnd: now + day,
        rollClose: now + day - 60000,
        open: now + day + 60000,
        close: now + 2 * day,
        timezone: 'America/Costa_Rica',
      },
      posts: candidates.map((c) => ({
        id: `${c.id}-post`,
        candidateId: c.id,
        text: c.propuesta,
        media: null,
        questions: [],
      })),
    }
  })
  return { organizations: orgs, elections }
}
