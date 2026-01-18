import React, { useState } from 'react';
import {
  ArrowLeft,
  Star,
  User,
  Users,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Cake,
  Asterisk,
  ChevronDown,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { patientsApi, CreatePatientRequest } from '../api';
import { logger } from '../utils/logger';
import { Patient } from '../types';

interface RegisterPatientPageProps {
  onBack: () => void;
  onSubmit: (patient: Patient) => void;
}

interface FormErrors {
  fullName?: string;
  gender?: string;
  age?: string;
  phone?: string;
  email?: string;
  location?: string;
  category?: string;
  emergencyName?: string;
  emergencyPhone?: string;
}

const RegisterPatientPage: React.FC<RegisterPatientPageProps> = ({ onBack, onSubmit }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    age: '',
    phone: '',
    email: '',
    location: '',
    category: '',
    emergencyName: '',
    emergencyPhone: '',
    reason: ''
  });

  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setSubmitError(null);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (parseInt(formData.age) < 0 || parseInt(formData.age) > 150) {
      newErrors.age = 'Please enter a valid age';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.location) {
      newErrors.location = 'Location is required';
    }

    if (!formData.category) {
      newErrors.category = 'Medical group category is required';
    }

    if (!formData.emergencyName.trim()) {
      newErrors.emergencyName = 'Emergency contact name is required';
    }

    if (!formData.emergencyPhone.trim()) {
      newErrors.emergencyPhone = 'Emergency contact phone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSubmitError(null);

    try {
      // Calculate year of birth from age
      const currentYear = new Date().getFullYear();
      const yearOfBirth = currentYear - parseInt(formData.age);

      // Map form data to API request format
      const patientData: CreatePatientRequest = {
        name: formData.fullName.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        location: formData.location || undefined,
        group: formData.category || undefined,
        year_of_birth: yearOfBirth,
        gender: formData.gender.toLowerCase() as 'male' | 'female' | 'other',
        initial_complaint: formData.reason.trim() || undefined,
        is_favorite: isFavorite,
        emergency_contact_name: formData.emergencyName.trim() || undefined,
        emergency_contact_phone: formData.emergencyPhone.trim() || undefined,
      };

      const createdPatient = await patientsApi.createPatient(patientData);

      logger.info('Patient created successfully', { patientId: createdPatient.id });

      setSubmitSuccess(true);

      // Show success briefly then navigate
      setTimeout(() => {
        onSubmit(createdPatient);
      }, 1500);

    } catch (err: any) {
      logger.error('Failed to create patient', err);

      if (err.response?.status === 409) {
        setSubmitError('A patient with this information already exists.');
      } else if (err.response?.status === 422) {
        const validationErrors = err.response?.data?.detail;
        if (Array.isArray(validationErrors)) {
          const errorMessages = validationErrors.map((e: any) => e.msg || e.message).join('. ');
          setSubmitError(errorMessages || 'Please check your input and try again.');
        } else {
          setSubmitError('Please check your input and try again.');
        }
      } else if (err.response?.status === 401) {
        setSubmitError('Your session has expired. Please log in again.');
      } else {
        setSubmitError('Failed to register patient. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClassName = (fieldName: keyof FormErrors) =>
    `block w-full pl-11 pr-4 py-3 bg-white border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium ${
      errors[fieldName] ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
    }`;

  const selectClassName = (fieldName: keyof FormErrors) =>
    `block w-full pl-11 pr-10 py-3 bg-white border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium appearance-none ${
      errors[fieldName] ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
    }`;

  if (submitSuccess) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
        <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient Registered!</h2>
          <p className="text-gray-500">Redirecting to patient list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            disabled={isLoading}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-600 disabled:opacity-50"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Register New Patient</h2>
        </div>
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          disabled={isLoading}
          className={`transition-colors ${isFavorite ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
        >
          <Star size={20} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="p-6 md:p-8 bg-[#F8FAFC]">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Patient Details</h1>
            <p className="text-gray-500 mt-1">Enter the new patient's information below.</p>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 font-medium">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Full Name *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Ex. John Doe"
                  disabled={isLoading}
                  className={inputClassName('fullName')}
                />
              </div>
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>

            {/* Gender & Age Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Gender *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Users size={18} />
                  </div>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={selectClassName('gender')}
                  >
                    <option value="" disabled>Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
                {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Age *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Cake size={18} />
                  </div>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Ex. 25"
                    min="0"
                    max="150"
                    disabled={isLoading}
                    className={inputClassName('age')}
                  />
                </div>
                {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
              </div>
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Contact Number *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 000-0000"
                  disabled={isLoading}
                  className={inputClassName('phone')}
                />
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john.doe@example.com"
                  disabled={isLoading}
                  className={inputClassName('email')}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Location *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <MapPin size={18} />
                </div>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={selectClassName('location')}
                >
                  <option value="" disabled>Select Location</option>
                  <option value="Main Clinic">Main Clinic</option>
                  <option value="West Wing">West Wing</option>
                  <option value="Emergency Dept">Emergency Dept</option>
                  <option value="Pediatric Ward">Pediatric Ward</option>
                  <option value="Cardiology Unit">Cardiology Unit</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
                  <ChevronDown size={16} />
                </div>
              </div>
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            </div>

            {/* Medical Group Category */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Medical Group Category *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Briefcase size={18} />
                </div>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={selectClassName('category')}
                >
                  <option value="" disabled>Select Category</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="General Practice">General Practice</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Oncology">Oncology</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
                  <ChevronDown size={16} />
                </div>
              </div>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            {/* Emergency Contact Section */}
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-6">
                 <Asterisk size={20} className="text-gray-900" />
                 <h3 className="text-lg font-bold text-gray-900">Emergency Contact</h3>
              </div>

              <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Contact Name *</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <User size={18} />
                        </div>
                        <input
                        type="text"
                        name="emergencyName"
                        value={formData.emergencyName}
                        onChange={handleChange}
                        placeholder="Full Name"
                        disabled={isLoading}
                        className={inputClassName('emergencyName')}
                        />
                    </div>
                    {errors.emergencyName && <p className="mt-1 text-sm text-red-600">{errors.emergencyName}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Contact Phone *</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <Phone size={18} />
                        </div>
                        <input
                        type="tel"
                        name="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={handleChange}
                        placeholder="(555) 000-0000"
                        disabled={isLoading}
                        className={inputClassName('emergencyPhone')}
                        />
                    </div>
                    {errors.emergencyPhone && <p className="mt-1 text-sm text-red-600">{errors.emergencyPhone}</p>}
                </div>
              </div>
            </div>

            {/* Reason for Visit */}
            <div className="pt-2">
               <div className="flex justify-between mb-2">
                 <label className="block text-sm font-bold text-gray-900">Reason for Visit</label>
                 <span className="text-xs text-gray-400 italic">Optional</span>
               </div>
               <textarea
                 name="reason"
                 value={formData.reason}
                 onChange={handleChange}
                 rows={4}
                 placeholder="Briefly describe symptoms or purpose of visit..."
                 disabled={isLoading}
                 className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium resize-none disabled:opacity-50 disabled:cursor-not-allowed"
               />
            </div>

            <div className="pt-4 pb-2">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-500/20 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Registering...
                      </>
                    ) : (
                      'Register Patient'
                    )}
                </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPatientPage;
