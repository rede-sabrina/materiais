import { getAllUsers, addUser, updateUserRole as svcUpdateRole, deleteUser as svcDeleteUser } from '../services/users.service.js'
import bcrypt from 'bcryptjs'
import { updateUser as svcUpdateUser } from '../services/users.service.js'

export async function listUsers(req, res, next){
  try{
    const users = await getAllUsers()
    res.json(users)
  } catch(err){ next(err) }
}

export async function createUser(req, res, next){
  try{
    const { username, password, loja, role, email, razaoSocial, cnpj, endereco, cep, numeroLoja, cidade, estado } = req.body
    if(!username || !password) return res.status(400).json({ message: 'username and password required' })
    const hashed = await bcrypt.hash(password, 10)
    const user = { username, passwordHash: hashed, loja, role: role || 'LOJA' }
    if(email) user.email = String(email).trim()
    if(razaoSocial) user.razaoSocial = String(razaoSocial).trim()
    if(cnpj) user.cnpj = String(cnpj).trim()
    if(endereco) user.endereco = String(endereco).trim()
    if(cep) user.cep = String(cep).trim()
    if(numeroLoja) user.numeroLoja = String(numeroLoja).trim()
    if(cidade) user.cidade = String(cidade).trim()
    if(estado) user.estado = String(estado).trim()
    const created = await addUser(user)
    res.status(201).json({ message: 'Usuário criado', user: { id: created._id || created.id, username: created.username, role: created.role, loja: created.loja, email: created.email } })
  } catch(err){ next(err) }
}

export async function updateUserRole(req, res, next){
  try{
    const { id } = req.params
    const { role } = req.body
    if(!role) return res.status(400).json({ message: 'role required' })
    const updated = await svcUpdateRole(id, role)
    res.json({ message: 'Role updated', user: updated })
  } catch(err){ next(err) }
}

export async function deleteUser(req, res, next){
  try{
    const { id } = req.params
    await svcDeleteUser(id)
    res.json({ message: 'User deleted' })
  } catch(err){ next(err) }
}

export async function updateUser(req, res, next){
  try{
    const { id } = req.params
    const { username, loja, password, role, email, razaoSocial, cnpj, endereco, cep, numeroLoja, cidade, estado } = req.body
    const patch = {}
    if(username) patch.username = username
    if(loja) patch.loja = loja
    if(role) patch.role = role
    if(typeof email !== 'undefined') patch.email = email ? String(email).trim() : undefined
    if(typeof razaoSocial !== 'undefined') patch.razaoSocial = razaoSocial ? String(razaoSocial).trim() : undefined
    if(typeof cnpj !== 'undefined') patch.cnpj = cnpj ? String(cnpj).trim() : undefined
    if(typeof endereco !== 'undefined') patch.endereco = endereco ? String(endereco).trim() : undefined
    if(typeof cep !== 'undefined') patch.cep = cep ? String(cep).trim() : undefined
    if(typeof numeroLoja !== 'undefined') patch.numeroLoja = numeroLoja ? String(numeroLoja).trim() : undefined
    if(typeof cidade !== 'undefined') patch.cidade = cidade ? String(cidade).trim() : undefined
    if(typeof estado !== 'undefined') patch.estado = estado ? String(estado).trim() : undefined
    if(password) patch.passwordHash = await bcrypt.hash(password, 10)
    const updated = await svcUpdateUser(id, patch)
    res.json({ message: 'User updated', user: updated })
  } catch(err){ next(err) }
}
