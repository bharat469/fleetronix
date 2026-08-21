import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGE_STORAGE_KEY } from '../i18n';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const getCleanLangCode = (lng: string) => {
    if (!lng) return 'en';
    return lng.split('-')[0].split('_')[0].toLowerCase();
  };

  const [currentLanguage, setCurrentLanguage] = useState<string>(getCleanLangCode(i18n.language));

  useEffect(() => {
    // Keep local state in sync if it changes somewhere else
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(getCleanLangCode(lng));
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const changeLanguage = async (lng: string) => {
    try {
      const cleanLng = getCleanLangCode(lng);
      // 1. Update i18n instance
      await i18n.changeLanguage(cleanLng);
      // 2. Persist selection to AsyncStorage
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, cleanLng);
      // 3. Update local generic state
      setCurrentLanguage(cleanLng);
      return true; // indicates success
    } catch (error) {
      console.error('Failed to change language or persist to async storage', error);
      return false;
    }
  };

  return {
    currentLanguage,
    changeLanguage,
  };
};
