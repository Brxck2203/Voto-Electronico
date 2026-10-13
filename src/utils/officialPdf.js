/** Descarga PDF autónoma para actas del prototipo. No contiene datos personales. */
const ascii = (value) => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\x20-\x7E]/g, '-')
const escapePdf = (text) => ascii(text).replace(/[\\()]/g, '\\$&')
export function makeOfficialPdf(act) {
  if (!act || act.status !== 'FINALIZADO') throw new Error('No hay acta oficial finalizada.')
  const lines = [
    'ACTA OFICIAL DE RESULTADOS - DEMOSTRACION',
    `Eleccion: ${act.name}`,
    `Electores del padron: ${act.eligible}`,
    `Votos emitidos: ${act.participation}`,
    `Abstenciones: ${act.abstentions}`,
    `Participacion: ${act.participationPercentage}%`,
    `Abstencionismo: ${act.abstentionPercentage}%`,
    `Papeletas sin seleccion: ${act.totalBlank}`,
    `Ponderacion: ${act.weighting}`,
    `Conciliacion: ${act.reconciliation?.valid ? 'CORRECTA' : 'ALERTA'}`,
    ...(act.reconciliation?.alerts || []).map(s => `ALERTA: ${s}`),
  ]
  for (const b of act.ballots) {
    lines.push(``, `PAPELETA: ${b.name} - ${b.totalVotes} papeletas, ${b.blank} sin seleccion`)
    for (const r of b.rows) lines.push(`  ${r.name}: ${r.votes} votos / ${r.weight} puntos / ${r.percentage}%`)
  }
  lines.push('', 'Emitida para fines academicos. No constituye certificacion criptografica.')
  // PDF 1.4 valido, con tantas paginas como sea necesario.
  const pages = []
  for (let i = 0; i < lines.length; i += 44) pages.push(lines.slice(i, i + 44))
  const objects = [null]
  const add = s => { objects.push(s); return objects.length - 1 }
  const catalogId = add(''), pagesId = add('')
  const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  const pageIds = []
  for (let p = 0; p < pages.length; p++) {
    const ops = ['BT', '/F1 10 Tf', '48 790 Td', '14 TL']
    pages[p].forEach((line, index) => {
      ops.push(`(${escapePdf(line.slice(0, 110))}) Tj`)
      if (index !== pages[p].length - 1) ops.push('T*')
    })
    ops.push('ET')
    const bytes = ops.join('\n') + '\n'
    const streamId = add(`<< /Length ${bytes.length} >>\nstream\n${bytes}endstream`)
    const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${streamId} 0 R >>`)
    pageIds.push(pageId)
  }
  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`
  objects[pagesId] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(n => `${n} 0 R`).join(' ')}] >>`
  let content = '%PDF-1.4\n'
  const offsets = [0]
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = content.length
    content += `${i} 0 obj\n${objects[i]}\nendobj\n`
  }
  const startXref = content.length
  content += `xref\n0 ${objects.length}\n0000000000 65535 f \n`
  for (let i = 1; i < objects.length; i++) content += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  content += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${startXref}\n%%EOF\n`
  return new Blob([content], { type: 'application/pdf' })
}
export function downloadOfficialPdf(act) {
  const url = URL.createObjectURL(makeOfficialPdf(act))
  const a = document.createElement('a')
  a.href = url
  a.download = `Acta_Oficial_${act.electionId || 'eleccion'}.pdf`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
