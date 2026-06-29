import UserModel from '../models/User.js'
import mongoose from 'mongoose'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const usersPath = join(__dirname, '../data/users.json')
let usersData = []
try { usersData = JSON.parse(readFileSync(usersPath, 'utf8')) } catch(e){ usersData = [] }

// in-memory fallback
const users = Array.isArray(usersData) ? [...usersData] : []

export async function findUserByUsername(username){
  try{
    if(UserModel && UserModel.findOne) return await UserModel.findOne({ username }).lean()
  } catch(e){}
  return users.find(u => u.username === username)
}

export async function addUser(user){
  try{
    const connected = mongoose.connection && mongoose.connection.readyState === 1
    if(connected && UserModel && UserModel.create){
      console.log('users.service: creating user in MongoDB')
      // avoid passing an `id` number that Mongoose may try to cast to _id
      const payload = { ...user }
      if(Object.prototype.hasOwnProperty.call(payload, 'id')) delete payload.id
      return await UserModel.create(payload)
    }
  } catch(e){
    console.error('users.service: error creating user in MongoDB', e.message)
  }
  console.log('users.service: falling back to in-memory users')
  users.push(user)
  return user
}

export async function getAllUsers(){
  try{
    if(UserModel && UserModel.find) return await UserModel.find().lean()
  } catch(e){}
  return users
}

export async function updateUserRole(id, role){
  try{
    const connected = mongoose.connection && mongoose.connection.readyState === 1
    if(connected && UserModel && UserModel.findByIdAndUpdate){
      return await UserModel.findByIdAndUpdate(id, { role }, { new: true }).lean()
    }
  } catch(e){
    console.error('users.service: error updating role', e.message)
  }
  // fallback: update in-memory
  const u = users.find(x => String(x.id) === String(id) || String(x._id) === String(id))
  if(u){ u.role = role }
  return u
}

export async function deleteUser(id){
  try{
    const connected = mongoose.connection && mongoose.connection.readyState === 1
    if(connected && UserModel && UserModel.findByIdAndDelete){
      return await UserModel.findByIdAndDelete(id)
    }
  } catch(e){
    console.error('users.service: error deleting user', e.message)
  }
  const idx = users.findIndex(x => String(x.id) === String(id) || String(x._id) === String(id))
  if(idx !== -1) users.splice(idx, 1)
  return true
}

export async function updateUser(id, patch){
  try{
    const connected = mongoose.connection && mongoose.connection.readyState === 1
    if(connected && UserModel && UserModel.findByIdAndUpdate){
      return await UserModel.findByIdAndUpdate(id, patch, { new: true }).lean()
    }
  } catch(e){
    console.error('users.service: error updating user', e.message)
  }
  const u = users.find(x => String(x.id) === String(id) || String(x._id) === String(id))
  if(u){ Object.assign(u, patch) }
  return u
}

export default { findUserByUsername, addUser, getAllUsers }
