import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { db } from '../db/prisma.js'

export interface AuthRequest extends Request {
  userId?: string
  user?:   { id: string; email: string; name: string; plan: string }
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string }

    // Verify session still exists in DB
    const session = await db.session.findUnique({
      where:   { token },
      include: { user: { select: { id: true, email: true, name: true, plan: true } } },
    })

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' })
    }

    req.userId = payload.sub
    req.user   = session.user
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return next()

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string }
    req.userId = payload.sub
  } catch { /* ignore */ }
  next()
}
