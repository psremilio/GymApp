import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../logic/theme';
import Card from '../components/Card';

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  screenTitle: { color: COLORS.text, fontSize: 28, fontWeight: 'bold' },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
});

export default StatsView;
