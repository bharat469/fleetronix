import { 
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Share from 'react-native-share';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { scale, verticalScale, moderateScale } from '../../../helpers/dimension';
import { getFontFamily } from '../../../helpers/fonts';
import { CloseIcon, ShareIcon, DownloadIcon, ShieldCheckIcon } from '../../../assets/svgIcons';
import { useExpenseDetails, useDownloadReceipt } from '../../../hooks/useExpense';
import { getExpensePdf } from '../../../services/expenseApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReactNativeBlobUtil from 'react-native-blob-util';
import moment from 'moment';
import BottomSheetComponent from '../../../components/bottomsheet';
import { useState } from 'react';

type ExpenseSuccessRouteProp = RouteProp<RootStackParamList, 'ExpenseSuccess'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ExpenseSuccessScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ExpenseSuccessRouteProp>();
  const { expenseId } = route.params;

  const [statusSheetVisible, setStatusSheetVisible] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'success' | 'error' | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const { data: details, isLoading } = useExpenseDetails(expenseId);
  const { mutate: downloadReceipt, isPending: isDownloading } = useDownloadReceipt({
    onSuccess: (path) => {
      setDownloadStatus('success');
      setStatusSheetVisible(true);
    },
    onError: (error) => {
      setDownloadStatus('error');
      setStatusSheetVisible(true);
    }
  });

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      // Fetch the pdf downloaded to CacheDir
      const path = await getExpensePdf(expenseId, true);
      
      // Verify that the file exists and is not empty
      const fileExists = await ReactNativeBlobUtil.fs.exists(path);
      if (!fileExists) {
        throw new Error('Receipt file not found.');
      }
      
      const stat = await ReactNativeBlobUtil.fs.stat(path);
      if (Number(stat.size) === 0) {
        throw new Error('Receipt file is empty.');
      }

      const shareOptions = {
        title: 'Expense Receipt',
        url: `file://${path}`,
        type: 'application/pdf',
        failOnCancel: false,
      };
      await Share.open(shareOptions);
    } catch (error: any) {
      console.log('Share error:', error);
      Alert.alert('Error', error?.message || 'Failed to share receipt. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const expense = details?.data;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('ExpenseDashboard')}>
          <CloseIcon color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expense Added</Text>
        <TouchableOpacity onPress={handleShare} disabled={isLoading || isSharing}>
          {isSharing ? (
            <ActivityIndicator size="small" color="#CA2027" />
          ) : (
            <ShareIcon color="#374151" />
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#CA2027" />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}> ₹{expense?.amount || '0'}</Text>
            </View>

            <View style={styles.detailsCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderText}>Expense Details</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ref Number</Text>
                <Text style={styles.detailValue}>{expense?.expense_number || expense?.payment_number || 'N/A'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>
                  {expense?.created_at ? moment(expense.created_at).format('DD-MM-YYYY, HH:mm:ss') : 'N/A'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>{expense?.mode_of_payment || expense?.payment_mode || 'N/A'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expense Category</Text>
                <Text style={styles.detailValue}>
                  {expense?.category || expense?.payment_head || expense?.note || 'N/A'}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValue}>₹{expense?.amount || '0'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Status</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Success</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.downloadBtn}
              onPress={() => downloadReceipt(expenseId)}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator color="#374151" />
              ) : (
                <>
                  <DownloadIcon color="#374151" width={scale(18)} height={scale(18)} />
                  <Text style={styles.downloadBtnText}>Get PDF Receipt</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.homeBtn}
              onPress={() => navigation.navigate('ExpenseDashboard' as any)}
            >
              <Text style={styles.homeBtnText}>Home</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <BottomSheetComponent 
        isVisible={statusSheetVisible} 
        onBackdropPress={() => setStatusSheetVisible(false)}
      >
        <View style={styles.statusSheetContent}>
          <View style={[styles.statusIconCircle, downloadStatus === 'error' && styles.errorIconCircle]}>
             {downloadStatus === 'success' ? (
               <ShieldCheckIcon color="white" width={scale(30)} height={scale(30)} />
             ) : (
               <Text style={styles.errorX}>✕</Text>
             )}
          </View>
          <Text style={styles.statusSheetTitle}>
            {downloadStatus === 'success' ? 'File Downloaded' : 'Download Failed'}
          </Text>
          <Text style={styles.statusSheetSub}>
            {downloadStatus === 'success' 
              ? 'Your receipt has been successfully saved to your downloads folder.' 
              : 'Something went wrong while downloading your receipt. Please try again.'}
          </Text>
          <TouchableOpacity 
            style={styles.statusCloseBtn} 
            onPress={() => setStatusSheetVisible(false)}
          >
            <Text style={styles.statusCloseBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetComponent>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#10B981',
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(100),
  },
  amountSection: {
    alignItems: 'center',
    marginVertical: verticalScale(30),
  },
  amountLabel: {
    fontSize: moderateScale(36),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#111827',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: scale(16),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: {
    backgroundColor: '#FFF7F7',
    paddingVertical: verticalScale(15),
    alignItems: 'center',
  },
  cardHeaderText: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#111827',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
  },
  detailLabel: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#6B7280',
  },
  detailValue: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: scale(20),
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    borderRadius: scale(20),
  },
  statusText: {
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#10B981',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(20),
    backgroundColor: '#F9FAFB',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: verticalScale(15),
    borderRadius: scale(12),
    marginBottom: verticalScale(15),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  downloadBtnText: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#374151',
    marginLeft: scale(8),
  },
  homeBtn: {
    backgroundColor: '#CA2027',
    paddingVertical: verticalScale(15),
    borderRadius: scale(12),
    alignItems: 'center',
  },
  homeBtnText: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: 'white',
  },
  statusSheetContent: {
    backgroundColor: 'white',
    padding: scale(20),
    alignItems: 'center',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
  },
  statusIconCircle: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  errorIconCircle: {
    backgroundColor: '#EF4444',
  },
  errorX: {
    fontSize: moderateScale(30),
    color: 'white',
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
  },
  statusSheetTitle: {
    fontSize: moderateScale(20),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#111827',
    marginBottom: verticalScale(10),
  },
  statusSheetSub: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: verticalScale(30),
    lineHeight: moderateScale(20),
  },
  statusCloseBtn: {
    backgroundColor: '#CA2027',
    width: '100%',
    paddingVertical: verticalScale(15),
    borderRadius: scale(12),
    alignItems: 'center',
  },
  statusCloseBtnText: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: 'white',
  },
});

export default ExpenseSuccessScreen;
