import { useState, useEffect, useCallback } from 'react';
import {
  analyticsApi,
  type PatientGrowthData,
  type NotesActivityData,
  type WeeklyActivityData,
  type DemographicsData,
  type TreatmentData,
} from '../lib/analytics';

/**
 * Hook for fetching all analytics data in parallel.
 * Provides patient growth, notes activity, weekly activity, and demographics.
 */
export function useAnalytics(days = 30) {
  const [patientGrowth, setPatientGrowth] = useState<PatientGrowthData[]>([]);
  const [notesActivity, setNotesActivity] = useState<NotesActivityData[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityData[]>([]);
  const [demographics, setDemographics] = useState<DemographicsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [growth, notes, weekly, demo] = await Promise.all([
        analyticsApi.getPatientGrowth(days),
        analyticsApi.getNotesActivity(days),
        analyticsApi.getWeeklyActivity(),
        analyticsApi.getDemographics(),
      ]);
      setPatientGrowth(growth);
      setNotesActivity(notes);
      setWeeklyActivity(weekly);
      setDemographics(demo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    patientGrowth,
    notesActivity,
    weeklyActivity,
    demographics,
    isLoading,
    error,
    refetch: fetchAnalytics,
  };
}

/**
 * Hook for fetching treatment statistics.
 */
export function useTreatments(days = 30) {
  const [treatments, setTreatments] = useState<TreatmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTreatments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyticsApi.getTreatments(days);
      setTreatments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch treatments');
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  return { treatments, isLoading, error, refetch: fetchTreatments };
}

/**
 * Hook for exporting analytics data.
 * Provides a download function for CSV export.
 */
export function useAnalyticsExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = useCallback(async (days = 30, filename?: string) => {
    setIsExporting(true);
    setError(null);
    try {
      await analyticsApi.downloadExport(days, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export analytics');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportData, isExporting, error };
}
