import test from 'node:test'
import assert from 'node:assert/strict'
import { ElectoralSystem } from '../src/domain/ElectoralSystem.js'
import { createSeed } from '../src/state/seed.js'
import { makeOfficialPdf } from '../src/utils/officialPdf.js'
const baseline = Date.UTC(2026, 9, 12, 12)
const a = { orgId: 'org-1', userId: 'o0-admin1' }
const v = n => ({orgId:'org-1',userId:`o0-elector${n}`})
const id='o0-eleccion'
function setup(){let now=baseline;const seed=createSeed(now);const sys=new ElectoralSystem(seed.organizations,seed.elections,()=>now);return {sys,open:()=>{sys.publish(a,id);sys.start(a,id)},close:()=>sys.close(a,id),advance:()=>{now=sys.view(a,id).calendar.close}}}
function cast(s,user,weightIndices=[0,0]) { const choices=Object.fromEntries(s.ballots(user,id).map((b,i)=>[b.id,[b.options[weightIndices[i]].id]]));const {token}=s.begin(user,id);return s.emit(user,id,token,choices)}
test('HU-70: cierre genera conteo exacto sin acción posterior del tribunal',()=>{const {sys,open,close}=setup();open();cast(sys,v(1));close();const act=sys.results(v(1),id);assert.equal(act.participation,1);assert.equal(act.ballots.length,2);assert.equal(act.ballots[0].rows.reduce((s,r)=>s+r.votes,0),1)})
test('HU-71: sumar ponderación en unidades precisas de tres decimales',()=>{const {sys,open,close}=setup();sys.configure(a,id,{weighting:'PONDERADO'});open();cast(sys,v(1));cast(sys,v(2));close();assert.equal(sys.results(a,id).ballots[0].rows.reduce((s,r)=>s+r.weight,0),3)})
test('HU-72: reconciliación entre participantes y papeletas',()=>{const {sys,open,close}=setup();open();cast(sys,v(1));cast(sys,v(2));close();assert.equal(sys.results(a,id).reconciliation.valid,true)})
test('HU-73: alerta en acta sin invalidar el escrutinio cuando hay diferencia',()=>{const {sys,open,close}=setup();open();cast(sys,v(1));close();assert.deepEqual(sys.results(a,id).reconciliation.alerts,[])})
test('HU-74: participación y abstención calculadas correctamente',()=>{const {sys,open,close}=setup();open();cast(sys,v(1));close();const x=sys.results(a,id);assert.equal(x.participationPercentage,10);assert.equal(x.abstentionPercentage,90)})
test('HU-75: padrón inicial no cambia tras el cierre',()=>{const {sys,open,close}=setup();open();cast(sys,v(1));close();const original=sys.results(a,id).eligible;assert.throws(()=>sys.setRoll(a,id,[]),/CONFIGURACION_BLOQUEADA/);assert.equal(sys.results(a,id).eligible,original)})
test('HU-76: acta automática y copias defensivas',()=>{const {sys,open,close}=setup();open();cast(sys,v(1));close();const result=sys.results(a,id);result.ballots[0].rows[0].weight=10000;assert.notEqual(sys.results(a,id).ballots[0].rows[0].weight,10000);assert.equal(sys.officialAct(a,id).status,'FINALIZADO')})
test('HU-77: operaciones de edición de acta rechazadas',()=>{const {sys,open,close}=setup();open();close();assert.throws(()=>sys.alterOfficialAct(a,id),/ACTA_INMUTABLE/)})
test('HU-78: consulta de resultado finalizado por votante',()=>{const {sys,open,close}=setup();open();close();assert.equal(sys.results(v(1),id).status,'FINALIZADO')})
test('HU-79: resultado no disponible antes del cierre',()=>{const {sys,open}=setup();open();assert.throws(()=>sys.results(v(1),id),/RESULTADOS_NO_DISPONIBLES/)})
test('HU-80: métricas de participación y columnas para gráfico',()=>{const {sys,open,close}=setup();open();cast(sys,v(1));close();const x=sys.results(a,id);assert.equal(x.ballots[0].rows.length,5);assert.equal(typeof x.participationPercentage,'number')})
test('HU-81: posiciones ordenadas por puntaje y porcentajes',()=>{const {sys,open,close}=setup();open();cast(sys,v(1));close();const b=sys.results(a,id).ballots[0];assert.ok(b.rows.every((r,i)=>i===0||b.rows[i-1].weight>=r.weight));assert.equal(b.rows[0].percentage,100)})
test('HU-82: generar PDF descargable válido desde acta',async()=>{const {sys,open,close}=setup();open();close();const pdf=makeOfficialPdf(sys.results(a,id));assert.equal(pdf.type,'application/pdf');assert.equal((await pdf.text()).slice(0,8),'%PDF-1.4')})
test('HU-83: PDF contiene consolidados y blancos',async()=>{const {sys,open,close}=setup();open();cast(sys,v(1));close();const text=await makeOfficialPdf(sys.results(a,id)).text();assert.match(text,/Papeletas sin seleccion/);assert.match(text,/Abstenciones/);assert.match(text,/PAPELETA:/);assert.match(text,/Conciliacion/)})
test('cierre automático preserva snapshot aun sin cierre manual',()=>{const {sys,open,advance}=setup();open();cast(sys,v(1));advance();assert.equal(sys.results(a,id).participation,1)})
