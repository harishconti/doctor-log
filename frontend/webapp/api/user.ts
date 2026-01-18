import { apiClient } from '../lib/client';
import type { User } from '../types';

export interface UpdateProfileRequest {
  full_name?: string;
  phone?: string;
  medical_specialty?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface UserActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
}

export const userApi = {
  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await apiClient.put<User>('/users/me', data);
    return response.data;
  },

  /**
   * Change user password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/users/me/password', data);
    return response.data;
  },

  /**
   * Upload profile photo
   */
  uploadProfilePhoto: async (file: File): Promise<{ photo_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{ photo_url: string }>(
      '/users/me/photo',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data;
  },

  /**
   * Get user activity history
   */
  getActivityHistory: async (limit: number = 10): Promise<UserActivity[]> => {
    const response = await apiClient.get<UserActivity[]>(`/users/me/activity?limit=${limit}`);
    return response.data;
  },

  /**
   * Update notification preferences
   */
  updateNotificationPreferences: async (preferences: {
    email_notifications?: boolean;
    desktop_notifications?: boolean;
    critical_alerts?: boolean;
  }): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>('/users/me/notifications', preferences);
    return response.data;
  },

  /**
   * Enable two-factor authentication
   */
  enable2FA: async (): Promise<{ qr_code: string; secret: string }> => {
    const response = await apiClient.post<{ qr_code: string; secret: string }>('/users/me/2fa/enable');
    return response.data;
  },

  /**
   * Verify and confirm 2FA setup
   */
  verify2FA: async (code: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/users/me/2fa/verify', { code });
    return response.data;
  },

  /**
   * Disable two-factor authentication
   */
  disable2FA: async (code: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/users/me/2fa/disable', { code });
    return response.data;
  },
};
