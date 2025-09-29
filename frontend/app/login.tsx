import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('dr.sarah@clinic.com'); // Pre-filled for demo
  const [password, setPassword] = useState('password123'); // Pre-filled for demo
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    router.push('/register');
  };

  const loadDemoAccount = (userType: 'cardiology' | 'physiotherapy') => {
    if (userType === 'cardiology') {
      setEmail('dr.sarah@clinic.com');
      setPassword('password123');
    } else {
      setEmail('dr.mike@physio.com');  
      setPassword('password123');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="medical" size={64} color="#2ecc71" />
            <Text style={styles.title}>Medical Contacts</Text>
            <Text style={styles.subtitle}>Professional Patient Management</Text>
          </View>

          {/* Demo Accounts */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Demo Accounts:</Text>
            <View style={styles.demoButtons}>
              <TouchableOpacity 
                style={styles.demoButton}
                onPress={() => loadDemoAccount('cardiology')}
              >
                <Text style={styles.demoButtonText}>Dr. Sarah (Cardiology)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.demoButton}
                onPress={() => loadDemoAccount('physiotherapy')}
              >
                <Text style={styles.demoButtonText}>Dr. Mike (Physiotherapy)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? 'eye' : 'eye-off'} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={styles.registerButton}
              onPress={navigateToRegister}
            >
              <Text style={styles.registerButtonText}>Create New Account</Text>
            </TouchableOpacity>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="people" size={24} color="#2ecc71" />
              <Text style={styles.featureText}>Patient Management</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="document-text" size={24} color="#2ecc71" />
              <Text style={styles.featureText}>Medical Notes</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="cloud" size={24} color="#2ecc71" />
              <Text style={styles.featureText}>Cloud Sync</Text>
            </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  demoSection: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2ecc71',
    marginBottom: 12,
    textAlign: 'center',
  },
  demoButtons: {
    gap: 8,
  },
  demoButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  loginButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#999',
    fontSize: 14,
  },
  registerButton: {
    borderWidth: 2,
    borderColor: '#2ecc71',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#2ecc71',
    fontSize: 16,
    fontWeight: '600',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 'auto',
  },
  feature: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});