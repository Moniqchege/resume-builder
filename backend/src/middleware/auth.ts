import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { db } from "../db/prisma.js";

/* ─────────────────────────────────────────────
   Extended Request Interface
───────────────────────────────────────────── */

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    plan: string;
  };
}

/* ─────────────────────────────────────────────
   Require Authentication Middleware
───────────────────────────────────────────── */

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload & { sub?: string };

    if (!payload?.sub) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // Check session in DB
    const session = await db.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            plan: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(401).json({ error: "Session not found" });
    }

    if (session.expiresAt < new Date()) {
      return res
        .status(401)
        .json({ error: "Session expired. Please log in again." });
    }

    // Attach user to request
    req.userId = payload.sub;
    req.user = session.user;

    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/* ─────────────────────────────────────────────
   Optional Authentication Middleware
───────────────────────────────────────────── */

export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload & { sub?: string };

    if (!payload?.sub) {
      return next();
    }

    const session = await db.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            plan: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return next();
    }

    req.userId = payload.sub;
    req.user = session.user;

  } catch {
    // silently ignore invalid tokens
  }

  return next();
}
