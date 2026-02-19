// App.tsx
import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import LandingView from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AppLayout from "./components/layout/AppLayout";
import BuilderPage from "./pages/BuilderPage";
import ATSPage from "./pages/ATSPage";


// ─── App ─────────────────────────────────────────────
export default function App() {
  const handleOAuthLogin = (provider: string) => {
    window.location.href = `http://localhost:4000/auth/${provider}`;
  };

  return (
      <Routes>
        <Route path="/" element={<LandingView onLogin={handleOAuthLogin} />} />
        <Route path="/login" element={<LandingView onLogin={handleOAuthLogin} />} />
        <Route />
        <Route path="/dashboard" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
      </Route>
       <Route path="/resume-builder" element={<AppLayout />}>
        <Route index element={<BuilderPage />} />
      </Route>
       <Route path="/ats-analyzer" element={<AppLayout />}>
      <Route path=":analysisId" element={<ATSPage />} />
      </Route>
      </Routes>
  );
}

