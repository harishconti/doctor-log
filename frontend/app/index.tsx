import React, { useEffect, useCallback } from 'react';
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
import { useAppStore, Patient } from '../store/useAppStore';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Index() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const {
    patients,
    searchQuery,
    selectedFilter,
    loading,
    isOffline,
    getFilteredPatients,
    setPatients,
    setSearchQuery,
    setSelectedFilter,
    setLoading,
    setOffline,
    toggleFavorite,
  } = useAppStore();

  const [refreshing, setRefreshing] = React.useState(false);

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
      else setLoading('patients', true);

      // Try to fetch from API first
      const response = await axios.get(`${BACKEND_URL}/api/patients`, {
        timeout: 10000
      });

      if (response.data.success) {
        const fetchedPatients = response.data.patients;
        setPatients(fetchedPatients);
        
        // Save to local storage for offline access
        await AsyncStorage.setItem('patients_cache', JSON.stringify(fetchedPatients));
        setOffline(false);
      }
    } catch (error) {
      console.log('API Error, loading from cache:', error);
      
      // Load from local storage if API fails
      try {
        const cachedData = await AsyncStorage.getItem('patients_cache');
        if (cachedData) {
          const cachedPatients = JSON.parse(cachedData);
          setPatients(cachedPatients);
          setOffline(true);
        }
      } catch (cacheError) {
        console.error('Cache load error:', cacheError);
        Alert.alert('Error', 'Failed to load patients data');
      }
    } finally {
      setLoading('patients', false);
      setRefreshing(false);
    }
  }, [isAuthenticated, setPatients, setLoading, setOffline]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPatients();
    }
  }, [isAuthenticated, loadPatients]);

  const handleToggleFavorite = async (patientId: string) => {
    try {
      await toggleFavorite(patientId);
    } catch (error) {
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

  const filteredPatients = getFilteredPatients();

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
            onPress={() => handleToggleFavorite(item.id)}
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