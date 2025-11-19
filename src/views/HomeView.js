import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../logic/theme';
import { getSmartSuggestions } from '../logic/reducer';
import Card from '../components/Card';
import BodyModel from '../components/BodyModel';


const HomeView = ({ state, dispatch, setView }) => {
  const todayCals = state.foodLog.reduce((acc, item) => acc + item.kcal, 0);
  const progress = Math.min(todayCals / state.user.goals.kcal, 1);
  const suggestion = useMemo(() => getSmartSuggestions(state.foodLog, state.user.goals, state.foodDB), [state.foodLog, state.foodDB]);
  const lastWorkoutIntensity = Object.keys(state.muscleIntensity).length > 0;

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

      {lastWorkoutIntensity && (
        <>
          <Text style={styles.sectionTitle}>Letztes Workout: Intensität</Text>
          <Card>
            <BodyModel muscleIntensity={state.muscleIntensity} />
          </Card>
        </>
      )}

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { color: COLORS.textSec, fontSize: 14 },
  username: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  profileBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
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
  emptyText: { color: COLORS.textSec, textAlign: 'center', marginTop: 40 }
});

export default HomeView;
