import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { scale, moderateScale, SCREEN } from '../../helpers/dimension';
import { getFontFamily } from '../../helpers/fonts';
import { useNavigation } from '@react-navigation/native';

import Svg, { Path, Circle } from 'react-native-svg';
import SvgIcon from '../../helpers/svgComponents';
import {
  FoodIcon,
  SubscriptionIcon,
  ShoppingIcon,
  RoadIcon,
  TruckIcon,
  MoreDotsIcon,
} from '../../assets/svgIcons';

interface TransactionItemProps {
  id?: string;
  icon?: React.ReactNode;
  category: string;
  description: string;
  amount: string;
  time: string;
  iconBg?: string;
  sign: 'plus' | 'minus';
}

const getCategoryIconAndBg = (category: string) => {
  const norm = (category || '').toLowerCase().trim();

  // 1. Toll
  if (norm.includes('toll')) {
    return {
      icon: <RoadIcon width={24} height={24} color="#2563EB" />,
      bg: '#DBEAFE', // Light blue
    };
  }
  // 2. Food
  if (norm.includes('food')) {
    return {
      icon: <FoodIcon width={24} height={24} color="#EF4444" />,
      bg: '#FEE2E2', // Light red
    };
  }
  // 3. Subscription
  if (norm.includes('sub')) {
    return {
      icon: <SvgIcon name="subscribeExpese" width={scale(24)} height={scale(24)} />,
      bg: '#EDE9FE', // Light purple
    };
  }
  // 4. Fuel
  if (norm.includes('fuel')) {
    return {
      icon: <SvgIcon name="fuelIconExpense" width={scale(24)} height={scale(24)} />,
      bg: '#FFEDD5', // Light orange
    };
  }
  // 5. Repairing / Maintenance
  if (norm.includes('repair') || norm.includes('maintenance') || norm.includes('tire') || norm.includes('tyre')) {
    return {
      icon: (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </Svg>
      ),
      bg: '#FEF3C7', // Light yellow
    };
  }
  // 6. Loading/unloading
  if (norm.includes('load') || norm.includes('cargo')) {
    return {
      icon: <TruckIcon width={24} height={24} color="#10B981" />,
      bg: '#ECFDF5', // Light emerald
    };
  }
  // 7. Lodging
  if (norm.includes('lodge') || norm.includes('stay') || norm.includes('hotel') || norm.includes('room')) {
    return {
      icon: (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" />
        </Svg>
      ),
      bg: '#E0F2FE', // Light sky
    };
  }
  // 8. Cleaning
  if (norm.includes('clean') || norm.includes('wash')) {
    return {
      icon: (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 3v1M12 20v1M3 12h1M20 12h1M18.36 5.64l-.7.7M6.34 17.66l-.7.7M18.36 18.36l-.7-.7M6.34 5.64l-.7-.7M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0z" />
        </Svg>
      ),
      bg: '#E0F7FA', // Light cyan
    };
  }
  // 9. Shopping
  if (norm.includes('shop')) {
    return {
      icon: <SvgIcon name="shoppingIconExpense" width={scale(24)} height={scale(24)} />,
      bg: '#FEF3C7',
    };
  }

  // Fallback
  return {
    icon: <MoreDotsIcon width={24} height={24} color="#6B7280" />,
    bg: '#F3F4F6', // Light gray
  };
};

const getCategoryDisplayName = (category: string) => {
  const norm = (category || '').toLowerCase().trim();
  const mapping: { [key: string]: string } = {
    'toll': 'Toll',
    'food': 'Food',
    'subscription': 'Subscription',
    'repairing': 'Repairing',
    'tire_changing': 'Tire Changing',
    'tyre_changing': 'Tire Changing',
    'fuel': 'Fuel',
    'loading_unloading': 'Loading/unloading',
    'lodging': 'Lodging',
    'cleaning': 'Cleaning',
    'shopping': 'Shopping',
    'other': 'Other',
  };
  return mapping[norm] || category;
};

const formatDateTime = (timeStr: string) => {
  if (!timeStr) return { date: '', time: '' };

  const hasDatePart = timeStr.includes('-') || timeStr.includes('/');
  if (!hasDatePart) {
    return { date: '', time: timeStr };
  }

  try {
    const dateObj = new Date(timeStr);
    if (!isNaN(dateObj.getTime())) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = months[dateObj.getMonth()];
      const year = dateObj.getFullYear();

      let hours = dateObj.getHours();
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedTime = `${hours}:${minutes} ${ampm}`;

      return {
        date: `${day} ${month} ${year}`,
        time: formattedTime,
      };
    }
  } catch (e) {
    // Ignore and fallback
  }

  const parts = timeStr.split(/[T ]/);
  if (parts.length >= 2) {
    return { date: parts[0], time: parts[1] };
  }

  return { date: '', time: timeStr };
};

const TransactionItem: React.FC<TransactionItemProps> = ({
  id,
  icon: customIcon,
  category,
  description,
  amount,
  time,
  iconBg: customIconBg,
  sign,
}) => {
  const navigation = useNavigation<any>();
  const isMinus = sign === 'minus';
  const { date: formattedDate, time: formattedTime } = formatDateTime(time);

  const { icon: defaultIcon, bg: defaultIconBg } = getCategoryIconAndBg(category);
  const icon = customIcon || defaultIcon;
  const iconBg = customIconBg || defaultIconBg;

  const handlePress = () => {
    if (id) {
      navigation.navigate('ExpenseSuccess', { expenseId: id });
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.category}>{getCategoryDisplayName(category)}</Text>
        <Text style={styles.description} numberOfLines={1}>{description}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: isMinus ? '#EF4444' : '#10B981' }]}>
          {isMinus ? '-' : '+'} ₹{amount}
        </Text>

        <Text style={styles.time}>{formattedTime}</Text>
      </View>
    </TouchableOpacity>
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
    justifyContent: 'center',
  },
  amount: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    marginBottom: scale(2),
  },
  date: {
    fontSize: moderateScale(11),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#4B5563',
    marginBottom: scale(2),
  },
  time: {
    fontSize: moderateScale(11),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#9CA3AF',
  },
});

export default TransactionItem;
