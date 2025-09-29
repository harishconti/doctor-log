import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppStore } from '../../store/useAppStore';

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

const LOCATIONS = [
  'Clinic',
  'Home Visit',
  'Hospital',
  'Emergency',
  'Telemedicine'
];

export interface PatientFormData {
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

export interface PatientFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<PatientFormData>;
  onSubmit: (data: PatientFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  submitButtonText?: string;
}

/**
 * Reusable PatientForm component for both adding and editing patients
 * 
 * @param mode - Whether creating new patient or editing existing
 * @param initialData - Initial form data for edit mode
 * @param onSubmit - Function called when form is submitted
 * @param onCancel - Function called when form is cancelled
 * @param loading - Whether form is in loading state
 * @param submitButtonText - Custom text for submit button
 */
export const PatientForm: React.FC<PatientFormProps> = ({
  mode,
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  submitButtonText
}) => {
  const { theme } = useTheme();
  const { settings } = useAppStore();
  
  const [formData, setFormData] = useState<PatientFormData>({
    name: initialData.name || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    address: initialData.address || '',
    location: initialData.location || 'Clinic',
    initial_complaint: initialData.initial_complaint || '',
    initial_diagnosis: initialData.initial_diagnosis || '',
    photo: initialData.photo || '',
    group: initialData.group || 'general',
    is_favorite: initialData.is_favorite || false
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Check if form has changes (for edit mode)
    if (mode === 'edit') {
      const changed = Object.keys(formData).some(key => {
        return formData[key as keyof PatientFormData] !== (initialData[key as keyof PatientFormData] || '');
      });
      setHasChanges(changed);
    } else {
      // For create mode, check if any field has content
      const hasContent = Object.values(formData).some(value => 
        typeof value === 'string' ? value.trim().length > 0 : value
      );
      setHasChanges(hasContent);
    }
  }, [formData, initialData, mode]);

  const updateFormData = async (field: keyof PatientFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Optional haptic feedback for form interactions
    if (settings.hapticEnabled) {
      try {
        await Haptics.selectionAsync();
      } catch (error) {
        // Haptic feedback is optional
      }
    }
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
      await updateFormData('photo', result.assets[0].base64);
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
      await updateFormData('photo', result.assets[0].base64);
    }
  };

  const showImagePicker = () => {
    const options = [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' as const }
    ];

    if (formData.photo && mode === 'edit') {
      options.splice(2, 0, { 
        text: 'Remove Photo', 
        onPress: () => updateFormData('photo', ''),
        style: 'destructive' as const
      });
    }

    Alert.alert(
      mode === 'edit' ? 'Update Photo' : 'Add Photo',
      'Choose how to add patient photo',
      options
    );
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Patient name is required';
    }
    
    if (formData.email && !formData.email.includes('@')) {
      return 'Please enter a valid email address';
    }

    if (formData.phone && formData.phone.length < 10) {
      return 'Please enter a valid phone number';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    if (mode === 'edit' && !hasChanges) {
      Alert.alert('No Changes', 'No changes to save');
      return;
    }

    try {
      await onSubmit(formData);
      
      // Success haptic feedback
      if (settings.hapticEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      // Error handling is done by parent component
      console.error('Form submission error:', error);
    }
  };

  const showLocationPicker = () => {
    Alert.alert(
      'Visit Location',
      'Select visit location',
      LOCATIONS.map(location => ({
        text: location,
        onPress: () => updateFormData('location', location)
      }))
    );
  };

  const showGroupPicker = () => {
    Alert.alert(
      'Medical Group',
      'Select medical specialty',
      MEDICAL_GROUPS.map(group => ({
        text: group.charAt(0).toUpperCase() + group.slice(1).replace('_', ' '),
        onPress: () => updateFormData('group', group)
      }))
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Photo Section */}
        <View style={[styles.photoSection, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity style={styles.photoContainer} onPress={showImagePicker}>
            {formData.photo ? (
              <Image 
                source={{ uri: `data:image/jpeg;base64,${formData.photo}` }}
                style={styles.patientPhoto}
              />
            ) : (
              <View style={[styles.photoPlaceholder, { borderColor: theme.colors.border }]}>
                <Ionicons name="camera" size={32} color={theme.colors.textSecondary} />
                <Text style={[styles.photoText, { color: theme.colors.textSecondary }]}>
                  {mode === 'edit' ? 'Update Photo' : 'Add Photo'}
                </Text>
              </View>
            )}
            {mode === 'edit' && formData.photo && (
              <View style={[styles.photoOverlay, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Full Name *</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: theme.colors.background, 
                borderColor: theme.colors.border,
                color: theme.colors.text 
              }]}
              placeholder="Enter patient's full name"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Phone</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.colors.background, 
                  borderColor: theme.colors.border,
                  color: theme.colors.text 
                }]}
                placeholder="Phone number"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.phone}
                onChangeText={(value) => updateFormData('phone', value)}
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputHalf}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Email</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.colors.background, 
                  borderColor: theme.colors.border,
                  color: theme.colors.text 
                }]}
                placeholder="Email address"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Address</Text>
            <TextInput
              style={[styles.textAreaInput, { 
                backgroundColor: theme.colors.background, 
                borderColor: theme.colors.border,
                color: theme.colors.text 
              }]}
              placeholder="Patient's address"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.address}
              onChangeText={(value) => updateFormData('address', value)}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* Medical Information */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Medical Information</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Location</Text>
              <TouchableOpacity 
                style={[styles.pickerButton, { 
                  backgroundColor: theme.colors.background, 
                  borderColor: theme.colors.border 
                }]}
                onPress={showLocationPicker}
              >
                <Text style={[styles.pickerText, { color: theme.colors.text }]}>
                  {formData.location}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputHalf}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Medical Group</Text>
              <TouchableOpacity 
                style={[styles.pickerButton, { 
                  backgroundColor: theme.colors.background, 
                  borderColor: theme.colors.border 
                }]}
                onPress={showGroupPicker}
              >
                <Text style={[styles.pickerText, { color: theme.colors.text }]}>
                  {formData.group.charAt(0).toUpperCase() + formData.group.slice(1).replace('_', ' ')}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Initial Complaint</Text>
            <TextInput
              style={[styles.textAreaInput, { 
                backgroundColor: theme.colors.background, 
                borderColor: theme.colors.border,
                color: theme.colors.text 
              }]}
              placeholder="Describe the patient's initial complaint or symptoms..."
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.initial_complaint}
              onChangeText={(value) => updateFormData('initial_complaint', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Initial Diagnosis</Text>
            <TextInput
              style={[styles.textAreaInput, { 
                backgroundColor: theme.colors.background, 
                borderColor: theme.colors.border,
                color: theme.colors.text 
              }]}
              placeholder="Enter initial diagnosis or assessment..."
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.initial_diagnosis}
              onChangeText={(value) => updateFormData('initial_diagnosis', value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Options */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Options</Text>
          
          <TouchableOpacity 
            style={styles.favoriteOption}
            onPress={() => updateFormData('is_favorite', !formData.is_favorite)}
          >
            <View style={styles.favoriteLeft}>
              <Ionicons 
                name={formData.is_favorite ? 'heart' : 'heart-outline'} 
                size={24} 
                color={formData.is_favorite ? theme.colors.error : theme.colors.textSecondary} 
              />
              <Text style={[styles.favoriteText, { color: theme.colors.text }]}>Mark as Favorite</Text>
            </View>
            <Text style={[styles.favoriteSubtext, { color: theme.colors.textSecondary }]}>
              Favorite patients appear at the top of your list
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.cancelButton, { borderColor: theme.colors.textSecondary }]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.submitButton, 
              { backgroundColor: theme.colors.primary },
              (!hasChanges || loading) && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={!hasChanges || loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : (submitButtonText || (mode === 'edit' ? 'Save Changes' : 'Add Patient'))}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
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
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  photoText: {
    fontSize: 12,
    marginTop: 4,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  textAreaInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 80,
  },
  pickerButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
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
    marginLeft: 12,
    fontWeight: '500',
  },
  favoriteSubtext: {
    fontSize: 14,
    marginLeft: 36,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});