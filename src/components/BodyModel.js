import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../logic/theme';

const musclePaths = {
  Brust: "M100 100 L150 100 L150 150 L100 150 Z",
  Rücken: "M100 160 L150 160 L150 210 L100 210 Z",
  Beine: "M100 220 L150 220 L150 300 L100 300 Z",
  Schulter: "M80 90 L170 90 L170 110 L80 110 Z",
  Arme: "M70 120 L90 120 L90 200 L70 200 Z M160 120 L180 120 L180 200 L160 200 Z",
};

// Simple hex color interpolation
const interpolateColor = (color1, color2, factor) => {
  const result = color1.slice();
  for (let i = 0; i < 3; i++) {
    result[i] = Math.round(result[i] + factor * (color2[i] - result[i]));
  }
  return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
};


const BodyModel = ({ selectedMuscle, onSelectMuscle, muscleIntensity = {} }) => {

  const startColorRgb = hexToRgb(COLORS.surfaceLight);
  const endColorRgb = hexToRgb(COLORS.primary);

  const getColor = (muscle) => {
    const intensity = muscleIntensity[muscle] || 0;
    if (selectedMuscle === muscle) return COLORS.secondary;

    return interpolateColor(startColorRgb, endColorRgb, intensity);
  };

  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" viewBox="0 0 250 350">
        {Object.keys(musclePaths).map(muscle => (
          <Path
            key={muscle}
            d={musclePaths[muscle]}
            fill={getColor(muscle)}
            stroke={COLORS.secondary}
            strokeWidth="1"
            onPress={() => onSelectMuscle && onSelectMuscle(muscle)}
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 350,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
});

export default BodyModel;
