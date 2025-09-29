import { Linking, Platform } from 'react-native';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ContactData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  patient_id: string;
  group: string;
}

export class PhoneIntegration {
  private static CONTACTS_SYNC_KEY = 'medical_contacts_synced';
  
  // Make phone call using native dialer
  static async makePhoneCall(phoneNumber: string, patientName?: string): Promise<boolean> {
    try {
      // Clean phone number (remove spaces, dashes, etc.)
      const cleanNumber = phoneNumber.replace(/[^+\d]/g, '');
      
      if (!cleanNumber) {
        throw new Error('Invalid phone number');
      }

      const phoneUrl = `tel:${cleanNumber}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);
      
      if (canOpen) {
        await Linking.openURL(phoneUrl);
        
        // Log the call for medical records
        await this.logPhoneCall(cleanNumber, patientName);
        return true;
      } else {
        throw new Error('Cannot open phone dialer');
      }
    } catch (error) {
      console.error('Phone call error:', error);
      return false;
    }
  }

  // Send SMS using native SMS app
  static async sendSMS(phoneNumber: string, message?: string): Promise<boolean> {
    try {
      const cleanNumber = phoneNumber.replace(/[^+\d]/g, '');
      let smsUrl = `sms:${cleanNumber}`;
      
      if (message) {
        const encodedMessage = encodeURIComponent(message);
        smsUrl += Platform.OS === 'ios' ? `&body=${encodedMessage}` : `?body=${encodedMessage}`;
      }
      
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
        return true;
      }
      return false;
    } catch (error) {
      console.error('SMS error:', error);
      return false;
    }
  }

  // Send email using native email app
  static async sendEmail(email: string, subject?: string, body?: string): Promise<boolean> {
    try {
      let emailUrl = `mailto:${email}`;
      const params: string[] = [];
      
      if (subject) {
        params.push(`subject=${encodeURIComponent(subject)}`);
      }
      
      if (body) {
        params.push(`body=${encodeURIComponent(body)}`);
      }
      
      if (params.length > 0) {
        emailUrl += `?${params.join('&')}`;
      }
      
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Email error:', error);
      return false;
    }
  }

  // Sync medical contacts to device contacts (for caller ID)
  static async syncContactsToDevice(medicalContacts: ContactData[]): Promise<boolean> {
    try {
      // Request contacts permission
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Contacts permission denied');
      }

      // Check if already synced recently
      const lastSync = await AsyncStorage.getItem(this.CONTACTS_SYNC_KEY);
      if (lastSync) {
        const lastSyncTime = new Date(lastSync);
        const now = new Date();
        const hoursSinceSync = (now.getTime() - lastSyncTime.getTime()) / (1000 * 60 * 60);
        
        // Don't sync more than once per day
        if (hoursSinceSync < 24) {
          console.log('Contacts recently synced, skipping...');
          return true;
        }
      }

      let syncedCount = 0;

      for (const contact of medicalContacts) {
        try {
          // Check if contact already exists
          const existingContacts = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
          });

          const existingContact = existingContacts.data.find(c => 
            c.phoneNumbers?.some(p => p.number?.replace(/[^+\d]/g, '') === contact.phone.replace(/[^+\d]/g, ''))
          );

          if (!existingContact) {
            // Create new contact with medical context
            const contactData: Contacts.Contact = {
              name: `${contact.name} (${contact.patient_id})`,
              firstName: contact.name.split(' ')[0],
              lastName: contact.name.split(' ').slice(1).join(' ') || '',
              phoneNumbers: [{
                number: contact.phone,
                isPrimary: true,
                label: 'Medical Contact'
              }],
              company: `Medical Patient - ${contact.group}`,
              note: `Medical Contact - Patient ID: ${contact.patient_id}, Group: ${contact.group}`
            };

            if (contact.email) {
              contactData.emails = [{
                email: contact.email,
                isPrimary: true,
                label: 'Medical'
              }];
            }

            await Contacts.addContactAsync(contactData);
            syncedCount++;
          }
        } catch (contactError) {
          console.error(`Error syncing contact ${contact.name}:`, contactError);
          // Continue with other contacts
        }
      }

      // Update last sync time
      await AsyncStorage.setItem(this.CONTACTS_SYNC_KEY, new Date().toISOString());
      
      console.log(`Synced ${syncedCount} medical contacts to device`);
      return true;
    } catch (error) {
      console.error('Contact sync error:', error);
      return false;
    }
  }

  // Remove medical contacts from device
  static async removeContactsFromDevice(): Promise<boolean> {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        return false;
      }

      const contacts = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Note, Contacts.Fields.Name, Contacts.Fields.ID],
      });

      let removedCount = 0;

      for (const contact of contacts.data) {
        // Check if this is a medical contact based on note
        if (contact.note && contact.note.includes('Medical Contact - Patient ID:')) {
          try {
            if (contact.id) {
              await Contacts.removeContactAsync(contact.id);
              removedCount++;
            }
          } catch (removeError) {
            console.error(`Error removing contact ${contact.name}:`, removeError);
          }
        }
      }

      // Clear sync timestamp
      await AsyncStorage.removeItem(this.CONTACTS_SYNC_KEY);
      
      console.log(`Removed ${removedCount} medical contacts from device`);
      return true;
    } catch (error) {
      console.error('Contact removal error:', error);
      return false;
    }
  }

  // Log phone call for medical records
  private static async logPhoneCall(phoneNumber: string, patientName?: string): Promise<void> {
    try {
      const callLog = {
        phone: phoneNumber,
        patientName: patientName || 'Unknown',
        timestamp: new Date().toISOString(),
        type: 'outgoing'
      };

      // Get existing call logs
      const existingLogs = await AsyncStorage.getItem('medical_call_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      // Add new log
      logs.unshift(callLog);
      
      // Keep only last 100 calls
      if (logs.length > 100) {
        logs.splice(100);
      }
      
      // Save updated logs
      await AsyncStorage.setItem('medical_call_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Error logging phone call:', error);
    }
  }

  // Get call logs for reports
  static async getCallLogs(): Promise<any[]> {
    try {
      const existingLogs = await AsyncStorage.getItem('medical_call_logs');
      return existingLogs ? JSON.parse(existingLogs) : [];
    } catch (error) {
      console.error('Error getting call logs:', error);
      return [];
    }
  }

  // Check if device supports phone calls
  static async canMakePhoneCalls(): Promise<boolean> {
    try {
      return await Linking.canOpenURL('tel:');
    } catch (error) {
      return false;
    }
  }

  // Check if device supports SMS
  static async canSendSMS(): Promise<boolean> {
    try {
      return await Linking.canOpenURL('sms:');
    } catch (error) {
      return false;
    }
  }

  // Open contact in device contacts app
  static async openContactInDevice(phoneNumber: string): Promise<boolean> {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        return false;
      }

      const contacts = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.ID],
      });

      const contact = contacts.data.find(c => 
        c.phoneNumbers?.some(p => p.number?.replace(/[^+\d]/g, '') === phoneNumber.replace(/[^+\d]/g, ''))
      );

      if (contact && contact.id) {
        // Try to open contact in contacts app (this may not work on all devices)
        const contactUrl = Platform.OS === 'ios' 
          ? `contacts://contact/${contact.id}`
          : `content://contacts/people/${contact.id}`;
        
        const canOpen = await Linking.canOpenURL(contactUrl);
        if (canOpen) {
          await Linking.openURL(contactUrl);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error opening contact:', error);
      return false;
    }
  }
}

export default PhoneIntegration;