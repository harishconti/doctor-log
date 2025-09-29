import React, { useState } from 'react';
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
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
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

export default function AddPatientScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    location: 'Clinic',
    initial_complaint: '',
    initial_diagnosis: '',
    photo: '',
    group: 'general',
    is_favorite: false
  });
  
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

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
      'Select Photo',
      'Choose how to add a patient photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
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

  const savePatient = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/patients`, formData);
      
      if (response.data.success) {
        Alert.alert(
          'Success',
          'Patient added successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to add patient';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Add Patient</Text>
          <TouchableOpacity 
            onPress={savePatient} 
            style={[styles.headerButton, loading && styles.disabledButton]}
            disabled={loading}
          >
            <Text style={styles.saveText}>Save</Text>
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
                  <Text style={styles.photoText}>Add Photo</Text>
                </View>
              )}
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
                  <Text style={styles.pickerText}>{formData.location}</Text>
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
});