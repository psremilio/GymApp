import React, { useState, useEffect, useReducer, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator,
  StatusBar as RNStatusBar,
  Alert
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Camera } from 'expo-camera';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

// --- 1. CONFIG & THEME ---
const COLORS = {
  bg: '#050505',
  surface: '#121212',
  surfaceLight: '#1E1E1E',
  primary: '#CCFF00',    // Neon Lime
  secondary: '#00E0FF',  // Cyan
  text: '#FFFFFF',
  textSec: '#A0A0A0',
  success: '#00FF94',
  danger: '#FF3366',
  chart: { p: '#00E0FF', c: '#CCFF00', f: '#FF3366' }
};

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- 2. DATABASE (PHASE 3: VARIATIONEN) ---
const EXERCISE_DB = [
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

const FOOD_DB = [
  { id: 'f1', name: 'Hähnchen (100g)', kcal: 165, p: 31, c: 0, f: 3.6, micros: { zn: 1, mg: 25 }, tags: ['protein', 'dinner'] },
  { id: 'f2', name: 'Reis (200g)', kcal: 260, p: 5, c: 56, f: 0.5, micros: { mg: 30 }, tags: ['carbs', 'lunch'] },
  { id: 'f3', name: 'Ei (Stk)', kcal: 70, p: 6, c: 0.6, f: 5, micros: { zn: 0.6 }, tags: ['fat', 'breakfast'] },
  { id: 'f4', name: 'Whey Shake', kcal: 110, p: 24, c: 2, f: 1, micros: { ca: 100 }, tags: ['protein', 'snack'] },
  { id: 'f5', name: 'Haferflocken (50g)', kcal: 180, p: 7, c: 30, f: 3.5, micros: { mg: 60, zn: 1.5 }, tags: ['carbs', 'breakfast'] },
  { id: 'f6', name: 'Magerquark (250g)', kcal: 170, p: 30, c: 10, f: 1, micros: { ca: 250 }, tags: ['protein', 'dinner'] },
];

const BARCODE_DB = {
  '40000001': FOOD_DB[0], 
  '40000002': FOOD_DB[3],
};

// --- 3. STATE & LOGIC ---
const initialState = {
  user: { name: 'Champ', goals: { kcal: 3200, p: 200, c: 350, f: 90, zn: 15, mg: 400 } },
  foodLog: [],
  history: [],
  prs: {}, // { 'Bankdrücken (LH)': 100 }
  activeWorkout: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'ADD_FOOD':
      return { ...state, foodLog: [...state.foodLog, { ...action.payload, timestamp: Date.now() }] };
    case 'START_WORKOUT':
      return { ...state, activeWorkout: { ...action.payload, startTime: Date.now() } };
    case 'ADD_EXERCISE':
      return { ...state, activeWorkout: { ...state.activeWorkout, exercises: [...state.activeWorkout.exercises, action.payload] }};
    case 'FINISH_WORKOUT':
      const newPrs = JSON.parse(JSON.stringify(state.prs));
      const workoutLogs = action.payload;
      let prBroken = false;

      Object.keys(workoutLogs).forEach(exName => {
        const sets = workoutLogs[exName];
        if (!sets) return;

        if (!newPrs[exName]) {
          newPrs[exName] = { maxWeight: 0, repPRs: {} };
        }

        const exercisePrs = newPrs[exName];

        sets.forEach(set => {
          const weight = parseFloat(set.weight);
          const reps = parseInt(set.reps, 10);

          if (!isNaN(weight) && !isNaN(reps)) {
            if (weight > exercisePrs.maxWeight) {
              exercisePrs.maxWeight = weight;
              prBroken = true;
            }

            const oldRepPr = exercisePrs.repPRs[weight] || 0;
            if (reps > oldRepPr) {
              exercisePrs.repPRs[weight] = reps;
              prBroken = true;
            }
          }
        });
      });

      if (prBroken && Platform.OS !== 'web') Alert.alert('Neuer PR!', '💪 Glückwunsch!');

      return { 
        ...state, 
        history: [...state.history, { ...state.activeWorkout, endTime: Date.now(), logs: workoutLogs }],
        prs: newPrs,
        activeWorkout: null 
      };
    case 'CANCEL_WORKOUT':
      return { ...state, activeWorkout: null };
    default:
      return state;
  }
}

// Smart Coach Logic (Phase 2 Feature)
const getSmartSuggestions = (currentLog, goals) => {
  const current = currentLog.reduce((acc, item) => ({ p: acc.p + item.p, c: acc.c + item.c, f: acc.f + item.f }), { p: 0, c: 0, f: 0 });
  const deficits = { p: (goals.p - current.p) / goals.p, c: (goals.c - current.c) / goals.c, f: (goals.f - current.f) / goals.f };
  const maxDeficitKey = Object.keys(deficits).reduce((a, b) => deficits[a] > deficits[b] ? a : b);

  if (deficits[maxDeficitKey] <= 0) return { title: "Ziel erreicht!", text: "Stark! Du bist voll im Plan.", icon: "check-circle", color: COLORS.success };

  let filtered = FOOD_DB.filter(f => f[maxDeficitKey] > 10);
  if (!filtered.length) filtered = FOOD_DB;
  const rec = filtered[Math.floor(Math.random() * filtered.length)];
  
  let title = maxDeficitKey === 'p' ? 'Protein fehlt' : maxDeficitKey === 'c' ? 'Carbs laden' : 'Fette nötig';
  
  return { title, text: rec ? `Iss etwas ${rec.name}` : 'Check deine Makros', icon: 'flash', color: COLORS.primary, food: rec };
};

// --- 4. COMPONENTS ---
const Card = ({ children, style, onPress, outlined }) => {
  const Container = onPress ? TouchableOpacity : View;
  return <Container style={[styles.card, outlined && styles.cardOutlined, style]} onPress={onPress} activeOpacity={0.7}>{children}</Container>;
};

const Button = ({ label, onPress, variant = 'primary', icon, style, disabled }) => {
  const isPrimary = variant === 'primary';
  const opacity = disabled ? 0.5 : 1;
  return (
    <TouchableOpacity 
      style={[styles.button, isPrimary ? styles.btnPrimary : styles.btnSecondary, { opacity }, style]} 
      onPress={onPress}
      disabled={disabled}
    >
      {icon && <Feather name={icon} size={20} color={isPrimary ? COLORS.bg : COLORS.text} style={{marginRight: 8}} />}
      <Text style={[styles.btnText, { color: isPrimary ? COLORS.bg : COLORS.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

// --- VIEWS ---
const HomeView = ({ state, dispatch, setView }) => {
  const todayCals = state.foodLog.reduce((acc, item) => acc + item.kcal, 0);
  const progress = Math.min(todayCals / state.user.goals.kcal, 1);
  const suggestion = useMemo(() => getSmartSuggestions(state.foodLog, state.user.goals), [state.foodLog]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 100}}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Willkommen,</Text>
          <Text style={styles.username}>{state.user.name} 🔥</Text>
        </View>
        <View style={styles.profileBtn}><Feather name="user" size={24} color={COLORS.text} /></View>
      </View>

      <View style={styles.statsRow}>
        <Card style={{flex: 1, marginRight: 8}}>
          <Text style={styles.label}>Kcal</Text>
          <Text style={styles.statBig}>{todayCals}</Text>
          <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} /></View>
        </Card>
        <Card style={{flex: 1, marginLeft: 8}} onPress={() => setView('stats')}>
          <Text style={styles.label}>PRs</Text>
          <Text style={[styles.statBig, {color: COLORS.success}]}>{Object.values(state.prs).reduce((acc, pr) => acc + Object.keys(pr.repPRs).length + (pr.maxWeight > 0 ? 1 : 0), 0)}</Text>
          <Text style={styles.statSub}>Rekorde</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Smart Coach</Text>
      <Card style={[styles.suggestionCard, {borderLeftColor: suggestion.color}]} onPress={() => suggestion.food && dispatch({ type: 'ADD_FOOD', payload: suggestion.food })}>
        <MaterialCommunityIcons name={suggestion.icon} size={28} color={suggestion.color} />
        <View style={{marginLeft: 12, flex: 1}}>
          <Text style={styles.cardTitle}>{suggestion.title}</Text>
          <Text style={styles.cardText}>{suggestion.text}</Text>
        </View>
        <Feather name="plus" size={20} color={COLORS.textSec} />
      </Card>

      <Text style={styles.sectionTitle}>Letzte Workouts</Text>
      {state.history.length === 0 ? (
        <Text style={styles.emptyText}>Noch keine Daten.</Text>
      ) : (
        state.history.slice(-3).reverse().map((w, i) => (
          <Card key={i} style={{marginBottom:8}}>
             <Text style={styles.cardTitle}>{w.name}</Text>
             <Text style={styles.cardText}>{new Date(w.endTime).toLocaleDateString()} • {Object.keys(w.logs).length} Übungen</Text>
          </Card>
        ))
      )}
    </ScrollView>
  );
};

const WeeklySummaryChart = ({ log, goals }) => {
  const weekData = useMemo(() => {
    const days = Array(7).fill(0).map(() => ({ p: 0, c: 0, f: 0, kcal: 0 }));
    const today = new Date();
    today.setHours(0,0,0,0);

    log.forEach(item => {
      const itemDate = new Date(item.timestamp);
      itemDate.setHours(0,0,0,0);
      const diffDays = Math.floor((today - itemDate) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays < 7) {
        days[6-diffDays].p += item.p;
        days[6-diffDays].c += item.c;
        days[6-diffDays].f += item.f;
        days[6-diffDays].kcal += item.kcal;
      }
    });
    return days;
  }, [log]);

  const maxKcal = Math.max(goals.kcal, ...weekData.map(d => d.kcal));

  return (
    <Card>
      <Text style={styles.cardTitle}>Wochenübersicht</Text>
      <View style={{flexDirection: 'row', height: 150, alignItems: 'flex-end', justifyContent: 'space-around', marginTop: 15}}>
        {weekData.map((day, i) => (
          <View key={i} style={{flex: 1, alignItems: 'center'}}>
            <View style={{flex: 1, width: '60%', backgroundColor: COLORS.surfaceLight, borderRadius: 5, overflow: 'hidden'}}>
              <View style={{width: '100%', height: `${(day.kcal/maxKcal)*100}%`, backgroundColor: COLORS.primary, alignSelf: 'flex-end'}} />
            </View>
            <Text style={{fontSize: 10, color: COLORS.textSec, marginTop: 4}}>{['Mo','Di','Mi','Do','Fr','Sa','So'][ (new Date().getDay() + 7 - (6-i)) % 7 ]}</Text>
          </View>
        ))}
      </View>
    </Card>
  )
}

const NutritionView = ({ state, dispatch }) => {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    const product = BARCODE_DB[data];
    if (product) {
      dispatch({ type: 'ADD_FOOD', payload: product });
      setScannerOpen(false);
      Alert.alert('Erfolg', `${product.name} hinzugefügt!`);
    } else {
      Alert.alert('Fehler', 'Produkt nicht gefunden.');
      setScannerOpen(false);
    }
  };

  const micros = state.foodLog.reduce((acc, item) => {
    Object.keys(item.micros || {}).forEach(key => {
      acc[key] = (acc[key] || 0) + item.micros[key];
    });
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.screenTitle}>Ernährung</Text></View>
      <ScrollView contentContainerStyle={{paddingBottom: 100}}>
        <WeeklySummaryChart log={state.foodLog} goals={state.user.goals} />

        <Text style={styles.sectionTitle}>Mikronährstoffe</Text>
        <View style={{flexDirection:'row', justifyContent: 'space-around', marginBottom: 20}}>
          {['zn', 'mg'].map(m => (
            <View key={m} style={{alignItems:'center'}}>
              <Text style={styles.label}>{m.toUpperCase()}</Text>
              <Text style={{color: COLORS.secondary, fontSize: 18, fontWeight: 'bold'}}>{(micros[m] || 0).toFixed(1)} / {state.user.goals[m]}mg</Text>
            </View>
          ))}
        </View>

        <Card>
          <Button label="Scan starten" onPress={() => setScannerOpen(true)} icon="camera" />
        </Card>

        <Text style={styles.sectionTitle}>Heutige Einträge</Text>
        {state.foodLog.slice().reverse().map((item, i) => (
          <View key={i} style={styles.foodItem}>
            <Text style={styles.foodName}>{item.name}</Text>
            <Text style={styles.foodKcal}>{item.kcal} kcal</Text>
          </View>
        ))}
      </ScrollView>
      <Modal visible={scannerOpen} animationType="slide">
        <View style={{flex: 1, backgroundColor: COLORS.bg}}>
          {hasPermission === null && <Text style={styles.emptyText}>Kamerazugriff wird angefordert...</Text>}
          {hasPermission === false && <Text style={styles.emptyText}>Kein Zugriff auf Kamera.</Text>}
          {hasPermission && (
            <Camera
              onBarCodeScanned={handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <Button label="Abbrechen" variant="secondary" onPress={() => setScannerOpen(false)} style={{position: 'absolute', bottom: 40, left: 20, right: 20}} />
        </View>
      </Modal>
    </View>
  );
};

const getAlternatives = (exercise, db) => {
  return db.filter(e => e.muscle === exercise.muscle && e.id !== exercise.id && e.type !== exercise.type);
};

const PlannerView = ({ state, onStart }) => {
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  
  const getExercises = (muscle) => {
    return EXERCISE_DB.filter(e => e.muscle === muscle);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.screenTitle}>Planer</Text></View>
      <ScrollView contentContainerStyle={{paddingBottom: 100}}>
        <Card>
          <Button
            label="Leeres Workout starten"
            icon="plus"
            onPress={() => onStart({ name: 'Freies Training', exercises: [] })}
            variant="secondary"
            style={{marginBottom: 16}}
          />
          <Text style={styles.cardTitle}>Oder Muskel wählen</Text>
          <View style={{flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:10}}>
            {['Brust', 'Rücken', 'Beine', 'Schulter', 'Arme'].map(m => (
              <TouchableOpacity key={m} 
                style={[styles.bodyPart, selectedMuscle === m && styles.bodyPartActive]}
                onPress={() => setSelectedMuscle(m === selectedMuscle ? null : m)}
              >
                <Text style={[styles.bodyPartText, selectedMuscle === m && {color:COLORS.bg}]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {selectedMuscle && (
          <View>
            <Text style={styles.sectionTitle}>Übungen für {selectedMuscle}</Text>
            {getExercises(selectedMuscle).map(ex => (
              <Card key={ex.id} style={styles.exerciseCard}>
                <View style={{flex: 1}}>
                  <Text style={styles.cardTitle}>{ex.name}</Text>
                  {state.prs[ex.name] && state.prs[ex.name].maxWeight > 0 &&
                    <Text style={{color: COLORS.success, fontSize:12}}>PR: {state.prs[ex.name].maxWeight}kg 🏆</Text>}
                </View>
                <TouchableOpacity style={{marginRight: 15}} onPress={() => setAlternatives(getAlternatives(ex, EXERCISE_DB))}>
                  <MaterialCommunityIcons name="swap-horizontal-bold" size={24} color={COLORS.secondary} />
                </TouchableOpacity>
                <Feather name="plus-circle" size={24} color={COLORS.primary} />
              </Card>
            ))}
            <Button label="Workout starten" style={{marginTop: 15}} onPress={() => onStart({ name: `${selectedMuscle} Focus`, exercises: getExercises(selectedMuscle) })} />
          </View>
        )}
      </ScrollView>
      <Modal visible={alternatives.length > 0} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alternativen</Text>
            {alternatives.map(alt => (
              <Card key={alt.id} style={{marginBottom: 8}}>
                <Text style={styles.cardTitle}>{alt.name}</Text>
                <Text style={styles.cardText}>{alt.type === 'compound' ? 'Verbundübung' : 'Isolation'}</Text>
              </Card>
            ))}
            <Button label="Schließen" variant="secondary" onPress={() => setAlternatives([])} style={{marginTop: 10}} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Phase 3: Functional Logger (Speichert Gewicht & Reps)
const ActiveSession = ({ workout, dispatch, history }) => {
  const [elapsed, setElapsed] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getLastLog = (exerciseName, history) => {
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

  const [logs, setLogs] = useState(() => {
    const initialLogs = {};
    workout.exercises.forEach(ex => {
      initialLogs[ex.name] = [getLastLog(ex.name, history)];
    });
    return initialLogs;
  });

  useEffect(() => { const t = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(t); }, []);

  const updateLog = (exName, index, field, value) => {
    const currentSets = logs[exName] || [{ weight: '', reps: '' }];
    const newSets = [...currentSets];
    if (!newSets[index]) newSets[index] = { weight: '', reps: '' };
    newSets[index] = { ...newSets[index], [field]: value };
    setLogs({ ...logs, [exName]: newSets });
  };

  const addSet = (exName) => {
    const currentSets = logs[exName] || [];
    const lastSet = currentSets.length > 0 ? currentSets[currentSets.length - 1] : getLastLog(exName, history);
    setLogs({ ...logs, [exName]: [...currentSets, { ...lastSet }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sessionHeader}>
        <TouchableOpacity onPress={() => dispatch({ type: 'CANCEL_WORKOUT' })}><Feather name="x" size={24} color={COLORS.textSec} /></TouchableOpacity>
        <Text style={styles.timer}>{Math.floor(elapsed / 60)}:{elapsed % 60 < 10 ? '0' : ''}{elapsed % 60}</Text>
        <TouchableOpacity onPress={() => dispatch({ type: 'FINISH_WORKOUT', payload: logs })}><Text style={{color: COLORS.primary}}>Fertig</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{padding: 20}}>
        <Text style={styles.sessionTitle}>{workout.name}</Text>
        {workout.exercises.map((ex) => (
          <View key={ex.id} style={styles.sessionExercise}>
            <Text style={styles.cardTitle}>{ex.name}</Text>
            {(logs[ex.name] || [{weight:'', reps:''}]).map((set, i) => (
              <View key={i} style={styles.setRow}>
                <Text style={{color: COLORS.textSec, width: 20}}>{i+1}</Text>
                <TextInput 
                  style={styles.inputTable} 
                  placeholder="kg" 
                  placeholderTextColor="#555" 
                  keyboardType="numeric"
                  value={set.weight}
                  onChangeText={(t) => updateLog(ex.name, i, 'weight', t)}
                />
                <TextInput 
                  style={styles.inputTable} 
                  placeholder="reps" 
                  placeholderTextColor="#555" 
                  keyboardType="numeric"
                  value={set.reps}
                  onChangeText={(t) => updateLog(ex.name, i, 'reps', t)}
                />
              </View>
            ))}
            <TouchableOpacity onPress={() => addSet(ex.name)} style={{marginTop:10}}>
              <Text style={{color: COLORS.secondary, fontSize:12}}>+ Satz</Text>
            </TouchableOpacity>
          </View>
        ))}
        <Button
          label="Übung hinzufügen"
          icon="plus"
          variant="secondary"
          onPress={() => setModalVisible(true)}
          style={{marginTop: 20}}
        />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Übung hinzufügen</Text>
            <TextInput
              style={[styles.inputTable, {width: '100%', marginBottom: 15, height: 50}]}
              placeholder="Suchen..."
              placeholderTextColor="#777"
              onChangeText={setSearchQuery}
              value={searchQuery}
            />
            <ScrollView>
              {EXERCISE_DB.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase())).map(ex => (
                <TouchableOpacity
                  key={ex.id}
                  style={styles.exerciseCard}
                  onPress={() => {
                    dispatch({ type: 'ADD_EXERCISE', payload: ex });
                    setModalVisible(false);
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.cardTitle}>{ex.name}</Text>
                  <Feather name="plus-circle" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button label="Schließen" variant="secondary" onPress={() => setModalVisible(false)} style={{marginTop: 20}}/>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const StatsView = ({ prs }) => {
  const [selectedEx, setSelectedEx] = useState(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.screenTitle}>Rekorde</Text></View>
      <ScrollView>
        {Object.keys(prs).map(exName => {
          const prData = prs[exName];
          const repPrs = Object.entries(prData.repPRs || {}).sort((a,b) => b[0] - a[0]);

          return (
            <Card key={exName} onPress={() => setSelectedEx(selectedEx === exName ? null : exName)}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={styles.cardTitle}>{exName}</Text>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={{color: COLORS.success, fontWeight: 'bold'}}>{prData.maxWeight}kg</Text>
                  <Feather name={selectedEx === exName ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textSec} style={{marginLeft: 10}} />
                </View>
              </View>
              {selectedEx === exName && (
                <View style={{marginTop: 15, borderTopWidth: 1, borderTopColor: COLORS.surfaceLight, paddingTop: 10}}>
                  <Text style={{color: COLORS.textSec, marginBottom: 5}}>Bestleistungen:</Text>
                  {repPrs.map(([weight, reps]) => (
                    <View key={weight} style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2}}>
                      <Text style={{color: COLORS.text}}>{weight} kg</Text>
                      <Text style={{color: COLORS.primary}}>{reps} Wiederholungen</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [view, setView] = useState('home');

  return (
    <SafeAreaProvider>
      <ExpoStatusBar style="light" backgroundColor={COLORS.bg} />
      {state.activeWorkout ? (
        <ActiveSession workout={state.activeWorkout} dispatch={dispatch} history={state.history} />
      ) : (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {view === 'home' && <HomeView state={state} dispatch={dispatch} setView={setView} />}
            {view === 'nutrition' && <NutritionView state={state} dispatch={dispatch} />}
            {view === 'planner' && <PlannerView state={state} onStart={(t) => dispatch({ type: 'START_WORKOUT', payload: t })} />}
            {view === 'stats' && <StatsView prs={state.prs} />}
          </View>
          <View style={styles.tabBar}>
            <TouchableOpacity onPress={() => setView('home')} style={styles.tabItem}><Feather name="home" size={24} color={view === 'home' ? COLORS.primary : COLORS.textSec} /></TouchableOpacity>
            <TouchableOpacity onPress={() => setView('planner')} style={styles.tabItem}><Feather name="calendar" size={24} color={view === 'planner' ? COLORS.primary : COLORS.textSec} /></TouchableOpacity>
            <TouchableOpacity onPress={() => setView('nutrition')} style={styles.tabItem}><MaterialCommunityIcons name="food-apple-outline" size={26} color={view === 'nutrition' ? COLORS.primary : COLORS.textSec} /></TouchableOpacity>
            <TouchableOpacity onPress={() => setView('stats')} style={styles.tabItem}><Feather name="bar-chart-2" size={24} color={view === 'stats' ? COLORS.primary : COLORS.textSec} /></TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0 },
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 20 },
  content: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { color: COLORS.textSec, fontSize: 14 },
  username: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  screenTitle: { color: COLORS.text, fontSize: 28, fontWeight: 'bold' },
  profileBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, marginBottom: 12 },
  cardOutlined: { borderWidth: 1, borderColor: COLORS.surfaceLight, backgroundColor: 'transparent' },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cardText: { color: COLORS.textSec, fontSize: 13 },
  label: { color: COLORS.textSec, fontSize: 12, textTransform: 'uppercase', marginBottom: 4 },
  statBig: { color: COLORS.primary, fontSize: 32, fontWeight: '900' },
  statSub: { color: COLORS.textSec, fontSize: 12 },
  statsRow: { flexDirection: 'row', marginBottom: 24 },
  progressBarBg: { height: 6, backgroundColor: COLORS.surfaceLight, borderRadius: 3, marginVertical: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 10 },
  suggestionCard: { backgroundColor: COLORS.surfaceLight, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  button: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnSecondary: { backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.textSec },
  btnText: { fontWeight: 'bold', fontSize: 15 },
  iconBtn: { padding: 8, backgroundColor: COLORS.surfaceLight, borderRadius: 12 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  macroCircle: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' },
  macroVal: { fontWeight: 'bold', fontSize: 16 },
  macroLabel: { color: COLORS.textSec, fontSize: 10 },
  foodItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceLight },
  foodName: { color: COLORS.text, fontSize: 15, fontWeight: '500' },
  foodKcal: { color: COLORS.success, fontWeight: 'bold' },
  tag: { color: COLORS.textSec, fontSize: 10, fontStyle: 'italic' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.surface, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: COLORS.surfaceLight },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  scannerPlaceholder: { height: 200, backgroundColor: '#000', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed' },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, height: 70, borderTopWidth: 1, borderTopColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 10, paddingBottom: 10 },
  tabItem: { padding: 10 },
  bodyMapContainer: { height: 340, backgroundColor: '#0a0a0a', borderRadius: 16, marginVertical: 10, position: 'relative', borderWidth: 1, borderColor: COLORS.surfaceLight },
  bodyPart: { backgroundColor: COLORS.surfaceLight, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  bodyPartActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  bodyPartText: { color: COLORS.textSec, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  exerciseCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sessionHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.surfaceLight },
  sessionTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  timer: { color: COLORS.secondary, fontSize: 24, fontVariant: ['tabular-nums'], fontWeight: 'bold' },
  sessionExercise: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, marginBottom: 16 },
  setRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  inputTable: { backgroundColor: COLORS.bg, color: COLORS.text, width: 60, height: 40, borderRadius: 8, textAlign: 'center', marginRight: 8, borderWidth: 1, borderColor: COLORS.surfaceLight },
  checkBtn: { width: 40, height: 40, backgroundColor: COLORS.success, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: COLORS.textSec, textAlign: 'center', marginTop: 40 }
});
