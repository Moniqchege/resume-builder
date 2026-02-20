import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import session from "express-session";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";

import { setupOAuth } from "./services/oauthStrategies.js";
import authRoutes from "./routes/auth.js";
import resumeRouter from "./routes/resumes.js";
import { atsRouter } from "./routes/ats.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

app.use("/api/resumes", resumeRouter);
app.use("/api/ats", atsRouter);

app.use(passport.initialize());
app.use(passport.session());

setupOAuth();

app.use("/auth", authRoutes);

app.listen(process.env.PORT || 4000, () => console.log("Server running"));