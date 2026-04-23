import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { scale, verticalScale, moderateScale, SCREEN } from '../../../helpers/dimension';
import { COLORS } from '../../../helpers/values/colors';
import { BackArrowIcon } from '../../../assets/svgIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import SvgIcon from '../../../helpers/svgComponents';

const RunTypeChip = ({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.chip, selected && styles.selectedChip]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, selected && styles.selectedChipText]}>{label}</Text>
  </TouchableOpacity>
);

const DayOption = ({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.dayBtn, selected && styles.selectedDayBtn]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.dayBtnText, selected && styles.selectedDayBtnText]}>{label}</Text>
  </TouchableOpacity>
);

const NewTripPreferencesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [selectedRunTypes, setSelectedRunTypes] = useState<string[]>(['Local']);
  const [selectedDayOption, setSelectedDayOption] = useState<string>('1-2 days');

  const runTypes = ['Local', 'Quest', 'Intertravel', 'Statewide', 'Circuits', 'Nearstate'];
  const dayOptions = ['1-2 days', '3-15 days', '16-30 days', '45 days', '90 days'];

  const toggleRunType = (type: string) => {
    if (selectedRunTypes.includes(type)) {
      setSelectedRunTypes(selectedRunTypes.filter(t => t !== type));
    } else {
      setSelectedRunTypes([...selectedRunTypes, type]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Run Type Preferences</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topSection}>
          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Run Type Preferences</Text>
            <View style={styles.svgWrapper}>
              <SvgIcon
                name='newTrip'
                width={scale(180)}
                height={verticalScale(117)}
              />
            </View>
          </View>
          <Text style={styles.subtitle}>
            Customize your driving experience by filtering your preferred run types to match your needs.
          </Text>
        </View>

        <View style={styles.chipsContainer}>
          {runTypes.map(type => (
            <RunTypeChip 
              key={type} 
              label={type} 
              selected={selectedRunTypes.includes(type)}
              onPress={() => toggleRunType(type)}
            />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select Days</Text>
          <Text style={styles.sectionSubtitle}>
            Choose the specific days that align with your availability, allowing for a flexible and tailored schedule that suits your preferences and commitments.
          </Text>
        </View>

        <View style={styles.daysContainer}>
          {dayOptions.map(option => (
            <DayOption 
              key={option} 
              label={option} 
              selected={selectedDayOption === option}
              onPress={() => setSelectedDayOption(option)}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('SearchingTruck')}
        >
          <Text style={styles.submitText}>Save/ Update</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
  },
  backBtn: {
    padding: scale(5),
    marginRight: scale(10),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#333',
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(40),
  },
  topSection: {
    marginTop: verticalScale(10),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainTitle: {
    fontSize: moderateScale(24),
    fontWeight: '500',
    color: COLORS.textColor.color5,
    width: SCREEN.WIDTH / 2.2,
  },
  svgWrapper: {
    // Keeps SVG proportions correct
  },
  subtitle: {
    fontSize: moderateScale(13),
    color: COLORS.textColor.color2.one,
    letterSpacing: 0.1,
    lineHeight: verticalScale(18),
    marginTop: verticalScale(10),
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(10),
    marginTop: verticalScale(25),
  },
  chip: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    borderRadius: scale(10),
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: 'white',
    minWidth: (SCREEN.WIDTH - scale(60)) / 3,
    alignItems: 'center',
  },
  selectedChip: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: moderateScale(14),
    color: '#000',
    fontWeight: '500',
  },
  selectedChipText: {
    color: 'white',
  },
  sectionHeader: {
    marginTop: verticalScale(30),
  },
  sectionTitle: {
    fontSize: moderateScale(22),
    fontWeight: '500',
    color: '#000',
  },
  sectionSubtitle: {
    fontSize: moderateScale(13),
    color: COLORS.textColor.color2.one,
    marginTop: verticalScale(6),
    lineHeight: verticalScale(18),
  },
  daysContainer: {
    marginTop: verticalScale(25),
    gap: verticalScale(12),
  },
  dayBtn: {
    height: verticalScale(45),
    borderRadius: scale(25),
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 230, 230, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDayBtn: {
    backgroundColor: COLORS.primary,
  },
  dayBtnText: {
    fontSize: moderateScale(16),
    color: COLORS.primary,
    fontWeight: '700',
  },
  selectedDayBtnText: {
    color: 'white',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: scale(12),
    height: verticalScale(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(40),
  },
  submitText: {
    color: 'white',
    fontSize: moderateScale(18),
    fontWeight: '500',
  },
});

export default NewTripPreferencesScreen;
