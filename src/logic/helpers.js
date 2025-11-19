export const getAlternatives = (exercise, db) => {
  return db.filter(e => e.muscle === exercise.muscle && e.id !== exercise.id && e.type !== exercise.type);
};

export const getLastLog = (exerciseName, history) => {
  if (!history) return { weight: '', reps: '' };
  for (let i = history.length - 1; i >= 0; i--) {
    const pastWorkout = history[i];
    if (pastWorkout.logs && pastWorkout.logs[exerciseName] && pastWorkout.logs[exerciseName].length > 0) {
      for (let j = pastWorkout.logs[exerciseName].length - 1; j >= 0; j--) {
        const set = pastWorkout.logs[exerciseName][j];
        if (set.weight || set.reps) return { weight: set.weight || '', reps: set.reps || '' };
      }
    }
  }
  return { weight: '', reps: '' };
};
