import React, { useState, useReducer } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';


import { COLORS } from './src/logic/theme';
import { initialState, appReducer } from './src/logic/reducer';

import HomeView from './src/views/HomeView';
import NutritionView from './src/views/NutritionView';
import PlannerView from './src/views/PlannerView';
import StatsView from './src/views/StatsView';
import ActiveSession from './src/views/ActiveSession';


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
  content: { flex: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, height: 70, borderTopWidth: 1, borderTopColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 10, paddingBottom: 10 },
  tabItem: { padding: 10 },
});
