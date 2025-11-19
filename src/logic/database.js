export const EXERCISE_DB = [
  // Brust
  { id: 'ex1', name: 'Bankdrücken (LH)', muscle: 'Brust', type: 'compound' },
  { id: 'ex2', name: 'Schrägbank (KH)', muscle: 'Brust', type: 'compound' },
  { id: 'ex3', name: 'Cable Flys', muscle: 'Brust', type: 'isolation' },
  { id: 'ex11', name: 'Dips', muscle: 'Brust', type: 'compound' }, // Neu
  // Schulter
  { id: 'ex4', name: 'Military Press', muscle: 'Schulter', type: 'compound' },
  { id: 'ex5', name: 'Seitheben', muscle: 'Schulter', type: 'isolation' },
  { id: 'ex13', name: 'Face Pulls', muscle: 'Schulter', type: 'isolation' }, // Neu
  // Beine
  { id: 'ex6', name: 'Kniebeugen', muscle: 'Beine', type: 'compound' },
  { id: 'ex12', name: 'Beinpresse', muscle: 'Beine', type: 'compound' }, // Neu
  // Rücken
  { id: 'ex7', name: 'Kreuzheben', muscle: 'Rücken', type: 'compound' },
  { id: 'ex8', name: 'Latzug', muscle: 'Rücken', type: 'compound' },
  // Arme
  { id: 'ex9', name: 'Trizepsdrücken', muscle: 'Arme', type: 'isolation' },
  { id: 'ex10', name: 'Hammer Curls', muscle: 'Arme', type: 'isolation' },
  { id: 'ex14', name: 'Langhantel Curls', muscle: 'Arme', type: 'isolation' }, // Neu
];

// This is now static, as FOOD_DB is part of the dynamic state.
export const BARCODE_DB = {
  '40000001': { id: 'f1', name: 'Hähnchen (100g)', kcal: 165, p: 31, c: 0, f: 3.6, micros: { zn: 1, mg: 25 }, tags: ['protein', 'dinner'] },
  '40000002': { id: 'f4', name: 'Whey Shake', kcal: 110, p: 24, c: 2, f: 1, micros: { ca: 100 }, tags: ['protein', 'snack'] },
};
