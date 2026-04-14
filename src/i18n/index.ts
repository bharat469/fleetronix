import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import kn from './locales/kn.json';
import bn from './locales/bn.json';
import mr from './locales/mr.json';

export const LANGUAGE_STORAGE_KEY = '@app_language';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  te: { translation: te },
  kn: { translation: kn },
  bn: { translation: bn },
  mr: { translation: mr },
};

// Find the best available language based on device settings, default to 'en'
const availableLanguages = Object.keys(resources);
const fallback = { languageTag: 'en', isRTL: false };
const bestLanguage =
  RNLocalize.findBestLanguageTag(availableLanguages) || fallback;

// We use an async language detector to fetch persisted language from AsyncStorage
const languageDetector: any = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const persistedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (persistedLanguage) {
        callback(persistedLanguage);
        return;
      }
    } catch (e) {
      console.error('Error fetching language from async storage', e);
    }
    // Fallback to detected device language if none was persisted
    callback(bestLanguage.languageTag);
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    compatibilityJSON: 'v4', // updated for i18next v24+ compatibility
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
