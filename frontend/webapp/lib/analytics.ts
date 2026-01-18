import { apiClient } from './client';
import type { AnalyticsData } from '../types';

export interface PatientGrowthData {
  date: string;
  new_patients: number;
  returning_patients: number;
}

export interface NotesActivityData {
  date: string;
  notes_created: number;
}

export interface WeeklyActivityData {
  day: string;
  patients: number;
  notes: number;
}

export interface DemographicsData {
  by_group: { group: string; count: number }[];
  by_month: { month: string; count: number }[];
  by_gender: { gender: string; count: number }[];
  by_age_range: { range: string; count: number }[];
}

export interface TreatmentData {
  name: string;
  department: string;
  count: number;
  percentage: number;
}

export const analyticsApi = {
  /**
   * Get patient growth data for a time period
   */
  getPatientGrowth: async (days: number = 30): Promise<PatientGrowthData[]> => {
    const response = await apiClient.get<PatientGrowthData[]>(`/analytics/patient-growth?days=${days}`);
    return response.data;
  },

  /**
   * Get notes activity data for a time period
   */
  getNotesActivity: async (days: number = 30): Promise<NotesActivityData[]> => {
    const response = await apiClient.get<NotesActivityData[]>(`/analytics/notes-activity?days=${days}`);
    return response.data;
  },

  /**
   * Get weekly activity summary
   */
  getWeeklyActivity: async (): Promise<WeeklyActivityData[]> => {
    const response = await apiClient.get<WeeklyActivityData[]>('/analytics/weekly-activity');
    return response.data;
  },

  /**
   * Get patient demographics breakdown
   */
  getDemographics: async (): Promise<DemographicsData> => {
    const response = await apiClient.get<DemographicsData>('/analytics/demographics');
    return response.data;
  },

  /**
   * Get treatment statistics
   */
  getTreatments: async (days: number = 30): Promise<TreatmentData[]> => {
    const response = await apiClient.get<TreatmentData[]>(`/analytics/treatments?days=${days}`);
    return response.data;
  },

  /**
   * Get all analytics data in one request
   */
  getAllAnalytics: async (days: number = 30): Promise<AnalyticsData> => {
    const response = await apiClient.get<AnalyticsData>(`/analytics?days=${days}`);
    return response.data;
  },

  /**
   * Export analytics data as CSV
   */
  exportToCsv: async (days: number = 30): Promise<Blob> => {
    const response = await apiClient.get('/analytics/export', {
      params: { days },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Download export as file
   */
  downloadExport: async (days: number = 30, filename: string = 'analytics-export.csv'): Promise<void> => {
    const blob = await analyticsApi.exportToCsv(days);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
