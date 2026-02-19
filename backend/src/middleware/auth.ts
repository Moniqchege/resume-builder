import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { db } from "../db/prisma";
import { AuthRequest } from "./auth-types";

/* ─────────────────────────────────────────────
   Require Authentication Middleware
───────────────────────────────────────────── */
export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { sub?: string };
    if (!payload?.sub) return res.status(401).json({ error: "Invalid token payload" });

    const session = await db.sessions.findUnique({
      where: { token },
      include: {
        users: {
          select: { id: true, email: true, name: true, plan: true },
        },
      },
    });

    if (!session) return res.status(401).json({ error: "Session not found" });

    if (new Date(session.expires_at) < new Date())
      return res.status(401).json({ error: "Session expired" });

    req.userId = payload.sub; 
    req.user = {
      id: session.users.id,
      email: session.users.email,
      name: session.users.name,
      plan: session.users.plan ?? "FREE",
    };

    next();
  } catch {
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

    const session = await db.sessions.findUnique({
      where: { token },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            plan: true,
          },
        },
      },
    });

    if (!session || session.expires_at < new Date()) {
      return next();
    }

    const userId = Number(payload.sub);
    if (isNaN(userId)) return next();

    req.userId = userId;
    req.user = {
      id: session.users.id,
      email: session.users.email,
      name: session.users.name,
      plan: session.users.plan ?? "FREE", 
    };
  } catch {
    // silently ignore invalid tokens
  }

  return next();
}


