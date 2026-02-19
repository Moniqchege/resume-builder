import OrbBackground from "@/components/OrbBackground";
import { useState, useEffect, useRef } from "react";
import { FaUser, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// ─── Landing / Auth View ──────────────────────────────────────────────────────
export default function LandingView({
  onLogin,
}: {
  onLogin: (provider: string) => void;
}) {
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null);

  const providers = [
    { id: "google", label: "Google", icon: "G", color: "#EA4335" },
    { id: "github", label: "GitHub", icon: "⌥", color: "#E8EDF5" },
  ];

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
  setUsername("");
  setPassword("");
  setConfirmPassword("");
}, []);

  // ───── Login Handler ─────
const handleLocalLogin = async () => {
  setError(null);
  if (!username || !password) {
    setError("Please fill in both fields.");
    return;
  }

  setLoading(true);
  try {
    const res = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "Login failed.");
      setLoading(false);
      return;
    }
    localStorage.setItem("token", data.token);
    console.log("Logged in successfully!", data);
    navigate("/dashboard");
    setLoading(false);
  } catch (err) {
    console.error(err);
    setError("Server error. Try again.");
    setLoading(false);
  }
};

// ───── Register Handler ─────
const handleRegister = async () => {
  setError(null);
  if (!username || !password || !confirmPassword) {
    setError("Please fill in both fields.");
    return;
  }

  if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

  setLoading(true);
  try {
    const res = await fetch("http://localhost:4000/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password, email: username }), // replace email if you want separate field
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "Registration failed.");
      setLoading(false);
      return;
    }
    localStorage.setItem("token", data.token);
    console.log("Registered successfully!", data);
    navigate("/dashboard");
    setLoading(false);
  } catch (err) {
    console.error(err);
    setError("Server error. Try again.");
    setLoading(false);
  }
};

return (
  <>
  <OrbBackground />
   <div style={{
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 24,
    position: "relative",
    zIndex: 1,
    animation: "fadeUp 0.8s ease both"
  }}>
    {/* Logo Top-Center */}
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 5 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "linear-gradient(135deg, #00D4FF 0%, #7B2FFF 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 800, color: "#fff",
          boxShadow: "0 0 30px rgba(0,212,255,0.35)"
        }}>N</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#E8EDF5", letterSpacing: "-0.5px" }}>NextStep</div>
          <div style={{ fontSize: 11, color: "#00D4FF", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2 }}>ATS OPTIMIZER</div>
        </div>
      </div>
    </div>

    {/* Middle Section: Two Columns */}
    <div style={{
      display: "flex",
      flexDirection: "row",
      gap: 40,
      flex: 1,
      flexWrap: "wrap", 
      justifyContent: "center",
      alignItems: "center"
    }}>
      {/* Left Column */}
      <div style={{
        flex: "1 1 300px",  
        display: "flex",
        flexDirection: "column",
        alignItems: "center", 
        gap: 24,
        textAlign: "center"
      }}>
        <h1 style={{
          fontSize: 48, fontWeight: 800, lineHeight: 1.1,
          background: "linear-gradient(135deg, #E8EDF5 0%, #00D4FF 50%, #7B2FFF 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-1.5px"
        }}>
          Beat the ATS.<br />Land the Job.
        </h1>

        <p style={{ color: "#8A94A6", fontSize: 16, lineHeight: 1.6 }}>
          Drop a job description. <br />Our AI tailors your resume to pass ATS filters and score in the top percentile.
        </p>

        {/* ATS Score Preview */}
        <div style={{
           background: "rgba(21,29,53,0.8)",
           border: "1px solid rgba(0,212,255,0.15)",
           borderRadius: 20,
           padding: "20px 24px",
           backdropFilter: "blur(12px)",
           display: "flex",
           alignItems: "start",
           gap: 20,
           justifyContent: "start",
           width: "100%",      
           maxWidth: 500,      
           boxSizing: "border-box"
        }}>
          <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="5" />
              <circle cx="32" cy="32" r="27" fill="none" stroke="url(#scoreGrad)" strokeWidth="5"
                strokeLinecap="round" strokeDasharray="170" strokeDashoffset="34"
                style={{ transition: "stroke-dashoffset 1.5s ease" }} />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00D4FF" />
                  <stop offset="100%" stopColor="#B8FF00" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#B8FF00",
              fontFamily: "'JetBrains Mono', monospace"
            }}>88</div>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, color: "#8A94A6", marginBottom: 4 }}>ATS Score Preview</div>
            <div style={{ fontSize: 15, color: "#E8EDF5", fontWeight: 600 }}>Senior Frontend Engineer</div>
            <div style={{ fontSize: 12, color: "#00D4FF", fontFamily: "'JetBrains Mono', monospace" }}>↑ 34 points after optimization</div>
          </div>
        </div>
      </div>

      {/* Right Column */}
<div
  style={{
    flex: "1 1 300px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    width: "100%",
  }}
>
  {/* ───── Local Auth Inputs ───── */}
  <div style={{ position: "relative", width: "100%", maxWidth: 540 }}>
  <input
    placeholder="Username"
    value={username}
    onChange={(e) => setUsername(e.target.value)}
    style={{
      width: "100%",
      maxWidth: 540,
      padding: "11px 16px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(15,22,41,0.8)",
      color: "#E8EDF5",
      fontSize: 14,
      fontFamily: "'Syne', sans-serif",
      outline: "none",
      transition: "all 0.2s ease",
    }}
  />
    <FaUser
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#8A94A6",
            fontSize: 16,
          }}
        />
  </div>
  <div style={{ position: "relative", width: "100%", maxWidth: 540 }}>
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    style={{
      width: "100%",
      maxWidth: 540,
      padding: "11px 16px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(15,22,41,0.8)",
      color: "#E8EDF5",
      fontSize: 14,
      fontFamily: "'Syne', sans-serif",
      outline: "none",
      transition: "all 0.2s ease",
    }}
  />
    <div
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
            color: "#8A94A6",
            fontSize: 16,
          }}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </div>
  </div>

   {isRegister && (
            <div style={{ position: "relative", width: "100%", maxWidth: 540 }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: "100%", padding: "11px 16px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,22,41,0.8)", color: "#E8EDF5", fontSize: 14, fontFamily: "'Syne', sans-serif", outline: "none", transition: "all 0.2s ease" }}
              />
              <div onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#8A94A6", fontSize: 16 }}>
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
          )}

  {/* ───── Login/Register Button ───── */}
  <button
    onClick={isRegister ? handleRegister : handleLocalLogin}
    onMouseEnter={() => setHoveredProvider(isRegister ? "register" : "login")}
    onMouseLeave={() => setHoveredProvider(null)}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: "10px 24px",
      borderRadius: 14,
      border: "1px solid",
      borderColor:
        hoveredProvider === (isRegister ? "register" : "login")
          ? "rgba(0,212,255,0.5)"
          : "rgba(255,255,255,0.08)",
      background:
        hoveredProvider === (isRegister ? "register" : "login")
          ? "rgba(0,212,255,0.06)"
          : "rgba(15,22,41,0.8)",
      color: "#E8EDF5",
      fontSize: 15,
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s ease",
      fontFamily: "'Syne', sans-serif",
      transform:
        hoveredProvider === (isRegister ? "register" : "login")
          ? "translateY(-1px)"
          : "none",
      boxShadow:
        hoveredProvider === (isRegister ? "register" : "login")
          ? "0 8px 24px rgba(0,212,255,0.12)"
          : "none",
      width: "100%",
      maxWidth: 540,
    }}
  >
    {isRegister ? "Register" : "Login"}
  </button>

  {/* ───── Toggle Link ───── */}
  <div
  onClick={() => setIsRegister(!isRegister)}
  style={{
    fontSize: 12,
    cursor: "pointer",
    marginTop: 2,
    fontFamily: "'JetBrains Mono', monospace",
    color: "#8A94A6",
  }}
>
  {isRegister ? (
    <>
      Already have an account?{" "}
      <span style={{ color: "#00D4FF", fontWeight: 600 }}>Login</span>
    </>
  ) : (
    <>
      Don't have an account?{" "}
      <span style={{ color: "#00D4FF", fontWeight: 600 }}>Register</span>
    </>
  )}
</div>

  {/* ───── Error Message ───── */}
  {error && (
    <div style={{ color: "#FF6B6B", fontSize: 12 }}>
      {error}
    </div>
  )}

  {/* ───── Divider ───── */}
  <div
    style={{
      width: 300,
      textAlign: "center",
      color: "#4A5568",
      fontSize: 12,
      margin: "8px 0",
    }}
  >
    ── or continue with ──
  </div>

  {/* ───── OAuth Providers ───── */}
  <div
  style={{
    display: "flex",
    gap: 16,
    justifyContent: "center", // optional
    flexWrap: "wrap", // keeps responsiveness
  }}
>
  {providers.map((p) => (
    <button
      key={p.id}
      onMouseEnter={() => setHoveredProvider(p.id)}
      onMouseLeave={() => setHoveredProvider(null)}
      onClick={() => onLogin(p.id)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "10px 24px",
        borderRadius: 14,
        border: "1px solid",
        borderColor:
          hoveredProvider === p.id
            ? "rgba(0,212,255,0.5)"
            : "rgba(255,255,255,0.08)",
        background:
          hoveredProvider === p.id
            ? "rgba(0,212,255,0.06)"
            : "rgba(15,22,41,0.8)",
        color: "#E8EDF5",
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "'Syne', sans-serif",
        transform: hoveredProvider === p.id ? "translateY(-1px)" : "none",
        boxShadow:
          hoveredProvider === p.id
            ? "0 8px 24px rgba(0,212,255,0.12)"
            : "none",
        width: "auto",
minWidth: 180,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `${p.color}20`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 800,
          color: p.color,
          border: `1px solid ${p.color}30`,
        }}
      >
        {p.icon}
      </span>
      Continue with {p.label}
    </button>
  ))}
  </div>
</div>
    </div>

    {/* Bottom Paragraph */}
    <p style={{ marginTop: 24, fontSize: 12, color: "#4A5568", textAlign: "center" }}>
      No credit card required · Free tier available · SOC 2 compliant
    </p>
  </div>
  </>
);
}
