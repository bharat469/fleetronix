import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scale, moderateScale, SCREEN } from '../../helpers/dimension';
import { getFontFamily } from '../../helpers/fonts';

interface TransactionItemProps {
  icon: React.ReactNode;
  category: string;
  description: string;
  amount: string;
  time: string;
  iconBg?: string;
  sign: 'plus' | 'minus';
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  icon,
  category,
  description,
  amount,
  time,
  iconBg = '#FFF7ED',
  sign,
}) => {
  const isMinus = sign === 'minus';
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.category}>{category}</Text>
        <Text style={styles.description} numberOfLines={1}>{description}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: isMinus ? '#EF4444' : '#10B981' }]}>
          {isMinus ? '-' : '+'} ${amount}
        </Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    backgroundColor: 'white',
    marginVertical: scale(4),
    marginHorizontal: scale(20),
    borderRadius: scale(16),
    // Subtle shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(15),
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  category: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#111827',
    marginBottom: scale(2),
  },
  description: {
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#6B7280',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    marginBottom: scale(2),
  },
  time: {
    fontSize: moderateScale(11),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#9CA3AF',
  },
});

export default TransactionItem;
