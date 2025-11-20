import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../logic/theme';
import { EXERCISE_DB } from '../logic/database';
import { getAlternatives } from '../logic/helpers';
import Card from '../components/Card';
import Button from '../components/Button';
import BodyModel from '../components/BodyModel';

const PlannerView = ({ state, onStart }) => {
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const getExercises = (muscle) => {
    return EXERCISE_DB.filter(e => e.muscle === muscle);
  };

  const handleSelectMuscle = (muscle) => {
    setSelectedMuscle(prev => prev === muscle ? null : muscle);
    setSearchQuery(''); // Clear search when selecting muscle via model
  };

  const filteredExercises = searchQuery
    ? EXERCISE_DB.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Planer</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={COLORS.textSec} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Übung suchen..."
          placeholderTextColor={COLORS.textSec}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (text) setSelectedMuscle(null); // Clear muscle selection when searching
          }}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={20} color={COLORS.textSec} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 100}}>
        {searchQuery.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Suchergebnisse</Text>
            {filteredExercises.length === 0 ? (
              <Text style={{color: COLORS.textSec, textAlign: 'center', marginTop: 20}}>Keine Übungen gefunden.</Text>
            ) : (
              filteredExercises.map(ex => (
                <Card key={ex.id} style={styles.exerciseCard}>
                  <View style={{flex: 1}}>
                    <Text style={styles.cardTitle}>{ex.name}</Text>
                    <Text style={styles.cardText}>{ex.muscle} • {ex.type === 'compound' ? 'Verbund' : 'Isolation'}</Text>
                    {state.prs[ex.name] && state.prs[ex.name].maxWeight > 0 &&
                      <Text style={{color: COLORS.success, fontSize:12}}>PR: {state.prs[ex.name].maxWeight}kg 🏆</Text>}
                  </View>
                  <TouchableOpacity onPress={() => onStart({ name: `${ex.name} Session`, exercises: [ex] })}>
                      <Feather name="plus-circle" size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                </Card>
              ))
            )}
          </View>
        ) : (
          <>
            <Card>
              <Button
                label="Leeres Workout starten"
                icon="plus"
                onPress={() => onStart({ name: 'Freies Training', exercises: [] })}
                variant="secondary"
              />
            </Card>

            <Card style={{marginTop: 16}}>
              <Text style={styles.cardTitle}>Wähle einen Muskel</Text>
              <BodyModel
                selectedMuscle={selectedMuscle}
                onSelectMuscle={handleSelectMuscle}
                muscleIntensity={state.muscleIntensity}
              />
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
                    <TouchableOpacity onPress={() => onStart({ name: `${selectedMuscle} Training`, exercises: [ex] })}>
                        <Feather name="plus-circle" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                  </Card>
                ))}
                <Button label="Ganzes Workout starten" style={{marginTop: 15}} onPress={() => onStart({ name: `${selectedMuscle} Focus`, exercises: getExercises(selectedMuscle) })} />
              </View>
            )}
          </>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  screenTitle: { color: COLORS.text, fontSize: 28, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 12, height: 50, marginBottom: 20 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 16, height: '100%' },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cardText: { color: COLORS.textSec, fontSize: 13 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 10 },
  exerciseCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.surface, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: COLORS.surfaceLight },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
});

export default PlannerView;
