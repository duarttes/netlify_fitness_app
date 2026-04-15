import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  calcMacros,
  findFoodByText,
  n,
  parseSmartEntry,
} from "../lib/foodUtils";
import { calcProfileTargets } from "../lib/profileUtils";

const TODAY = new Date().toISOString().slice(0, 10);

function Progress({ value, max, color = "green" }) {
  const percent = Math.min(max > 0 ? (value / max) * 100 : 0, 100);

  return (
    <div className="progress-track">
      <div
        className={`progress-fill ${color}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function FancyBar({ value, max, color }) {
  const percent = Math.min(max > 0 ? (value / max) * 100 : 0, 100);

  return (
    <div className="fancy-bar">
      <div className={`fancy-fill ${color}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DashboardPage({ session }) {
  const userId = session.user.id;

  const [slots, setSlots] = useState([]);
  const [foods, setFoods] = useState([]);
  const [meals, setMeals] = useState([]);
  const [waterEntries, setWaterEntries] = useState([]);
  const [profile, setProfile] = useState(null);
  const [foodSuggestions, setFoodSuggestions] = useState([]);
  const [editingFoodSuggestions, setEditingFoodSuggestions] = useState([]);
  const [supplementCatalog, setSupplementCatalog] = useState([]);
  const [supplementLogs, setSupplementLogs] = useState([]);
  const [batchPreview, setBatchPreview] = useState([]);
  const [supplementForm, setSupplementForm] = useState({
    name: "",
    dosage: "",
  });

  const TAB_ITEMS = [
    { id: "resumo", label: "Resumo" },
    { id: "lancamento", label: "Lançar" },
    { id: "historico", label: "Histórico" },
    { id: "perfil", label: "Perfil" },
  ];

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

  const [slotForm, setSlotForm] = useState({ name: "" });

  const [smartForm, setSmartForm] = useState({
    slotId: "",
    text: "",
  });

  const [manualForm, setManualForm] = useState({
    slotId: "",
    food_name: "",
    quantity_g: "",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
  });

  const [waterInput, setWaterInput] = useState("");

  const [editingMealId, setEditingMealId] = useState(null);
  const [editingMealForm, setEditingMealForm] = useState({
    meal_slot_id: "",
    food_name: "",
    quantity_g: "",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
  });

  const [editingWaterId, setEditingWaterId] = useState(null);
  const [editingWaterValue, setEditingWaterValue] = useState("");

  const [exerciseEntries, setExerciseEntries] = useState([]);
  const [exerciseForm, setExerciseForm] = useState({
    exercise_name: "",
    calories_burned: "",
    notes: "",
  });
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [editingExerciseForm, setEditingExerciseForm] = useState({
    exercise_name: "",
    calories_burned: "",
    notes: "",
  });

  async function loadAll() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const [
      { data: slotData, error: slotError },
      { data: foodData, error: foodError },
      { data: mealData, error: mealError },
      { data: waterData, error: waterError },
      { data: profileData, error: profileError },
      { data: dailyData, error: dailyError },
      { data: exerciseData, error: exerciseError },
      { data: supplementCatalogData, error: supplementCatalogError },
      { data: supplementLogsData, error: supplementLogsError },
    ] = await Promise.all([
      supabase
        .from("meal_slots")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("sort_order"),
      supabase.from("food_catalog").select("*").order("name"),
      supabase
        .from("meal_entries")
        .select("*")
        .eq("user_id", userId)
        .eq("log_date", TODAY)
        .order("created_at", { ascending: false }),
      supabase
        .from("water_entries")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", `${TODAY}T00:00:00`)
        .lt("created_at", `${tomorrowStr}T00:00:00`)
        .order("created_at", { ascending: false }),
      supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("log_date", TODAY)
        .maybeSingle(),
      supabase
        .from("exercise_entries")
        .select("*")
        .eq("user_id", userId)
        .eq("log_date", TODAY)
        .order("created_at", { ascending: false }),
      supabase
        .from("supplement_catalog")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("supplement_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("log_date", TODAY),
    ]);

    const firstError =
      slotError ||
      foodError ||
      mealError ||
      waterError ||
      profileError ||
      dailyError ||
      exerciseError ||
      supplementCatalogError ||
      supplementLogsError;

    if (firstError) {
      console.error(firstError);
      setStatus(firstError.message);
      return;
    }

    setSlots(slotData ?? []);
    setFoods(foodData ?? []);
    setMeals(mealData ?? []);
    setWaterEntries(waterData ?? []);
    setProfile(profileData ?? null);
    setExerciseEntries(exerciseData ?? []);
    setSupplementCatalog(supplementCatalogData ?? []);
    setSupplementLogs(supplementLogsData ?? []);

    if (profileData) {
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

    if (dailyData) {
      setGoals({
        kcal: dailyData.kcal_goal ?? 2200,
        protein: dailyData.protein_goal ?? 200,
        carbs: dailyData.carb_goal ?? 220,
        fat: dailyData.fat_goal ?? 65,
      });
    } else if (profileData) {
      setGoals({
        kcal: profileData.target_calories ?? 2200,
        protein: profileData.target_protein_g ?? 200,
        carbs: profileData.target_carbs_g ?? 220,
        fat: profileData.target_fat_g ?? 65,
      });
    }

    if ((slotData ?? []).length > 0) {
      const first = slotData[0].id;
      setSmartForm((p) => ({ ...p, slotId: p.slotId || first }));
      setManualForm((p) => ({ ...p, slotId: p.slotId || first }));
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
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [meals]);

  const exerciseTotalKcal = useMemo(() => {
    return exerciseEntries.reduce(
      (acc, item) => acc + n(item.calories_burned),
      0,
    );
  }, [exerciseEntries]);

  const netCalories = Math.max(0, totals.kcal - exerciseTotalKcal);

  const waterTotalMl = useMemo(() => {
    return waterEntries.reduce((acc, item) => acc + n(item.amount_ml), 0);
  }, [waterEntries]);

  const historyEntries = useMemo(() => {
    return [
      ...meals.map((item) => ({ ...item, type: "meal" })),
      ...waterEntries.map((item) => ({ ...item, type: "water" })),
      ...exerciseEntries.map((item) => ({ ...item, type: "exercise" })),
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  }, [meals, waterEntries, exerciseEntries]);

  const lastMeal = meals[0] || null;
  const lastWater = waterEntries[0] || null;

  async function saveGoals() {
    const { error } = await supabase.from("daily_logs").upsert({
      user_id: userId,
      log_date: TODAY,
      kcal_goal: n(goals.kcal),
      protein_goal: n(goals.protein),
      carb_goal: n(goals.carbs),
      fat_goal: n(goals.fat),
    });

    setStatus(error ? error.message : "Metas salvas.");
    if (!error) await loadAll();
  }

  function updateFoodSuggestions(value) {
    if (!value.trim()) {
      setFoodSuggestions([]);
      return;
    }

    const q = value.toLowerCase();

    const matches = foods
      .filter((food) => {
        const names = [food.name, ...(food.aliases || [])].map((x) =>
          String(x).toLowerCase(),
        );
        return names.some((name) => name.includes(q));
      })
      .slice(0, 6);

    setFoodSuggestions(matches);
  }

  function updateEditingFoodSuggestions(value) {
    if (!value.trim()) {
      setEditingFoodSuggestions([]);
      return;
    }

    const q = value.toLowerCase();

    const matches = foods
      .filter((food) => {
        const names = [food.name, ...(food.aliases || [])].map((x) =>
          String(x).toLowerCase(),
        );
        return names.some((name) => name.includes(q));
      })
      .slice(0, 6);

    setEditingFoodSuggestions(matches);
  }

  function selectSuggestedFood(food) {
    const macros = calcMacros(
      food,
      manualForm.quantity_g || food.unit_weight_g || 100,
    );

    setManualForm((p) => ({
      ...p,
      food_name: food.name,
      quantity_g: String(macros.quantity_g),
      calories: String(macros.calories),
      protein_g: String(macros.protein_g),
      carbs_g: String(macros.carbs_g),
      fat_g: String(macros.fat_g),
    }));

    setFoodSuggestions([]);
  }

  function selectEditingSuggestedFood(food) {
    const macros = calcMacros(
      food,
      editingMealForm.quantity_g || food.unit_weight_g || 100,
    );

    setEditingMealForm((p) => ({
      ...p,
      food_name: food.name,
      quantity_g: String(macros.quantity_g),
      calories: String(macros.calories),
      protein_g: String(macros.protein_g),
      carbs_g: String(macros.carbs_g),
      fat_g: String(macros.fat_g),
    }));

    setEditingFoodSuggestions([]);
  }

  async function saveProfile() {
    const normalized = {
      ...profileForm,
      age: n(profileForm.age),
      weight_kg: n(profileForm.weight_kg),
      height_cm: n(profileForm.height_cm),
    };

    const targets = calcProfileTargets(normalized);

    const payload = {
      user_id: userId,
      ...normalized,
      ...targets,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("user_profiles").upsert(payload);

    if (error) {
      setStatus(error.message);
      return;
    }

    setGoals({
      kcal: targets.target_calories,
      protein: targets.target_protein_g,
      carbs: targets.target_carbs_g,
      fat: targets.target_fat_g,
    });

    setStatus("Perfil atualizado.");
    await loadAll();
  }

  async function addSlot() {
    if (!slotForm.name.trim()) return;

    const nextOrder = slots.length + 1;
    const { error } = await supabase.from("meal_slots").insert({
      user_id: userId,
      name: slotForm.name.trim(),
      sort_order: nextOrder,
      is_default: false,
      is_active: true,
    });

    setStatus(error ? error.message : "Novo tipo de refeição criado.");
    if (!error) setSlotForm({ name: "" });
    await loadAll();
  }

  async function renameSlot(id, name) {
    const { error } = await supabase
      .from("meal_slots")
      .update({ name })
      .eq("id", id)
      .eq("user_id", userId);

    setStatus(error ? error.message : "Refeição atualizada.");
    await loadAll();
  }

  async function deactivateSlot(id) {
    const { error } = await supabase
      .from("meal_slots")
      .update({ is_active: false })
      .eq("id", id)
      .eq("user_id", userId);

    setStatus(error ? error.message : "Refeição removida.");
    await loadAll();
  }

  async function addSmartMeal() {
    const slot = slots.find((s) => s.id === smartForm.slotId);
    if (!slot) return setStatus("Selecione a refeição.");

    const parsed = parseSmartEntry(smartForm.text, foods);
    if (!parsed.food) return setStatus("Não encontrei esse alimento na base.");

    const macros = calcMacros(parsed.food, parsed.grams);

    const { error } = await supabase.from("meal_entries").insert({
      user_id: userId,
      log_date: TODAY,
      meal_slot: slot.name,
      meal_slot_id: slot.id,
      meal_slot_name: slot.name,
      food_name: parsed.food.name,
      quantity_g: macros.quantity_g,
      calories: macros.calories,
      protein_g: macros.protein_g,
      carbs_g: macros.carbs_g,
      fat_g: macros.fat_g,
      source: "smart",
    });

    setStatus(error ? error.message : "Alimento adicionado.");
    if (!error) setSmartForm({ ...smartForm, text: "" });
    await loadAll();
  }

  async function addManualMeal() {
    const slot = slots.find((s) => s.id === manualForm.slotId);
    if (!slot) return setStatus("Selecione a refeição.");

    const { error } = await supabase.from("meal_entries").insert({
      user_id: userId,
      log_date: TODAY,
      meal_slot: slot.name,
      meal_slot_id: slot.id,
      meal_slot_name: slot.name,
      food_name: manualForm.food_name,
      quantity_g: n(manualForm.quantity_g),
      calories: n(manualForm.calories),
      protein_g: n(manualForm.protein_g),
      carbs_g: n(manualForm.carbs_g),
      fat_g: n(manualForm.fat_g),
      source: "manual",
    });

    setStatus(error ? error.message : "Alimento manual salvo.");
    if (!error) {
      setManualForm((p) => ({
        ...p,
        food_name: "",
        quantity_g: "",
        calories: "",
        protein_g: "",
        carbs_g: "",
        fat_g: "",
      }));
    }
    await loadAll();
  }

  function autofillManual() {
    const food = findFoodByText(manualForm.food_name, foods);
    if (!food) return setStatus("Não encontrei esse alimento.");

    const macros = calcMacros(
      food,
      manualForm.quantity_g || food.unit_weight_g || 100,
    );

    setManualForm((p) => ({
      ...p,
      food_name: food.name,
      quantity_g: String(macros.quantity_g),
      calories: String(macros.calories),
      protein_g: String(macros.protein_g),
      carbs_g: String(macros.carbs_g),
      fat_g: String(macros.fat_g),
    }));
    setStatus("Macros preenchidos.");
  }

  function startEditMeal(item) {
    setEditingMealId(item.id);
    setEditingMealForm({
      meal_slot_id: item.meal_slot_id || "",
      food_name: item.food_name || "",
      quantity_g: String(item.quantity_g || ""),
      calories: String(item.calories || ""),
      protein_g: String(item.protein_g || ""),
      carbs_g: String(item.carbs_g || ""),
      fat_g: String(item.fat_g || ""),
    });
  }

  function autofillEditingMeal() {
    const food = findFoodByText(editingMealForm.food_name, foods);
    if (!food) return setStatus("Não encontrei esse alimento.");
    const macros = calcMacros(
      food,
      editingMealForm.quantity_g || food.unit_weight_g || 100,
    );

    setEditingMealForm((p) => ({
      ...p,
      food_name: food.name,
      quantity_g: String(macros.quantity_g),
      calories: String(macros.calories),
      protein_g: String(macros.protein_g),
      carbs_g: String(macros.carbs_g),
      fat_g: String(macros.fat_g),
    }));
    setStatus("Macros da edição preenchidos.");
  }

  async function saveMealEdit(id) {
    const slot = slots.find((s) => s.id === editingMealForm.meal_slot_id);
    if (!slot) return setStatus("Selecione a refeição.");

    const { error } = await supabase
      .from("meal_entries")
      .update({
        meal_slot: slot.name,
        meal_slot_id: slot.id,
        meal_slot_name: slot.name,
        food_name: editingMealForm.food_name,
        quantity_g: n(editingMealForm.quantity_g),
        calories: n(editingMealForm.calories),
        protein_g: n(editingMealForm.protein_g),
        carbs_g: n(editingMealForm.carbs_g),
        fat_g: n(editingMealForm.fat_g),
      })
      .eq("id", id)
      .eq("user_id", userId);

    setStatus(error ? error.message : "Alimento atualizado.");
    if (!error) setEditingMealId(null);
    await loadAll();
  }

  async function deleteMeal(id) {
    const { error } = await supabase.from("meal_entries").delete().eq("id", id);
    setStatus(error ? error.message : "Alimento removido.");
    await loadAll();
  }

  async function addWater(amountMl) {
    const { error } = await supabase.from("water_entries").insert({
      user_id: userId,
      amount_ml: amountMl,
    });

    setStatus(error ? error.message : "Água adicionada.");
    await loadAll();
  }

  async function addCustomWater() {
    const value = n(waterInput);
    if (!value) return;
    await addWater(value);
    setWaterInput("");
  }

  function startEditWater(item) {
    setEditingWaterId(item.id);
    setEditingWaterValue(String(item.amount_ml || ""));
  }

  async function saveWaterEdit(id) {
    const { error } = await supabase
      .from("water_entries")
      .update({ amount_ml: n(editingWaterValue) })
      .eq("id", id)
      .eq("user_id", userId);

    setStatus(error ? error.message : "Água atualizada.");
    if (!error) {
      setEditingWaterId(null);
      setEditingWaterValue("");
    }
    await loadAll();
  }

  async function deleteWater(id) {
    const { error } = await supabase
      .from("water_entries")
      .delete()
      .eq("id", id);
    setStatus(error ? error.message : "Água removida.");
    await loadAll();
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function addExercise() {
    if (!exerciseForm.exercise_name.trim()) return;

    const { error } = await supabase.from("exercise_entries").insert({
      user_id: userId,
      log_date: TODAY,
      exercise_name: exerciseForm.exercise_name,
      calories_burned: n(exerciseForm.calories_burned),
      notes: exerciseForm.notes,
    });

    setStatus(error ? error.message : "Exercício salvo.");
    if (!error) {
      setExerciseForm({ exercise_name: "", calories_burned: "", notes: "" });
    }
    await loadAll();
  }

  function startEditExercise(item) {
    setEditingExerciseId(item.id);
    setEditingExerciseForm({
      exercise_name: item.exercise_name || "",
      calories_burned: String(item.calories_burned || ""),
      notes: item.notes || "",
    });
  }

  async function saveExerciseEdit(id) {
    const { error } = await supabase
      .from("exercise_entries")
      .update({
        exercise_name: editingExerciseForm.exercise_name,
        calories_burned: n(editingExerciseForm.calories_burned),
        notes: editingExerciseForm.notes,
      })
      .eq("id", id)
      .eq("user_id", userId);

    setStatus(error ? error.message : "Exercício atualizado.");
    if (!error) setEditingExerciseId(null);
    await loadAll();
  }

  async function deleteExercise(id) {
    const { error } = await supabase
      .from("exercise_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    setStatus(error ? error.message : "Exercício removido.");
    await loadAll();
  }

  async function addSupplementToCatalog() {
    if (!supplementForm.name.trim()) return;

    const { error } = await supabase.from("supplement_catalog").insert({
      user_id: userId,
      name: supplementForm.name,
      dosage: supplementForm.dosage,
    });

    setStatus(error ? error.message : "Suplemento cadastrado.");
    if (!error) {
      setSupplementForm({ name: "", dosage: "" });
    }
    await loadAll();
  }

  function supplementCheckedToday(supplementId) {
    return supplementLogs.find(
      (item) => item.supplement_id === supplementId && item.checked,
    );
  }

  async function toggleSupplementCheck(supplement) {
    const existing = supplementLogs.find(
      (item) => item.supplement_id === supplement.id,
    );

    if (existing) {
      const { error } = await supabase
        .from("supplement_logs")
        .update({
          checked: !existing.checked,
          checked_at: !existing.checked ? new Date().toISOString() : null,
        })
        .eq("id", existing.id);

      setStatus(error ? error.message : "Checklist atualizado.");
    } else {
      const { error } = await supabase.from("supplement_logs").insert({
        user_id: userId,
        supplement_id: supplement.id,
        log_date: TODAY,
        checked: true,
        checked_at: new Date().toISOString(),
      });

      setStatus(error ? error.message : "Checklist atualizado.");
    }

    await loadAll();
  }

  async function deleteSupplementCatalog(id) {
    const { error } = await supabase
      .from("supplement_catalog")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    setStatus(error ? error.message : "Suplemento removido.");
    await loadAll();
  }

  const FOOD_DB = [
    { name: "ovo", kcal: 70, protein: 6, carbs: 1, fat: 5, unit: "unit" },
    { name: "banana", kcal: 89, protein: 1.1, carbs: 23, fat: 0.3, unit: "g" },
    { name: "arroz", kcal: 130, protein: 2.5, carbs: 28, fat: 0.3, unit: "g" },
    { name: "feijao", kcal: 77, protein: 5, carbs: 14, fat: 0.5, unit: "g" },
    { name: "frango", kcal: 165, protein: 31, carbs: 0, fat: 3.6, unit: "g" },
    { name: "pao", kcal: 265, protein: 9, carbs: 49, fat: 3.2, unit: "g" },
  ];

      function normalize(text) {
      return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();
    }

    function parseBatchInput(text) {
      return text
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    function extractQuantity(item) {
      const matchG = item.match(/(\d+)\s*g/);
      if (matchG) {
        return { value: Number(matchG[1]), unit: "g" };
      }

      const matchUnit = item.match(/(\d+)\s*(un|ovo|ovos|banana|maça|maca)?/);
      if (matchUnit) {
        return { value: Number(matchUnit[1]), unit: "unit" };
      }

      return { value: 100, unit: "g" }; // default
    }

      function findFood(name) {
        const normalized = normalize(name);

        return FOOD_DB.find((f) =>
          normalized.includes(f.name)
        );
      }

      function processBatch(text) {
        const items = parseBatchInput(text);

        return items.map((item) => {
          const qty = extractQuantity(item);
          const food = findFood(item);

          if (!food) {
            return {
              name: item,
              error: true,
            };
          }

          let factor = 1;

          if (food.unit === "g") {
            factor = qty.value / 100;
          } else {
            factor = qty.value;
          }

          return {
            name: food.name,
            qty: qty.value,
            kcal: food.kcal * factor,
            protein: food.protein * factor,
            carbs: food.carbs * factor,
            fat: food.fat * factor,
          };
        });
      }

  return (
    <div className="app-shell clay-bg">
      <div className="topbar">
        <div>
          <h1>Duarttes FIT</h1>
        </div>
        <button className="clay-btn" onClick={signOut}>
          Sair
        </button>
      </div>

      {status && <div className="status-box clay-soft">{status}</div>}

      <div className="tabs">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.id}
            className={
              activeTab === tab.id
                ? "active clay-btn tab-btn"
                : "clay-btn tab-btn"
            }
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "resumo" && (
        <div className="summary-layout">
          <div className="card clay-card summary-hero">
            <div className="section-head">
              <h2>Resumo do dia</h2>
              <span className="section-badge">Hoje</span>
            </div>

            {profile && (
              <div className="profile-summary clay-soft">
                <strong>{profile.full_name || "Perfil"}</strong>
                <div className="muted">
                  {profile.weight_kg}kg • {profile.height_cm}cm • {profile.age}{" "}
                  anos
                </div>
                <div className="muted">
                  Objetivo: {profile.goal} • Atividade: {profile.activity_level}
                </div>
              </div>
            )}

            <div className="metric-grid">
              <div className="metric-card clay-soft">
                <div className="metric-title">Consumidas</div>
                <div className="metric-value">{totals.kcal.toFixed(0)}</div>
                <div className="metric-subtext">
                  {Math.max(goals.kcal - totals.kcal, 0).toFixed(0)} kcal
                  restantes
                </div>
                <FancyBar value={totals.kcal} max={goals.kcal} color="green" />
              </div>

              <div className="metric-card clay-soft">
                <div className="metric-title">Gastas</div>
                <div className="metric-value">
                  {exerciseTotalKcal.toFixed(0)}
                </div>
                <div className="metric-subtext">Treino e atividades</div>
                <FancyBar
                  value={exerciseTotalKcal}
                  max={goals.kcal}
                  color="orange"
                />
              </div>

              <div className="metric-card clay-soft">
                <div className="metric-title">Líquidas</div>
                <div className="metric-value">{netCalories.toFixed(0)}</div>
                <div className="metric-subtext">Saldo do dia</div>
                <FancyBar value={netCalories} max={goals.kcal} color="blue" />
              </div>

              <div className="metric-card clay-soft">
                <div className="metric-title">Proteína</div>
                <div className="metric-value">{totals.protein.toFixed(1)}g</div>
                <div className="metric-subtext">
                  {Math.max(goals.protein - totals.protein, 0).toFixed(1)}g
                  restantes
                </div>
                <FancyBar
                  value={totals.protein}
                  max={goals.protein}
                  color="purple"
                />
              </div>

              <div className="metric-card clay-soft">
                <div className="metric-title">Água</div>
                <div className="metric-value">
                  {(waterTotalMl / 1000).toFixed(2)}L
                </div>
                <div className="metric-subtext">
                  {Math.min((waterTotalMl / 3000) * 100, 100).toFixed(0)}% da
                  meta
                </div>
                <FancyBar value={waterTotalMl} max={3000} color="cyan" />
              </div>
            </div>
          </div>

          <div className="summary-main">
            <div className="card clay-card quick-card">
              <div className="section-head">
                <h2>Ações rápidas</h2>
                <span className="section-badge">Água</span>
              </div>

              <div className="quick-water-buttons">
                <button
                  className="clay-btn"
                  onClick={() => addWater(200)}
                  type="button"
                >
                  +200 ml
                </button>
                <button
                  className="clay-btn"
                  onClick={() => addWater(300)}
                  type="button"
                >
                  +300 ml
                </button>
                <button
                  className="clay-btn"
                  onClick={() => addWater(500)}
                  type="button"
                >
                  +500 ml
                </button>
              </div>

              <div className="quick-inline">
                <input
                  value={waterInput}
                  onChange={(e) => setWaterInput(e.target.value)}
                  placeholder="Quantidade em ml"
                />
                <button
                  className="clay-btn"
                  onClick={addCustomWater}
                  type="button"
                >
                  Adicionar
                </button>
              </div>

              <button
                className="clay-btn small-btn"
                onClick={saveGoals}
                type="button"
              >
                Salvar metas
              </button>
            </div>
          </div>

          <div className="summary-side">
            <div className="card clay-card">
              <div className="section-head">
                <h2>Últimos registros</h2>
                <span className="section-badge">Hoje</span>
              </div>

              <div className="last-row">
                <div className="last-register-card clay-soft">
                  <span className="badge water">Água</span>
                  {lastWater ? (
                    <>
                      <strong>{lastWater.amount_ml} ml</strong>
                      <div className="muted">
                        {formatDateTime(lastWater.created_at)}
                      </div>
                    </>
                  ) : (
                    <div className="muted">Sem água registrada hoje</div>
                  )}
                </div>

                <div className="last-register-card clay-soft">
                  <span className="badge food">Comida</span>
                  {lastMeal ? (
                    <>
                      <strong>{lastMeal.food_name}</strong>
                      <div className="muted">{lastMeal.meal_slot_name}</div>
                      <div className="muted">
                        {formatDateTime(lastMeal.created_at)}
                      </div>
                    </>
                  ) : (
                    <div className="muted">
                      Nenhuma refeição registrada hoje
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card clay-card supplement-card">
              <div className="section-head">
                <h2>Suplementos do dia</h2>
                <span className="section-count">
                  {supplementCatalog.length}
                </span>
              </div>

              <div className="supplement-grid">
                {supplementCatalog.length === 0 ? (
                  <p>Nenhum suplemento cadastrado.</p>
                ) : (
                  supplementCatalog.map((item) => {
                    const checked = supplementCheckedToday(item.id);

                    return (
                      <button
                        key={item.id}
                        className={`supp-pill ${checked ? "checked" : ""}`}
                        onClick={() => toggleSupplementCheck(item)}
                        type="button"
                      >
                        <strong>{item.name}</strong>
                        <span>{item.dosage || "Sem dosagem"}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "lancamento" && (
        <div className="launch-layout">
          <div className="launch-main">
            <div className="card clay-card">
              <div className="section-head">
                <h2>Lançar alimento</h2>
                <span className="section-badge">Hoje</span>
              </div>

              <div className="launch-stack">
                <div className="launch-card clay-soft">
                  <div className="section-head section-head-sm">
                    <h3>Lançamento inteligente</h3>
                    <span className="section-mini">rápido</span>
                  </div>

                  <div className="stack">
                    <div>
                      <label>Refeição</label>

                      <div className="inline-slot-row">
                        <select
                          value={smartForm.slotId}
                          onChange={(e) =>
                            setSmartForm({
                              ...smartForm,
                              slotId: e.target.value,
                            })
                          }
                        >
                          {slots.map((slot) => (
                            <option key={slot.id} value={slot.id}>
                              {slot.name}
                            </option>
                          ))}
                        </select>

                        <div className="inline-create-row">
                          <input
                            value={slotForm.name}
                            onChange={(e) =>
                              setSlotForm({ name: e.target.value })
                            }
                            placeholder="Nova refeição"
                          />
                            {batchPreview.length > 0 && (
                            <div className="card clay-soft">
                              <h3>Preview</h3>

                              {batchPreview.map((item, idx) => (
                                <div key={idx} className="list-item">
                                  {item.error ? (
                                    <span style={{ color: "red" }}>
                                      ❌ {item.name} não encontrado
                                    </span>
                                  ) : (
                                    <>
                                      <strong>{item.name}</strong> ({item.qty})
                                      <div className="muted">
                                        {item.kcal.toFixed(0)} kcal • P {item.protein.toFixed(1)}
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}

                              <div style={{ marginTop: 10 }}>
                                <strong>
                                  Total:{" "}
                                  {batchPreview
                                    .reduce((sum, i) => sum + (i.kcal || 0), 0)
                                    .toFixed(0)} kcal
                                </strong>
                              </div>
                            </div>
                              )}
                            <button
                              className="clay-btn"
                              onClick={() => {
                                batchPreview.forEach((item) => {
                                  if (!item.error) {
                                    addManualMeal({
                                      food_name: item.name,
                                      calories: item.kcal,
                                      protein_g: item.protein,
                                      carbs_g: item.carbs,
                                      fat_g: item.fat,
                                    });
                                  }
                                });

                                setBatchPreview([]);
                                setSmartForm({ ...smartForm, text: "" });
                              }}
                            >
                              Salvar refeição
                            </button>  
                        </div>
                      </div>
                    </div>

                    <div>
                      <label>Digite alimento + peso</label>
                      <textarea
                        rows={4}
                        value={smartForm.text}
                        onChange={(e) =>
                          setSmartForm({ ...smartForm, text: e.target.value })
                        }
                        placeholder="Ex.: 1 ovo cozido, banana 120g, arroz 100g"
                      />
                      <div className="helper-text">
                        Exemplos: 2 ovos, banana 120g, arroz 100g
                      </div>
                    </div>

                    <div>
                                                  <button
                              className="clay-btn"
                              onClick={() => {
                                const result = processBatch(smartForm.text);
                                setBatchPreview(result);
                              }}
                            >
                              Analisar alimentos
                            </button>                    
                      
                      <div className="action-row">
                        <button
                          className="clay-btn"
                          type="button"
                          onClick={addSmartMeal}
                        >
                          Adicionar com inteligência
                        </button>
                    </div> 
                    
                    </div>

                  
                  </div>
                </div>

                <div className="launch-card clay-soft">
                  <div className="section-head section-head-sm">
                    <h3>Lançamento manual</h3>
                    <span className="section-mini">controle total</span>
                  </div>

                  <div className="stack">
                    <div>
                      <label>Refeição</label>

                      <div className="inline-slot-row">
                        <select
                          value={manualForm.slotId}
                          onChange={(e) =>
                            setManualForm({
                              ...manualForm,
                              slotId: e.target.value,
                            })
                          }
                        >
                          {slots.map((slot) => (
                            <option key={slot.id} value={slot.id}>
                              {slot.name}
                            </option>
                          ))}
                        </select>

                        <div className="inline-create-row">
                          <input
                            value={slotForm.name}
                            onChange={(e) =>
                              setSlotForm({ name: e.target.value })
                            }
                            placeholder="Nova refeição"
                          />
                          <button
                            className="clay-btn icon-btn"
                            type="button"
                            onClick={addSlot}
                            aria-label="Criar refeição"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label>Ingrediente</label>
                      <input
                        value={manualForm.food_name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setManualForm({ ...manualForm, food_name: value });
                          updateFoodSuggestions(value);
                        }}
                        placeholder="Ex.: ovo cozido"
                      />

                      {foodSuggestions.length > 0 && (
                        <div className="suggestions-box">
                          {foodSuggestions.map((food) => (
                            <button
                              key={food.name}
                              className="suggestion-item"
                              type="button"
                              onClick={() => selectSuggestedFood(food)}
                            >
                              <strong>{food.name}</strong>
                              <span>
                                {food.calories_100g} kcal • P{" "}
                                {food.protein_100g} • C {food.carbs_100g} • G{" "}
                                {food.fat_100g}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="manual-grid">
                      <div>
                        <label>Peso (g)</label>
                        <input
                          value={manualForm.quantity_g}
                          onChange={(e) =>
                            setManualForm({
                              ...manualForm,
                              quantity_g: e.target.value,
                            })
                          }
                          placeholder="Ex.: 50"
                        />
                      </div>

                      <div className="manual-grid-actions">
                        <label className="label-hidden">Ação</label>
                        <button
                          className="clay-btn"
                          type="button"
                          onClick={autofillManual}
                        >
                          Preencher macros automaticamente
                        </button>
                      </div>
                    </div>

                    <div className="macro-grid">
                      <div>
                        <label>Kcal</label>
                        <input
                          value={manualForm.calories}
                          onChange={(e) =>
                            setManualForm({
                              ...manualForm,
                              calories: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label>Proteína</label>
                        <input
                          value={manualForm.protein_g}
                          onChange={(e) =>
                            setManualForm({
                              ...manualForm,
                              protein_g: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label>Carbo</label>
                        <input
                          value={manualForm.carbs_g}
                          onChange={(e) =>
                            setManualForm({
                              ...manualForm,
                              carbs_g: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label>Gordura</label>
                        <input
                          value={manualForm.fat_g}
                          onChange={(e) =>
                            setManualForm({
                              ...manualForm,
                              fat_g: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="action-row">
                      <button
                        className="clay-btn"
                        type="button"
                        onClick={addManualMeal}
                      >
                        Salvar manual
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="launch-side">
            <div className="card clay-card">
              <div className="section-head">
                <h2>Refeições</h2>
                <span className="section-count">{slots.length}</span>
              </div>

              <div className="stack">
                {slots.map((slot) => (
                  <EditableSlot
                    key={slot.id}
                    slot={slot}
                    onRename={renameSlot}
                    onDeactivate={deactivateSlot}
                  />
                ))}
              </div>
            </div>

            <div className="card clay-card">
              <div className="section-head">
                <h2>Suplementos</h2>
                <span className="section-badge">rotina</span>
              </div>

              <div className="stack">
                <div className="supplement-form-grid">
                  <div>
                    <label>Nome</label>
                    <input
                      value={supplementForm.name}
                      onChange={(e) =>
                        setSupplementForm({
                          ...supplementForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="Ex.: Creatina"
                    />
                  </div>

                  <div>
                    <label>Dosagem</label>
                    <input
                      value={supplementForm.dosage}
                      onChange={(e) =>
                        setSupplementForm({
                          ...supplementForm,
                          dosage: e.target.value,
                        })
                      }
                      placeholder="Ex.: 5g, 2 cápsulas"
                    />
                  </div>
                </div>

                <div className="action-row">
                  <button
                    className="clay-btn"
                    type="button"
                    onClick={addSupplementToCatalog}
                  >
                    Adicionar à rotina
                  </button>
                </div>

                <div className="supplement-manage-list">
                  {supplementCatalog.length === 0 ? (
                    <p className="muted">Nenhum item cadastrado.</p>
                  ) : (
                    supplementCatalog.map((item) => {
                      const checked = supplementCheckedToday(item.id);

                      return (
                        <div key={item.id} className="manage-item clay-soft">
                          <div className="manage-item-body">
                            <strong>{item.name}</strong>
                            <div className="muted">
                              {item.dosage || "Sem dosagem"}
                            </div>
                            {checked?.checked_at && (
                              <div className="muted">
                                Tomado: {formatDateTime(checked.checked_at)}
                              </div>
                            )}
                          </div>

                          <div className="manage-item-actions">
                            <button
                              className="clay-btn"
                              type="button"
                              onClick={() => toggleSupplementCheck(item)}
                            >
                              {checked ? "Tomado" : "Marcar"}
                            </button>

                            <button
                              className="clay-btn danger-btn"
                              type="button"
                              onClick={() => deleteSupplementCatalog(item.id)}
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="card clay-card">
              <div className="section-head">
                <h2>Exercícios rápidos</h2>
                <span className="section-badge">gasto</span>
              </div>

              <div className="quick-exercise-buttons">
                <button
                  className="clay-btn"
                  type="button"
                  onClick={() =>
                    setExerciseForm((prev) => ({
                      ...prev,
                      exercise_name: "Musculação",
                      calories_burned: "250",
                    }))
                  }
                >
                  Musculação
                </button>
                <button
                  className="clay-btn"
                  type="button"
                  onClick={() =>
                    setExerciseForm((prev) => ({
                      ...prev,
                      exercise_name: "Esteira",
                      calories_burned: "150",
                    }))
                  }
                >
                  Esteira
                </button>
                <button
                  className="clay-btn"
                  type="button"
                  onClick={() =>
                    setExerciseForm((prev) => ({
                      ...prev,
                      exercise_name: "Bike",
                      calories_burned: "200",
                    }))
                  }
                >
                  Bike
                </button>
              </div>

              <div className="exercise-inline">
                <input
                  value={exerciseForm.exercise_name}
                  onChange={(e) =>
                    setExerciseForm({
                      ...exerciseForm,
                      exercise_name: e.target.value,
                    })
                  }
                  placeholder="Ex.: Escada"
                />
                <input
                  value={exerciseForm.calories_burned}
                  onChange={(e) =>
                    setExerciseForm({
                      ...exerciseForm,
                      calories_burned: e.target.value,
                    })
                  }
                  placeholder="kcal"
                />
                <button
                  className="clay-btn icon-btn"
                  type="button"
                  onClick={addExercise}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "historico" && (
        <div className="grid-2">
          <div className="card clay-card">
            <div className="section-head">
              <h2>Últimos lançamentos</h2>
              <span className="section-badge">5 itens</span>
            </div>

            {historyEntries.length === 0 ? (
              <p>Nenhum lançamento ainda.</p>
            ) : (
              <div className="list">
                {historyEntries.map((item) => (
                  <div className="list-item clay-soft compact-item" key={`${item.type}-${item.id}`}>
                    <div className="list-item-header">
                      <strong>
                        {item.type === "meal" && item.food_name}
                        {item.type === "water" && `${item.amount_ml} ml de água`}
                        {item.type === "exercise" && item.exercise_name}
                      </strong>
                      <span className="muted">{formatDateTime(item.created_at)}</span>
                    </div>

                    <div className="muted">
                      {item.type === "meal" &&
                        `${item.meal_slot_name} • ${item.quantity_g} g • ${item.calories} kcal`}
                      {item.type === "water" && "Hidratação"}
                      {item.type === "exercise" &&
                        `${item.calories_burned} kcal${item.notes ? ` • ${item.notes}` : ""}`}
                    </div>

                    <div className="actions-row">
                      {item.type === "meal" && (
                        <>
                          <button
                            className="clay-btn"
                            onClick={() => startEditMeal(item)}
                            type="button"
                          >
                            Editar
                          </button>
                          <button
                            className="clay-btn danger"
                            onClick={() => deleteMeal(item.id)}
                            type="button"
                          >
                            Excluir
                          </button>
                        </>
                      )}

                      {item.type === "water" && (
                        <>
                          <button
                            className="clay-btn"
                            onClick={() => startEditWater(item)}
                            type="button"
                          >
                            Editar
                          </button>
                          <button
                            className="clay-btn danger"
                            onClick={() => deleteWater(item.id)}
                            type="button"
                          >
                            Excluir
                          </button>
                        </>
                      )}

                      {item.type === "exercise" && (
                        <>
                          <button
                            className="clay-btn"
                            onClick={() => startEditExercise(item)}
                            type="button"
                          >
                            Editar
                          </button>
                          <button
                            className="clay-btn danger"
                            onClick={() => deleteExercise(item.id)}
                            type="button"
                          >
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card clay-card">
            <div className="section-head">
              <h2>Resumo do histórico</h2>
              <span className="section-badge">Hoje</span>
            </div>

            <div className="stack">
              <div className="metric-block">
                <div className="metric-head">
                  <strong>Comidas</strong>
                  <span>{meals.length}</span>
                </div>
              </div>

              <div className="metric-block">
                <div className="metric-head">
                  <strong>Água</strong>
                  <span>{waterEntries.length}</span>
                </div>
              </div>

              <div className="metric-block">
                <div className="metric-head">
                  <strong>Exercícios</strong>
                  <span>{exerciseEntries.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "perfil" && (
        <div className="grid-2">
          <div className="card clay-card">
            <h2>Perfil</h2>

            <div className="stack">
              <div>
                <label>Nome</label>
                <input
                  value={profileForm.full_name}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      full_name: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Sexo</label>
                <select
                  value={profileForm.sex}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, sex: e.target.value })
                  }
                >
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
              </div>

              <div>
                <label>Idade</label>
                <input
                  value={profileForm.age}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, age: e.target.value })
                  }
                />
              </div>

              <div>
                <label>Peso (kg)</label>
                <input
                  value={profileForm.weight_kg}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      weight_kg: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Altura (cm)</label>
                <input
                  value={profileForm.height_cm}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      height_cm: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label>Nível de atividade</label>
                <select
                  value={profileForm.activity_level}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      activity_level: e.target.value,
                    })
                  }
                >
                  <option value="sedentario">Sedentário</option>
                  <option value="leve">Leve</option>
                  <option value="moderado">Moderado</option>
                  <option value="alto">Alto</option>
                  <option value="atleta">Atleta</option>
                </select>
              </div>

              <div>
                <label>Objetivo</label>
                <select
                  value={profileForm.goal}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, goal: e.target.value })
                  }
                >
                  <option value="emagrecer">Emagrecer</option>
                  <option value="manter">Manutenção</option>
                  <option value="ganhar_massa">Ganhar massa magra</option>
                </select>
              </div>

              <button className="clay-btn" onClick={saveProfile}>
                Salvar perfil e recalcular metas
              </button>
            </div>
          </div>

          <div className="card clay-card">
            <h2>Metas calculadas</h2>

            <div className="metric-block">
              <div className="metric-head">
                <strong>Calorias</strong>
                <span>{goals.kcal}</span>
              </div>
            </div>

            <div className="metric-block">
              <div className="metric-head">
                <strong>Proteína</strong>
                <span>{goals.protein}g</span>
              </div>
            </div>

            <div className="metric-block">
              <div className="metric-head">
                <strong>Carbo</strong>
                <span>{goals.carbs}g</span>
              </div>
            </div>

            <div className="metric-block">
              <div className="metric-head">
                <strong>Gordura</strong>
                <span>{goals.fat}g</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditableSlot({ slot, onRename, onDeactivate }) {
  const [name, setName] = useState(slot.name);

  return (
    <div className="list-item clay-soft">
      <div>
        <strong>{slot.is_default ? "Padrão" : "Personalizado"}</strong>
      </div>
      <div className="grid-2 top-space slot-edit-grid">
        <div>
          <label>Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="actions-row">
          <button className="clay-btn" onClick={() => onRename(slot.id, name)}>
            Salvar
          </button>
          {!slot.is_default && (
            <button
              className="clay-btn danger"
              onClick={() => onDeactivate(slot.id)}
            >
              Remover
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
