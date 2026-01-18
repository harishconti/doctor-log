import { apiClient } from '../lib/client';
import type { Patient, PaginatedResponse, PatientStats, ClinicalNote } from '../types';

export interface GetPatientsParams {
  search?: string;
  group?: string;
  is_favorite?: boolean;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CreatePatientRequest {
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  group?: string;
  year_of_birth?: number;
  gender?: 'male' | 'female' | 'other';
  initial_complaint?: string;
  is_favorite?: boolean;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {}

export interface CreateNoteRequest {
  content: string;
  visit_type?: 'regular' | 'follow-up' | 'emergency';
}

export const patientsApi = {
  /**
   * Get paginated list of patients with optional filters
   */
  getPatients: async (params: GetPatientsParams = {}): Promise<PaginatedResponse<Patient>> => {
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.append('search', params.search);
    if (params.group) queryParams.append('group', params.group);
    if (params.is_favorite !== undefined) queryParams.append('is_favorite', String(params.is_favorite));
    if (params.page) queryParams.append('page', String(params.page));
    if (params.page_size) queryParams.append('page_size', String(params.page_size));
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);

    const queryString = queryParams.toString();
    const url = `/patients/${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<PaginatedResponse<Patient>>(url);
    return response.data;
  },

  /**
   * Get a single patient by ID
   */
  getPatient: async (patientId: string): Promise<Patient> => {
    const response = await apiClient.get<Patient>(`/patients/${patientId}`);
    return response.data;
  },

  /**
   * Create a new patient
   */
  createPatient: async (data: CreatePatientRequest): Promise<Patient> => {
    const response = await apiClient.post<Patient>('/patients/', data);
    return response.data;
  },

  /**
   * Update an existing patient
   */
  updatePatient: async (patientId: string, data: UpdatePatientRequest): Promise<Patient> => {
    const response = await apiClient.put<Patient>(`/patients/${patientId}`, data);
    return response.data;
  },

  /**
   * Delete a patient
   */
  deletePatient: async (patientId: string): Promise<void> => {
    await apiClient.delete(`/patients/${patientId}`);
  },

  /**
   * Get patient statistics
   */
  getStats: async (): Promise<PatientStats> => {
    const response = await apiClient.get<PatientStats>('/patients/stats/');
    return response.data;
  },

  /**
   * Get list of patient groups
   */
  getGroups: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>('/patients/groups/');
    return response.data;
  },

  /**
   * Toggle patient favorite status
   */
  toggleFavorite: async (patientId: string, isFavorite: boolean): Promise<Patient> => {
    const response = await apiClient.put<Patient>(`/patients/${patientId}`, {
      is_favorite: isFavorite,
    });
    return response.data;
  },

  /**
   * Get clinical notes for a patient
   */
  getNotes: async (patientId: string): Promise<ClinicalNote[]> => {
    const response = await apiClient.get<ClinicalNote[]>(`/patients/${patientId}/notes`);
    return response.data;
  },

  /**
   * Create a clinical note for a patient
   */
  createNote: async (patientId: string, data: CreateNoteRequest): Promise<ClinicalNote> => {
    const response = await apiClient.post<ClinicalNote>(`/patients/${patientId}/notes`, data);
    return response.data;
  },

  /**
   * Upload patient photo
   */
  uploadPhoto: async (patientId: string, file: File): Promise<{ photo_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{ photo_url: string }>(
      `/patients/${patientId}/photo`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },
};
