import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  medical_specialty: string;
  subscription_plan: 'regular' | 'pro';
  subscription_status: 'active' | 'inactive' | 'trial';
  trial_end_date: string;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  patient_id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  location: string;
  initial_complaint: string;
  initial_diagnosis: string;
  photo: string;
  group: string;
  is_favorite: boolean;
  notes: PatientNote[];
  created_at: string;
  updated_at: string;
  // Offline sync metadata
  _offline_created?: boolean;
  _offline_modified?: boolean;
  _needs_sync?: boolean;
}

export interface PatientNote {
  id: string;
  content: string;
  timestamp: string;
  visit_type: string;
  created_by: string;
  _offline_created?: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  hapticEnabled: boolean;
  offlineMode: boolean;
  autoSync: boolean;
  contactsSync: boolean;
}

interface LoadingState {
  patients: boolean;
  profile: boolean;
  subscription: boolean;
  stats: boolean;
  patientDetails: boolean;
  sync: boolean;
  auth: boolean;
  upload: boolean;
}

interface ErrorState {
  patients: string | null;
  profile: string | null;
  subscription: string | null;
  stats: string | null;
  patientDetails: string | null;
  sync: string | null;
  auth: string | null;
  upload: string | null;
}

interface AppState {
  // App state
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;

  // User data
  user: User | null;

  // Patients data
  patients: Patient[];
  searchQuery: string;
  selectedFilter: string;
  
  // Granular loading states
  loading: LoadingState;
  
  // Error states
  errors: ErrorState;
  
  // App state
  isOffline: boolean;
  lastSyncTime: string | null;
  settings: AppSettings;
  
  // Offline queue
  offlineQueue: any[];
  
  // Actions
  setUser: (user: User | null) => void;
  setPatients: (patients: Patient[]) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  removePatient: (id: string) => void;
  toggleFavorite: (patientId: string) => Promise<void>;
  
  // Search and filter
  setSearchQuery: (query: string) => void;
  setSelectedFilter: (filter: string) => void;
  getFilteredPatients: () => Patient[];
  
  // Granular loading state actions
  setLoading: (key: keyof LoadingState, loading: boolean) => void;
  setError: (key: keyof ErrorState, error: string | null) => void;
  clearError: (key: keyof ErrorState) => void;
  clearAllErrors: () => void;
  
  // App state actions
  setOffline: (offline: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // Offline actions
  addToOfflineQueue: (action: any) => void;
  clearOfflineQueue: () => void;
  markPatientForSync: (id: string) => void;
  getPatientsNeedingSync: () => Patient[];
  
  // Convenience getters
  isAnyLoading: () => boolean;
  hasAnyError: () => boolean;
  getLoadingKeys: () => (keyof LoadingState)[];
  getErrorKeys: () => (keyof ErrorState)[];
}

const defaultSettings: AppSettings = {
  theme: 'system',
  hapticEnabled: true,
  offlineMode: true,
  autoSync: true,
  contactsSync: false
};

const initialLoadingState: LoadingState = {
  patients: false,
  profile: false,
  subscription: false,
  stats: false,
  patientDetails: false,
  sync: false,
  auth: false,
  upload: false,
};

const initialErrorState: ErrorState = {
  patients: null,
  profile: null,
  subscription: null,
  stats: null,
  patientDetails: null,
  sync: null,
  auth: null,
  upload: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      user: null,
      patients: [],
      searchQuery: '',
      selectedFilter: 'all',
      loading: initialLoadingState,
      errors: initialErrorState,
      isOffline: false,
      lastSyncTime: null,
      settings: defaultSettings,
      offlineQueue: [],

      // User actions
      setUser: (user) => set({ user }),

      // Patient actions
      setPatients: (patients) => set({ patients }),
      
      addPatient: (patient) => {
        const patients = get().patients;
        const newPatient = { 
          ...patient, 
          _offline_created: get().isOffline,
          _needs_sync: get().isOffline 
        };
        set({ patients: [newPatient, ...patients] });
        
        if (get().isOffline) {
          get().addToOfflineQueue({
            type: 'CREATE_PATIENT',
            data: newPatient,
            timestamp: new Date().toISOString()
          });
        }
      },
      
      updatePatient: (id, updates) => {
        const patients = get().patients.map(p => 
          p.id === id 
            ? { 
                ...p, 
                ...updates, 
                _offline_modified: get().isOffline,
                _needs_sync: true
              }
            : p
        );
        set({ patients });
        
        if (get().isOffline) {
          get().addToOfflineQueue({
            type: 'UPDATE_PATIENT',
            id,
            data: updates,
            timestamp: new Date().toISOString()
          });
        }
      },
      
      removePatient: (id) => {
        const patients = get().patients.filter(p => p.id !== id);
        set({ patients });
        
        if (get().isOffline) {
          get().addToOfflineQueue({
            type: 'DELETE_PATIENT',
            id,
            timestamp: new Date().toISOString()
          });
        }
      },

      toggleFavorite: async (patientId) => {
        const originalPatients = get().patients;
        const patient = originalPatients.find(p => p.id === patientId);
        if (!patient) return;

        // Optimistic update
        const optimisticPatients = originalPatients.map(p =>
          p.id === patientId ? { ...p, is_favorite: !p.is_favorite } : p
        );
        set({ patients: optimisticPatients });

        // Haptic feedback
        try {
          const { settings } = get();
          if (settings.hapticEnabled) {
            const { default: Haptics } = await import('expo-haptics');
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } catch (hapticError) {
          console.log('Haptic feedback not available:', hapticError);
        }

        try {
          const response = await axios.put(
            `${BACKEND_URL}/api/patients/${patientId}`,
            { is_favorite: !patient.is_favorite }
          );

          if (response.data.success) {
            // Update cache
            await AsyncStorage.setItem('patients_cache', JSON.stringify(optimisticPatients));
          } else {
            throw new Error('API returned unsuccessful response');
          }
        } catch (error) {
          // Revert on error
          set({ patients: originalPatients });
          // Re-throw error to be handled by the component
          throw error;
        }
      },

      // Search and filter
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSelectedFilter: (selectedFilter) => set({ selectedFilter }),
      
      getFilteredPatients: () => {
        const { patients, searchQuery, selectedFilter } = get();
        let filtered = patients;

        // Apply search filter
        if (searchQuery.trim()) {
          filtered = filtered.filter(patient =>
            patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            patient.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            patient.phone.includes(searchQuery) ||
            patient.email.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        // Apply category filter
        if (selectedFilter !== 'all') {
          if (selectedFilter === 'favorites') {
            filtered = filtered.filter(patient => patient.is_favorite);
          } else if (selectedFilter === 'offline') {
            filtered = filtered.filter(patient => patient._needs_sync);
          } else {
            filtered = filtered.filter(patient => patient.group === selectedFilter);
          }
        }

        return filtered;
      },

      // Granular loading state actions
      setLoading: (key, loading) => {
        const currentLoading = get().loading;
        set({ loading: { ...currentLoading, [key]: loading } });
      },

      setError: (key, error) => {
        const currentErrors = get().errors;
        set({ errors: { ...currentErrors, [key]: error } });
      },

      clearError: (key) => {
        const currentErrors = get().errors;
        set({ errors: { ...currentErrors, [key]: null } });
      },

      clearAllErrors: () => {
        set({ errors: initialErrorState });
      },

      // App state actions
      setOffline: (isOffline) => set({ isOffline }),
      updateSettings: (newSettings) => {
        const settings = { ...get().settings, ...newSettings };
        set({ settings });
      },

      // Offline queue
      addToOfflineQueue: (action) => {
        const offlineQueue = [...get().offlineQueue, action];
        set({ offlineQueue });
      },
      
      clearOfflineQueue: () => set({ offlineQueue: [] }),
      
      markPatientForSync: (id) => {
        get().updatePatient(id, { _needs_sync: true });
      },
      
      getPatientsNeedingSync: () => {
        return get().patients.filter(p => p._needs_sync);
      },

      // Convenience getters
      isAnyLoading: () => {
        const loading = get().loading;
        return Object.values(loading).some(Boolean);
      },

      hasAnyError: () => {
        const errors = get().errors;
        return Object.values(errors).some(Boolean);
      },

      getLoadingKeys: () => {
        const loading = get().loading;
        return Object.entries(loading)
          .filter(([_, isLoading]) => isLoading)
          .map(([key, _]) => key as keyof LoadingState);
      },

      getErrorKeys: () => {
        const errors = get().errors;
        return Object.entries(errors)
          .filter(([_, error]) => error !== null)
          .map(([key, _]) => key as keyof ErrorState);
      }
    }),
    {
      name: 'medical-contacts-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        patients: state.patients,
        settings: state.settings,
        offlineQueue: state.offlineQueue,
        lastSyncTime: state.lastSyncTime
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);