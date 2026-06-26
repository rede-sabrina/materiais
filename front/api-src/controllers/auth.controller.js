import authService from "../services/auth.service.js";
import { findUserByUsername } from "../services/users.service.js";

export async function register(req, res, next) {
	try {
		const { username, password, loja, email } = req.body;
		if (!username || !password) return res.status(400).json({ message: 'username and password required' });
		const result = await authService.register(username, password, loja, email);
		res.status(201).json(result);
	} catch (err) {
		// service throws on duplicate user
		res.status(400).json({ message: err.message || 'error' });
	}
}

export async function login(req, res, next) {
	try {
		const { username, password } = req.body;
		if (!username || !password) return res.status(400).json({ message: 'username and password required' });
		const data = await authService.login(username, password);
		res.json(data);
	} catch (err) {
		res.status(401).json({ message: err.message || 'invalid credentials' });
	}
}

export async function me(req, res, next){
	try{
		const username = req.user && req.user.username
		if(!username) return res.status(400).json({ message: 'Usuário não identificado' })
		const u = await findUserByUsername(username)
		if(u) return res.json(u)
		// fallback to token payload
		return res.json(req.user)
	} catch(err){ next(err) }
}