import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../logic/theme';
import { EXERCISE_DB } from '../logic/database';
import { getLastLog } from '../logic/helpers';
import Button from '../components/Button';

const ActiveSession = ({ workout, dispatch, history }) => {
  const [elapsed, setElapsed] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  sessionHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.surfaceLight },
  sessionTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  timer: { color: COLORS.secondary, fontSize: 24, fontVariant: ['tabular-nums'], fontWeight: 'bold' },
  sessionExercise: { backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, marginBottom: 16 },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  setRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  inputTable: { backgroundColor: COLORS.bg, color: COLORS.text, width: 60, height: 40, borderRadius: 8, textAlign: 'center', marginRight: 8, borderWidth: 1, borderColor: COLORS.surfaceLight },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.surface, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: COLORS.surfaceLight },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  exerciseCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surfaceLight, padding:16, borderRadius: 12, marginBottom: 8 }
});

export default ActiveSession;
