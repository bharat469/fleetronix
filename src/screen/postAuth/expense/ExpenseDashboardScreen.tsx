import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from '../../../helpers/dimension';
import { getFontFamily } from '../../../helpers/fonts';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { useDriverInfo } from '../../../hooks/useAuth';
import { useExpenseDashboard } from '../../../hooks/useExpense';
import LinearGradient from 'react-native-linear-gradient';
import { ActivityIndicator } from 'react-native';

// Reusable Components
import SectionHeader from '../../../components/expenses/SectionHeader';
import SummaryCard from '../../../components/expenses/SummaryCard';
import TransactionItem from '../../../components/expenses/TransactionItem';
import SpendChart from '../../../components/expenses/SpendChart';
import SvgIcon from '../../../helpers/svgComponents';
import { RedBellIcon, BackArrowIcon } from '../../../assets/svgIcons';
import ExpenseFilterBottomSheet, { FilterState } from '../../../components/expenses/ExpenseFilterBottomSheet';
import BottomSheetComponent from '../../../components/bottomsheet';

const ExpenseDashboardScreen = (props:any) => {
  const [activeFilter, setActiveFilter] = React.useState('Today');
  const [isFilterVisible, setIsFilterVisible] = React.useState(false);
  
  const now = new Date();
  const [currentFilters, setCurrentFilters] = React.useState<FilterState>({
    filterBy: null,
    sortBy: null,
    category: [],
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const { driverId, userToken } = useSelector((state: RootState) => state.auth);
  const { data: driverResponse } = useDriverInfo(
    driverId || '',
    userToken || '',
    !!driverId && !!userToken
  );
  const driverData = driverResponse?.data;

  const { data: expenseData, isLoading: isExpenseLoading } = useExpenseDashboard({
    month: currentFilters.month,
    year: currentFilters.year,
    frequency: activeFilter.toLowerCase(),
  });

  const dashboardData = expenseData?.data;

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

  const _handleAddNewExpense=()=>{
    props.navigation.navigate('AddExpense');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <LinearGradient
        colors={['#FFF1F1', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
      />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => props.navigation.goBack()} style={styles.backBtn}>
              <BackArrowIcon color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileContainer}>
              <Image 
                source={{ uri: driverData?.image || driverData?.profile_photo || 'https://randomuser.me/api/portraits/women/44.jpg' }} 
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.notificationBtn}>
            <RedBellIcon width={scale(24)} height={scale(24)} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {isExpenseLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#CA2027" />
          </View>
        ) : (
          <>
            {/* Total Expense Section */}
            <View style={styles.expenseOverview}>
              <Text style={styles.overviewLabel}>Total Expense</Text>
              <Text style={styles.totalAmount}>₹{dashboardData?.total_expense || 0}</Text>
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryRow}>
              <SummaryCard label="Received" amount={String(dashboardData?.received || 0)} type="received" />
              <SummaryCard label="Pending" amount={String(dashboardData?.pending || 0)} type="pending" />
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.addBtnContainer} activeOpacity={0.9} onPress={_handleAddNewExpense}>
              <LinearGradient
                colors={['#CA2027', '#991B1B']}
                style={styles.addBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.addBtnText}>Add Your new Expense</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Spend Frequency Chart */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Spend Frequency</Text>
              <SpendChart 
                activeFilter={activeFilter} 
                setActiveFilter={setActiveFilter} 
                data={dashboardData?.spend_frequency} 
              />
            </View>

            {/* Recent Transactions */}
            <SectionHeader 
              title="Recent Transaction" 
              onSeeAll={() => {}} 
              onFilter={() => {
             
                setIsFilterVisible(true);
              }} 
            />
            
            {dashboardData?.recent_transactions?.map((item: any, index: number) => (
              <TransactionItem 
                key={item.id || `tx-${index}`}
                category={item.category}
                description={item.description}
                amount={String(item.amount)}
                time={item.time}
                sign={item.sign}
                icon={
                  <SvgIcon 
                    name={
                      item.category.toLowerCase().includes('shop') ? 'shoppingIconExpense' :
                      item.category.toLowerCase().includes('sub') ? 'subscribeExpese' :
                      'foodIconExpense'
                    } 
                    width={scale(24)} 
                    height={scale(24)} 
                    color={
                      item.category.toLowerCase().includes('shop') ? '#F59E0B' :
                      item.category.toLowerCase().includes('sub') ? '#8B5CF6' :
                      '#EF4444'
                    } 
                  />
                }
                iconBg={
                  item.category.toLowerCase().includes('shop') ? '#FEF3C7' :
                  item.category.toLowerCase().includes('sub') ? '#EDE9FE' :
                  '#FEE2E2'
                }
              />
            ))}

            <View style={styles.todaySection}>
              <Text style={styles.todayLabel}>Today</Text>
            </View>
          </>
        )}

        <View style={{ height: scale(40) }} />
      </ScrollView>
      <BottomSheetComponent 
        isVisible={isFilterVisible} 
        onBackdropPress={() => setIsFilterVisible(false)}
        onBackButtonPress={()=>setIsFilterVisible(false)}
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
    height: verticalScale(300),
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: scale(10),
    marginBottom: verticalScale(10),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: scale(12),
    padding: scale(5),
  },
  profileContainer: {
    width: scale(45),
    height: scale(45),
    borderRadius: scale(22.5),
    borderWidth: 2,
    borderColor: '#CA2027',
    padding: 2,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: scale(20),
  },
  notificationBtn: {
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
  notificationDot: {
    position: 'absolute',
    top: scale(12),
    right: scale(12),
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  expenseOverview: {
    alignItems: 'center',
    marginTop: scale(20),
  },
  overviewLabel: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#6B7280',
    marginBottom: scale(8),
  },
  totalAmount: {
    fontSize: moderateScale(40),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#111827',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: scale(15),
    marginTop: scale(30),
  },
  addBtnContainer: {
    marginHorizontal: scale(20),
    marginTop: scale(30),
  },
  addBtn: {
    height: scale(56),
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: 'white',
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
  },
  sectionContainer: {
    marginTop: scale(35),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#111827',
    paddingHorizontal: scale(20),
    marginBottom: scale(10),
  },
  todaySection: {
    paddingHorizontal: scale(20),
    marginTop: scale(20),
  },
  todayLabel: {
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#111827',
  },
});

export default ExpenseDashboardScreen;
