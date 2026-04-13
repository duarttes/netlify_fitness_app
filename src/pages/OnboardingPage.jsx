import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { calcProfileTargets, n } from "../lib/profileUtils";

export function OnboardingPage({ session, onDone }) {
  const [form, setForm] = useState({
    full_name: session.user.user_metadata?.full_name || "",
    sex: "masculino",
    age: "",
    weight_kg: "",
    height_cm: "",
    activity_level: "moderado",
    goal: "emagrecer",
  });
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();

    if (!form.full_name || !form.age || !form.weight_kg || !form.height_cm) {
      setStatus("Preencha nome, idade, peso e altura.");
      return;
    }

    setSaving(true);
    setStatus("Salvando perfil...");

    try {
      const normalized = {
        ...form,
        age: n(form.age),
        weight_kg: n(form.weight_kg),
        height_cm: n(form.height_cm),
      };

      const targets = calcProfileTargets(normalized);

      const payload = {
        user_id: session.user.id,
        ...normalized,
        ...targets,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("user_profiles").upsert(payload);

      if (error) {
        console.error(error);
        setStatus(error.message);
        setSaving(false);
        return;
      }

      setStatus("Perfil salvo com sucesso.");
      onDone();
    } catch (err) {
      console.error(err);
      setStatus("Erro ao salvar perfil.");
      setSaving(false);
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={saveProfile}>
        <h1>Complete seu perfil</h1>
        <p>Vamos personalizar suas metas</p>

        <div>
          <label>Nome</label>
          <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>

        <div>
          <label>Sexo</label>
          <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
          </select>
        </div>

        <div>
          <label>Idade</label>
          <input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
        </div>

        <div>
          <label>Peso (kg)</label>
          <input value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
        </div>

        <div>
          <label>Altura (cm)</label>
          <input value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
        </div>

        <div>
          <label>Nível de atividade</label>
          <select value={form.activity_level} onChange={(e) => setForm({ ...form, activity_level: e.target.value })}>
            <option value="sedentario">Sedentário</option>
            <option value="leve">Leve</option>
            <option value="moderado">Moderado</option>
            <option value="alto">Alto</option>
            <option value="atleta">Atleta</option>
          </select>
        </div>

        <div>
          <label>Objetivo</label>
          <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
            <option value="emagrecer">Emagrecer</option>
            <option value="manter">Manutenção</option>
            <option value="ganhar_massa">Ganhar massa magra</option>
          </select>
        </div>

        <button type="submit" className="clay-btn" disabled={saving}>
          {saving ? "Salvando..." : "Salvar perfil"}
        </button>

        {status && <div className="status-box clay-soft">{status}</div>}
      </form>
    </div>
  );
}