/** Cliente HTTP hacia data/database.json mediante el servidor local Node.js. */
async function request(method, payload = {}) {
  let response
  try {
    response = await fetch('/api/' + encodeURIComponent(method), {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    throw new Error('No se encontró el servidor de datos. Ejecute npm run dev y compruebe el puerto 8787.')
  }
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || `Error local ${response.status}`)
  return result
}
export async function localServices() {
  return { call: request, login: (email,password) => request('adminLogin',{email,password}),
    logout: () => request('adminLogout'), session: () => request('adminSession') }
}
