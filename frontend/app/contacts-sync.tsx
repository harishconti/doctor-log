import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../store/useAppStore';

export default function ContactsSyncScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const { patients, loading: storeLoading } = useAppStore();

  const [syncing, setSyncing] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [callLogs, setCallLogs] = useState([]);
  const [phoneSupported, setPhoneSupported] = useState(false);
  const [smsSupported, setSmsSupported] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    
    loadScreenData();
    checkPhoneCapabilities();
  }, [isAuthenticated]);

  const loadScreenData = async () => {
    try {
      // Load sync settings
      const syncSetting = await AsyncStorage.getItem('contacts_sync_enabled');
      setSyncEnabled(syncSetting === 'true');

      // Load last sync time
      const lastSync = await AsyncStorage.getItem('medical_contacts_synced');
      setLastSyncTime(lastSync);

      // Load call logs
      const { PhoneIntegration } = await import('../utils/phoneIntegration');
      const logs = await PhoneIntegration.getCallLogs();
      setCallLogs(logs.slice(0, 10)); // Show last 10 calls

    } catch (error) {
      console.error('Error loading screen-specific data:', error);
    }
  };

  const checkPhoneCapabilities = async () => {
    try {
      const { PhoneIntegration } = await import('../utils/phoneIntegration');
      
      const [canCall, canSMS] = await Promise.all([
        PhoneIntegration.canMakePhoneCalls(),
        PhoneIntegration.canSendSMS()
      ]);
      
      setPhoneSupported(canCall);
      setSmsSupported(canSMS);
    } catch (error) {
      console.error('Error checking phone capabilities:', error);
    }
  };

  const handleSyncContacts = async () => {
    try {
      setSyncing(true);
      
      const { PhoneIntegration } = await import('../utils/phoneIntegration');
      
      // Convert patients to contact format
      const contactData = patients
        .filter(p => p.phone)
        .map(p => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          email: p.email || '',
          patient_id: p.patient_id,
          group: p.group || 'general'
        }));

      const success = await PhoneIntegration.syncContactsToDevice(contactData);
      
      if (success) {
        Alert.alert(
          'Success',
          `Successfully synced ${contactData.length} medical contacts to your device. You will now see patient names when they call.`,
          [{ text: 'OK' }]
        );
        
        await AsyncStorage.setItem('contacts_sync_enabled', 'true');
        setSyncEnabled(true);
        await loadScreenData(); // Refresh data
      } else {
        Alert.alert(
          'Sync Failed',
          'Failed to sync contacts. Please check permissions and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while syncing contacts');
    } finally {
      setSyncing(false);
    }
  };

  const handleRemoveContacts = async () => {
    Alert.alert(
      'Remove Medical Contacts',
      'This will remove all medical contacts from your device contacts. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setSyncing(true);
              
              const { PhoneIntegration } = await import('../utils/phoneIntegration');
              const success = await PhoneIntegration.removeContactsFromDevice();
              
              if (success) {
                Alert.alert('Success', 'Medical contacts removed from device');
                await AsyncStorage.setItem('contacts_sync_enabled', 'false');
                setSyncEnabled(false);
                await loadScreenData();
              } else {
                Alert.alert('Error', 'Failed to remove contacts');
              }
            } catch (error) {
              Alert.alert('Error', 'An error occurred while removing contacts');
            } finally {
              setSyncing(false);
            }
          }
        }
      ]
    );
  };

  const toggleAutoSync = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('auto_sync_enabled', enabled.toString());
      
      if (enabled) {
        Alert.alert(
          'Auto Sync Enabled',
          'Medical contacts will be automatically synced to your device when you add new patients.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update auto sync setting');
    }
  };

  const formatCallTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  if (storeLoading.patients) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={styles.loadingText}>Loading contacts data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contacts Integration</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="phone-portrait" size={32} color="#2ecc71" />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Device Integration</Text>
              <Text style={styles.statusSubtitle}>
                {syncEnabled ? 'Medical contacts synced' : 'Contacts not synced'}
              </Text>
            </View>
            <View style={[
              styles.statusIndicator, 
              { backgroundColor: syncEnabled ? '#2ecc71' : '#e74c3c' }
            ]} />
          </View>

          {lastSyncTime && (
            <Text style={styles.lastSyncText}>
              Last synced: {new Date(lastSyncTime).toLocaleString()}
            </Text>
          )}
        </View>

        {/* Sync Controls */}
        <View style={styles.syncCard}>
          <Text style={styles.sectionTitle}>Sync Management</Text>
          
          <View style={styles.syncInfo}>
            <Ionicons name="information-circle" size={20} color="#3498db" />
            <Text style={styles.syncInfoText}>
              Syncing adds your medical patients to your device contacts, enabling caller ID when they call.
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.syncButton, syncing && styles.disabledButton]}
              onPress={handleSyncContacts}
              disabled={syncing}
            >
              {syncing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="sync" size={20} color="#fff" />
              )}
              <Text style={styles.buttonText}>
                {syncing ? 'Syncing...' : 'Sync Contacts'}
              </Text>
            </TouchableOpacity>

            {syncEnabled && (
              <TouchableOpacity 
                style={[styles.removeButton, syncing && styles.disabledButton]}
                onPress={handleRemoveContacts}
                disabled={syncing}
              >
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.buttonText}>Remove Contacts</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.syncCount}>
            {patients.filter(p => p.phone).length} patients with phone numbers
          </Text>
        </View>

        {/* Device Capabilities */}
        <View style={styles.capabilitiesCard}>
          <Text style={styles.sectionTitle}>Device Capabilities</Text>
          
          <View style={styles.capabilityItem}>
            <Ionicons 
              name={phoneSupported ? 'checkmark-circle' : 'close-circle'} 
              size={24} 
              color={phoneSupported ? '#2ecc71' : '#e74c3c'} 
            />
            <Text style={styles.capabilityText}>Phone Calls</Text>
          </View>

          <View style={styles.capabilityItem}>
            <Ionicons 
              name={smsSupported ? 'checkmark-circle' : 'close-circle'} 
              size={24} 
              color={smsSupported ? '#2ecc71' : '#e74c3c'} 
            />
            <Text style={styles.capabilityText}>SMS Messages</Text>
          </View>
        </View>

        {/* Recent Calls */}
        {callLogs.length > 0 && (
          <View style={styles.callLogsCard}>
            <Text style={styles.sectionTitle}>Recent Patient Calls</Text>
            
            {callLogs.map((call, index) => (
              <View key={index} style={styles.callLogItem}>
                <View style={styles.callInfo}>
                  <Ionicons name="call-outline" size={20} color="#2ecc71" />
                  <View style={styles.callDetails}>
                    <Text style={styles.callPatient}>{call.patientName}</Text>
                    <Text style={styles.callPhone}>{call.phone}</Text>
                  </View>
                </View>
                <Text style={styles.callTime}>{formatCallTime(call.timestamp)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.instruction}>
            <Text style={styles.instructionNumber}>1</Text>
            <Text style={styles.instructionText}>
              Tap "Sync Contacts" to add your medical patients to your device contacts
            </Text>
          </View>
          
          <View style={styles.instruction}>
            <Text style={styles.instructionNumber}>2</Text>
            <Text style={styles.instructionText}>
              When patients call, you'll see their name and patient ID on caller ID
            </Text>
          </View>
          
          <View style={styles.instruction}>
            <Text style={styles.instructionNumber}>3</Text>
            <Text style={styles.instructionText}>
              Use "Remove Contacts" if you want to clear medical contacts from your device
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2ecc71',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
  },
  headerButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  lastSyncText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  syncCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  syncInfoText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 12,
  },
  syncButton: {
    backgroundColor: '#2ecc71',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  removeButton: {
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  syncCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  capabilitiesCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  capabilityText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  callLogsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  callLogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  callInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  callDetails: {
    marginLeft: 12,
    flex: 1,
  },
  callPatient: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  callPhone: {
    fontSize: 14,
    color: '#666',
  },
  callTime: {
    fontSize: 12,
    color: '#999',
  },
  instructionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2ecc71',
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
});