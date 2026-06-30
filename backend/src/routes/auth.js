import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

export const authRouter = Router();

const client = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID);

// Lista de emails autorizados
const ALLOWED_EMAILS = [
  'estuardo@amikgroup.com',
  'estuardo.escobar.sabogal@gmail.com',
  'lucia@amikgroup.com',
  'upsjbenlinea@gmail.com',
];

// Cliente → cuentas que puede ver
const CLIENT_MAP = {
  'estuardo@amikgroup.com':          ['upsjb', 'deco', 'espac', 'libra'],
  'estuardo.escobar.sabogal@gmail.com': ['upsjb', 'deco', 'espac', 'libra'],
  'lucia@amikgroup.com':             ['upsjb', 'deco', 'espac', 'libra'],
  'upsjbenlinea@gmail.com':          ['upsjb'],
};

// POST /api/auth/google
authRouter.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Token requerido' });

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    if (!ALLOWED_EMAILS.includes(email)) {
      return res.status(403).json({ error: 'Acceso no autorizado. Contacta a AMIK GROUP.' });
    }

    const user = {
      email,
      name: payload.name,
      picture: payload.picture,
      clients: CLIENT_MAP[email] || [],
    };

    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user });
  } catch (err) {
    console.error('[Auth] Google error:', err.message);
    res.status(401).json({ error: 'Token de Google inválido' });
  }
});

// GET /api/auth/me
authRouter.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No autenticado' });

  try {
    const token = authHeader.replace('Bearer ', '');
    const user = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
});
