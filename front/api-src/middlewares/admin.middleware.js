export default function adminOnly(req, res, next){
  if(!req.user) return res.status(401).json({ message: 'Acesso não autorizado' })
  if(req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Acesso restrito a administradores' })
  next()
}
