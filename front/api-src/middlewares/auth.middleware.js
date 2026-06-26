import jwt from 'jsonwebtoken'

export default function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'] || '';
    if (!authHeader) return res.status(401).json({ message: 'Acesso não autorizado' });

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Token malformado' });

    const token = parts[1];
    try {
        const secret = process.env.JWT_SECRET || 'dev-secret';
        const payload = jwt.verify(token, secret);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token inválido' });
    }
}