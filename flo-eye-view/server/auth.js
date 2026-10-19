import crypto from 'node:crypto';

/**
 * Local access-code gate for sellable demos.
 * - If FLO_EYE_ACCESS_CODE is unset → open (dev mode)
 * - If set → /api/* (except health/auth) require session cookie
 *
 * Not production SSO — a deliberate sell-boundary demo until Flofaction auth lands.
 */

const COOKIE = 'flo_eye_session';
const sessions = new Map(); // token -> { at }

export function accessCodeConfigured() {
  return Boolean(process.env.FLO_EYE_ACCESS_CODE);
}

export function createAuthRouter(express) {
  const router = express.Router();

  router.get('/api/auth/status', (req, res) => {
    const required = accessCodeConfigured();
    const authed = !required || Boolean(readSession(req));
    res.json({
      required,
      authenticated: authed,
      mode: required ? (authed ? 'unlocked' : 'locked') : 'open-dev',
      sku: process.env.FLO_EYE_SKU || 'command',
    });
  });

  router.post('/api/auth/login', (req, res) => {
    if (!accessCodeConfigured()) {
      return res.json({ ok: true, mode: 'open-dev' });
    }
    const code = String(req.body?.code || '');
    if (code !== process.env.FLO_EYE_ACCESS_CODE) {
      return res.status(401).json({ error: 'Invalid access code' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, { at: Date.now() });
    res.setHeader(
      'Set-Cookie',
      `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
    );
    res.json({ ok: true, mode: 'unlocked' });
  });

  router.post('/api/auth/logout', (_req, res) => {
    res.setHeader(
      'Set-Cookie',
      `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    );
    res.json({ ok: true });
  });

  return router;
}

export function requireAuth(req, res, next) {
  if (!accessCodeConfigured()) return next();
  // Always allow auth endpoints + health
  if (req.path.startsWith('/api/auth') || req.path === '/api/health') return next();
  if (!req.path.startsWith('/api/')) return next();
  if (readSession(req)) return next();
  res.status(401).json({ error: 'Authentication required', login: '/api/auth/login' });
}

function readSession(req) {
  const raw = req.headers.cookie || '';
  const match = raw.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!match) return null;
  const token = match[1];
  const sess = sessions.get(token);
  if (!sess) return null;
  // 24h TTL
  if (Date.now() - sess.at > 86400_000) {
    sessions.delete(token);
    return null;
  }
  return sess;
}
