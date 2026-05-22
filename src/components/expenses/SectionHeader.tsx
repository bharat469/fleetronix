import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { scale, moderateScale } from '../../helpers/dimension';
import { getFontFamily } from '../../helpers/fonts';
import { FilterIcon } from '../../assets/svgIcons';
import SvgIcon from '../../helpers/svgComponents';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
  onFilter?: () => void;
  showFilter?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  onSeeAll, 
  onFilter, 
  showFilter = true 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.rightSection}>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        )}
        {showFilter && (
          <TouchableOpacity onPress={onFilter} style={styles.filterBtn}>
          <SvgIcon name='filterExpense' width={scale(18)} height={scale(18)} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: scale(15),
    paddingHorizontal: scale(20),
  },
  title: {
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#111827',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllBtn: {
    backgroundColor: '#FDF2F2',
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    marginRight: scale(10),
  },
  seeAllText: {
    fontSize: moderateScale(15),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#CA2027',
  },
  filterBtn: {
    width: scale(25),
    height: scale(25),
    backgroundColor: 'white',
    borderRadius: scale(5),
    justifyContent: 'center',
    alignItems: 'center',
    // Premium shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
});

export default SectionHeader;
