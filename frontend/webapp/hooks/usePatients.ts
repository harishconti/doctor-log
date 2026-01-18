import { useState, useEffect, useCallback } from 'react';
import { patientsApi, type GetPatientsParams } from '../lib/patients';
import type { Patient, PatientStats, PaginatedResponse } from '../types';

/**
 * Hook for fetching and managing paginated patient list with filtering.
 * Provides automatic refetching when filters change.
 */
export function usePatients(initialFilters: GetPatientsParams = {}) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GetPatientsParams>(initialFilters);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Patient> = await patientsApi.getPatients(filters);
      setPatients(response.items);
      setPagination({
        total: response.total,
        page: response.page,
        pageSize: response.page_size,
        totalPages: response.total_pages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patients');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const updateFilters = useCallback((newFilters: Partial<GetPatientsParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  return {
    patients,
    pagination,
    isLoading,
    error,
    filters,
    updateFilters,
    setPage,
    refetch: fetchPatients,
  };
}

/**
 * Hook for fetching patient statistics (total counts, groups, etc.)
 */
export function usePatientStats() {
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await patientsApi.getStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch patient stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}

/**
 * Hook for fetching a single patient by ID.
 * Only fetches when a valid ID is provided.
 */
export function usePatient(id: string | null) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatient = useCallback(async (patientId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await patientsApi.getPatient(patientId);
      setPatient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchPatient(id);
    } else {
      setPatient(null);
      setIsLoading(false);
    }
  }, [id, fetchPatient]);

  const refetch = useCallback(() => {
    if (id) {
      fetchPatient(id);
    }
  }, [id, fetchPatient]);

  return { patient, isLoading, error, setPatient, refetch };
}

/**
 * Hook for fetching patient groups.
 */
export function usePatientGroups() {
  const [groups, setGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await patientsApi.getGroups();
        setGroups(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch groups');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, []);

  return { groups, isLoading, error };
}
