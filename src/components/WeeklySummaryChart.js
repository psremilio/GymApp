import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../logic/theme';
import Card from './Card';

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

const styles = StyleSheet.create({
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
});

export default WeeklySummaryChart;
