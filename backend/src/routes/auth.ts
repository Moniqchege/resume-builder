import { Router } from "express";
import passport from "passport";

const router = Router();

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

// LinkedIn OAuth
// router.get("/linkedin", passport.authenticate("linkedin"));
// router.get(
//   "/linkedin/callback",
//   passport.authenticate("linkedin", { failureRedirect: "/auth/failure" }),
//   (req, res) => {
//     res.redirect(`${process.env.FRONTEND_URL}/dashboard?user=${encodeURIComponent(JSON.stringify(req.user))}`);
//   }
// );

// Microsoft OAuth
// router.get("/microsoft", passport.authenticate("microsoft"));
// router.get(
//   "/microsoft/callback",
//   passport.authenticate("microsoft", { failureRedirect: "/auth/failure" }),
//   (req, res) => {
//     res.redirect(`${process.env.FRONTEND_URL}/dashboard?user=${encodeURIComponent(JSON.stringify(req.user))}`);
//   }
// );

router.get("/failure", (req, res) => res.send("Authentication failed"));

export default router;
