// Crop growth stage definitions based on days from planting
export const cropStages: Record<string, { name: string; startDay: number; endDay: number }[]> = {
  Rice: [
    { name: "Germination", startDay: 0, endDay: 7 },
    { name: "Seedling Stage", startDay: 7, endDay: 21 },
    { name: "Tillering Stage", startDay: 21, endDay: 45 },
    { name: "Panicle Initiation", startDay: 45, endDay: 60 },
    { name: "Flowering Stage", startDay: 60, endDay: 75 },
    { name: "Grain Filling", startDay: 75, endDay: 100 },
    { name: "Maturity & Harvest", startDay: 100, endDay: 120 }
  ],
  Tomato: [
    { name: "Germination", startDay: 0, endDay: 7 },
    { name: "Seedling Stage", startDay: 7, endDay: 25 },
    { name: "Vegetative Growth", startDay: 25, endDay: 50 },
    { name: "Flowering Stage", startDay: 50, endDay: 70 },
    { name: "Fruit Development", startDay: 70, endDay: 90 },
    { name: "Ripening Stage", startDay: 90, endDay: 120 },
    { name: "Harvest Stage", startDay: 120, endDay: 130 }
  ],
  Potato: [
    { name: "Sprouting", startDay: 0, endDay: 15 },
    { name: "Vegetative Growth", startDay: 15, endDay: 40 },
    { name: "Tuber Initiation", startDay: 40, endDay: 50 },
    { name: "Tuber Bulking", startDay: 50, endDay: 80 },
    { name: "Maturation", startDay: 80, endDay: 100 },
    { name: "Harvest Stage", startDay: 100, endDay: 120 }
  ],
  Maize: [
    { name: "Germination", startDay: 0, endDay: 7 },
    { name: "Seedling Stage", startDay: 7, endDay: 21 },
    { name: "Vegetative Growth", startDay: 21, endDay: 50 },
    { name: "Tasseling & Silking", startDay: 50, endDay: 65 },
    { name: "Grain Filling", startDay: 65, endDay: 90 },
    { name: "Maturity Stage", startDay: 90, endDay: 110 },
    { name: "Harvest Stage", startDay: 110, endDay: 120 }
  ],
  Grapes: [
    // Grapes are perennial, rough estimation in days for a season
    { name: "Dormancy Stage", startDay: 0, endDay: 30 },
    { name: "Bud Break Stage", startDay: 30, endDay: 45 },
    { name: "Shoot Growth Stage", startDay: 45, endDay: 70 },
    { name: "Flowering Stage", startDay: 70, endDay: 85 },
    { name: "Fruit Set Stage", startDay: 85, endDay: 100 },
    { name: "Berry Development", startDay: 100, endDay: 140 },
    { name: "Veraison (Ripening)", startDay: 140, endDay: 170 },
    { name: "Maturity & Harvest", startDay: 170, endDay: 200 }
  ]
};

export const getCurrentGrowthStage = (crop: string, plantingDate: string) => {
  if (!plantingDate || !crop) return { stageName: "Unknown", progressPercent: 0, daysPassed: 0 };
  
  const plantDate = new Date(plantingDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - plantDate.getTime());
  const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const stages = cropStages[crop];
  if (!stages) return { stageName: "Growing", progressPercent: 50, daysPassed };

  let currentStage = stages[stages.length - 1]; // default to last stage if exceeded
  const totalDays = stages[stages.length - 1].endDay;

  for (const stage of stages) {
    if (daysPassed >= stage.startDay && daysPassed <= stage.endDay) {
      currentStage = stage;
      break;
    }
  }

  const progressPercent = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));

  return {
    stageName: currentStage.name,
    progressPercent,
    daysPassed
  };
};

// Calculate irrigation needs (dummy logic based on temp and humidity)
export const calculateIrrigation = (temp: number, humidity: number, crop: string) => {
  let baseWaterLitersPerHectare = 1000; // Base requirement
  
  if (temp > 30) baseWaterLitersPerHectare += 500; // Hot weather needs more water
  if (humidity > 80) baseWaterLitersPerHectare -= 300; // High humidity needs less water
  
  if (crop === "Rice") baseWaterLitersPerHectare *= 2; // Rice needs lots of water
  if (crop === "Grapes") baseWaterLitersPerHectare *= 0.5; // Grapes need less
  
  return baseWaterLitersPerHectare;
};
