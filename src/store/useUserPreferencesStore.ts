import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'en' | 'es';
export type MeasurementUnit = 'metric' | 'imperial';

interface UserPreferences {
  locale: Locale | null; // null = use browser default
  measurementUnit: MeasurementUnit;
  setLocale: (locale: Locale | null) => void;
  setMeasurementUnit: (unit: MeasurementUnit) => void;
}

export const useUserPreferencesStore = create<UserPreferences>()(
  persist(
    (set) => ({
      locale: null,
      measurementUnit: 'metric',
      setLocale: (locale) => set({ locale }),
      setMeasurementUnit: (unit) => set({ measurementUnit: unit }),
    }),
    { name: 'houseplan-user-preferences' }
  )
);
