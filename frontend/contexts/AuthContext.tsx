import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Platform-specific secure storage
const SecureStorageAdapter = {
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } else {
      // Use SecureStore for native platforms
      await SecureStore.setItemAsync(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } else {
      // Use SecureStore for native platforms
      return await SecureStore.getItemAsync(key);
    }
  },

  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } else {
      // Use SecureStore for native platforms
      await SecureStore.deleteItemAsync(key);
    }
  }
};

// Types
interface User {
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

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  phone: string;
  password: string;
  full_name: string;
  medical_specialty: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        SecureStorageAdapter.getItem('auth_token'),
        AsyncStorage.getItem('user_data')
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Set axios default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Verify token is still valid
        try {
          await axios.get(`${BACKEND_URL}/api/auth/me`);
        } catch (error) {
          // Token is invalid, clear stored data
          await logout();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email,
        password
      });

      const { access_token, user: userData } = response.data;
      
      // Store auth data
      await Promise.all([
        SecureStorageAdapter.setItem('auth_token', access_token),
        AsyncStorage.setItem('user_data', JSON.stringify(userData))
      ]);
      
      setToken(access_token);
      setUser(userData);
      
      // Set axios default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/register`, userData);
      
      const { access_token, user: newUser } = response.data;
      
      // Store auth data
      await Promise.all([
        SecureStorageAdapter.setItem('auth_token', access_token),
        AsyncStorage.setItem('user_data', JSON.stringify(newUser))
      ]);
      
      setToken(access_token);
      setUser(newUser);
      
      // Set axios default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      // First, clear stored data - this is the critical part
      const storageCleanupResults = await Promise.allSettled([
        SecureStorageAdapter.removeItem('auth_token'),
        AsyncStorage.removeItem('user_data'),
        AsyncStorage.removeItem('patients_cache'),
        AsyncStorage.removeItem('medical_call_logs'),
        AsyncStorage.removeItem('contacts_sync_enabled'),
        AsyncStorage.removeItem('medical-contacts-store') // Clear Zustand store data
      ]);
      
      // Log any storage cleanup failures for debugging
      storageCleanupResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          const keys = ['auth_token', 'user_data', 'patients_cache', 'medical_call_logs', 'contacts_sync_enabled', 'store'];
          console.warn(`Failed to clear ${keys[index]}:`, result.reason);
        }
      });
      
      // Only clear app state after storage is cleaned
      setToken(null);
      setUser(null);
      
      // Clear axios default authorization header
      delete axios.defaults.headers.common['Authorization'];
      
      console.log('Logout completed successfully');
      
    } catch (error) {
      console.error('Critical error during logout:', error);
      
      // If storage cleanup completely fails, still clear app state
      // but warn user about potential data remnants
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
      
      // In production, you might want to show a warning to the user
      // about manually clearing app data if logout issues persist
      throw new Error('Logout may not have completed fully. Please clear app data manually if issues persist.');
    }
  };

  const refreshUser = async () => {
    try {
      if (!token) return;
      
      const response = await axios.get(`${BACKEND_URL}/api/auth/me`);
      const userData = response.data.user;
      
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
      
    } catch (error) {
      console.error('Error refreshing user data:', error);
      // If refresh fails, logout user
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};