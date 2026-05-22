import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale, moderateScale } from '../../helpers/dimension';
import { getFontFamily } from '../../helpers/fonts';
import SvgIcon from '../../helpers/svgComponents';

interface SummaryCardProps {
  label: string;
  amount: string;
  type: 'received' | 'pending';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, amount, type }) => {
  const isReceived = type === 'received';
  const borderColor = isReceived ? '#A7F3D0' : '#FECACA';
  const backgroundColor = type === 'received' ? 'rgba(0, 168, 107, 0.1)' : 'rgba(253, 60, 74, 0.1)';
  const iconColor = isReceived ? '#10B981' : '#EF4444';

  return (
    <View style={[styles.container, { borderColor, backgroundColor }]}>
      <View style={[styles.iconContainer, { backgroundColor: isReceived ? 'rgba(0, 168, 107, 0.1)' : 'rgba(253, 60, 74, 0.1)' }]}>
        <SvgIcon 
          name={isReceived ? 'receivedExpenses' : 'pendingExpenses'} 
          width={scale(24)} 
          height={scale(24)} 
          color={iconColor} 
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: iconColor }]}>{label}</Text>
        <Text style={styles.amount}>₹{amount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    borderRadius: scale(20),
    borderWidth: 1,
    marginHorizontal: scale(5),
 
  },
  iconContainer: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    marginBottom: scale(2),
  },
  amount: {
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#111827',
  },
});

export default SummaryCard;
