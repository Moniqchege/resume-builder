import dotenv from "dotenv";
dotenv.config();
import cors from "cors";

import express from "express";
import session from "express-session";
import passport from "passport";
import { setupOAuth } from "./services/oauthStrategies.js";
import authRoutes from "./routes/auth.js";
import resumeRouter from "./routes/resumes.js";

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

app.use('/api/resumes', resumeRouter)

app.use(passport.initialize());
app.use(passport.session());

setupOAuth();

app.use("/auth", authRoutes);

app.listen(process.env.PORT || 4000, () => console.log("Server running"));
