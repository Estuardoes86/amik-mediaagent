export function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const expected = process.env.INTERNAL_API_KEY;

  if (!expected) {
    // Dev mode: no key required if env not set
    return next();
  }

  if (!apiKey || apiKey !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
