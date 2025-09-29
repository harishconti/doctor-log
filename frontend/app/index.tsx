import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  Alert,
  Image,
  RefreshControl,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Types
interface PatientNote {
  id: string;
  content: string;
  timestamp: string;
  visit_type: string;
  created_by: string;
}

interface Patient {
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
}

export default function Index() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated]);

  // Load patients from API or local storage
  const loadPatients = useCallback(async (showRefresh = false) => {
    if (!isAuthenticated) return;
    
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      // Try to fetch from API first
      const response = await axios.get(`${BACKEND_URL}/api/patients`, {
        timeout: 10000
      });

      if (response.data.success) {
        const fetchedPatients = response.data.patients;
        setPatients(fetchedPatients);
        setFilteredPatients(fetchedPatients);
        
        // Save to local storage for offline access
        await AsyncStorage.setItem('patients_cache', JSON.stringify(fetchedPatients));
        setIsOffline(false);
      }
    } catch (error) {
      console.log('API Error, loading from cache:', error);
      
      // Load from local storage if API fails
      try {
        const cachedData = await AsyncStorage.getItem('patients_cache');
        if (cachedData) {
          const cachedPatients = JSON.parse(cachedData);
          setPatients(cachedPatients);
          setFilteredPatients(cachedPatients);
          setIsOffline(true);
        }
      } catch (cacheError) {
        console.error('Cache load error:', cacheError);
        Alert.alert('Error', 'Failed to load patients data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPatients();
    }
  }, [isAuthenticated, loadPatients]);

  // Filter patients based on search and filter criteria
  useEffect(() => {
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
      } else {
        filtered = filtered.filter(patient => patient.group === selectedFilter);
      }
    }

    setFilteredPatients(filtered);
  }, [searchQuery, selectedFilter, patients]);

  const toggleFavorite = async (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    // Optimistic update - immediately update UI
    const optimisticPatients = patients.map(p =>
      p.id === patientId ? { ...p, is_favorite: !p.is_favorite } : p
    );
    setPatients(optimisticPatients);

    // Haptic feedback for immediate user response
    try {
      const { settings } = useAppStore.getState();
      if (settings.hapticEnabled) {
        const { default: Haptics } = await import('expo-haptics');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (hapticError) {
      // Haptic feedback is optional, don't block the operation
      console.log('Haptic feedback not available:', hapticError);
    }

    try {
      // Make API call in background
      const response = await axios.put(
        `${BACKEND_URL}/api/patients/${patientId}`,
        { is_favorite: !patient.is_favorite }
      );

      if (response.data.success) {
        // Update cache with successful response
        await AsyncStorage.setItem('patients_cache', JSON.stringify(optimisticPatients));
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      // Revert optimistic update on error
      setPatients(patients);
      
      // Show error message
      Alert.alert(
        'Update Failed', 
        'Failed to update favorite status. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
      
      console.error('Failed to update favorite status:', error);
    }
  };

  const navigateToProfile = () => {
    router.push('/profile');
  };

  const addNewPatient = () => {
    router.push('/add-patient');
  };

  const renderPatientCard = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => {
        router.push(`/patient/${item.id}`);
      }}
    >
      <View style={styles.cardContent}>
        <View style={styles.patientInfo}>
          {item.photo ? (
            <Image 
              source={{ uri: `data:image/jpeg;base64,${item.photo}` }}
              style={styles.patientPhoto}
            />
          ) : (
            <View style={styles.patientPhotoPlaceholder}>
              <Ionicons name="person" size={24} color="#666" />
            </View>
          )}
          
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{item.name}</Text>
            <Text style={styles.patientId}>ID: {item.patient_id}</Text>
            {item.phone ? <Text style={styles.patientContact}>{item.phone}</Text> : null}
            {item.initial_complaint ? (
              <Text style={styles.complaint} numberOfLines={1}>
                {item.initial_complaint}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => toggleFavorite(item.id)}
            style={styles.favoriteButton}
          >
            <Ionicons
              name={item.is_favorite ? 'heart' : 'heart-outline'}
              size={20}
              color={item.is_favorite ? '#e74c3c' : '#666'}
            />
          </TouchableOpacity>
          
          <View style={styles.groupBadge}>
            <Text style={styles.groupText}>{item.group || 'General'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filter: string, label: string) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.activeFilterButton
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={[
          styles.filterText,
          selectedFilter === filter && styles.activeFilterText
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const getFilterButtons = () => {
    const buttons = [
      { filter: 'all', label: 'All' },
      { filter: 'favorites', label: 'Favorites' }
    ];

    // Add unique groups
    const groups = [...new Set(patients.map(p => p.group).filter(Boolean))];
    groups.forEach(group => {
      buttons.push({ filter: group, label: group });
    });

    return buttons;
  };

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={styles.loadingText}>Loading patients...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Medical Contacts</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.full_name?.split(' ')[0]}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={navigateToProfile}
          >
            <Ionicons name="person-circle" size={32} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={addNewPatient}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="wifi-outline" size={16} color="#fff" />
          <Text style={styles.offlineText}>Offline Mode - Data may not be current</Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
      </View>

      {/* Filters */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={getFilterButtons()}
        renderItem={({ item }) => renderFilterButton(item.filter, item.label)}
        keyExtractor={(item) => item.filter}
        contentContainerStyle={styles.filtersContainer}
      />

      {/* Patients List */}
      <FlatList
        data={filteredPatients}
        renderItem={renderPatientCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.patientsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPatients(true)}
            colors={['#2ecc71']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No patients found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Add your first patient to get started'}
            </Text>
          </View>
        }
      />

      {/* Stats Footer */}
      <View style={styles.statsFooter}>
        <Text style={styles.statsText}>
          {filteredPatients.length} of {patients.length} patients
        </Text>
        {user?.subscription_plan && (
          <Text style={styles.planText}>
            {user.subscription_plan.charAt(0).toUpperCase() + user.subscription_plan.slice(1)} Plan
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#2ecc71',
    ...Platform.select({
      ios: {
        paddingTop: 8,
      },
      android: {
        paddingTop: 16,
      },
    }),
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  profileButton: {
    padding: 4,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineBanner: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#2ecc71',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  patientsList: {
    paddingHorizontal: 16,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    padding: 16,
  },
  patientInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  patientPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  patientPhotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  patientId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  patientContact: {
    fontSize: 14,
    color: '#2ecc71',
    marginBottom: 4,
  },
  complaint: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 4,
  },
  groupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
  },
  groupText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  statsFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  planText: {
    fontSize: 12,
    color: '#2ecc71',
    fontWeight: '500',
  },
});