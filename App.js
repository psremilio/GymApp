import React, { useState, useEffect, useReducer, useMemo } from 'react';
import {
  SafeAreaView,
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
  user: { name: 'Champ', goals: { kcal: 3200, p: 200, c: 350, f: 90 } },
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
    case 'FINISH_WORKOUT':
      // Phase 3: PR Check
      const newPrs = { ...state.prs };
      const workoutLogs = action.payload;
      let prBroken = false;

      Object.keys(workoutLogs).forEach(exName => {
        const sets = workoutLogs[exName];
        if (!sets) return;
        const maxWeight = Math.max(...sets.map(s => parseFloat(s.weight) || 0));
        const oldPr = newPrs[exName] || 0;
        
        if (maxWeight > oldPr) {
          newPrs[exName] = maxWeight;
          prBroken = true;
        }
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
          <Text style={[styles.statBig, {color: COLORS.success}]}>{Object.keys(state.prs).length}</Text>
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

const NutritionView = ({ state, dispatch }) => {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      const product = Object.values(BARCODE_DB)[0]; 
      dispatch({ type: 'ADD_FOOD', payload: product });
      setScanning(false);
      setScannerOpen(false);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.screenTitle}>Ernährung</Text></View>
      <ScrollView contentContainerStyle={{paddingBottom: 100}}>
        <Card style={{marginBottom: 20}}>
          <Button label="Scan starten" onPress={() => setScannerOpen(true)} icon="camera" />
        </Card>
        {state.foodLog.slice().reverse().map((item, i) => (
          <View key={i} style={styles.foodItem}>
            <Text style={styles.foodName}>{item.name}</Text>
            <Text style={styles.foodKcal}>{item.kcal} kcal</Text>
          </View>
        ))}
      </ScrollView>
      <Modal visible={scannerOpen} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Scanner</Text>
            <View style={styles.scannerPlaceholder}>
              {scanning ? <ActivityIndicator color={COLORS.primary} size="large"/> : <Ionicons name="scan" size={50} color={COLORS.textSec} />}
            </View>
            <Button label={scanning ? "Scanne..." : "Scan simulieren"} onPress={handleScan} disabled={scanning} />
            <Button label="Abbrechen" variant="secondary" onPress={() => setScannerOpen(false)} style={{marginTop:10}} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const PlannerView = ({ state, onStart }) => {
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  
  const getExercises = (muscle) => {
    return EXERCISE_DB.filter(e => e.muscle === muscle);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.screenTitle}>Planer</Text></View>
      <ScrollView contentContainerStyle={{paddingBottom: 100}}>
        <Card>
          <Text style={styles.cardTitle}>Muskel wählen</Text>
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
                <View>
                  <Text style={styles.cardTitle}>{ex.name}</Text>
                  {state.prs[ex.name] && <Text style={{color: COLORS.success, fontSize:12}}>PR: {state.prs[ex.name]}kg 🏆</Text>}
                </View>
                <Feather name="plus-circle" size={24} color={COLORS.primary} />
              </Card>
            ))}
            <Button label="Workout starten" style={{marginTop: 15}} onPress={() => onStart({ name: `${selectedMuscle} Focus`, exercises: getExercises(selectedMuscle) })} />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Phase 3: Functional Logger (Speichert Gewicht & Reps)
const ActiveSession = ({ workout, dispatch }) => {
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState({});

  useEffect(() => { const t = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(t); }, []);

  const updateLog = (exName, index, field, value) => {
    const currentSets = logs[exName] || [{ weight: '', reps: '' }];
    const newSets = [...currentSets];
    if (!newSets[index]) newSets[index] = { weight: '', reps: '' };
    newSets[index] = { ...newSets[index], [field]: value };
    setLogs({ ...logs, [exName]: newSets });
  };

  const addSet = (exName) => {
    const currentSets = logs[exName] || [{ weight: '', reps: '' }];
    setLogs({ ...logs, [exName]: [...currentSets, { weight: '', reps: '' }] });
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [view, setView] = useState('home');

  if (state.activeWorkout) return <ActiveSession workout={state.activeWorkout} dispatch={dispatch} />;

  return (
    <>
      <ExpoStatusBar style="light" backgroundColor={COLORS.bg} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {view === 'home' && <HomeView state={state} dispatch={dispatch} setView={setView} />}
          {view === 'nutrition' && <NutritionView state={state} dispatch={dispatch} />}
          {view === 'planner' && <PlannerView state={state} onStart={(t) => dispatch({ type: 'START_WORKOUT', payload: t })} />}
          {view === 'stats' && <View style={styles.container}><Text style={{color:'white', textAlign:'center', marginTop:20}}>Statistiken in Phase 4</Text></View>}
        </View>
        <View style={styles.tabBar}>
          <TouchableOpacity onPress={() => setView('home')} style={styles.tabItem}><Feather name="home" size={24} color={view === 'home' ? COLORS.primary : COLORS.textSec} /></TouchableOpacity>
          <TouchableOpacity onPress={() => setView('planner')} style={styles.tabItem}><Feather name="calendar" size={24} color={view === 'planner' ? COLORS.primary : COLORS.textSec} /></TouchableOpacity>
          <TouchableOpacity onPress={() => setView('nutrition')} style={styles.tabItem}><MaterialCommunityIcons name="food-apple-outline" size={26} color={view === 'nutrition' ? COLORS.primary : COLORS.textSec} /></TouchableOpacity>
          <TouchableOpacity onPress={() => setView('stats')} style={styles.tabItem}><Feather name="bar-chart-2" size={24} color={view === 'stats' ? COLORS.primary : COLORS.textSec} /></TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
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
