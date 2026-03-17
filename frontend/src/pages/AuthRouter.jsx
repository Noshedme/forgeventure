// src/pages/AuthRouter.jsx
import { useState } from "react";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";

export default function AuthRouter({ onLogin }) {
  const [view, setView] = useState("login");

  if (view === "register") {
    return <RegisterPage onGoLogin={() => setView("login")} onSuccess={onLogin} />;
  }

  return <LoginPage onGoRegister={() => setView("register")} onSuccess={onLogin} />;
}