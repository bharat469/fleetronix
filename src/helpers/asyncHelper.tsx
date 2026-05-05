import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async set<T>(key: string, value: T): Promise<void> {
    try {
      if (value === undefined || value === null) {
        // Option 1: Remove if null/undefined
        // await AsyncStorage.removeItem(key);
        // Option 2: Just skip to prevent crash
        console.warn(`[storage] Attempted to set ${key} to ${value}, skipping to prevent crash.`);
        return;
      }
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.log('Error saving keys', error);
    }
  },
  get: async (key: string): Promise<string | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value; // ✅ always string or null
    } catch (e) {
      console.error('Error retrieving from storage', e);
      return null;
    }
  },
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.log('Error in removing data', error);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.log('Error in clearing storage', error);
    }
  },
};