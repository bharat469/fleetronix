import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  BackHandler,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from '../../../helpers/dimension';
import { getFontFamily } from '../../../helpers/fonts';
import { useExpenseActivity } from '../../../hooks/useExpense';
import LinearGradient from 'react-native-linear-gradient';

// Reusable Components
import TransactionItem from '../../../components/expenses/TransactionItem';
import SvgIcon from '../../../helpers/svgComponents';
import { BackArrowIcon } from '../../../assets/svgIcons';
import ExpenseFilterBottomSheet, { FilterState } from '../../../components/expenses/ExpenseFilterBottomSheet';
import BottomSheetComponent from '../../../components/bottomsheet';

const normalizeCategory = (cat: string) => {
  return (cat || '')
    .toLowerCase()
    .replace('tyre', 'tire')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

const AllExpensesScreen = (props: any) => {
  const [isFilterVisible, setIsFilterVisible] = React.useState(false);
  const now = new Date();
  
  const [currentFilters, setCurrentFilters] = React.useState<FilterState>({
    filterBy: null,
    sortBy: null,
    category: [],
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        props.navigation.goBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        subscription.remove();
      };
    }, [props.navigation])
  );

  const { data: activityData, isLoading: isExpenseLoading, refetch, isRefetching } = useExpenseActivity({
    page: 1,
    per_page: 50,
    sort_by: currentFilters.sortBy ? currentFilters.sortBy.toLowerCase() : 'newest',
    month: currentFilters.month,
    year: currentFilters.year,
  });

  const dashboardData = activityData?.data;
  const transactions = dashboardData?.expenses || dashboardData?.activity || dashboardData?.recent_transactions || (Array.isArray(dashboardData) ? dashboardData : []);

  const handleApplyFilters = (newFilters: FilterState) => {
    setCurrentFilters(newFilters);
    setIsFilterVisible(false);
  };

  const handleResetFilters = () => {
    setCurrentFilters({
      filterBy: null,
      sortBy: null,
      category: [],
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
  };

  // Client-side filtering & sorting implementation
  const filteredTransactions = React.useMemo(() => {
    let list = [...transactions];

    // 1. Filter by transaction type (Received/Income vs Pending/Expense)
    if (currentFilters.filterBy) {
      if (currentFilters.filterBy === 'Received') {
        list = list.filter(item => item.sign === 'plus' || item.type === 'income');
      } else if (currentFilters.filterBy === 'Pending') {
        list = list.filter(item => item.sign === 'minus' || item.type === 'expense');
      }
    }

    // 2. Filter by category
    if (currentFilters.category && currentFilters.category.length > 0) {
      list = list.filter(item =>
        currentFilters.category.some(cat =>
          normalizeCategory(item.category) === normalizeCategory(cat)
        )
      );
    }

    // 2.5 Filter by month and year
    if (currentFilters.month) {
      list = list.filter(item => {
        const timeVal = item.timestamp || item.created_at || item.time;
        if (!timeVal) return false;
        const d = new Date(timeVal);
        return !isNaN(d.getTime()) && (d.getMonth() + 1) === currentFilters.month;
      });
    }

    if (currentFilters.year) {
      list = list.filter(item => {
        const timeVal = item.timestamp || item.created_at || item.time;
        if (!timeVal) return false;
        const d = new Date(timeVal);
        return !isNaN(d.getTime()) && d.getFullYear() === currentFilters.year;
      });
    }

    // 3. Sort by amount and date
    if (currentFilters.sortBy) {
      list.sort((a, b) => {
        const amtA = Number(a.amount) || 0;
        const amtB = Number(b.amount) || 0;

        if (currentFilters.sortBy === 'Highest') {
          return amtB - amtA;
        }
        if (currentFilters.sortBy === 'Lowest') {
          return amtA - amtB;
        }
        if (currentFilters.sortBy === 'Newest') {
          const timeA = new Date(a.time).getTime();
          const timeB = new Date(b.time).getTime();
          if (!isNaN(timeA) && !isNaN(timeB)) {
            return timeB - timeA;
          }
          return b.time.localeCompare(a.time);
        }
        if (currentFilters.sortBy === 'Oldest') {
          const timeA = new Date(a.time).getTime();
          const timeB = new Date(b.time).getTime();
          if (!isNaN(timeA) && !isNaN(timeB)) {
            return timeA - timeB;
          }
          return a.time.localeCompare(b.time);
        }
        return 0;
      });
    }

    return list;
  }, [transactions, currentFilters.filterBy, currentFilters.category, currentFilters.sortBy, currentFilters.month, currentFilters.year]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <LinearGradient
        colors={['#FFF1F1', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
      />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => props.navigation.goBack()} style={styles.backBtn}>
            <BackArrowIcon color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Transactions</Text>
        </View>
        
        <TouchableOpacity onPress={() => setIsFilterVisible(true)} style={styles.filterBtn}>
          <SvgIcon name="filterExpense" width={scale(18)} height={scale(18)} />
        </TouchableOpacity>
      </View>

      {isExpenseLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#CA2027" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={['#CA2027']}
              tintColor="#CA2027"
            />
          }
        >
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No transactions found matching the selected filters.</Text>
            </View>
          ) : (
            filteredTransactions.map((item: any, index: number) => (
              <TransactionItem 
                key={item.id || item._id || `all-tx-${index}`}
                id={item.id || item._id || item.reference_id}
                category={item.category}
                description={item.description}
                amount={String(item.amount)}
                time={item.timestamp || item.created_at || item.time}
                sign={item.sign}
              />
            ))
          )}
          <View style={{ height: scale(40) }} />
        </ScrollView>
      )}

      <BottomSheetComponent 
        isVisible={isFilterVisible} 
        onBackdropPress={() => setIsFilterVisible(false)}
        onBackButtonPress={() => setIsFilterVisible(false)}
      >
        <ExpenseFilterBottomSheet 
          initialFilters={currentFilters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          onClose={() => setIsFilterVisible(false)}
        />
      </BottomSheetComponent>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: scale(10),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: scale(10),
    paddingBottom: scale(15),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: scale(12),
    padding: scale(5),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#111827',
  },
  filterBtn: {
    width: scale(45),
    height: scale(45),
    backgroundColor: 'white',
    borderRadius: scale(15),
    justifyContent: 'center',
    alignItems: 'center',
    // Premium shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(40),
    marginTop: verticalScale(100),
  },
  emptyText: {
    fontSize: moderateScale(15),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: scale(22),
  },
});

export default AllExpensesScreen;
