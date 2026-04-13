import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { calcMacros, findFoodByText, n, parseSmartEntry } from "../lib/foodUtils";
import { calcProfileTargets } from "../lib/profileUtils";

const TODAY = new Date().toISOString().slice(0, 10);

function Progress({ value, max }) {
  const percent = Math.min(max > 0 ? (value / max) * 100 : 0, 100);
  return (
    <div style={{ background: "#e5e7eb", borderRadius: 10 }}>
      <div
        style={{
          width: percent + "%",
          background: "#22c55e",
          height: 10,
          borderRadius: 10,
        }}
      />
    </div>
  );
}

export function DashboardPage({ session }) {
  const userId = session.user.id;

  const [meals, setMeals] = useState([]);
  const [waterEntries, setWaterEntries] = useState([]);
  const [profile, setProfile] = useState(null);

  const [goals, setGoals] = useState({
    kcal: 2200,
    protein: 200,
    carbs: 220,
    fat: 65,
  });

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    sex: "masculino",
    age: "",
    weight_kg: "",
    height_cm: "",
    activity_level: "moderado",
    goal: "emagrecer",
  });

  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState("resumo");

  async function loadAll() {
    const { data: mealData } = await supabase
      .from("meal_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", TODAY)
      .order("created_at", { ascending: false });

    const { data: waterData } = await supabase
      .from("water_entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    setMeals(mealData || []);
    setWaterEntries(waterData || []);
    setProfile(profileData || null);

    if (profileData) {
      setGoals({
        kcal: profileData.target_calories,
        protein: profileData.target_protein_g,
        carbs: profileData.target_carbs_g,
        fat: profileData.target_fat_g,
      });

      setProfileForm({
        full_name: profileData.full_name || "",
        sex: profileData.sex || "masculino",
        age: profileData.age || "",
        weight_kg: profileData.weight_kg || "",
        height_cm: profileData.height_cm || "",
        activity_level: profileData.activity_level || "moderado",
        goal: profileData.goal || "emagrecer",
      });
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const totals = useMemo(() => {
    return meals.reduce(
      (acc, item) => {
        acc.kcal += n(item.calories);
        acc.protein += n(item.protein_g);
        acc.carbs += n(item.carbs_g);
        acc.fat += n(item.fat_g);
        return acc;
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [meals]);

  const waterTotal = waterEntries.reduce((acc, w) => acc + n(w.amount_ml), 0);

  async function deleteMeal(id) {
    await supabase.from("meal_entries").delete().eq("id", id);
    loadAll();
  }

  async function deleteWater(id) {
    await supabase.from("water_entries").delete().eq("id", id);
    loadAll();
  }

  async function addWater(amount) {
    await supabase.from("water_entries").insert({
      user_id: userId,
      amount_ml: amount,
    });
    loadAll();
  }

  async function saveProfile() {
    const normalized = {
      ...profileForm,
      age: n(profileForm.age),
      weight_kg: n(profileForm.weight_kg),
      height_cm: n(profileForm.height_cm),
    };

    const targets = calcProfileTargets(normalized);

    await supabase.from("user_profiles").upsert({
      user_id: userId,
      ...normalized,
      ...targets,
    });

    setGoals({
      kcal: targets.target_calories,
      protein: targets.target_protein_g,
      carbs: targets.target_carbs_g,
      fat: targets.target_fat_g,
    });

    setStatus("Perfil atualizado");
    loadAll();
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 10 }}>
        {["resumo", "perfil"].map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === "resumo" && (
        <>
          <h2>Resumo</h2>

          <p>Calorias {totals.kcal} / {goals.kcal}</p>
          <Progress value={totals.kcal} max={goals.kcal} />

          <p>Proteína {totals.protein} / {goals.protein}</p>
          <Progress value={totals.protein} max={goals.protein} />

          <p>Água {(waterTotal / 1000).toFixed(2)}L</p>
          <Progress value={waterTotal} max={3000} />

          <h3>Água rápida</h3>
          <button onClick={() => addWater(200)}>+200ml</button>
          <button onClick={() => addWater(500)}>+500ml</button>

          <h3>Comidas</h3>
          {meals.map((m) => (
            <div key={m.id}>
              {m.food_name} - {m.calories} kcal
              <button onClick={() => deleteMeal(m.id)}>X</button>
            </div>
          ))}

          <h3>Água</h3>
          {waterEntries.map((w) => (
            <div key={w.id}>
              {w.amount_ml} ml
              <button onClick={() => deleteWater(w.id)}>X</button>
            </div>
          ))}
        </>
      )}

      {activeTab === "perfil" && (
        <>
          <h2>Perfil</h2>

          <input placeholder="Nome" value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
          <input placeholder="Idade" value={profileForm.age} onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })} />
          <input placeholder="Peso" value={profileForm.weight_kg} onChange={(e) => setProfileForm({ ...profileForm, weight_kg: e.target.value })} />
          <input placeholder="Altura" value={profileForm.height_cm} onChange={(e) => setProfileForm({ ...profileForm, height_cm: e.target.value })} />

          <button onClick={saveProfile}>Salvar</button>

          <p>{status}</p>
        </>
      )}
    </div>
  );
}