import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
const tmp = mkdtempSync(path.join(os.tmpdir(),'voto-json-test-'))
process.env.VOTO_JSON_DB = path.join(tmp,'database.json')
const {createInitialDatabase,demoElectors,demoAdmin} = await import('../server/seed.js')
const {saveDatabase,loadDatabase} = await import('../server/store.js')
const {createApi,ApiError} = await import('../server/api.js')
const handle=createApi()
const org='eleccion-demo'
function reset(){saveDatabase(createInitialDatabase())}
test.after(()=>rmSync(tmp,{recursive:true,force:true}))
test('guarda y carga la base JSON sin usar Firebase',()=>{
 reset();const db=loadDatabase();assert.equal(db.electors.length,10);assert.equal(db.votes.length,0);assert.ok(!readFileSync(process.env.VOTO_JSON_DB,'utf8').includes('A91B2C3D4E5F60718293ABCD'))
})
test('votante valida cédula más código electoral, no solo cédula',()=>{
 reset();assert.throws(()=>handle('startCedulaVoting',{electionId:org,cedula:demoElectors[0][0],credential:'CODIGOERRONEO1234567890'}),/incorrectos/)
 const s=handle('startCedulaVoting',{electionId:org,cedula:demoElectors[0][0],credential:demoElectors[0][2]});assert.match(s.token,/^[a-f0-9]{64}$/)
})
test('emisión persiste y bloquea voto duplicado, sin identidad en papeletas',()=>{
 reset();const [cedula, , credential]=demoElectors[0];const session=handle('startCedulaVoting',{electionId:org,cedula,credential});const options=loadDatabase().elections[0].ballots
 const selections=Object.fromEntries(options.map(b=>[b.id,[b.options[0].id]]))
 assert.equal(handle('castCedulaVote',{electionId:org,sessionToken:session.token,selections}).status,'VOTO_REGISTRADO')
 const state=loadDatabase();assert.equal(state.participation.length,1);assert.equal(state.votes.length,2)
 for(const paper of state.votes){assert.equal(paper.electorId,undefined);assert.equal(paper.cedula,undefined);assert.equal(paper.sessionToken,undefined)}
 assert.throws(()=>handle('castCedulaVote',{electionId:org,sessionToken:session.token,selections}),/SESION_VENCIDA/)
 assert.throws(()=>handle('startCedulaVoting',{electionId:org,cedula,credential}),/YA_EMITIDO/)
})
test('rechaza papeleta inválida sin registrar participación parcial',()=>{
 reset();const [cedula,,credential]=demoElectors[1];const s=handle('startCedulaVoting',{electionId:org,cedula,credential})
 assert.throws(()=>handle('castCedulaVote',{electionId:org,sessionToken:s.token,selections:{presidencia:['noexiste'],tesoreria:['cand-4']}}),/Papeleta inválida/)
 assert.equal(loadDatabase().votes.length,0);assert.equal(loadDatabase().participation.length,0)
})
test('gestión exige credenciales; edición de una elección en borrador se guarda',()=>{
 reset();assert.throws(()=>handle('getPortal'),/Acceso de gestión no autorizado/)
 assert.throws(()=>handle('adminLogin',{email:demoAdmin.email,password:'incorrecta'}),/incorrectos/)
 const r=handle('adminLogin',demoAdmin);const cookie=r.__cookie.split(';')[0];const ctx={cookie}
 assert.equal(handle('getPortal',{},ctx).user.role,'tribunal')
 const e=handle('getElection',{electionId:'borrador-demo'},ctx)
 assert.equal(e.phase,'BORRADOR')
 const ans=handle('adminConfigureElection',{electionId:e.id,name:'Nueva elección',purpose:'Revisión académica',openAt:Date.now()+2*86400000,closeAt:Date.now()+3*86400000,sessionSeconds:180,weighting:'IGUALITARIO',ballots:e.ballots},ctx)
 assert.equal(ans.status,'BORRADOR');assert.equal(loadDatabase().elections.find(x=>x.id===e.id).name,'Nueva elección')
 assert.equal(handle('adminPublish',{electionId:e.id},ctx).status,'PUBLICADO')
 assert.equal(handle('adminLogout',{},ctx).ok,true)
 assert.throws(()=>handle('getPortal',{},ctx),/Acceso de gestión/)
})
test('oculta resultados antes del cierre; acta permanece estable tras cierre',()=>{
 reset();assert.throws(()=>handle('getPublicResults',{electionId:org}),/RESULTADOS_NO_DISPONIBLES/)
 const db=loadDatabase();const e=db.elections.find(x=>x.id===org);e.closeAt=Date.now()-1;saveDatabase(db)
 const act=handle('getPublicResults',{electionId:org});assert.equal(act.status,'FINALIZADO');assert.equal(act.eligible,10);assert.equal(act.participation,0)
 assert.equal(loadDatabase().acts.length,1);assert.deepEqual(handle('getPublicResults',{electionId:org}),act);assert.equal(loadDatabase().acts.length,1)
})
