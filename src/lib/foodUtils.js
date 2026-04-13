export const n = (v) => Number(String(v ?? "").replace(",", ".")) || 0;

export function calcMacros(food, grams) {
  const g = n(grams);
  const factor = g / 100;
  return {
    quantity_g: g,
    calories: Number((n(food.calories_100g) * factor).toFixed(1)),
    protein_g: Number((n(food.protein_100g) * factor).toFixed(1)),
    carbs_g: Number((n(food.carbs_100g) * factor).toFixed(1)),
    fat_g: Number((n(food.fat_100g) * factor).toFixed(1)),
  };
}

export function findFoodByText(text, foods) {
  const q = String(text || "").trim().toLowerCase();
  if (!q) return null;
  return foods.find((food) => {
    const names = [food.name, ...(food.aliases || [])].map((x) => String(x).toLowerCase());
    return names.some((name) => q.includes(name) || name.includes(q));
  }) || null;
}

export function parseSmartEntry(text, foods) {
  const raw = String(text || "").trim().toLowerCase();
  if (!raw) return { food: null, grams: 0, count: 0 };

  const food = findFoodByText(raw, foods);
  if (!food) return { food: null, grams: 0, count: 0 };

  const gramMatch = raw.match(/(\d+[\.,]?\d*)\s*g/);
  if (gramMatch) {
    return { food, grams: n(gramMatch[1]), count: 0 };
  }

  const unitMatch = raw.match(/(\d+[\.,]?\d*)/);
  if (unitMatch && food.unit_weight_g) {
    const count = n(unitMatch[1]);
    return { food, grams: Number((count * n(food.unit_weight_g)).toFixed(1)), count };
  }

  if (food.unit_weight_g) {
    return { food, grams: n(food.unit_weight_g), count: 1 };
  }

  return { food, grams: 100, count: 0 };
}
