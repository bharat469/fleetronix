import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import LinearGradient from 'react-native-linear-gradient';
import { scale, verticalScale, moderateScale } from '../../../helpers/dimension';
import { getFontFamily } from '../../../helpers/fonts';
import { COLORS } from '../../../helpers/values/colors';
import SvgIcon from '../../../helpers/svgComponents';
import { 
  BackArrowIcon, 
  ChevronRightIcon, 
  CloseCircleIcon, 
  PaperclipIcon,
  CameraIcon,
  GalleryIcon,
  DocumentIcon,
} from '../../../assets/svgIcons';
import BottomSheetComponent from '../../../components/bottomsheet';
import { useImageSelection } from '../../../helpers/useImageSelection';
import { pick, types } from '@react-native-documents/picker';
import { Asset } from 'react-native-image-picker';
import { useAddExpense } from '../../../hooks/useExpense';

interface Attachment {
  uri?: string;
  type?: string;
  name?: string;
  isImage?: boolean;
}

const mockCategories = ['Fuel', 'Toll', 'Repairing', 'Food', 'Lodging', 'Loading/unloading', 'Cleaning', 'Shopping', 'Subscription'];
const mockWallets = ['UPI', 'Cash', 'bank transfer', 'wallet','cheque'];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AddExpenseScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [amount, setAmount] = useState('0');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [wallet, setWallet] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [currentSheet, setCurrentSheet] = useState<'attachment' | 'category' | 'wallet'>('attachment');

  const { mutate: addExpenseMutate, isPending: isSubmitting } = useAddExpense({
    onSuccess: (response) => {
      // Check for ID in various possible response structures
      const expenseId = response?.data?._id || response?._id || response?.data?.id || response?.id;
      
      console.log('[AddExpense] Success response ID:', expenseId);
      console.log('responseshgds',response)
      if (expenseId) {
        navigation.navigate('ExpenseSuccess', { expenseId } as any);
      } else {
        Alert.alert('Success', 'Expense added successfully');
        // navigation.goBack();
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add expense');
    }
  });

  const onImageSelected = (asset: any) => {
    setAttachment({
      uri: asset.uri,
      type: asset.type,
      name: asset.fileName,
      isImage: true
    });
    setIsSheetVisible(false);
  };

  const { pickImage, takePhoto } = useImageSelection(onImageSelected);

  const handleDocumentPick = async () => {
    try {
      const [result] = await pick({
        type: [types.pdf, types.doc, types.docx, types.images],
      });
    
      setAttachment({
        uri: result.uri || undefined,
        type: result.type || undefined,
        name: result.name || undefined,
        isImage: result.type ? result.type.startsWith('image/') : false
      });
      setIsSheetVisible(false);
    } catch (err) {
      console.log('Document pick error:', err);
    }
  };

  const openSheet = (type: 'attachment' | 'category' | 'wallet') => {
    setCurrentSheet(type);
    setIsSheetVisible(true);
  };

  const handleSelection = (value: string) => {
    if (currentSheet === 'category') setCategory(value);
    if (currentSheet === 'wallet') setWallet(value);
    setIsSheetVisible(false);
  };

  const handleContinue = () => {
    const numericAmount = parseFloat(amount);
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Validation Error', 'Amount must be greater than 0');
      return;
    }

    if (!category) {
      Alert.alert('Validation Error', 'Please select a category');
      return;
    }

    if (!description) {
      Alert.alert('Validation Error', 'Please enter a description');
      return;
    }

    if (!wallet) {
      Alert.alert('Validation Error', 'Please select a payment mode');
      return;
    }

    addExpenseMutate({
      amount: numericAmount,
      category: category,
      description: description,
      mode_of_payment: wallet,
      attachment: attachment ? {
        uri: attachment.uri!,
        type: attachment.type!,
        name: attachment.name!,
      } : null
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#CA2027" />
      
      {/* Red Header Section */}
      <View style={styles.headerSection}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerNav}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <BackArrowIcon color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Expense</Text>
            <View style={{ width: scale(24) }} />
          </View>
          
          <View style={styles.amountContainer}>
            <Text style={styles.howMuchText}>How much?</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="Enter Amount"
                placeholderTextColor="rgba(255,255,255,0.6)"
                autoFocus={true}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* White Form Section */}
      <View style={styles.formContainer}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
          {/* Category Dropdown */}
          <TouchableOpacity style={styles.inputWrapper} onPress={() => openSheet('category')}>
            {category ? (
              <View style={styles.categoryPill}>
                <View style={styles.greenDot} />
                <Text style={styles.categoryPillText}>{category}</Text>
              </View>
            ) : (
              <Text style={[styles.inputValue, styles.placeholderText]}>
                Category
              </Text>
            )}
            <View style={styles.chevronDown}>
              <ChevronRightIcon style={{ transform: [{ rotate: '90deg' }] }} />
            </View>
          </TouchableOpacity>

          {/* Description Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Description"
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Wallet Dropdown */}
          <TouchableOpacity style={styles.inputWrapper} onPress={() => openSheet('wallet')}>
            <Text style={[styles.inputValue, !wallet && styles.placeholderText]}>
              {wallet || 'Wallet'}
            </Text>
            <View style={styles.chevronDown}>
              <ChevronRightIcon style={{ transform: [{ rotate: '90deg' }] }} />
            </View>
          </TouchableOpacity>

          {/* Attachment Section */}
          {attachment ? (
            <View style={styles.attachmentPreviewContainer}>
              {attachment.isImage ? (
                <Image source={{ uri: attachment.uri || undefined }} style={styles.attachmentImage} />
              ) : (
                <View style={[styles.attachmentImage, styles.documentPlaceholder]}>
                  <DocumentIcon color="#CA2027" />
                  <Text style={styles.documentName} numberOfLines={1}>{attachment.name}</Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.removeAttachmentBtn}
                onPress={() => setAttachment(null)}
              >
                <CloseCircleIcon />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addAttachmentBtn}
              onPress={() => openSheet('attachment')}
            >
              <PaperclipIcon />
              <Text style={styles.addAttachmentText}>Add attachment</Text>
            </TouchableOpacity>
          )}

          {/* Continue Button */}
          <TouchableOpacity 
            style={styles.continueBtnContainer} 
            activeOpacity={0.9}
            onPress={handleContinue}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={['#CA2027', '#991B1B']}
              style={styles.continueBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.continueBtnText}>Continue</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Universal Bottom Sheet */}
      <BottomSheetComponent 
        isVisible={isSheetVisible} 
        onBackdropPress={() => setIsSheetVisible(false)}
        style={{ justifyContent: 'flex-end' }}
      >
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHandle} />
          
          {currentSheet === 'attachment' ? (
            <View style={styles.pickerOptions}>
              <TouchableOpacity style={styles.pickerOption} onPress={takePhoto}>
                <View style={[styles.pickerIconWrapper, { backgroundColor: '#FFF5F5' }]}>
                  <CameraIcon color="#CA2027" width={scale(28)} height={scale(28)} />
                </View>
                <Text style={styles.pickerOptionText}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.pickerOption} onPress={pickImage}>
                <View style={[styles.pickerIconWrapper, { backgroundColor: '#FFF5F5' }]}>
                  <GalleryIcon color="#CA2027" width={scale(28)} height={scale(28)} />
                </View>
                <Text style={styles.pickerOptionText}>Image</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.pickerOption} onPress={handleDocumentPick}>
                <View style={[styles.pickerIconWrapper, { backgroundColor: '#FFF5F5' }]}>
                  <DocumentIcon color="#CA2027" width={scale(28)} height={scale(28)} />
                </View>
                <Text style={styles.pickerOptionText}>Document</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.selectionListContainer}>
              <Text style={styles.selectionTitle}>
                Select {currentSheet === 'category' ? 'Category' : 'Wallet'}
              </Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: verticalScale(300) }}>
                {(currentSheet === 'category' ? mockCategories : mockWallets).map((item) => (
                  <TouchableOpacity 
                    key={item} 
                    style={styles.selectionItem}
                    onPress={() => handleSelection(item)}
                  >
                    <Text style={styles.selectionItemText}>{item}</Text>
                    {((currentSheet === 'category' ? category : wallet) === item) && (
                      <View style={styles.selectedDot} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </BottomSheetComponent>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#CA2027',
  },
  headerSection: {
    backgroundColor: '#CA2027',
    paddingBottom: verticalScale(40),
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
  },
  backBtn: {
    padding: scale(5),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: 'white',
  },
  amountContainer: {
    marginTop: verticalScale(30),
    paddingHorizontal: scale(30),
  },
  howMuchText: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: 'rgba(255,255,255,0.8)',
    marginBottom: scale(10),
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: moderateScale(48),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: 'white',
    marginRight: scale(10),
  },
  amountInput: {
    fontSize: moderateScale(64),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: 'white',
    flex: 1,
    padding: 0,
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: scale(30),
    borderTopRightRadius: scale(30),
    marginTop: verticalScale(-20),
  },
  scrollContent: {
    padding: scale(25),
    paddingBottom: verticalScale(40),
  },
  inputWrapper: {
    height: scale(56),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: scale(15),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(15),
    marginBottom: scale(20),
    justifyContent:'space-between'
  },
  inputValue: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#111827',
  },
  chevronDown: {
    marginLeft: scale(10),
  },
  addAttachmentBtn: {
    height: scale(56),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: scale(15),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(30),
  },
  addAttachmentText: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#9CA3AF',
    marginLeft: scale(10),
  },
  attachmentPreviewContainer: {
    marginBottom: scale(30),
    position: 'relative',
    width: scale(100),
    height: scale(100),
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
    borderRadius: scale(15),
  },
  removeAttachmentBtn: {
    position: 'absolute',
    top: scale(-10),
    right: scale(-10),
    zIndex: 1,
  },
  continueBtnContainer: {
    marginTop: scale(10),
  },
  continueBtn: {
    height: scale(56),
    borderRadius: scale(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnText: {
    color: 'white',
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: scale(25),
    borderTopRightRadius: scale(25),
    paddingBottom: verticalScale(30),
  },
  pickerHandle: {
    width: scale(40),
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: scale(10),
    marginBottom: scale(20),
  },
  pickerOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: scale(20),
  },
  pickerOption: {
    alignItems: 'center',
    gap: scale(10),
  },
  pickerIconWrapper: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerOptionText: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#CA2027',
  },
  selectionListContainer: {
    paddingHorizontal: scale(25),
    paddingBottom: scale(20),
  },
  selectionTitle: {
    fontSize: moderateScale(20),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#111827',
    marginBottom: scale(20),
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(15),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectionItemText: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#374151',
  },
  selectedDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: '#CA2027',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  greenDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: '#10B981',
    marginRight: scale(8),
  },
  categoryPillText: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#111827',
  },
  documentPlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(10),
  },
  documentName: {
    fontSize: moderateScale(10),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#6B7280',
    marginTop: scale(5),
    textAlign: 'center',
  },
});

export default AddExpenseScreen;
