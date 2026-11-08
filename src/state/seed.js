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
  const biographies = [
    'Ana disfruta organizar encuentros donde las personas puedan compartir ideas y aprender unas de otras. Ha colaborado en actividades vecinales y en iniciativas de comunicación interna, procurando que la información llegue con claridad. En su tiempo libre le interesan la lectura, los espacios culturales y las formas sencillas de fortalecer la colaboración cotidiana.',
    'Luis participa con frecuencia en actividades de apoyo organizativo y en reuniones comunitarias. Le interesa comprender cómo se administran los recursos colectivos y promover conversaciones claras sobre las decisiones comunes. Fuera de esas tareas, disfruta caminar por espacios naturales, compartir con sus amistades y aprender herramientas prácticas para trabajar en equipo.',
    'Mariana se ha involucrado en jornadas de convivencia y en espacios de escucha para personas asociadas. Le interesa que distintas generaciones encuentren maneras cómodas de participar y proponer mejoras. También disfruta la jardinería, la lectura y colaborar en actividades culturales que ayudan a crear vínculos duraderos dentro de su comunidad.',
    'Diego suele apoyar la coordinación de actividades y la preparación de materiales para reuniones organizativas. Le interesa que los procesos sean comprensibles y que las personas puedan aportar con confianza. En sus ratos libres disfruta aprender sobre oficios, participar en iniciativas barriales y conversar sobre ideas que facilitan la cooperación.',
    'Sofía ha colaborado en actividades recreativas y encuentros de intercambio entre integrantes de su comunidad. Le interesa crear espacios acogedores donde las propuestas se escuchen con respeto. Disfruta la música, las caminatas y compartir conocimientos útiles, especialmente cuando una actividad permite que más personas se involucren de manera voluntaria.',
    'Carlos participa en labores de apoyo durante reuniones y actividades colectivas, desde la organización del espacio hasta la coordinación entre equipos. Le interesa mejorar la comunicación y aprender de experiencias diversas. En su tiempo libre disfruta cocinar, practicar actividades al aire libre y colaborar en proyectos que reúnen a personas con intereses compartidos.',
    'Valeria ha acompañado iniciativas de aprendizaje y colaboración entre personas asociadas. Le interesa que las actividades organizativas sean accesibles y que cada persona encuentre una forma de contribuir. También disfruta las artes manuales, conocer nuevas perspectivas y apoyar encuentros comunitarios donde se comparten habilidades y se fortalecen relaciones de confianza.',
    'Andrés acostumbra colaborar en actividades de planificación y en espacios de conversación comunitaria. Le interesan la organización participativa, el intercambio de conocimientos y el cuidado de los recursos compartidos. Fuera de las reuniones disfruta la fotografía de paisajes, las caminatas y ayudar a coordinar actividades sencillas entre personas vecinas.',
    'Daniela ha participado en iniciativas de convivencia y en equipos voluntarios que preparan actividades para la comunidad. Le interesa promover la escucha y el aprendizaje colectivo, especialmente entre personas con experiencias distintas. Disfruta leer, visitar espacios naturales y apoyar propuestas culturales que invitan a compartir de manera cercana.',
    'Gabriel colabora en tareas de organización y apoyo logístico para actividades colectivas. Le interesa facilitar que las reuniones sean productivas y que las ideas se conviertan en acuerdos claros. En sus ratos libres disfruta la música, los proyectos de reparación y participar en iniciativas comunitarias centradas en el bienestar compartido.',
  ]
  const portraits = [
    '/candidates/ana-rodriguez.svg',
    '/candidates/luis-fernandez.svg',
    '/candidates/mariana-solano.svg',
    '/candidates/diego-vargas.svg',
    '/candidates/sofia-mora.svg',
    '/candidates/carlos-jimenez.svg',
    '/candidates/valeria-castro.svg',
    '/candidates/andres-chaves.svg',
    '/candidates/daniela-rojas.svg',
    '/candidates/gabriel-nunez.svg',
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
      fotografia: portraits[n],
      foto: portraits[n],
      fotografiaTipo: 'AVATAR_SVG',
      agrupacion: ['Renovación', 'Unidad', 'Avance', 'Encuentro', 'Futuro'][
        n % 5
      ],
      biografia: biographies[n],
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
        .map((m) => ({ userId: m.id, weight: 1 })),
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
