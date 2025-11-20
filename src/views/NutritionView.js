import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, Modal, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import { COLORS } from '../logic/theme';
import { BARCODE_DB } from '../logic/database';
import Card from '../components/Card';
import Button from '../components/Button';
import WeeklySummaryChart from '../components/WeeklySummaryChart';

const AddFoodModal = ({ visible, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [p, setP] = useState('');
  const [c, setC] = useState('');
  const [f, setF] = useState('');

  const handleSave = () => {
    if (!name || !kcal || !p || !c || !f) {
      Alert.alert('Fehler', 'Bitte alle Felder ausfüllen.');
      return;
    }
    onSave({
      name,
      kcal: parseFloat(kcal),
      p: parseFloat(p),
      c: parseFloat(c),
      f: parseFloat(f)
    });
    setName(''); setKcal(''); setP(''); setC(''); setF('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Neues Lebensmittel</Text>
          <TextInput style={styles.input} placeholder="Name (z.B. Apfel)" placeholderTextColor="#777" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Kalorien" placeholderTextColor="#777" keyboardType="numeric" value={kcal} onChangeText={setKcal} />
          <View style={styles.macroInputRow}>
            <TextInput style={styles.inputMacro} placeholder="Protein" placeholderTextColor="#777" keyboardType="numeric" value={p} onChangeText={setP} />
            <TextInput style={styles.inputMacro} placeholder="Carbs" placeholderTextColor="#777" keyboardType="numeric" value={c} onChangeText={setC} />
            <TextInput style={styles.inputMacro} placeholder="Fett" placeholderTextColor="#777" keyboardType="numeric" value={f} onChangeText={setF} />
          </View>
          <Button label="Speichern & Hinzufügen" onPress={handleSave} style={{marginBottom: 10}}/>
          <Button label="Abbrechen" variant="secondary" onPress={onClose} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};


const NutritionView = ({ state, dispatch }) => {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      // We only request camera permissions if we are not on web.
      // Expo Camera on web might work differently or require different handling.
      if (Platform.OS !== 'web') {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      } else {
        setHasPermission(true); // Mock permission for web
      }
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

  const handleSaveCustomFood = (food) => {
    dispatch({ type: 'ADD_CUSTOM_FOOD', payload: food });
    setModalOpen(false);
    Alert.alert('Erfolg', `${food.name} wurde gespeichert und zu deinem Log hinzugefügt!`);
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

        <Card style={{flexDirection: 'row', justifyContent: 'space-between', gap: 10}}>
          <Button label="Scan" onPress={() => setScannerOpen(true)} icon="camera" style={{flex:1}} />
          <Button label="Manuell" onPress={() => setModalOpen(true)} icon="plus" style={{flex:1}} variant="secondary" />
        </Card>

        <Text style={styles.sectionTitle}>Heutige Einträge</Text>
        {state.foodLog.slice().reverse().map((item, i) => (
          <View key={i} style={styles.foodItem}>
            <Text style={styles.foodName}>{item.name}</Text>
            <Text style={styles.foodKcal}>{item.kcal} kcal</Text>
          </View>
        ))}
      </ScrollView>

      {/* --- Modals --- */}
      <AddFoodModal visible={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveCustomFood} />

      <Modal visible={scannerOpen} animationType="slide">
        <View style={{flex: 1, backgroundColor: COLORS.bg}}>
          {hasPermission === null && <Text style={styles.emptyText}>Kamerazugriff wird angefordert...</Text>}
          {hasPermission === false && <Text style={styles.emptyText}>Kein Zugriff auf Kamera.</Text>}
          {hasPermission && (
             Platform.OS === 'web' ? (
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                  <Text style={styles.emptyText}>Scanner nicht im Web verfügbar</Text>
                </View>
             ) : (
              <Camera
                onBarCodeScanned={handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
              />
             )
          )}
          <Button label="Abbrechen" variant="secondary" onPress={() => setScannerOpen(false)} style={{position: 'absolute', bottom: 40, left: 20, right: 20}} />
        </View>
      </Modal>
    </View>
  );
};

const baseInput = {
  backgroundColor: COLORS.surfaceLight,
  color: COLORS.text,
  height: 50,
  borderRadius: 12,
  paddingHorizontal: 15,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: COLORS.bg
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  screenTitle: { color: COLORS.text, fontSize: 28, fontWeight: 'bold' },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 10 },
  label: { color: COLORS.textSec, fontSize: 12, textTransform: 'uppercase', marginBottom: 4 },
  foodItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceLight },
  foodName: { color: COLORS.text, fontSize: 15, fontWeight: '500' },
  foodKcal: { color: COLORS.success, fontWeight: 'bold' },
  emptyText: { color: COLORS.textSec, textAlign: 'center', marginTop: 40 },
  // Modal & Input Styles
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.surface, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: COLORS.surfaceLight },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: baseInput,
  macroInputRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 10 },
  inputMacro: { flex: 1, ...baseInput },
});

export default NutritionView;
