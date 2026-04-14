import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getFontFamily } from '../../helpers/fonts';
import { useLanguage } from '../../hooks/useLanguage';
import SvgIcon from '../../helpers/svgComponents';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LANGUAGES } from '../../helpers/values/constants';
import { moderateScale, scale, verticalScale } from '../../helpers/dimension';
import { COLORS } from '../../helpers/values/colors';
import LinearGradient from 'react-native-linear-gradient';

const LanguageSelectionScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();

  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);

  useEffect(() => {
    if (currentLanguage) {
      setSelectedLanguage(currentLanguage);
    }
  }, [currentLanguage]);

  const handleContinue = async () => {
    await changeLanguage(selectedLanguage);
    navigation.navigate('Login');
  };

  const renderLanguageOption = ({ item }: { item: typeof LANGUAGES[0] }) => {
    const isSelected = selectedLanguage === item.id;
    return (
      <TouchableOpacity
        style={styles.languageRow}
        activeOpacity={0.7}
        onPress={() => setSelectedLanguage(item.id)}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <SvgIcon name="checkIcon" width={scale(14)} height={verticalScale(14)} color={COLORS.primary} />}
        </View>
        <Text style={styles.languageLabel}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={['rgba(202, 32, 39, 0.12)', 'rgba(255, 255, 255, 0)']}
      locations={[0.482, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <View style={styles.headerContainer}>
            <SvgIcon name="fleetronixLogo" width={scale(256)} height={verticalScale(50)} color={COLORS.secondary}/>
            <Text style={styles.subtitle}>{t('select_language', 'Select Language')}/भाषा चुने</Text>
          </View>

          <View style={styles.listContainer}>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.id}
              renderItem={renderLanguageOption}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </View>

          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>{t('continue', 'Continue')}</Text>
              <SvgIcon name="arrowRight" width={scale(20)} height={verticalScale(20)} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
    </LinearGradient>
  );
};

export default LanguageSelectionScreen;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(134),
  },
  card: {
    flex: 1,
    backgroundColor: '#CC2B2B',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: verticalScale(10),
  },
  title: {
    fontFamily: getFontFamily('InknutAntiqua', 'Bold'),
    fontSize: moderateScale(40),
    color: COLORS.secondary,
    marginBottom: verticalScale(4),
  },
  subtitle: {
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    fontSize: moderateScale(20),
    color: COLORS.secondary,
    marginVertical:verticalScale(10)
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: verticalScale(20),
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  checkbox: {
    width: scale(22),
    height: verticalScale(22),
    borderRadius: moderateScale(6),
    borderWidth: 1.5,
    borderColor: COLORS.borderColor.color1,
    marginRight: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  languageLabel: {
    fontFamily: getFontFamily('ApercuPro', 'Regular'),
    fontSize: moderateScale(20),
    color: COLORS.secondary,
  },
  footerContainer: {
    marginTop: 'auto',
    paddingTop: verticalScale(20),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    borderColor: COLORS.borderColor.color2,
  },
  buttonText: {
    fontFamily: getFontFamily('ApercuPro', 'Medium'),
    fontSize: moderateScale(14.5),
    color: COLORS.secondary,
  },
});

