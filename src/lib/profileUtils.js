export function n(v) {
  return Number(String(v ?? "").replace(",", ".")) || 0;
}

export function calcProfileTargets(profile) {
  const weight = n(profile.weight_kg);
  const height = n(profile.height_cm);
  const age = n(profile.age);

  const isMale = (profile.sex || "").toLowerCase() === "masculino";

  const bmr = isMale
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const activityMap = {
    sedentario: 1.2,
    leve: 1.375,
    moderado: 1.55,
    alto: 1.725,
    atleta: 1.9,
  };

  const factor = activityMap[profile.activity_level] || 1.375;
  const maintenance = bmr * factor;

  let calories = maintenance;
  if (profile.goal === "emagrecer") calories -= 400;
  if (profile.goal === "ganhar_massa") calories += 250;

  const protein = profile.goal === "ganhar_massa" ? weight * 2.2 : weight * 2.0;
  const fat = weight * 0.8;
  const carbs = (calories - protein * 4 - fat * 9) / 4;

  return {
    target_calories: Math.round(calories),
    target_protein_g: Math.round(protein),
    target_carbs_g: Math.max(0, Math.round(carbs)),
    target_fat_g: Math.round(fat),
  };
}