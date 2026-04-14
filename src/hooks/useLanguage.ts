import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGE_STORAGE_KEY } from '../i18n';

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<string>(i18n.language || 'en');

  useEffect(() => {
    // Keep local state in sync if it changes somewhere else
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const changeLanguage = async (lng: string) => {
    try {
      // 1. Update i18n instance
      await i18n.changeLanguage(lng);
      // 2. Persist selection to AsyncStorage
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
      // 3. Update local generic state
      setCurrentLanguage(lng);
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
