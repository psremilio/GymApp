import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../logic/theme';

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

const styles = StyleSheet.create({
  button: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnSecondary: { backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.textSec },
  btnText: { fontWeight: 'bold', fontSize: 15 },
});

export default Button;
