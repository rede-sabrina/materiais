import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import * as usersService from './users.service.js'

async function register(username, password, loja, email){
  const userExists = await usersService.findUserByUsername(username)
  if(userExists) throw new Error('User já existe')

  const allUsers = await usersService.getAllUsers()
  const role = allUsers.length === 0 ? 'ADMIN' : 'LOJA'

  const hashedPassword = await bcrypt.hash(password, 10)
  // store hashed password as `passwordHash` to match Mongoose schema
  const user = { id: Date.now(), username, passwordHash: hashedPassword, role, loja }
  if(email) user.email = String(email).trim()
  await usersService.addUser(user)
  return { message: 'Usuário criado com sucesso', user: { id: user.id, username: user.username, role: user.role, loja: user.loja, email: user.email } }
}

async function login(username, password){
  const user = await usersService.findUserByUsername(username)
  if(!user) throw new Error('Usuário não encontrado')

  // support both `password` (fallback) and `passwordHash` (mongoose)
  const stored = user.password || user.passwordHash || user.passwordhash
  const isValid = await bcrypt.compare(password, stored)
  if(!isValid) throw new Error('Senha incorreta')

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, loja: user.loja }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1d' })
  return { user: { id: user.id, username: user.username }, token }
}

export default { register, login }