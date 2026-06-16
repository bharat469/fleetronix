import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { scale, moderateScale, verticalScale } from '../../helpers/dimension';
import { getFontFamily } from '../../helpers/fonts';
import { ChevronRightIcon } from '../../assets/svgIcons';

interface ExpenseFilterBottomSheetProps {
  onApply: (filters: FilterState) => void;
  onReset: () => void;
  onClose: () => void;
  initialFilters: FilterState;
}

export interface FilterState {
  filterBy: 'Received' | 'Pending' | null;
  sortBy: 'Highest' | 'Lowest' | 'Newest' | 'Oldest' | null;
  category: string[];
  month: number;
  year: number;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const mockCategories = ['Fuel', 'Toll', 'Repairing', 'Food', 'Lodging', 'Loading/unloading', 'Cleaning', 'Shopping', 'Subscription'];

const ExpenseFilterBottomSheet: React.FC<ExpenseFilterBottomSheetProps> = ({
  onApply,
  onReset,
  onClose,
  initialFilters,
}) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [currentView, setCurrentView] = useState<'main' | 'month' | 'year' | 'category'>('main');

  const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

  const toggleFilterBy = (type: 'Received' | 'Pending') => {
    setFilters(prev => ({
      ...prev,
      filterBy: prev.filterBy === type ? null : type
    }));
  };

  const setSortBy = (sort: 'Highest' | 'Lowest' | 'Newest' | 'Oldest') => {
    setFilters(prev => ({
      ...prev,
      sortBy: prev.sortBy === sort ? null : sort
    }));
  };

  const toggleCategory = (cat: string) => {
    setFilters(prev => {
      const exists = prev.category.includes(cat);
      if (exists) {
        return { ...prev, category: prev.category.filter(c => c !== cat) };
      } else {
        return { ...prev, category: [...prev.category, cat] };
      }
    });
  };

  const handleMonthSelect = (index: number) => {
    setFilters(prev => ({ ...prev, month: index + 1 }));
    setCurrentView('main');
  };

  const handleYearSelect = (year: number) => {
    setFilters(prev => ({ ...prev, year }));
    setCurrentView('main');
  };

  const renderMainView = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Filter By Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Filter By</Text>
        <View style={styles.chipContainer}>
          <TouchableOpacity 
            onPress={() => toggleFilterBy('Received')}
            style={[styles.chip, filters.filterBy === 'Received' && styles.activeChip]}
          >
            <Text style={[styles.chipText, filters.filterBy === 'Received' && styles.activeChipText]}>Received</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => toggleFilterBy('Pending')}
            style={[styles.chip, filters.filterBy === 'Pending' && styles.activeChip]}
          >
            <Text style={[styles.chipText, filters.filterBy === 'Pending' && styles.activeChipText]}>Pending</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort By Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Sort By</Text>
        <View style={styles.chipContainer}>
          {['Highest', 'Lowest', 'Newest', 'Oldest'].map((item) => (
            <TouchableOpacity 
              key={item}
              onPress={() => setSortBy(item as any)}
              style={[styles.chip, filters.sortBy === item && styles.activeChip]}
            >
              <Text style={[styles.chipText, filters.sortBy === item && styles.activeChipText]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List Selection Sections */}
      <View style={styles.listSection}>
        <Text style={styles.sectionLabel}>Category</Text>
        <TouchableOpacity style={styles.listItem} onPress={() => setCurrentView('category')}>
          <Text style={styles.listItemLabel}>Choose Category</Text>
          <View style={styles.listItemRight}>
            <Text style={styles.listItemValue}>{filters.category.length} Selected</Text>
            <ChevronRightIcon />
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { marginTop: scale(20) }]}>Monthly</Text>
        <TouchableOpacity style={styles.listItem} onPress={() => setCurrentView('month')}>
          <Text style={styles.listItemLabel}>Choose month</Text>
          <View style={styles.listItemRight}>
            <Text style={styles.listItemValue}>{months[filters.month - 1]}</Text>
            <ChevronRightIcon />
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { marginTop: scale(20) }]}>Yearly</Text>
        <TouchableOpacity style={styles.listItem} onPress={() => setCurrentView('year')}>
          <Text style={styles.listItemLabel}>Choose year</Text>
          <View style={styles.listItemRight}>
            <Text style={styles.listItemValue}>{filters.year}</Text>
            <ChevronRightIcon />
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.applyBtn} 
        onPress={() => onApply(filters)}
      >
        <Text style={styles.applyBtnText}>Apply</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderMonthView = () => (
    <View style={styles.selectionView}>
      <View style={styles.gridContainer}>
        {months.map((month, index) => (
          <TouchableOpacity 
            key={month}
            onPress={() => handleMonthSelect(index)}
            style={[styles.gridItem, filters.month === index + 1 && styles.activeGridItem]}
          >
            <Text style={[styles.gridText, filters.month === index + 1 && styles.activeGridText]}>{month.substring(0, 3)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderYearView = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.selectionView}>
      {years.map((year) => (
        <TouchableOpacity 
          key={year}
          onPress={() => handleYearSelect(year)}
          style={[styles.listSelectionItem, filters.year === year && styles.activeListSelectionItem]}
        >
          <Text style={[styles.listSelectionText, filters.year === year && styles.activeListSelectionText]}>{year}</Text>
        </TouchableOpacity>
      ))}
      <View style={{ height: scale(20) }} />
    </ScrollView>
  );

  const renderCategoryView = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.selectionView}>
      {mockCategories.map((cat) => (
        <TouchableOpacity 
          key={cat}
          onPress={() => toggleCategory(cat)}
          style={[styles.listSelectionItem, filters.category.includes(cat) && styles.activeListSelectionItem]}
        >
          <Text style={[styles.listSelectionText, filters.category.includes(cat) && styles.activeListSelectionText]}>{cat}</Text>
          {filters.category.includes(cat) && <View style={styles.selectedDot} />}
        </TouchableOpacity>
      ))}
      <TouchableOpacity 
        style={[styles.applyBtn, { marginTop: scale(20) }]} 
        onPress={() => setCurrentView('main')}
      >
        <Text style={styles.applyBtnText}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const getTitle = () => {
    switch (currentView) {
      case 'month': return 'Select Month';
      case 'year': return 'Select Year';
      case 'category': return 'Select Categories';
      default: return 'Filter Transaction';
    }
  };

  return (
    <View style={styles.modalWrapper}>
      <View style={styles.container}>
        <View style={styles.handle} />
        
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => currentView === 'main' ? onClose() : setCurrentView('main')}
          >
            <Text style={styles.title}>{getTitle()}</Text>
          </TouchableOpacity>
          {currentView === 'main' && (
            <TouchableOpacity onPress={() => {
              onReset();
              onClose();
            }} style={styles.resetBtn}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {currentView === 'main' && renderMainView()}
        {currentView === 'month' && renderMonthView()}
        {currentView === 'year' && renderYearView()}
        {currentView === 'category' && renderCategoryView()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: scale(30),
    borderTopRightRadius: scale(30),
    paddingBottom: verticalScale(20),
  },
  handle: {
    width: scale(50),
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: scale(10),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: scale(20),
    paddingBottom: scale(10),
  },
  title: {
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#111827',
  },
  resetBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: scale(15),
    paddingVertical: scale(6),
    borderRadius: scale(10),
  },
  resetText: {
    color: '#EF4444',
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(20),
  },
  section: {
    marginTop: scale(20),
  },
  sectionLabel: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#111827',
    marginBottom: scale(15),
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(10),
  },
  chip: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderRadius: scale(25),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  activeChip: {
    borderColor: '#CA2027',
    backgroundColor: '#FDF2F2',
  },
  chipText: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#374151',
  },
  activeChipText: {
    color: '#CA2027',
  },
  listSection: {
    marginTop: scale(25),
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scale(10),
  },
  listItemLabel: {
    fontSize: moderateScale(15),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#4B5563',
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemValue: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#9CA3AF',
    marginRight: scale(5),
  },
  applyBtn: {
    backgroundColor: '#CA2027',
    height: scale(56),
    borderRadius: scale(15),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(30),
  },
  applyBtnText: {
    color: 'white',
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
  },
  selectionView: {
    paddingHorizontal: scale(20),
    maxHeight: verticalScale(350),
    paddingBottom: scale(20),
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: scale(10),
  },
  gridItem: {
    width: '30%',
    height: scale(50),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    marginBottom: scale(10),
  },
  activeGridItem: {
    borderColor: '#CA2027',
    backgroundColor: '#FDF2F2',
  },
  gridText: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#374151',
  },
  activeGridText: {
    color: '#CA2027',
  },
  listSelectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activeListSelectionItem: {
    backgroundColor: '#FDF2F2',
    paddingHorizontal: scale(10),
    borderRadius: scale(8),
  },
  listSelectionText: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#374151',
  },
  activeListSelectionText: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#CA2027',
  },
  selectedDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: '#CA2027',
  },
});

export default ExpenseFilterBottomSheet;
