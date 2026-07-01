import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const authRouter = Router();

const client = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID);

// Lista de emails autorizados
// ── Configuración desde Railway env vars ──
// ALLOWED_USERS = JSON array de objetos { email|domain, clients, role }
// role: 'admin' (equipo AMIK, ve todo) | 'client' (solo su data, sin pestañas internas)
// Si no se especifica role: los correos @amikgroup.com son 'admin', el resto 'client'.
// Ejemplo: [{"email":"juan@upsjb.edu.pe","clients":["upsjb"],"role":"client"},{"domain":"amikgroup.com","clients":["upsjb","deco"],"role":"admin"}]
const DEFAULT_USERS = [
  { email: 'estuardo@amikgroup.com',             clients: ['upsjb','deco','espac','libra'], role:'admin' },
  { email: 'e.escobar@amikgroup.com',            clients: ['upsjb','deco','espac','libra'], role:'admin' },
  { email: 'estuardo.escobar.sabogal@gmail.com', clients: ['upsjb','deco','espac','libra'], role:'admin' },
  { email: 'lucia@amikgroup.com',                clients: ['upsjb','deco','espac','libra'], role:'admin' },
  { email: 'upsjbenlinea@gmail.com',             clients: ['upsjb'],                        role:'client' },
  { domain: 'upsjb.edu.pe',                      clients: ['upsjb'],                        role:'client' },
];

function getAllowedUsers() {
  try {
    if (process.env.ALLOWED_USERS) return JSON.parse(process.env.ALLOWED_USERS);
  } catch(e) { console.error('[Auth] ALLOWED_USERS parse error:', e.message); }
  return DEFAULT_USERS;
}

// Deriva el rol: usa el explícito; si no hay, admin para @amikgroup.com, client para el resto
function deriveRole(entry, email) {
  if (entry.role) return entry.role;
  const domain = email.split('@')[1];
  return domain === 'amikgroup.com' ? 'admin' : 'client';
}

function getAccessForEmail(email) {
  const users = getAllowedUsers();
  const domain = email.split('@')[1];
  // Buscar por email exacto primero
  const byEmail = users.find(u => u.email === email);
  if (byEmail) return { clients: byEmail.clients, role: deriveRole(byEmail, email) };
  // Luego por dominio
  const byDomain = users.find(u => u.domain === domain);
  if (byDomain) return { clients: byDomain.clients, role: deriveRole(byDomain, email) };
  return null;
}

// POST /api/auth/google
authRouter.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Token requerido' });

    console.log('[Auth] Verifying token with client ID:', process.env.GOOGLE_OAUTH_CLIENT_ID?.slice(0,20));
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    const access = getAccessForEmail(email);
    if (!access) {
      return res.status(403).json({ error: 'Acceso no autorizado. Contacta a AMIK GROUP.' });
    }

    const user = {
      email,
      name: payload.name,
      picture: payload.picture,
      clients: access.clients,
      role: access.role,
    };

    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user });
  } catch (err) {
    console.error('[Auth] Google error full:', err);
    res.status(401).json({ error: 'Token de Google inválido: ' + err.message });
  }
});

// ── LOGIN LOCAL (usuario + contraseña) ──
// LOCAL_USERS = JSON array: [{ email, name, passwordHash, clients, role }]
// La contraseña se guarda SIEMPRE hasheada con bcrypt (nunca en texto plano).
// Genera el hash en tu Mac con: node -e "console.log(require('bcryptjs').hashSync('TU_CLAVE',10))"
function getLocalUsers() {
  try {
    if (process.env.LOCAL_USERS) return JSON.parse(process.env.LOCAL_USERS);
  } catch(e) { console.error('[Auth] LOCAL_USERS parse error:', e.message); }
  return [];
}

// POST /api/auth/login  { email, password }
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const users = getLocalUsers();
    const found = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!found || !found.passwordHash) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const ok = bcrypt.compareSync(password, found.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

    const user = {
      email: found.email,
      name: found.name || found.email.split('@')[0],
      picture: null,
      clients: found.clients || [],
      role: found.role || 'client',
    };

    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    console.error('[Auth] Local login error:', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
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
