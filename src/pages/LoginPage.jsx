import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export function LoginPage() {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function ensureDefaultSlots(userId) {
    const defaults = [
      { name: "Café da manhã", sort_order: 1, is_default: true },
      { name: "Almoço", sort_order: 2, is_default: true },
      { name: "Lanche", sort_order: 3, is_default: true },
      { name: "Janta", sort_order: 4, is_default: true },
      { name: "Ceia", sort_order: 5, is_default: true },
    ];
    const { data: existing } = await supabase.from("meal_slots").select("id").eq("user_id", userId).limit(1);
    if (!existing || existing.length === 0) {
      await supabase.from("meal_slots").insert(defaults.map((item) => ({ ...item, user_id: userId })));
    }
  }

  async function submit(e) {
    e.preventDefault();
    setStatus("Carregando...");
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) return setStatus(error.message);
      if (data.user) {
        await supabase.from("profiles").upsert({ id: data.user.id, full_name: fullName });
        await ensureDefaultSlots(data.user.id);
      }
      return setStatus("Conta criada.");
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setStatus(error.message);
    if (data.user) await ensureDefaultSlots(data.user.id);
    setStatus("Entrando...");
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <h1>DUFIT</h1>
        <div className="tabs">
          <button type="button" className={mode==="login"?"active":""} onClick={() => setMode("login")}>Entrar</button>
          <button type="button" className={mode==="signup"?"active":""} onClick={() => setMode("signup")}>Criar conta</button>
        </div>
        {mode === "signup" && <div><label>Nome</label><input value={fullName} onChange={(e)=>setFullName(e.target.value)} /></div>}
        <div><label>E-mail</label><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
        <div><label>Senha</label><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} /></div>
        <button type="submit">{mode === "login" ? "Entrar" : "Criar conta"}</button>
        {status && <div className="status-box">{status}</div>}
      </form>
    </div>
  );
}
