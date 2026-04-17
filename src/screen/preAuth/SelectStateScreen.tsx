import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../helpers/values/colors';
import { getFontFamily } from '../../helpers/fonts';
import { moderateScale, scale, verticalScale } from '../../helpers/dimension';
import SvgIcon from '../../helpers/svgComponents';
import { getStates, StateData } from '../../api/masterApi';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { toggleStateSelection } from '../../redux/slices/registrationSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectState'>;

const SelectStateScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const selectedStates = useAppSelector((state) => state.registration.selectedStates);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['states'],
    queryFn: getStates,
  });

  const filteredStates = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((state) =>
      state.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const toggleSelection = (item: StateData) => {
    dispatch(toggleStateSelection(item));
  };

  const handleContinue = () => {
    navigation.navigate('VerifyDocuments');
  };

  const renderStateItem = ({ item }: { item: StateData }) => {
    const isSelected = selectedStates.some((s) => s.id === item.id);

    return (
      <TouchableOpacity
        style={styles.stateItem}
        onPress={() => toggleSelection(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.stateName}>{item.name}</Text>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <SvgIcon name="checkIcon" width={scale(14)} height={scale(14)} color={COLORS.secondary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderChip = (item: StateData) => (
    <View key={item.id} style={styles.chip}>
      <Text style={styles.chipText}>{item.name}</Text>
      <TouchableOpacity onPress={() => toggleSelection(item)} style={styles.chipClose}>
        <Text style={styles.chipCloseText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            {/* Progress Header */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressCircle, styles.progressCirclePast]}>
                <SvgIcon name="checkIcon" width={scale(14)} height={scale(14)} color={COLORS.secondary} />
              </View>
              <View style={styles.progressLine} />
              <View style={styles.progressCircle}>
                <Text style={styles.progressText}>2</Text>
              </View>
              <View style={[styles.progressLine, styles.progressLineInactive]} />
              <View style={[styles.progressCircle, styles.progressCircleInactive]}>
                <Text style={styles.progressTextInactive}>3</Text>
              </View>
            </View>

            <Text style={styles.stepInfo}>{t('step_2_of_3', 'Step 2 of 3')}</Text>
            <Text style={styles.title}>{t('drivers_oasis', "Driver's Oasis")}</Text>
            <Text style={styles.description}>
              {t('drivers_oasis_desc', "Discover the 'Driver's Oasis': Where Comfort Meets the Open Road. Your Zen Zone on every journey")}
            </Text>

            <View style={styles.preferenceContainer}>
              <Text style={styles.preferenceLabel}>{t('preferences_state', 'Preferences State')}</Text>

              <View style={styles.searchContainer}>
                <SvgIcon name='searchIcon' width={scale(18)} height={scale(18)} color="#A0A0A0" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('search_your_state', 'Search your State...')}
                  placeholderTextColor="#A0A0A0"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {selectedStates.length > 0 && (
                <View style={styles.chipsContainer}>
                  <View style={styles.chipsWrapper}>
                    {selectedStates.map(renderChip)}
                  </View>
                </View>
              )}

              {isLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{t('failed_to_load_states', 'Failed to load states')}</Text>
                  <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
                    <Text style={styles.retryText}>{t('retry', 'Retry')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.listContainer, { height: verticalScale(220) }]}>
                  <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
                    {filteredStates.map((item) => (
                      <View key={item.id}>
                        {renderStateItem({ item })}
                      </View>
                    ))}
                    {filteredStates.length === 0 && (
                      <Text style={styles.emptyText}>{t('no_states_found', 'No states found')}</Text>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, selectedStates.length === 0 && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={selectedStates.length === 0}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{t('continue', 'Continue')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SelectStateScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  container: {
    flex: 1,
    paddingHorizontal: scale(20),
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(30),
  },
  progressCircle: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCirclePast: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  progressCircleInactive: {
    borderColor: COLORS.textColor.color2.three,
  },
  progressText: {
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    fontSize: moderateScale(16),
    color: COLORS.primary,
  },
  progressTextInactive: {
    color: COLORS.textColor.color2.three,
  },
  progressLine: {
    width: scale(60),
    height: 1.5,
    backgroundColor: COLORS.primary,
    marginHorizontal: scale(8),
  },
  progressLineInactive: {
    backgroundColor: COLORS.textColor.color2.three,
  },
  stepInfo: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(14),
    color: COLORS.textColor.color2.one,
    marginBottom: verticalScale(8),
  },
  title: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(28),
    color: COLORS.textColor.color1,
    fontWeight: '700',
    marginBottom: verticalScale(12),
  },
  description: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(16),
    color: COLORS.textColor.color2.one,
    lineHeight: verticalScale(22),
    marginBottom: verticalScale(30),
  },
  preferenceContainer: {
    flex: 1,
  },
  preferenceLabel: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(18),
    color: COLORS.textColor.color1,
    marginBottom: verticalScale(16),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#68718229',
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(12),
    height: verticalScale(45),
    marginBottom: verticalScale(16),
    // Shadow for iOS
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    // Elevation for Android
    elevation: 2,
  },
  searchIcon: {
    marginRight: scale(10),
  },
  searchInput: {
    flex: 1,
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(16),
    color: COLORS.textColor.color1,
  },
  chipsContainer: {
    backgroundColor: 'rgba(202, 32, 39, 0.15)', // Slightly more visible red
    borderRadius: moderateScale(10),
    padding: scale(10),
    marginBottom: verticalScale(16),
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.textColor.color2.three,
    borderRadius: moderateScale(20),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    margin: scale(4),
  },
  chipText: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(13),
    color: COLORS.textColor.color1,
    marginRight: scale(6),
  },
  chipClose: {
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: COLORS.textColor.color2.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCloseText: {
    fontSize: moderateScale(14),
    color: COLORS.textColor.color1,
    lineHeight: scale(16),
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: verticalScale(120),
  },
  listContainer: {
    marginTop: verticalScale(10),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(15),
    // Shadow for iOS
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    // Elevation for Android
    elevation: 5,
  },
  listContent: {
    paddingBottom: verticalScale(20),
  },
  stateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: verticalScale(55), // Fixed height to control '4 at a time'
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  stateName: {
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    fontSize: moderateScale(17),
    color: COLORS.textColor.color1,
  },
  checkbox: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(2),
    backgroundColor: '#D1D5DB', // Gray background as in image
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    fontSize: moderateScale(16),
    color: COLORS.textColor.color2.one,
    marginBottom: verticalScale(10),
  },
  retryButton: {
    padding: scale(10),
    backgroundColor: COLORS.primary,
    borderRadius: moderateScale(8),
  },
  retryText: {
    color: COLORS.secondary,
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
  },
  emptyText: {
    textAlign: 'center',
    marginTop: verticalScale(20),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: COLORS.textColor.color2.one,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: scale(20),
    backgroundColor: COLORS.secondary,
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.textColor.color2.three,
  },
  buttonText: {
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    fontSize: moderateScale(18),
    color: COLORS.secondary,
    fontWeight: '600',
  },
});
