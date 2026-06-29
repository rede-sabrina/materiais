import returnsMock from '../data/returns.json'
import productsMock from '../data/products.json'
import usersMock from '../data/users.json'

const API_BASE = import.meta.env.VITE_API_URL || ''
const SESSION_TTL_MS = 4 * 60 * 60 * 1000

function getToken(){
	if(typeof window === 'undefined') return null
	const token = sessionStorage.getItem('token')
	const expRaw = sessionStorage.getItem('token_expires_at')
	const exp = expRaw ? Number(expRaw) : 0
	if(token && exp && Date.now() > exp){
		clearToken()
		return null
	}
	return token
}

function clearToken(){
	try{ sessionStorage.removeItem('token') } catch(e){}
	try{ sessionStorage.removeItem('token_expires_at') } catch(e){}
}

function setToken(token){
	if(typeof window === 'undefined') return
	sessionStorage.setItem('token', token)
	sessionStorage.setItem('token_expires_at', String(Date.now() + SESSION_TTL_MS))
}

async function maybeFetch(path, options){
	if(!API_BASE) return null
	const token = getToken()
	const headers = options?.headers ? {...options.headers} : {}
	if(token) headers['Authorization'] = `Bearer ${token}`
	const res = await fetch(`${API_BASE}${path}`, {...options, headers})
	if(res.status === 401){
		// token expired/invalid -> clear and redirect to login
		clearToken()
		try{ window.location.href = '/login' }catch(e){}
		throw new Error('Unauthorized')
	}
	if(!res.ok) throw new Error('API error')
	return res.json()
}

function wait(data){ return new Promise(res=>setTimeout(()=>res(data), 300)) }

export async function fetchReturns(params){
	if(!params) params = {}
	const qs = Object.keys(params).filter(k=> params[k] !== undefined && params[k] !== '').map(k=> encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&')
	const path = '/api/returns' + (qs ? ('?' + qs) : '')
	const r = await maybeFetch(path)
	return r ?? wait(returnsMock)
}

export async function fetchReturnById(id){
	const r = await maybeFetch(`/api/returns/${id}`)
	return r ?? wait(returnsMock.find(x=>String(x.id)===String(id)))
}

export async function fetchProducts(){
	const r = await maybeFetch('/api/products')
	return r ?? wait(productsMock)
}

export async function fetchUsers(){
	const r = await maybeFetch('/api/users')
	return r ?? wait(usersMock)
}

export async function fetchMe(){
	const r = await maybeFetch('/api/auth/me')
 	// fallback to first user in dev mode
	if(r) return r
	// dev helper: allow choosing a dev user via sessionStorage.devUser = 'LOJA'
	try{
		const devChoice = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('devUser') : null
		if(devChoice === 'LOJA' && Array.isArray(usersMock) && usersMock[1]) return wait(usersMock[1])
	}catch(e){}
	return wait((usersMock && usersMock[0]) || { username: 'dev', loja: 'Matriz', role: 'ADMIN' })
}

export async function fetchReportSummary(params){
	if(!API_BASE) return wait({ total: { totalValue: 0, totalCount: 0 }, byLoja: [], byDistribuidora: [] })
	const qs = params ? Object.keys(params).filter(k=> params[k] !== undefined && params[k] !== '').map(k=> encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&') : ''
	const path = '/api/reports/summary' + (qs ? ('?' + qs) : '')
	const r = await maybeFetch(path)
	return r
}

export async function fetchAuditEvents(params){
  const qs = params ? Object.keys(params).filter(k=> params[k] !== undefined && params[k] !== '').map(k=> encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&') : ''
  const path = '/api/audit' + (qs ? ('?' + qs) : '')
  const r = await maybeFetch(path)
  return r ?? wait([])
}

// ---------- Orders API ----------
export async function fetchOrders(params){
  if(!params) params = {}
  const qs = Object.keys(params).filter(k=> params[k] !== undefined && params[k] !== '').map(k=> encodeURIComponent(k)+'='+encodeURIComponent(params[k])).join('&')
  const path = '/api/orders' + (qs ? ('?'+qs) : '')
  const r = await maybeFetch(path)
  return r ?? []
}

export async function fetchOrderById(id){
  const r = await maybeFetch(`/api/orders/${id}`)
  return r ?? null
}

export async function createOrder(data){
  if(!API_BASE){
    const item = { ...data, id: Date.now(), createdAt: new Date().toISOString(), status: data.status || 'Pendente' }
    return wait(item)
  }
  const token = getToken()
  const headers = {'Content-Type':'application/json', ...(token ? {'Authorization':`Bearer ${token}`} : {}) }
  const res = await fetch(`${API_BASE}/api/orders`, { method:'POST', headers, body: JSON.stringify(data) })
  if(!res.ok) throw new Error('create order failed')
  const txt = await res.text()
  if(!txt) return {}
  try{ return JSON.parse(txt) } catch(e){ return {} }
}

export async function deleteAuditEvents(params){
	if(!API_BASE) return wait({ deleted: 0 })
	const qs = params ? Object.keys(params).filter(k=> params[k] !== undefined && params[k] !== '').map(k=> encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&') : ''
	const path = '/api/audit' + (qs ? ('?' + qs) : '')
	const token = getToken()
	const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined
	const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers })
	if(!res.ok) throw new Error('delete audit failed')
	return res.json()
}

export async function createUserAdmin({ username, password, loja, role, email, razaoSocial, cnpj, endereco, cep, numeroLoja, cidade, estado }){
	if(!API_BASE) return wait({ message: 'Usuário criado (dev)', user: { username, loja, role, email, razaoSocial, cnpj, endereco, cep, numeroLoja, cidade, estado } })
	const token = getToken()
	const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
	const res = await fetch(`${API_BASE}/api/users`, { method: 'POST', headers, body: JSON.stringify({ username, password, loja, role, email, razaoSocial, cnpj, endereco, cep, numeroLoja, cidade, estado }) })
	if(!res.ok) throw new Error('create user failed')
	return res.json()
}

export async function setUserRole(id, role){
	if(!API_BASE) return wait({ id, role })
	const token = getToken()
	const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
	const res = await fetch(`${API_BASE}/api/users/${id}/role`, { method: 'PATCH', headers, body: JSON.stringify({ role }) })
	if(!res.ok) throw new Error('set role failed')
	return res.json()
}

export async function deleteUserAdmin(id){
	if(!API_BASE) return wait({ ok: true })
	const token = getToken()
	const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined
	const res = await fetch(`${API_BASE}/api/users/${id}`, { method: 'DELETE', headers })
	if(!res.ok) throw new Error('delete user failed')
	return res.json()
}

export async function updateUserAdmin(id, patch){
  if(!API_BASE) return wait({ id, ...patch })
	const token = getToken()
 	const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
 	const res = await fetch(`${API_BASE}/api/users/${id}`, { method: 'PATCH', headers, body: JSON.stringify(patch) })
 	if(!res.ok) throw new Error('update user failed')
 	return res.json()
}

export async function uploadXML(file){
	if(!API_BASE) return wait({ok:true, name: file?.name})
	const fd = new FormData()
	fd.append('file', file)
	const token = getToken()
	const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined
	const res = await fetch(`${API_BASE}/api/uploads`, { method: 'POST', body: fd, headers })
	if(!res.ok) throw new Error('upload failed')
	return res.json()
}

export async function createReturn(data){
	if(!API_BASE){
		const item = { ...data, id: Date.now(), createdAt: new Date().toISOString(), status: data.status || 'Solicitado' }
		try{ if(Array.isArray(returnsMock)) returnsMock.unshift(item) }catch(e){}
		return wait(item)
	}
	const token = getToken()
	const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
	const res = await fetch(`${API_BASE}/api/returns`, { method: 'POST', headers, body: JSON.stringify(data) })
	if(!res.ok) throw new Error('create failed')
	// tolerate empty response bodies (some servers return 201 with no body)
	const text = await res.text()
	if(!text) return {}
	try{ return JSON.parse(text) } catch(e){ return {} }
}

export async function updateReturn(id, data){
	if(!API_BASE) return wait({ ...data, id })
	const token = getToken()
	const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
	const res = await fetch(`${API_BASE}/api/returns/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) })
	if(!res.ok) throw new Error('update failed')
	return res.json()
}

export async function updateReturnStatus(id, status){
	if(!API_BASE) return wait({ id, status })
	const token = getToken()
	const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
	const res = await fetch(`${API_BASE}/api/returns/${id}/status`, { method: 'PATCH', headers, body: JSON.stringify({ status }) })
	if(!res.ok) throw new Error('status update failed')
	return res.json()
}

export async function deleteReturn(id){
	if(!API_BASE) return wait({ ok: true })
	const token = getToken()
	const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined
	const res = await fetch(`${API_BASE}/api/returns/${id}`, { method: 'DELETE', headers })
	if(!res.ok) throw new Error('delete failed')
	return res.json()
}

export async function registerUser({ username, password, loja }){
	if(!API_BASE) return wait({ message: 'Usuário criado (dev)', user: { username, loja } })
	const res = await fetch(`${API_BASE}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, loja }) })
	if(!res.ok) throw new Error('register failed')
	return res.json()
}
