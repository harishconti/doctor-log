import React, { useEffect, useCallback, useMemo } from 'react';
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
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useAppStore } from '../store/useAppStore';
import { map } from 'rxjs/operators';
import { sync } from '../services/sync';

// WatermelonDB imports
import { database } from '../models/database';
import Patient from '../models/Patient';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';

// The raw UI component
function Index({ patients, groups, totalPatientCount }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const {
    searchQuery,
    selectedFilter,
    loading,
    isOffline,
    lastSyncTime,
    setSearchQuery,
    setSelectedFilter,
    setLoading,
    setOffline,
    settings,
  } = useAppStore();

  const [refreshing, setRefreshing] = React.useState(false);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (settings.hapticEnabled) {
      Haptics.impactAsync(style);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated]);

  const handleSync = useCallback(async (showRefresh = false) => {
    if (!isAuthenticated) return;
    
    try {
      if (showRefresh) {
        setRefreshing(true);
        triggerHaptic();
      } else {
        setLoading('sync', true);
      }

      await sync();
      setOffline(false);

    } catch (error) {
      console.log('Sync failed, using local DB:', error);
      setOffline(true);
    } finally {
      setLoading('sync', false);
      setRefreshing(false);
    }
  }, [isAuthenticated, setLoading, setOffline]);

  useEffect(() => {
    if (isAuthenticated) {
      handleSync();
    }
  }, [isAuthenticated, handleSync]);

  const handleToggleFavorite = async (patient: Patient) => {
    try {
      await database.write(async () => {
        await patient.update(p => {
          p.isFavorite = !p.isFavorite;
        });
      });
      triggerHaptic();
    } catch (error) {
      Alert.alert('Update Failed', 'Failed to update favorite status.');
      console.error('Failed to update favorite status:', error);
    }
  };

  const navigateToProfile = () => {
    triggerHaptic();
    router.push('/profile');
  };

  const addNewPatient = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/add-patient');
  };

  const renderPatientCard = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => router.push(`/patient/${item.id}`)}
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
            <Text style={styles.patientId}>ID: {item.patientId}</Text>
            {item.phone ? <Text style={styles.patientContact}>{item.phone}</Text> : null}
            {item.initialComplaint ? (
              <Text style={styles.complaint} numberOfLines={1}>
                {item.initialComplaint}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => handleToggleFavorite(item)}
            style={styles.favoriteButton}
          >
            <Ionicons
              name={item.isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={item.isFavorite ? '#e74c3c' : '#666'}
            />
          </TouchableOpacity>
          <View style={styles.groupBadge}>
            <Text style={styles.groupText}>{item.group || 'General'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const filterButtons = useMemo(() => {
    const buttons = [
      { filter: 'all', label: 'All' },
      { filter: 'favorites', label: 'Favorites' }
    ];
    (groups || []).forEach(group => {
      if(group) {
        buttons.push({ filter: group, label: group });
      }
    });
    return buttons;
  }, [groups]);

  if (authLoading || loading.patients) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={styles.loadingText}>
            {authLoading ? 'Loading...' : 'Loading patients...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header, Offline Banner, Search, Filters */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Medical Contacts</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.full_name?.split(' ')[0]}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.syncButton} onPress={() => handleSync(true)} disabled={refreshing || loading.sync}>
            <Ionicons name={refreshing || loading.sync ? "sync-circle" : "sync"} size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={navigateToProfile}>
            <Ionicons name="person-circle" size={32} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={addNewPatient}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="wifi-outline" size={16} color="#fff" />
          <Text style={styles.offlineText}>
            Offline Mode - {lastSyncTime ? `Last synced: ${new Date(lastSyncTime).toLocaleTimeString()}`: 'Never synced'}
          </Text>
        </View>
      )}

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

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={filterButtons}
        renderItem={({ item }) => (
          <TouchableOpacity
            key={item.filter}
            style={[styles.filterButton, selectedFilter === item.filter && styles.activeFilterButton]}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter(item.filter);
            }}
          >
            <Text style={[styles.filterText, selectedFilter === item.filter && styles.activeFilterText]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.filter}
        contentContainerStyle={styles.filtersContainer}
      />

      <FlatList
        data={patients}
        renderItem={renderPatientCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.patientsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
        onRefresh={() => handleSync(true)}
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

      <View style={styles.statsFooter}>
        <Text style={styles.statsText}>
          {patients.length} of {totalPatientCount} patients
        </Text>
        <Text style={styles.syncTimeText}>
          {lastSyncTime ? `Last synced: ${new Date(lastSyncTime).toLocaleTimeString()}`: ''}
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

const enhance = withObservables(['searchQuery', 'selectedFilter'], ({ searchQuery, selectedFilter }) => {
  const patientCollection = database.collections.get<Patient>('patients');
  let query = patientCollection.query();

  if (searchQuery) {
    const likeQuery = Q.like(`%${searchQuery.toLowerCase()}%`);
    query = query.where(Q.or(Q.where('name', likeQuery), Q.where('patient_id', likeQuery)));
  }

  if (selectedFilter && selectedFilter !== 'all') {
    if (selectedFilter === 'favorites') {
      query = query.where('is_favorite', true);
    } else {
      query = query.where('group', selectedFilter);
    }
  }

  return {
    patients: query.observe(),
    groups: patientCollection.query(Q.where('group', Q.notEq(null))).observe().pipe(
      map(ps => [...new Set(ps.map(p => p.group))])
    ),
    totalPatientCount: patientCollection.query().observeCount(),
  };
});

// Create the enhanced component *outside* of the render function
const EnhancedIndex = enhance(Index);

const IndexContainer = () => {
  // Pull the props from the Zustand store
  const { searchQuery, selectedFilter } = useAppStore(
    (state) => ({ searchQuery: state.searchQuery, selectedFilter: state.selectedFilter }),
    // Using shallow compare is better for performance when selecting multiple values
  );

  // Render the enhanced component, passing the reactive props to it
  return <EnhancedIndex searchQuery={searchQuery} selectedFilter={selectedFilter} />;
};

export default IndexContainer;

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
    alignItems: 'center',
  },
  syncButton: {
    padding: 4,
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
  syncTimeText: {
    fontSize: 12,
    color: '#999',
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