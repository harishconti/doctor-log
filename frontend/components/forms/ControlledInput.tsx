import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Control, Controller, FieldError } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

interface ControlledInputProps extends TextInputProps {
  control: Control<any>;
  name: string;
  label?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

const ControlledInput: React.FC<ControlledInputProps> = ({
  control,
  name,
  label,
  iconName,
  isPassword = false,
  ...textInputProps
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          {label && <Text style={styles.label}>{label}</Text>}
          <View style={[styles.inputContainer, error ? styles.inputContainerError : null]}>
            {iconName && <Ionicons name={iconName} size={20} color="#666" style={styles.inputIcon} />}
            <TextInput
              style={styles.input}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              secureTextEntry={isPassword && !isPasswordVisible}
              {...textInputProps}
            />
            {isPassword && (
              <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                <Ionicons name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          {error && <Text style={styles.errorText}>{error.message}</Text>}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputContainerError: {
    borderColor: '#e74c3c',
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
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default ControlledInput;