import { Platform, Alert } from 'react-native';
import { COLORS } from './theme';
import { EXERCISE_DB } from './database';

const initialFoodDB = [
  { id: 'f1', name: 'Hähnchen (100g)', kcal: 165, p: 31, c: 0, f: 3.6, micros: { zn: 1, mg: 25 }, tags: ['protein', 'dinner'] },
  { id: 'f2', name: 'Reis (200g)', kcal: 260, p: 5, c: 56, f: 0.5, micros: { mg: 30 }, tags: ['carbs', 'lunch'] },
  { id: 'f3', name: 'Ei (Stk)', kcal: 70, p: 6, c: 0.6, f: 5, micros: { zn: 0.6 }, tags: ['fat', 'breakfast'] },
  { id: 'f4', name: 'Whey Shake', kcal: 110, p: 24, c: 2, f: 1, micros: { ca: 100 }, tags: ['protein', 'snack'] },
  { id: 'f5', name: 'Haferflocken (50g)', kcal: 180, p: 7, c: 30, f: 3.5, micros: { mg: 60, zn: 1.5 }, tags: ['carbs', 'breakfast'] },
  { id: 'f6', name: 'Magerquark (250g)', kcal: 170, p: 30, c: 10, f: 1, micros: { ca: 250 }, tags: ['protein', 'dinner'] },
];

export const initialState = {
  user: { name: 'Champ', goals: { kcal: 3200, p: 200, c: 350, f: 90, zn: 15, mg: 400 } },
  foodLog: [],
  history: [],
  prs: {},
  activeWorkout: null,
  foodDB: initialFoodDB,
  muscleIntensity: {}, // e.g. { Brust: 0.8, Rücken: 0.5 }
};

export function appReducer(state, action) {
  switch (action.type) {
    case 'ADD_FOOD':
      return { ...state, foodLog: [...state.foodLog, { ...action.payload, timestamp: Date.now() }] };
    case 'ADD_CUSTOM_FOOD':
      const newFood = { ...action.payload, id: `f${Date.now()}`, micros: {}, tags: [] };
      return {
        ...state,
        foodDB: [...state.foodDB, newFood],
        foodLog: [...state.foodLog, { ...newFood, timestamp: Date.now() }],
      };
    case 'START_WORKOUT':
      return { ...state, activeWorkout: { ...action.payload, startTime: Date.now() } };
    case 'ADD_EXERCISE':
      return { ...state, activeWorkout: { ...state.activeWorkout, exercises: [...state.activeWorkout.exercises, action.payload] }};
    case 'FINISH_WORKOUT': {
      const newPrs = JSON.parse(JSON.stringify(state.prs));
      const workoutLogs = action.payload;
      let prBroken = false;
      const muscleVolume = {};

      Object.keys(workoutLogs).forEach(exName => {
        const sets = workoutLogs[exName];
        if (!sets) return;

        const exerciseInfo = EXERCISE_DB.find(ex => ex.name === exName);
        const muscle = exerciseInfo ? exerciseInfo.muscle : 'Unknown';
        if (!muscleVolume[muscle]) muscleVolume[muscle] = 0;

        if (!newPrs[exName]) newPrs[exName] = { maxWeight: 0, repPRs: {} };
        const exercisePrs = newPrs[exName];

        sets.forEach(set => {
          const weight = parseFloat(set.weight) || 0;
          const reps = parseInt(set.reps, 10) || 0;

          muscleVolume[muscle] += weight * reps;

          if (weight > exercisePrs.maxWeight) {
            exercisePrs.maxWeight = weight;
            prBroken = true;
          }
          const oldRepPr = exercisePrs.repPRs[weight] || 0;
          if (reps > oldRepPr) {
            exercisePrs.repPRs[weight] = reps;
            prBroken = true;
          }
        });
      });

      if (prBroken && Platform.OS !== 'web') Alert.alert('Neuer PR!', '💪 Glückwunsch!');

      const maxVolume = Math.max(...Object.values(muscleVolume));
      const newMuscleIntensity = {};
      if (maxVolume > 0) {
        for (const muscle in muscleVolume) {
          newMuscleIntensity[muscle] = muscleVolume[muscle] / maxVolume;
        }
      }

      return {
        ...state,
        history: [...state.history, { ...state.activeWorkout, endTime: Date.now(), logs: workoutLogs }],
        prs: newPrs,
        activeWorkout: null,
        muscleIntensity: newMuscleIntensity,
      };
    }
    case 'CANCEL_WORKOUT':
      return { ...state, activeWorkout: null };
    default:
      return state;
  }
}

export const getSmartSuggestions = (currentLog, goals, foodDB) => {
  const current = currentLog.reduce((acc, item) => ({ p: acc.p + item.p, c: acc.c + item.c, f: acc.f + item.f }), { p: 0, c: 0, f: 0 });
  const deficits = { p: (goals.p - current.p) / goals.p, c: (goals.c - current.c) / goals.c, f: (goals.f - current.f) / goals.f };
  const maxDeficitKey = Object.keys(deficits).reduce((a, b) => deficits[a] > deficits[b] ? a : b);

  if (deficits[maxDeficitKey] <= 0) return { title: "Ziel erreicht!", text: "Stark! Du bist voll im Plan.", icon: "check-circle", color: COLORS.success };

  let filtered = foodDB.filter(f => f[maxDeficitKey] > 10);
  if (!filtered.length) filtered = foodDB;
  const rec = filtered[Math.floor(Math.random() * filtered.length)];

  let title = maxDeficitKey === 'p' ? 'Protein fehlt' : maxDeficitKey === 'c' ? 'Carbs laden' : 'Fette nötig';

  return { title, text: rec ? `Iss etwas ${rec.name}` : 'Check deine Makros', icon: 'flash', color: COLORS.primary, food: rec };
};
