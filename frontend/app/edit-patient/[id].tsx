import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const MEDICAL_GROUPS = [
  'general',
  'cardiology', 
  'physiotherapy',
  'orthopedics',
  'neurology',
  'dermatology',
  'pediatrics',
  'psychiatry',
  'endocrinology',
  'pulmonology',
  'obstetric_cardiology',
  'post_surgical'
];

interface PatientFormData {
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
}

export default function EditPatientScreen() {
  const { id } = useLocalSearchParams();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    location: '',
    initial_complaint: '',
    initial_diagnosis: '',
    photo: '',
    group: 'general',
    is_favorite: false
  });
  
  const [originalData, setOriginalData] = useState<PatientFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    loadPatientData();
  }, [id, isAuthenticated]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/patients/${id}`);
      
      if (response.data.success) {
        const patient = response.data.patient;
        const data = {
          name: patient.name || '',
          phone: patient.phone || '',
          email: patient.email || '',
          address: patient.address || '',
          location: patient.location || '',
          initial_complaint: patient.initial_complaint || '',
          initial_diagnosis: patient.initial_diagnosis || '',
          photo: patient.photo || '',
          group: patient.group || 'general',
          is_favorite: patient.is_favorite || false
        };
        setFormData(data);
        setOriginalData(data);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load patient data');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof PatientFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permissions are required to select photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true
    });

    if (!result.canceled && result.assets[0].base64) {
      updateFormData('photo', result.assets[0].base64);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permissions are required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true
    });

    if (!result.canceled && result.assets[0].base64) {
      updateFormData('photo', result.assets[0].base64);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Update Photo',
      'Choose how to update patient photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Remove Photo', onPress: () => updateFormData('photo', ''), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Patient name is required');
      return false;
    }
    
    if (formData.email && !formData.email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const hasChanges = () => {
    if (!originalData) return false;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  const saveChanges = async () => {
    if (!validateForm()) return;
    if (!hasChanges()) {
      Alert.alert('No Changes', 'No changes to save');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.put(`${BACKEND_URL}/api/patients/${id}`, formData);
      
      if (response.data.success) {
        Alert.alert(
          'Success',
          'Patient updated successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to update patient';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const deletePatient = () => {
    Alert.alert(
      'Delete Patient',
      'Are you sure you want to delete this patient? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BACKEND_URL}/api/patients/${id}`);
              Alert.alert(
                'Deleted',
                'Patient deleted successfully',
                [{ text: 'OK', onPress: () => router.replace('/') }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to delete patient');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={styles.loadingText}>Loading patient data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Patient</Text>
          <TouchableOpacity 
            onPress={saveChanges} 
            style={[
              styles.headerButton, 
              (!hasChanges() || saving) && styles.disabledButton
            ]}
            disabled={!hasChanges() || saving}
          >
            <Text style={styles.saveText}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Photo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoContainer} onPress={showImagePicker}>
              {formData.photo ? (
                <Image 
                  source={{ uri: `data:image/jpeg;base64,${formData.photo}` }}
                  style={styles.patientPhoto}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={32} color="#666" />
                  <Text style={styles.photoText}>Update Photo</Text>
                </View>
              )}
              <View style={styles.photoOverlay}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter patient's full name"
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Phone number"
                  value={formData.phone}
                  onChangeText={(value) => updateFormData('phone', value)}
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Email address"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Patient's address"
                value={formData.address}
                onChangeText={(value) => updateFormData('address', value)}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          {/* Medical Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical Information</Text>
            
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Location</Text>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      'Visit Location',
                      'Select visit location',
                      [
                        { text: 'Clinic', onPress: () => updateFormData('location', 'Clinic') },
                        { text: 'Home Visit', onPress: () => updateFormData('location', 'Home Visit') },
                        { text: 'Hospital', onPress: () => updateFormData('location', 'Hospital') },
                        { text: 'Emergency', onPress: () => updateFormData('location', 'Emergency') }
                      ]
                    );
                  }}
                >
                  <Text style={styles.pickerText}>{formData.location || 'Select location'}</Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Medical Group</Text>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      'Medical Group',
                      'Select medical specialty',
                      MEDICAL_GROUPS.map(group => ({
                        text: group.charAt(0).toUpperCase() + group.slice(1).replace('_', ' '),
                        onPress: () => updateFormData('group', group)
                      }))
                    );
                  }}
                >
                  <Text style={styles.pickerText}>
                    {formData.group.charAt(0).toUpperCase() + formData.group.slice(1).replace('_', ' ')}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Initial Complaint</Text>
              <TextInput
                style={styles.textAreaInput}
                placeholder="Describe the patient's initial complaint or symptoms..."
                value={formData.initial_complaint}
                onChangeText={(value) => updateFormData('initial_complaint', value)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Initial Diagnosis</Text>
              <TextInput
                style={styles.textAreaInput}
                placeholder="Enter initial diagnosis or assessment..."
                value={formData.initial_diagnosis}
                onChangeText={(value) => updateFormData('initial_diagnosis', value)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Options</Text>
            
            <TouchableOpacity 
              style={styles.favoriteOption}
              onPress={() => updateFormData('is_favorite', !formData.is_favorite)}
            >
              <View style={styles.favoriteLeft}>
                <Ionicons 
                  name={formData.is_favorite ? 'heart' : 'heart-outline'} 
                  size={24} 
                  color={formData.is_favorite ? '#e74c3c' : '#666'} 
                />
                <Text style={styles.favoriteText}>Mark as Favorite</Text>
              </View>
              <Text style={styles.favoriteSubtext}>
                Favorite patients appear at the top of your list
              </Text>
            </TouchableOpacity>
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerSection}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <TouchableOpacity style={styles.deleteButton} onPress={deletePatient}>
              <Ionicons name="trash" size={20} color="#e74c3c" />
              <Text style={styles.deleteText}>Delete Patient</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardAvoid: {
    flex: 1,
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.5,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 60,
    overflow: 'hidden',
  },
  patientPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
  },
  photoText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textAreaInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 80,
  },
  pickerButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  favoriteOption: {
    paddingVertical: 12,
  },
  favoriteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  favoriteText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  favoriteSubtext: {
    fontSize: 14,
    color: '#666',
    marginLeft: 36,
  },
  dangerSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 16,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e74c3c',
    gap: 8,
  },
  deleteText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '500',
  },
});