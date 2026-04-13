import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { calcMacros, findFoodByText, n, parseSmartEntry } from "../lib/foodUtils";

const TODAY = new Date().toISOString().slice(0, 10);

function Progress({ value, max, color = "green" }) {
  const percent = Math.min(max > 0 ? (value / max) * 100 : 0, 100);

  return (
    <div className="progress-track">
      <div className={`progress-fill ${color}`} style={{ width: `${percent}%` }} />
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
  const [goals, setGoals] = useState({ kcal: 2200, protein: 200, carbs: 220, fat: 65 });
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState("resumo");

  const [slotForm, setSlotForm] = useState({ name: "" });
  const [smartForm, setSmartForm] = useState({ slotId: "", text: "" });
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

  async function loadAll() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const [
      { data: slotData },
      { data: foodData },
      { data: mealData },
      { data: daily },
      { data: waterData },
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
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("log_date", TODAY)
        .maybeSingle(),
      supabase
        .from("water_entries")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", `${TODAY}T00:00:00`)
        .lt("created_at", `${tomorrowStr}T00:00:00`)
        .order("created_at", { ascending: false }),
    ]);

    setSlots(slotData ?? []);
    setFoods(foodData ?? []);
    setMeals(mealData ?? []);
    setWaterEntries(waterData ?? []);

    if (daily) {
      setGoals({
        kcal: daily.kcal_goal ?? 2200,
        protein: daily.protein_goal ?? 200,
        carbs: daily.carb_goal ?? 220,
        fat: daily.fat_goal ?? 65,
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
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [meals]);

  const waterTotalMl = useMemo(() => {
    return waterEntries.reduce((acc, item) => acc + n(item.amount_ml), 0);
  }, [waterEntries]);

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

    const macros = calcMacros(food, manualForm.quantity_g || food.unit_weight_g || 100);

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
    const macros = calcMacros(food, editingMealForm.quantity_g || food.unit_weight_g || 100);

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
    const { error } = await supabase.from("water_entries").delete().eq("id", id);
    setStatus(error ? error.message : "Água removida.");
    await loadAll();
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="app-shell clay-bg">
      <div className="topbar">
        <div>
          <h1>Matheus Tracker v15</h1>
          <p>Claymorphism + edição de comida e água</p>
        </div>
        <button className="clay-btn" onClick={signOut}>Sair</button>
      </div>

      {status && <div className="status-box clay-soft">{status}</div>}

      <div className="tabs">
        {["resumo", "refeicoes", "lancamento"].map((t) => (
          <button
            key={t}
            className={activeTab === t ? "active clay-btn" : "clay-btn"}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "resumo" && (
        <div className="grid-2">
          <div className="card clay-card">
            <h2>Resumo do dia</h2>

            <div className="metric-block">
              <div className="metric-head">
                <strong>Calorias</strong>
                <span>{totals.kcal.toFixed(0)} / {goals.kcal}</span>
              </div>
              <Progress value={totals.kcal} max={goals.kcal} color="green" />
            </div>

            <div className="metric-block">
              <div className="metric-head">
                <strong>Proteína</strong>
                <span>{totals.protein.toFixed(1)}g / {goals.protein}g</span>
              </div>
              <Progress value={totals.protein} max={goals.protein} color="blue" />
            </div>

            <div className="metric-block">
              <div className="metric-head">
                <strong>Carbo</strong>
                <span>{totals.carbs.toFixed(1)}g / {goals.carbs}g</span>
              </div>
              <Progress value={totals.carbs} max={goals.carbs} color="orange" />
            </div>

            <div className="metric-block">
              <div className="metric-head">
                <strong>Gordura</strong>
                <span>{totals.fat.toFixed(1)}g / {goals.fat}g</span>
              </div>
              <Progress value={totals.fat} max={goals.fat} color="purple" />
            </div>

            <div className="metric-block">
              <div className="metric-head">
                <strong>Água</strong>
                <span>{(waterTotalMl / 1000).toFixed(2)}L / 3.00L</span>
              </div>
              <Progress value={waterTotalMl} max={3000} color="cyan" />
            </div>
          </div>

          <div className="card clay-card">
            <h2>Ações rápidas</h2>

            <div className="quick-section">
              <label>Água rápida</label>
              <div className="actions-row">
                <button className="clay-btn" onClick={() => addWater(200)}>+200 ml</button>
                <button className="clay-btn" onClick={() => addWater(300)}>+300 ml</button>
                <button className="clay-btn" onClick={() => addWater(500)}>+500 ml</button>
              </div>

              <div className="custom-water-row">
                <input
                  value={waterInput}
                  onChange={(e) => setWaterInput(e.target.value)}
                  placeholder="Ex.: 750"
                />
                <button className="clay-btn" onClick={addCustomWater}>Adicionar</button>
              </div>
            </div>

            <div className="quick-section">
              <label>Metas</label>
              <div className="grid-2">
                <div>
                  <label>Kcal</label>
                  <input value={goals.kcal} onChange={(e) => setGoals({ ...goals, kcal: e.target.value })} />
                </div>
                <div>
                  <label>Proteína</label>
                  <input value={goals.protein} onChange={(e) => setGoals({ ...goals, protein: e.target.value })} />
                </div>
                <div>
                  <label>Carbo</label>
                  <input value={goals.carbs} onChange={(e) => setGoals({ ...goals, carbs: e.target.value })} />
                </div>
                <div>
                  <label>Gordura</label>
                  <input value={goals.fat} onChange={(e) => setGoals({ ...goals, fat: e.target.value })} />
                </div>
              </div>
              <button className="clay-btn" onClick={saveGoals}>Salvar metas</button>
            </div>
          </div>

          <div className="card clay-card">
            <h2>Últimos registros</h2>

            <div className="last-register-box">
              <div className="last-register-card clay-soft">
                <span className="badge water">Água</span>
                {lastWater ? (
                  <>
                    <strong>{lastWater.amount_ml} ml</strong>
                    <div className="muted">{formatDateTime(lastWater.created_at)}</div>
                  </>
                ) : (
                  <div className="muted">Sem registro</div>
                )}
              </div>

              <div className="last-register-card clay-soft">
                <span className="badge food">Comida</span>
                {lastMeal ? (
                  <>
                    <strong>{lastMeal.food_name}</strong>
                    <div className="muted">{lastMeal.meal_slot_name}</div>
                    <div className="muted">{formatDateTime(lastMeal.created_at)}</div>
                  </>
                ) : (
                  <div className="muted">Sem registro</div>
                )}
              </div>
            </div>
          </div>

          <div className="card clay-card">
            <h2>Água lançada</h2>
            {waterEntries.length === 0 ? (
              <p>Nenhum registro.</p>
            ) : (
              waterEntries.map((item) => (
                <div className="list-item clay-soft" key={item.id}>
                  <div>
                    <strong>{item.amount_ml} ml</strong>
                    <div className="muted">{formatDateTime(item.created_at)}</div>
                  </div>

                  {editingWaterId === item.id ? (
                    <div className="edit-actions">
                      <input
                        value={editingWaterValue}
                        onChange={(e) => setEditingWaterValue(e.target.value)}
                        placeholder="ml"
                      />
                      <button className="clay-btn" onClick={() => saveWaterEdit(item.id)}>Salvar</button>
                      <button className="clay-btn" onClick={() => setEditingWaterId(null)}>Cancelar</button>
                    </div>
                  ) : (
                    <div className="actions-row">
                      <button className="clay-btn" onClick={() => startEditWater(item)}>Editar</button>
                      <button className="clay-btn danger" onClick={() => deleteWater(item.id)}>Excluir</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="card clay-card wide">
            <h2>Comidas lançadas</h2>
            {meals.length === 0 ? (
              <p>Nenhum alimento ainda.</p>
            ) : (
              meals.map((item) => (
                <div className="list-item clay-soft meal-item" key={item.id}>
                  {editingMealId === item.id ? (
                    <div className="meal-edit-box">
                      <div className="grid-2">
                        <div>
                          <label>Refeição</label>
                          <select
                            value={editingMealForm.meal_slot_id}
                            onChange={(e) => setEditingMealForm({ ...editingMealForm, meal_slot_id: e.target.value })}
                          >
                            {slots.map((slot) => (
                              <option key={slot.id} value={slot.id}>
                                {slot.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label>Alimento</label>
                          <input
                            value={editingMealForm.food_name}
                            onChange={(e) => setEditingMealForm({ ...editingMealForm, food_name: e.target.value })}
                          />
                        </div>

                        <div>
                          <label>Peso</label>
                          <input
                            value={editingMealForm.quantity_g}
                            onChange={(e) => setEditingMealForm({ ...editingMealForm, quantity_g: e.target.value })}
                          />
                        </div>

                        <div className="edit-fill-button">
                          <button className="clay-btn" onClick={autofillEditingMeal}>Preencher macros</button>
                        </div>

                        <div>
                          <label>Kcal</label>
                          <input
                            value={editingMealForm.calories}
                            onChange={(e) => setEditingMealForm({ ...editingMealForm, calories: e.target.value })}
                          />
                        </div>

                        <div>
                          <label>Proteína</label>
                          <input
                            value={editingMealForm.protein_g}
                            onChange={(e) => setEditingMealForm({ ...editingMealForm, protein_g: e.target.value })}
                          />
                        </div>

                        <div>
                          <label>Carbo</label>
                          <input
                            value={editingMealForm.carbs_g}
                            onChange={(e) => setEditingMealForm({ ...editingMealForm, carbs_g: e.target.value })}
                          />
                        </div>

                        <div>
                          <label>Gordura</label>
                          <input
                            value={editingMealForm.fat_g}
                            onChange={(e) => setEditingMealForm({ ...editingMealForm, fat_g: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="actions-row top-space">
                        <button className="clay-btn" onClick={() => saveMealEdit(item.id)}>Salvar</button>
                        <button className="clay-btn" onClick={() => setEditingMealId(null)}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <strong>{item.meal_slot_name} • {item.food_name}</strong>
                        <div className="muted">
                          {item.quantity_g} g • {item.calories} kcal • P {item.protein_g} • C {item.carbs_g} • G {item.fat_g}
                        </div>
                        <div className="muted">Registrado em {formatDateTime(item.created_at)}</div>
                      </div>

                      <div className="actions-row">
                        <button className="clay-btn" onClick={() => startEditMeal(item)}>Editar</button>
                        <button className="clay-btn danger" onClick={() => deleteMeal(item.id)}>Excluir</button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "refeicoes" && (
        <div className="grid-2">
          <div className="card clay-card">
            <h2>Tipos de refeição</h2>
            <div className="stack">
              <div>
                <label>Novo tipo</label>
                <input
                  value={slotForm.name}
                  onChange={(e) => setSlotForm({ name: e.target.value })}
                  placeholder="Ex.: pós-treino"
                />
              </div>
              <button className="clay-btn" onClick={addSlot}>Adicionar novo tipo</button>
            </div>
          </div>

          <div className="card clay-card">
            <h2>Editar tipos padrão</h2>
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
      )}

      {activeTab === "lancamento" && (
        <div className="grid-2">
          <div className="card clay-card">
            <h2>Lançamento inteligente</h2>
            <div className="stack">
              <div>
                <label>Refeição</label>
                <select
                  value={smartForm.slotId}
                  onChange={(e) => setSmartForm({ ...smartForm, slotId: e.target.value })}
                >
                  {slots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Digite alimento + peso</label>
                <input
                  value={smartForm.text}
                  onChange={(e) => setSmartForm({ ...smartForm, text: e.target.value })}
                  placeholder="Ex.: 1 ovo cozido, banana 120g, arroz 100g"
                />
              </div>

              <button className="clay-btn" onClick={addSmartMeal}>Adicionar com inteligência</button>
            </div>
          </div>

          <div className="card clay-card">
            <h2>Lançamento manual</h2>
            <div className="stack">
              <div>
                <label>Refeição</label>
                <select
                  value={manualForm.slotId}
                  onChange={(e) => setManualForm({ ...manualForm, slotId: e.target.value })}
                >
                  {slots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Ingrediente</label>
                <input
                  value={manualForm.food_name}
                  onChange={(e) => setManualForm({ ...manualForm, food_name: e.target.value })}
                  placeholder="Ex.: ovo cozido"
                />
              </div>

              <div>
                <label>Peso (g)</label>
                <input
                  value={manualForm.quantity_g}
                  onChange={(e) => setManualForm({ ...manualForm, quantity_g: e.target.value })}
                  placeholder="Ex.: 50"
                />
              </div>

              <button className="clay-btn" onClick={autofillManual}>Preencher macros automaticamente</button>

              <div className="grid-2">
                <div>
                  <label>Kcal</label>
                  <input value={manualForm.calories} onChange={(e) => setManualForm({ ...manualForm, calories: e.target.value })} />
                </div>
                <div>
                  <label>Proteína</label>
                  <input value={manualForm.protein_g} onChange={(e) => setManualForm({ ...manualForm, protein_g: e.target.value })} />
                </div>
                <div>
                  <label>Carbo</label>
                  <input value={manualForm.carbs_g} onChange={(e) => setManualForm({ ...manualForm, carbs_g: e.target.value })} />
                </div>
                <div>
                  <label>Gordura</label>
                  <input value={manualForm.fat_g} onChange={(e) => setManualForm({ ...manualForm, fat_g: e.target.value })} />
                </div>
              </div>

              <button className="clay-btn" onClick={addManualMeal}>Salvar manual</button>
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
          <button className="clay-btn" onClick={() => onRename(slot.id, name)}>Salvar</button>
          {!slot.is_default && <button className="clay-btn danger" onClick={() => onDeactivate(slot.id)}>Remover</button>}
        </div>
      </div>
    </div>
  );
}