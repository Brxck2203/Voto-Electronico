import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const dbPath = process.env.VOTO_JSON_DB ? path.resolve(process.env.VOTO_JSON_DB) : path.join(rootDir, 'data', 'database.json')
export const sha = (value) => createHash('sha256').update(String(value)).digest('hex')
export const cleanCedula = (value) => String(value ?? '').replace(/[\s-]/g, '')
export function passHash(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 32).toString('hex')}`
}
export function checkPassword(password, hashed = '') {
  const [salt, hex] = hashed.split(':')
  if (!salt || !/^[0-9a-f]{64}$/.test(hex || '')) return false
  const actual = scryptSync(String(password), salt, 32)
  return timingSafeEqual(actual, Buffer.from(hex, 'hex'))
}
export function loadDatabase() {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
  if (!Array.isArray(data.elections) || !Array.isArray(data.votes) || !Array.isArray(data.participation)) throw new Error('Formato de base de datos no válido.')
  return data
}
export function saveDatabase(data) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  const tmp = dbPath + '.' + process.pid + '.tmp'
  try {
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 })
    fs.renameSync(tmp, dbPath)
  } finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp) }
}
