import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../helpers/values/colors';
import { getFontFamily } from '../../helpers/fonts';
import { moderateScale, scale, verticalScale } from '../../helpers/dimension';
import SvgIcon from '../../helpers/svgComponents';
import { getVehicleTypes, VehicleType } from '../../api/masterApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { toggleTruckSelection } from '../../redux/slices/registrationSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectTruck'>;

const CARD_COLORS = [
  '#A0A0A0', // Tipper Trucks
  '#CC2B2B', // Trailer Truck
  '#2B2BCC', // Dump Truck
  '#4A5568', // Small Truck
  '#48BB78', // Furniture Truck
  '#90CDF4', // Logging Truck
  '#805AD5', // Purple
  '#C53030', // Dark Red
];

const SelectTruckScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const selectedTrucks = useAppSelector((state) => state.registration.selectedTrucks);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: getVehicleTypes,
  });

  const toggleSelection = (item: VehicleType) => {
    dispatch(toggleTruckSelection(item));
  };

  const handleContinue = () => {
    // Navigate to next step
    navigation.navigate('SelectState');
  };

  const renderTruckItem = ({ item, index }: { item: VehicleType; index: number }) => {
    const isSelected = selectedTrucks.some((truck) => truck.id === item.id);
    const bgColor = CARD_COLORS[index % CARD_COLORS.length];

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: bgColor, borderWidth: 0 },
          isSelected && styles.cardSelected,
        ]}
        onPress={() => toggleSelection(item)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <SvgIcon name="truckIcon" width={scale(100)} height={verticalScale(60)} />
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.truckName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        {isSelected && (
          <View style={styles.checkOverlay}>
            <SvgIcon name="checkIcon" width={scale(20)} height={scale(20)} color={COLORS.secondary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Progress Header */}
        <View style={styles.progressContainer}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressText}>1</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={[styles.progressCircle, styles.progressCircleInactive]}>
            <Text style={styles.progressTextInactive}>2</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={[styles.progressCircle, styles.progressCircleInactive]}>
            <Text style={styles.progressTextInactive}>3</Text>
          </View>
        </View>

        <Text style={styles.stepInfo}>{t('step_1_of_3', 'Step 1 of 3')}</Text>
        <Text style={styles.title}>{t('select_truck', 'Select Truck')}</Text>
        <Text style={styles.description}>
          {t('select_truck_desc', 'Pick your truck type for tailored driving opportunities.')}
        </Text>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{t('failed_to_load_trucks', 'Failed to load trucks')}</Text>
            <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
              <Text style={styles.retryText}>{t('retry', 'Retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={data?.data}
            renderItem={renderTruckItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, selectedTrucks.length === 0 && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={selectedTrucks.length === 0}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{t('continue', 'Continue')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SelectTruckScreen;

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
    marginBottom: verticalScale(20),
  },
  listContent: {
    paddingBottom: verticalScale(100),
  },
  card: {
    flex: 1,
    margin: scale(8),
    height: verticalScale(140),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    justifyContent: 'flex-end',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: verticalScale(10),
  },
  cardFooter: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: verticalScale(8),
    alignItems: 'center',
  },
  truckName: {
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    fontSize: moderateScale(14),
    color: COLORS.secondary,
    paddingHorizontal: scale(5),
  },
  checkOverlay: {
    position: 'absolute',
    top: scale(8),
    right: scale(8),
    backgroundColor: COLORS.primary,
    borderRadius: scale(10),
    padding: scale(2),
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
