import { Router, Request, Response } from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import { db } from "../db/prisma";
import jwt from "jsonwebtoken";

const router = Router();

// Register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Check if user exists
    const existing = await db.user.findFirst({
      where: {
        OR: [{ username }, { email }]
      },
      select: { id: true }
    });

    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = await db.user.create({
      data: {
        username,
        email,
        password_hash: hashedPassword,
        name: username
      },
      select: { id: true, username: true, email: true }
    });

    // Sign JWT
    const token = jwt.sign(
      { userId: result.id, username: result.username },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.status(201).json({ token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await db.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ message: "Invalid credentials" });

    // Sign JWT
    const token = jwt.sign(
      { sub: user.id }, // sub is your user ID, matches middleware
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // Store session
    await db.sessions.create({
      data: {
        user_id: user.id,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    res.json({ token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/failure" }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?user=${encodeURIComponent(JSON.stringify(req.user))}`);
  }
);

// GitHub OAuth
router.get("/github", passport.authenticate("github"));
router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/auth/failure" }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?user=${encodeURIComponent(JSON.stringify(req.user))}`);
  }
);

router.get("/failure", (req, res) => res.send("Authentication failed"));

export default router;
