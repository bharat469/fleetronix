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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import SvgIcon from '../../../helpers/svgComponents';
import { getFontFamily } from '../../../helpers/fonts';
import { BackArrowIcon } from '../../../assets/svgIcons';

// Functional Custom Calendar Component with Multi-Select
const CustomCalendar = ({
  selectedDates,
  onDatesChange
}: {
  selectedDates: Date[],
  onDatesChange: (dates: Date[]) => void
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const isDateSelected = (day: number) => {
    return selectedDates.some(d =>
      d.getDate() === day &&
      d.getMonth() === month &&
      d.getFullYear() === year
    );
  };

  const handleDatePress = (day: number) => {
    const clickedDate = new Date(year, month, day);
    let newSelection;

    if (isDateSelected(day)) {
      newSelection = selectedDates.filter(d =>
        !(d.getDate() === day && d.getMonth() === month && d.getFullYear() === year)
      );
    } else {
      newSelection = [...selectedDates, clickedDate];
    }

    onDatesChange(newSelection);
  };

  const renderDates = () => {
    const dateCells = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      dateCells.push(<View key={`empty-${i}`} style={styles.dateCell} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = isDateSelected(d);
      dateCells.push(
        <TouchableOpacity
          key={`day-${d}`}
          style={styles.dateCell}
          onPress={() => handleDatePress(d)}
          activeOpacity={0.7}
        >
          <View style={[styles.dateCircle, isSelected && styles.selectedDateCircle]}>
            <Text style={[styles.dateText, isSelected && styles.selectedDateText]}>
              {d}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
    return dateCells;
  };

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBox}>
          <Text style={styles.calendarArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{`${monthNames[month].substring(0, 3)}, ${year}`}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBox}>
          <Text style={styles.calendarArrow}>{'>'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.calendarDivider} />
      <View style={styles.daysRow}>
        {days.map(day => (
          <Text key={day} style={styles.dayText}>{day}</Text>
        ))}
      </View>
      <View style={styles.datesGrid}>
        {renderDates()}
      </View>
    </View>
  );
};

const NewTripDateScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const handleDatesChange = (dates: Date[]) => {
    setSelectedDates(dates);
    console.log('Selected Dates count:', dates.length);
  };

  const clearDates = () => setSelectedDates([]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.secondary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Trip Date</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topSection}>
          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Availability Date for Working</Text>
            <View style={styles.svgWrapper}>
              <SvgIcon
                name='newTrip'
                width={scale(180)}
                height={verticalScale(117)}
              />
            </View>
          </View>
          <Text style={styles.subtitle}>
            Specify your preferred date for availability to streamline work scheduling and assignments.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.immediatelyBtn, selectedDates.length === 0 && { backgroundColor: COLORS.primary }]}
          activeOpacity={0.8}
          onPress={clearDates}
        >
          <Text style={[styles.immediatelyText, selectedDates.length === 0 && { color: 'white' }]}>Immediately</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Choose Preferred Work Date</Text>
          <Text style={styles.formSubtitle}>
            Pick Your Ideal Work Date for Convenience.
          </Text>

          <CustomCalendar
            selectedDates={selectedDates}
            onDatesChange={handleDatesChange}
          />

          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('NewTripPreferences')}
          >
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>
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
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#1E1B4B',
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
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: COLORS.textColor.color5,
    width: SCREEN.WIDTH / 2.2,
  },
  svgWrapper: {
    // Keeps SVG proportions correct
  },
  subtitle: {
    fontSize: moderateScale(15),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: COLORS.textColor.color2.one,
    letterSpacing: 0.1,
    lineHeight: verticalScale(18),
    marginTop: verticalScale(10),
  },
  immediatelyBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: scale(12),
    height: verticalScale(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(30),
  },
  immediatelyText: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: COLORS.primary,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(30),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#8E8E93',
  },
  orText: {
    marginHorizontal: scale(15),
    fontSize: moderateScale(18),
    color: '#8E8E93',
  },
  formSection: {
    marginTop: verticalScale(10),
  },
  formTitle: {
    fontSize: moderateScale(22),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#000',
  },
  formSubtitle: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: COLORS.textColor.color2.one,
    marginTop: verticalScale(4),
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: '#FFBABA',
    padding: scale(15),
    marginTop: verticalScale(25),
    marginBottom: verticalScale(30),
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(10),
  },
  arrowBox: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarArrow: {
    fontSize: moderateScale(24),
    color: '#000',
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
  },
  monthTitle: {
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    color: '#8E8E93',
  },
  calendarDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: scale(5),
    marginBottom: verticalScale(15),
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: verticalScale(10),
  },
  dayText: {
    fontSize: moderateScale(11),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
    color: '#000',
    width: scale(40),
    textAlign: 'center',
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dateCell: {
    width: scale(45),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: verticalScale(2),
  },
  dateCircle: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDateCircle: {
    backgroundColor: COLORS.primary,
  },
  dateText: {
    fontSize: moderateScale(15),
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    color: '#000',
  },
  selectedDateText: {
    color: 'white',
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: scale(12),
    height: verticalScale(55),
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    color: 'white',
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('ApercuPro', 'Bold'),
  },
});

export default NewTripDateScreen;
