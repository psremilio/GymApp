import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../logic/theme';

const Card = ({ children, style, onPress, outlined }) => {
  const Container = onPress ? TouchableOpacity : View;
  return <Container style={[styles.card, outlined && styles.cardOutlined, style]} onPress={onPress} activeOpacity={0.7}>{children}</Container>;
};

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 16, marginBottom: 12 },
  cardOutlined: { borderWidth: 1, borderColor: COLORS.surfaceLight, backgroundColor: 'transparent' },
});

export default Card;
