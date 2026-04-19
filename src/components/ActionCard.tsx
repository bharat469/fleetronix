import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { SvgProps } from 'react-native-svg';

interface ActionCardProps {
  title: string;
  subtitle: string;
  Icon: React.FC<SvgProps>;
  iconBgColor: string;
  onPress?: () => void;
  style?: ViewStyle;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, subtitle, Icon, iconBgColor, onPress, style }) => {
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Icon width={24} height={24} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.subtitle} numberOfLines={3}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    width: '46%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E0909',
    flex: 1,
  },
  subtitle: {
    fontSize: 10,
    color: '#858080',
    lineHeight: 14,
  },
});

export default ActionCard;
