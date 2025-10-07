import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/useAppStore';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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

export default function PatientDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const settings = useAppStore((state) => state.settings);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (settings.hapticEnabled) {
      Haptics.impactAsync(style);
    }
  };
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState('regular');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    loadPatientDetails();
  }, [id, isAuthenticated]);

  const loadPatientDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/patients/${id}`);
      
      if (response.data.success) {
        setPatient(response.data.patient);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load patient details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!patient) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/patients/${patient.id}`,
        { is_favorite: !patient.is_favorite }
      );

      if (response.data.success) {
        setPatient({ ...patient, is_favorite: !patient.is_favorite });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const addNote = async () => {
    if (!patient || !newNote.trim()) return;

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/patients/${patient.id}/notes`,
        { content: newNote.trim(), visit_type: newNoteType }
      );

      if (response.data.success) {
        // Reload patient details to get updated notes
        await loadPatientDetails();
        setNewNote('');
        setShowAddNote(false);
        if (settings.hapticEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add note');
    }
  };

  const makePhoneCall = async (phoneNumber: string) => {
    if (!phoneNumber) return;
    
    try {
      // Import phone integration dynamically
      const { PhoneIntegration } = await import('../../utils/phoneIntegration');
      
      Alert.alert(
        'Call Patient',
        `Call ${patient?.name} at ${phoneNumber}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: async () => {
              const success = await PhoneIntegration.makePhoneCall(phoneNumber, patient?.name);
              if (!success) {
                Alert.alert('Error', 'Unable to make phone call. Please check if your device supports calling.');
              }
            }
          },
          {
            text: 'SMS',
            onPress: async () => {
              const success = await PhoneIntegration.sendSMS(phoneNumber, `Hello ${patient?.name}, this is a message from your medical practitioner.`);
              if (!success) {
                Alert.alert('Error', 'Unable to send SMS. Please check if your device supports messaging.');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Phone integration not available');
    }
  };

  const sendEmail = async (email: string) => {
    if (!email) return;
    
    try {
      const { PhoneIntegration } = await import('../../utils/phoneIntegration');
      
      Alert.alert(
        'Send Email',
        `Send email to ${patient?.name} at ${email}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Send', 
            onPress: async () => {
              const subject = `Medical Consultation - ${patient?.name}`;
              const body = `Dear ${patient?.name},\n\nI hope this message finds you well.\n\nBest regards,\nYour Medical Practitioner`;
              
              const success = await PhoneIntegration.sendEmail(email, subject, body);
              if (!success) {
                Alert.alert('Error', 'Unable to open email client.');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Email integration not available');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={styles.loadingText}>Loading patient details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#e74c3c" />
          <Text style={styles.errorText}>Patient not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          triggerHaptic();
          router.back();
        }} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Details</Text>
        <TouchableOpacity onPress={toggleFavorite} style={styles.headerButton}>
          <Ionicons
            name={patient.is_favorite ? 'heart' : 'heart-outline'}
            size={24}
            color={patient.is_favorite ? '#e74c3c' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Patient Info Card */}
        <View style={styles.patientCard}>
          <View style={styles.patientHeader}>
            {patient.photo ? (
              <Image 
                source={{ uri: `data:image/jpeg;base64,${patient.photo}` }}
                style={styles.patientPhoto}
              />
            ) : (
              <View style={styles.patientPhotoPlaceholder}>
                <Ionicons name="person" size={48} color="#666" />
              </View>
            )}
            
            <View style={styles.patientBasicInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientId}>ID: {patient.patient_id}</Text>
              <View style={styles.groupBadge}>
                <Text style={styles.groupText}>{patient.group || 'General'}</Text>
              </View>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            {patient.phone && (
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={() => {
                  triggerHaptic();
                  makePhoneCall(patient.phone);
                }}
              >
                <Ionicons name="call" size={20} color="#2ecc71" />
                <Text style={styles.contactText}>{patient.phone}</Text>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>
            )}
            
            {patient.email && (
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={() => {
                  triggerHaptic();
                  sendEmail(patient.email);
                }}
              >
                <Ionicons name="mail" size={20} color="#3498db" />
                <Text style={styles.contactText}>{patient.email}</Text>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>
            )}
            
            {patient.address && (
              <View style={styles.contactItem}>
                <Ionicons name="location" size={20} color="#f39c12" />
                <Text style={styles.contactText}>{patient.address}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Medical Information */}
        <View style={styles.medicalCard}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          
          <View style={styles.medicalItem}>
            <Text style={styles.medicalLabel}>Location:</Text>
            <Text style={styles.medicalValue}>{patient.location || 'Not specified'}</Text>
          </View>
          
          <View style={styles.medicalItem}>
            <Text style={styles.medicalLabel}>Initial Complaint:</Text>
            <Text style={styles.medicalValue}>{patient.initial_complaint || 'Not specified'}</Text>
          </View>
          
          <View style={styles.medicalItem}>
            <Text style={styles.medicalLabel}>Initial Diagnosis:</Text>
            <Text style={styles.medicalValue}>{patient.initial_diagnosis || 'Not specified'}</Text>
          </View>
        </View>

        {/* Documents Section (Pro Feature) */}
        {user?.subscription_plan === 'pro' ? (
          <View style={styles.notesCard}>
            <Text style={styles.sectionTitle}>Documents</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => Alert.alert('Upload Document', 'This feature is coming soon!')}
            >
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.buttonText}>Upload Document</Text>
            </TouchableOpacity>
            <View style={styles.emptyNotes}>
              <Ionicons name="document-attach-outline" size={48} color="#ccc" />
              <Text style={styles.emptyNotesText}>No documents yet</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.upgradeCard}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/upgrade');
            }}
          >
            <Ionicons name="rocket-outline" size={32} color="#f39c12" />
            <View style={styles.upgradeTextContainer}>
              <Text style={styles.upgradeTitle}>Unlock Document Storage</Text>
              <Text style={styles.upgradeSubtitle}>Upgrade to Pro to upload and manage patient documents.</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#c7c7cc" />
          </TouchableOpacity>
        )}

        {/* Notes Section */}
        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Text style={styles.sectionTitle}>Medical Notes ({patient.notes?.length || 0})</Text>
            <TouchableOpacity
              style={styles.addNoteButton}
              onPress={() => {
                triggerHaptic();
                setShowAddNote(true);
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {patient.notes && patient.notes.length > 0 ? (
            patient.notes.map((note, index) => (
              <View key={note.id || index} style={styles.noteItem}>
                <View style={styles.noteHeader}>
                  <Text style={styles.noteType}>{note.visit_type}</Text>
                  <Text style={styles.noteDate}>{formatDate(note.timestamp)}</Text>
                </View>
                <Text style={styles.noteContent}>{note.content}</Text>
                <Text style={styles.noteAuthor}>By: {note.created_by}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyNotes}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={styles.emptyNotesText}>No notes yet</Text>
              <Text style={styles.emptyNotesSubtext}>Add the first medical note for this patient</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              triggerHaptic();
              router.push(`/edit-patient/${patient.id}`);
            }}
          >
            <Ionicons name="create" size={20} color="#fff" />
            <Text style={styles.buttonText}>Edit Patient</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Note Modal */}
      <Modal
        visible={showAddNote}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddNote(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddNote(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Note</Text>
            <TouchableOpacity onPress={addNote}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Visit Type</Text>
              <View style={styles.visitTypeButtons}>
                {['regular', 'follow-up', 'emergency', 'initial'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.visitTypeButton,
                      newNoteType === type && styles.activeVisitType
                    ]}
                    onPress={() => setNewNoteType(type)}
                  >
                    <Text style={[
                      styles.visitTypeText,
                      newNoteType === type && styles.activeVisitTypeText
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Note Content</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="Enter medical note..."
                value={newNote}
                onChangeText={setNewNote}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginVertical: 16,
  },
  backButton: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  scrollContent: {
    paddingBottom: 32,
  },
  patientCard: {
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
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  patientPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  patientPhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  patientBasicInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  patientId: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  groupBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
  },
  groupText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  contactSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  medicalCard: {
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
  medicalItem: {
    marginBottom: 12,
  },
  medicalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  medicalValue: {
    fontSize: 16,
    color: '#333',
  },
  notesCard: {
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
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addNoteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteType: {
    fontSize: 12,
    color: '#2ecc71',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  noteDate: {
    fontSize: 12,
    color: '#666',
  },
  noteContent: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  noteAuthor: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyNotes: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyNotesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyNotesSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  actionButtons: {
    paddingHorizontal: 16,
  },
  editButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  uploadButton: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeCard: {
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  upgradeTextContainer: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  modalCancel: {
    fontSize: 16,
    color: '#e74c3c',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalSave: {
    fontSize: 16,
    color: '#2ecc71',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  visitTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  visitTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
  },
  activeVisitType: {
    backgroundColor: '#2ecc71',
  },
  visitTypeText: {
    fontSize: 14,
    color: '#666',
  },
  activeVisitTypeText: {
    color: '#fff',
    fontWeight: '600',
  },
  noteInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
});