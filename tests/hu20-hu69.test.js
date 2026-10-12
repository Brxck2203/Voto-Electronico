import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ElectoralSystem } from '../src/domain/ElectoralSystem.js'
import { createSeed } from '../src/state/seed.js'
const t0 = Date.UTC(2026, 9, 12, 12)
const A = { orgId: 'org-1', userId: 'o0-admin1' }
const B = { orgId: 'org-2', userId: 'o1-admin1' }
const V = n => ({ orgId: 'org-1', userId: `o0-elector${n}` })
const E = 'o0-eleccion'
function setup() {
  let now = t0
  const seeds = createSeed(now)
  const s = new ElectoralSystem(seeds.organizations, seeds.elections, () => now)
  return {
    s, go: ms => { now += ms },
    open: () => { s.publish(A, E); s.start(A, E) },
    tickToClose: () => { now = s.view(A,E).calendar.close },
  }
}
function ballot(s) {
  return Object.fromEntries(s.ballots(V(1), E).map(b => [b.id,[b.options[0].id]]))
}
function cast(s, n=1, selection=ballot(s)) {
  const { token } = s.begin(V(n), E)
  return s.emit(V(n), E, token, selection)
}
function grp(s) {
  const e = s.view(A,E)
  for (const c of e.candidates) s.option(A,E,c.id,false)
  s.configure(A,E,{mode:'POR_GRUPOS'})
  s.group(A,E,'Equipo Norte',e.positions.map(p=>({positionId:p.id,candidateId:e.candidates.find(c=>c.puestoId===p.id).id})))
  return s.view(A,E).groups[0]
}
// Cada prueba identifica una historia concreta de las HU-20 a HU-69.
test('HU-20: modalidad POR_PUESTOS y bloqueo por opciones habilitadas',()=>{
 const {s}=setup(); assert.equal(s.view(A,E).mode,'POR_PUESTOS')
 assert.throws(()=>s.configure(A,E,{mode:'POR_GRUPOS'}),/Deshabilite/)
 s.configure(A,E,{mode:'POR_PUESTOS'}); assert.equal(s.view(A,E).mode,'POR_PUESTOS')
})
test('HU-21: modalidad POR_GRUPOS exclusiva y valores inválidos rechazados',()=>{
 const {s}=setup(); grp(s); assert.equal(s.view(A,E).mode,'POR_GRUPOS')
 assert.throws(()=>s.configure(A,E,{mode:'AMBAS'}),/Modalidad inválida/)
 assert.equal(s.view(A,E).mode,'POR_GRUPOS')
})
test('HU-22: solo opciones habilitadas y candidaturas aprobadas',()=>{
 const {s}=setup();const c=s.view(A,E).candidates[0]
 s.reviewCandidate(A,E,c.id,'Rechazado')
 assert.throws(()=>s.option(A,E,c.id,true),/no habilitada/)
 assert.ok(!s.ballots(A,E)[0].options.some(o=>o.id===c.id))
})
test('HU-23: retirar opción de papeleta conserva candidatura y no duplica',()=>{
 const {s}=setup(); const c=s.view(A,E).candidates[0]
 s.option(A,E,c.id,false)
 assert.ok(s.view(A,E).candidates.some(x=>x.id===c.id))
 assert.ok(!s.ballots(A,E)[0].options.some(x=>x.id===c.id))
 s.option(A,E,c.id,true);s.option(A,E,c.id,true)
 assert.equal(s.ballots(A,E)[0].options.filter(x=>x.id===c.id).length,1)
})
test('HU-24: creación independiente con organización confiable y datos obligatorios',()=>{
 const {s}=setup();assert.throws(()=>s.create(A,'  ','Propósito'),/obligatorios/)
 const id=s.create(A,'Elección nueva','Otra');assert.equal(s.view(A,id).status,'BORRADOR')
 assert.equal(s.view(A,id).orgId,'org-1')
})
test('HU-25: procesos visibles solo para su organización',()=>{
 const {s}=setup();const id=s.create(A,'Otra','Prueba')
 assert.ok(s.list(A).some(x=>x.id===id));assert.ok(!s.list(B).some(x=>x.id===id))
 assert.throws(()=>s.view(B,id),/ACCESO_DENEGADO/)
})
test('HU-26: secuencia de calendario incorrecta no reemplaza configuración válida',()=>{
 const {s}=setup(),old=s.view(A,E).calendar
 assert.throws(()=>s.configure(A,E,{calendar:{...old,rollClose:old.open}}),/Calendario/)
 assert.deepEqual(s.view(A,E).calendar,old)
})
test('HU-27: calendario y zona horaria consultables',()=>{
 const {s}=setup();s.configure(A,E,{calendar:{...s.view(A,E).calendar,timezone:'UTC'}})
 assert.equal(s.view(A,E).calendar.timezone,'UTC')
 assert.ok(Number.isFinite(s.view(A,E).calendar.open))
})
test('HU-28: duración entera positiva y vencimiento antes del cierre',()=>{
 const {s,open,go}=setup();assert.throws(()=>s.configure(A,E,{sessionSeconds:1.5}),/entero positivo/)
 s.configure(A,E,{sessionSeconds:120});open();const {expires}=s.begin(V(1),E)
 assert.equal(expires,t0+120000)
})
test('HU-29: se consulta duración y no se aplica cero o negativos',()=>{
 const {s}=setup();assert.equal(s.view(A,E).sessionSeconds,180)
 assert.throws(()=>s.configure(A,E,{sessionSeconds:0}),/entero positivo/)
 assert.equal(s.view(A,E).sessionSeconds,180)
})
test('HU-30: límites válidos admiten blanco; exceso rechazado',()=>{
 const {s}=setup(),p=s.view(A,E).positions[0]
 s.setLimits(A,E,p.id,0,2);assert.equal(s.view(A,E).positions[0].min,0)
 assert.throws(()=>s.setLimits(A,E,p.id,1,99),/Límites inválidos/)
})
test('HU-31: consulta de límites relacionados con opciones habilitadas',()=>{
 const {s}=setup(),p=s.view(A,E).positions[0]
 assert.equal(p.min,1);assert.equal(p.max,1)
 s.option(A,E,s.view(A,E).candidates[0].id,false)
 assert.equal(s.ballots(A,E)[0].options.length,4)
 assert.throws(()=>s.setLimits(A,E,p.id,1,5),/opciones habilitadas/)
})
test('HU-32: esquema igualitario da peso 1, ponderado utiliza padrón',()=>{
 const {s,open}=setup();s.configure(A,E,{weighting:'PONDERADO'});open()
 cast(s,2);s.close(A,E)
 const rows=s.results(A,E).ballots[0].rows
 assert.equal(rows.reduce((acc,row)=>acc+row.weight,0),2)
})
test('HU-33: consulta del esquema y rechazo de padrones con peso no positivo',()=>{
 const {s}=setup();s.configure(A,E,{weighting:'PONDERADO'})
 assert.equal(s.view(A,E).weighting,'PONDERADO')
 assert.throws(()=>s.setRoll(A,E,[{userId:'o0-elector1',weight:0}]),/positivos/)
})
test('HU-34: composición completa y sin puestos repetidos en un grupo',()=>{
 const {s}=setup(),g=grp(s)
 assert.equal(g.members.length,2)
 assert.throws(()=>s.group(A,E,'Mal grupo',[g.members[0],g.members[0]]),/exactamente/)
 s.option(A,E,g.id,true);assert.equal(s.ballots(A,E)[0].options.length,1)
})
test('HU-35: se consulta la composición, puesto y candidatura en cada grupo',()=>{
 const {s}=setup(),g=grp(s),e=s.view(A,E)
 assert.ok(g.members.every(m=>e.positions.some(p=>p.id===m.positionId) &&
                                  e.candidates.some(c=>c.id===m.candidateId)))
})
test('HU-36: requisitos para puesto aparecen en todas las candidaturas asignadas',()=>{
 const {s}=setup(),p=s.view(A,E).positions[0]
 s.setRequirements(A,E,p.id,[{nombre:'Registro vigente',obligatorio:true}])
 assert.ok(s.view(A,E).candidates.filter(c=>c.puestoId===p.id)
  .every(c=>c.requisitos[0].nombre==='Registro vigente'&&c.estado==='Pendiente'))
})
test('HU-37: cambiar requisito requiere nueva evaluación; guardar sin cambio no la borra',()=>{
 const {s}=setup(),p=s.view(A,E).positions[0],c=s.view(A,E).candidates[0]
 s.setRequirements(A,E,p.id,p.requirements)
 assert.equal(s.view(A,E).candidates[0].estado,'Habilitado')
 s.setRequirements(A,E,p.id,[{nombre:'Nuevo',obligatorio:true}])
 assert.equal(s.view(A,E).candidates[0].verificacion,'Pendiente')
 assert.equal(s.view(A,E).candidates[0].enabled,false)
})
test('HU-38: tribunal sin duplicados, ajenos y nunca vacío',()=>{
 const {s}=setup();assert.throws(()=>s.setAdmins(A,E,[]),/al menos/)
 assert.throws(()=>s.setAdmins(A,E,['o0-admin2','o0-admin2']),/sin duplicados/)
 assert.throws(()=>s.setAdmins(A,E,['o1-admin1']),/sin duplicados/)
 s.setAdmins(A,E,['o0-admin1']);assert.equal(s.view(A,E).admins.length,1)
})
test('HU-39: tribunal consultable e independiente de otra organización',()=>{
 const {s}=setup();assert.deepEqual(s.view(A,E).admins,['o0-admin1','o0-admin2'])
 assert.throws(()=>s.view(B,E),/ACCESO_DENEGADO/)
})
test('HU-40: vista previa no produce votos ni participación; borrador nuevo indica pendientes',()=>{
 const {s}=setup(),id=s.create(A,'Nuevo','Prueba')
 assert.ok(s.view(A,id).configPending.length>0)
 s.ballots(A,id);s.ballots(A,id)
 assert.equal(s.view(A,id).participationCount,0)
 assert.equal(s.view(A,id).status,'BORRADOR')
})
test('HU-41: borrador no publicable sin confirmar datos requeridos',()=>{
 const {s}=setup(),id=s.create(A,'Nuevo','Prueba')
 assert.ok(s.publicationErrors(A,id).some(x=>x.includes('PENDIENTE')))
 const e=s.view(A,id);s.configure(A,id,{mode:e.mode,calendar:e.calendar,sessionSeconds:e.sessionSeconds,weighting:e.weighting})
 assert.ok(!s.publicationErrors(A,id).some(x=>x.includes('PENDIENTE')))
})
test('HU-42: solo configuración válida se publica y los cambios la devuelven a borrador',()=>{
 const {s}=setup();s.publish(A,E);assert.equal(s.view(A,E).status,'PUBLICADO')
 s.configure(A,E,{purpose:'Actualizado'});assert.equal(s.view(A,E).status,'BORRADOR')
})
test('HU-43: lista de fallos previa a publicar y reintento correcto',()=>{
 const {s}=setup(),c=s.view(A,E).candidates[0]
 s.option(A,E,c.id,false)
 assert.equal(s.publicationErrors(A,E).length,0)
 s.option(A,E,c.id,true)
 s.publish(A,E);assert.equal(s.view(A,E).status,'PUBLICADO')
})
test('HU-44: papeletas publicadas incluyen todas las opciones una sola vez para dos votantes',()=>{
 const {s}=setup();s.publish(A,E)
 const a=s.ballots(V(1),E),b=s.ballots(V(2),E)
 assert.deepEqual(a,b);assert.ok(a.every(x=>new Set(x.options.map(o=>o.id)).size===x.options.length))
})
test('HU-45: revisión de orden verifica permutación y versión',()=>{
 const {s}=setup();assert.throws(()=>s.verifyOrder(A,E),/Publique/)
 s.publish(A,E);assert.equal(s.verifyOrder(A,E).valid,true)
 assert.equal(s.verifyOrder(A,E).ballots.length,2)
})
test('HU-46: bloquea configuración desde instante de apertura incluso por llamada lógica',()=>{
 const {s,open}=setup();open()
 assert.throws(()=>s.configure(A,E,{name:'Inyectado'}),/CONFIGURACION_BLOQUEADA/)
})
test('HU-47: rechazos explicativos conservan la configuración anterior',()=>{
 const {s,open}=setup(),old=s.view(A,E).name;open()
 assert.throws(()=>s.configure(A,E,{name:'Cambio'}),/apertura ya fue alcanzada/)
 assert.equal(s.view(A,E).name,old)
})
test('HU-48: sesión identidad A no puede emitir usando sesión B',()=>{
 const {s,open}=setup();open()
 const b=s.begin(V(2),E);assert.throws(()=>s.emit(V(1),E,b.token,ballot(s)),/ACCESO_DENEGADO/)
 assert.equal(s.view(A,E).participationCount,0)
})
test('HU-49: elector ausente del padrón cerrado no puede ingresar',()=>{
 const {s,open}=setup();s.setRoll(A,E,s.view(A,E).roll.filter(r=>r.userId!==V(1).userId));open()
 assert.throws(()=>s.begin(V(1),E),/NO_HABILITADO/)
})
test('HU-50: rechaza emisiones antes de abrir o sin publicación',()=>{
 const {s}=setup();assert.throws(()=>s.begin(V(1),E),/FUERA_DE_PERIODO/)
 s.publish(A,E);assert.throws(()=>s.begin(V(1),E),/FUERA_DE_PERIODO/)
})
test('HU-51: el cierre impide registrar aunque el votante tenga la papeleta abierta',()=>{
 const {s,open}=setup();open();const sess=s.begin(V(1),E);s.close(A,E)
 assert.throws(()=>s.emit(V(1),E,sess.token,ballot(s)),/FUERA_DE_PERIODO/)
})
test('HU-52: falta de papeleta, duplicados o selección ajena rechazan emisión completa',()=>{
 const {s,open}=setup();open();const sess=s.begin(V(1),E),b=ballot(s),key=Object.keys(b)[0]
 assert.throws(()=>s.emit(V(1),E,sess.token,{[key]:b[key]}),/PAPELETA_INVALIDA/)
 assert.throws(()=>s.emit(V(1),E,sess.token,{...b,[key]:[b[key][0],b[key][0]]}),/PAPELETA_INVALIDA/)
 assert.equal(s.view(A,E).participationCount,0)
})
test('HU-53: error indica papeleta afectada y elector sigue NO_EMITIDO',()=>{
 const {s,open}=setup();open();const sess=s.begin(V(1),E),b=ballot(s),key=Object.keys(b)[0]
 assert.throws(()=>s.emit(V(1),E,sess.token,{...b,[key]:[]}),/revise las opciones y límites/)
 assert.equal(s.participationStatus(A,E)[0].status,'NO_EMITIDO')
})
test('HU-54: doble emisión no aumenta papeletas; segunda operación rechazada',()=>{
 const {s,open}=setup();open();const sess=s.begin(V(1),E),b=ballot(s)
 s.emit(V(1),E,sess.token,b)
 assert.throws(()=>s.emit(V(1),E,sess.token,b),/YA_EMITIDO/)
 assert.equal(s.monitor(A,E).emitted,1)
})
test('HU-55: reintento de emisión informa YA_EMITIDO sin opción elegida',()=>{
 const {s,open}=setup();open();cast(s,1)
 assert.throws(()=>s.begin(V(1),E),/YA_EMITIDO/)
 assert.equal(s.view(V(1),E).emitted,true)
})
test('HU-56: no hay método para modificar papeleta confirmada',()=>{
 const {s,open}=setup();open();cast(s,1)
 assert.equal(typeof s.modifyVote,'undefined');assert.equal(typeof s.deleteVote,'undefined')
})
test('HU-57: ni el administrador tiene interfaz lógica para editar votos',()=>{
 const {s,open}=setup();open();cast(s,1)
 assert.equal(typeof s.updateBallot,'undefined');assert.equal(typeof s.removeBallot,'undefined')
 assert.equal(s.monitor(A,E).emitted,1)
})
test('HU-58: vencimiento invalida la sesión sin marcar emisión',()=>{
 const {s,open,go}=setup();s.configure(A,E,{sessionSeconds:2});open()
 const sess=s.begin(V(1),E);go(2000)
 assert.throws(()=>s.emit(V(1),E,sess.token,ballot(s)),/SESION_VENCIDA/)
 assert.equal(s.view(A,E).participationCount,0)
})
test('HU-59: la UI muestra cronómetro y advertencia antes de expirar',()=>{
 const file=readFileSync(new URL('../src/components/Election/ProcessPages.jsx',import.meta.url),'utf8')
 assert.match(file,/role="timer"/);assert.match(file,/<= 30000/);assert.match(file,/Su sesión está por vencer/)
})
test('HU-60: reingreso abre sesión nueva, limpia selecciones del motor tras vencimiento',()=>{
 const {s,open,go}=setup();s.configure(A,E,{sessionSeconds:2});open()
 const first=s.begin(V(1),E);go(2001)
 const second=s.begin(V(1),E);assert.notEqual(first.token,second.token)
 assert.equal(s.view(V(1),E).emitted,false)
})
test('HU-61: reingreso negado si emitió o la jornada cerró',()=>{
 const {s,open}=setup();open();cast(s,1)
 assert.throws(()=>s.begin(V(1),E),/YA_EMITIDO/)
 s.close(A,E);assert.throws(()=>s.begin(V(2),E),/FUERA_DE_PERIODO/)
})
test('HU-62: acuse tras registro no contiene candidato ni identificador de papeleta',()=>{
 const {s,open}=setup();open();const receipt=cast(s,1)
 assert.deepEqual(receipt,{status:'VOTO_REGISTRADO',electionId:E})
})
test('HU-63: rechazo no retorna constancia de voto registrado',()=>{
 const {s,open}=setup();open();const sess=s.begin(V(1),E)
 assert.throws(()=>s.emit(V(1),E,sess.token,{}),/PAPELETA_INVALIDA/)
 assert.equal(s.monitor(A,E).emitted,0)
})
test('HU-64: estado individual de participación carece de selección y peso',()=>{
 const {s,open}=setup();open();cast(s,1)
 const st=s.participationStatus(A,E)
 assert.equal(st[0].status,'EMITIDO')
 assert.deepEqual(Object.keys(st[0]),['electorId','name','status'])
 assert.throws(()=>s.participationStatus(V(1),E),/ACCESO_DENEGADO/)
})
test('HU-65: auditoría inspecciona solo los esquemas aislados, no papeletas',()=>{
 const {s}=setup(),audit=s.auditStructure(A,E)
 assert.equal(audit.sharedIndividualIdentifier,false)
 assert.ok(!audit.ballotFields.includes('elector'))
 assert.ok(!audit.participationFields.includes('opciones'))
 assert.throws(()=>s.auditStructure(V(1),E),/ACCESO_DENEGADO/)
})
test('HU-66: un administrador de otra organización no puede leer ni modificar procesos',()=>{
 const {s}=setup()
 assert.throws(()=>s.view(B,E),/ACCESO_DENEGADO/)
 assert.throws(()=>s.configure(B,E,{name:'Atacada'}),/ACCESO_DENEGADO/)
})
test('HU-67: contexto activo gobierna operaciones, no permite cruzar organización',()=>{
 const {s}=setup()
 assert.throws(()=>s.ballots({orgId:'org-2',userId:'o0-admin1'},E),/ACCESO_DENEGADO/)
 assert.throws(()=>s.results({orgId:'org-1',userId:'o1-admin1'},E),/ACCESO_DENEGADO/)
})
test('HU-68: las preferencias no aparecen hasta el cierre',()=>{
 const {s,open}=setup();open();cast(s,1)
 assert.throws(()=>s.results(A,E),/RESULTADOS_NO_DISPONIBLES/)
 assert.equal(s.monitor(A,E).emitted,1)
 s.close(A,E);assert.equal(s.results(A,E).participation,1)
})
test('HU-69: monitor devuelve solo agregados, sin candidatos ni pesos',()=>{
 const {s,open}=setup();open();cast(s,1)
 assert.deepEqual(s.monitor(A,E),{eligible:10,emitted:1,pending:9})
 assert.throws(()=>s.monitor(V(2),E),/ACCESO_DENEGADO/)
})
