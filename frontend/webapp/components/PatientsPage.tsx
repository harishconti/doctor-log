import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Users,
  AlertCircle,
  Calendar,
  Clock,
  Heart,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronNext,
  Hourglass,
  RefreshCw
} from 'lucide-react';
import { Patient, PatientStats } from '../types';
import { patientsApi, GetPatientsParams } from '../api';
import { useAuthStore } from '../store/authStore';
import { logger } from '../utils/logger';
import { SkeletonStatCard, SkeletonPatientItem } from './Skeleton';

interface PatientsPageProps {
  onSelectPatient: (patient: Patient) => void;
  onAddNewPatient?: () => void;
}

const StatCard = ({ label, value, icon: Icon, colorClass, bgClass, isLoading }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  isLoading?: boolean;
}) => {
  if (isLoading) {
    return <SkeletonStatCard className="h-28" />;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:-translate-y-1 duration-200 h-28">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${bgClass}`}>
        <Icon size={26} className={colorClass} />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
      </div>
    </div>
  );
};

const PatientListItem = ({
  patient,
  onClick,
  onToggleFavorite
}: {
  patient: Patient;
  onClick: () => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
}) => {
  const getStatusConfig = (status?: string) => {
    const statusUpper = status?.toUpperCase() || '';
    switch (statusUpper) {
      case 'CRITICAL': return { label: 'CRITICAL', className: 'bg-red-50 text-red-600 border-red-100' };
      case 'STABLE': return { label: 'STABLE', className: 'bg-green-50 text-emerald-600 border-emerald-100' };
      case 'RECOVERING': return { label: 'POST-OP', className: 'bg-blue-50 text-blue-600 border-blue-100' };
      default: return { label: 'FOLLOW-UP', className: 'bg-gray-100 text-gray-600 border-gray-200' };
    }
  };

  const statusConfig = getStatusConfig(patient.status);
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2);

  const colors = [
    'bg-blue-100 text-blue-600',
    'bg-purple-100 text-purple-600',
    'bg-orange-100 text-orange-600',
    'bg-emerald-100 text-emerald-600',
    'bg-indigo-100 text-indigo-600'
  ];
  const colorIndex = patient.name.length % colors.length;
  const avatarColor = colors[colorIndex];

  const formatLastVisit = (date?: string) => {
    if (!date) return 'No visits yet';
    const visitDate = new Date(date);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return visitDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
        {patient.photo ? (
          <img
            src={patient.photo}
            alt={patient.name}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-sm sm:text-lg font-bold shrink-0 ${avatarColor}`}>
            {getInitials(patient.name)}
          </div>
        )}

        <div>
           <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                {patient.name}
              </h3>
              {patient.is_favorite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite?.(patient.id, false);
                  }}
                  className="focus:outline-none"
                >
                  <Heart size={16} className="fill-red-500 text-red-500 hover:fill-red-400 hover:text-red-400 transition-colors" />
                </button>
              )}
              {!patient.is_favorite && onToggleFavorite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite?.(patient.id, true);
                  }}
                  className="focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart size={16} className="text-gray-300 hover:text-red-400 transition-colors" />
                </button>
              )}
           </div>
           <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm font-medium">
              <Clock size={14} />
              <span>Last Visit: {formatLastVisit(patient.lastVisit || patient.updated_at)}</span>
           </div>
           {patient.group && (
             <span className="text-xs text-gray-400 mt-1 block">{patient.group}</span>
           )}
        </div>
      </div>

      <div className="flex items-center justify-between w-full sm:w-auto sm:gap-6 pl-[4.5rem] sm:pl-0">
         <span className={`px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold border uppercase tracking-wide ${statusConfig.className}`}>
            {statusConfig.label}
         </span>
         <div className="text-gray-300 group-hover:text-brand-400 transition-colors">
            <ChevronNext size={20} />
         </div>
      </div>
    </div>
  );
};

const PatientListSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <SkeletonPatientItem key={i} />
    ))}
  </div>
);

type FilterTab = 'all' | 'favorites' | 'critical' | 'department';

const PatientsPage: React.FC<PatientsPageProps> = ({ onSelectPatient, onAddNewPatient }) => {
  const { user } = useAuthStore();

  // State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [groups, setGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const pageSize = 10;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  // Debounce timer ref
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Fetch patients from API
  const fetchPatients = useCallback(async (params: GetPatientsParams = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await patientsApi.getPatients({
        page: currentPage,
        page_size: pageSize,
        search: searchQuery || undefined,
        is_favorite: activeTab === 'favorites' ? true : undefined,
        group: selectedGroup || undefined,
        ...params,
      });

      setPatients(response.items);
      setTotalPages(response.total_pages);
      setTotalPatients(response.total);
    } catch (err) {
      logger.error('Failed to fetch patients', err);
      setError('Failed to load patients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, activeTab, selectedGroup, pageSize]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const statsData = await patientsApi.getStats();
      setStats(statsData);
    } catch (err) {
      logger.error('Failed to fetch stats', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    try {
      const groupsData = await patientsApi.getGroups();
      setGroups(groupsData);
    } catch (err) {
      logger.error('Failed to fetch groups', err);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchPatients();
    fetchStats();
    fetchGroups();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchPatients();
  }, [currentPage, activeTab, selectedGroup]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchPatients();
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchQuery]);

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle tab change
  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedGroup('');
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (patientId: string, isFavorite: boolean) => {
    try {
      await patientsApi.toggleFavorite(patientId, isFavorite);
      // Update local state
      setPatients(prev => prev.map(p =>
        p.id === patientId ? { ...p, is_favorite: isFavorite } : p
      ));
      // Refresh stats
      fetchStats();
    } catch (err) {
      logger.error('Failed to toggle favorite', err);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }
    return pages;
  };

  // Format date
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening';
  const userName = user?.full_name || 'Doctor';

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <div>
           <p className="text-gray-500 font-medium mb-1 text-sm">{today}</p>
           <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{greeting}, {userName}</h1>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div className="w-full"></div>

           <div className="flex w-full md:w-auto items-center gap-3">
              <div className="relative flex-1 md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search patients by name or ID..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm"
                />
              </div>
              <button
                onClick={onAddNewPatient}
                className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand-600/20 transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus size={20} />
                New Patient
              </button>
           </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Patients"
          value={stats?.total_patients ?? 0}
          icon={Users}
          bgClass="bg-blue-50"
          colorClass="text-brand-600"
          isLoading={isStatsLoading}
        />
        <StatCard
          label="Favorites"
          value={stats?.total_favorites ?? 0}
          icon={Heart}
          bgClass="bg-red-50"
          colorClass="text-red-500"
          isLoading={isStatsLoading}
        />
        <StatCard
          label="Groups"
          value={stats?.total_groups ?? 0}
          icon={Calendar}
          bgClass="bg-green-50"
          colorClass="text-emerald-600"
          isLoading={isStatsLoading}
        />
        <StatCard
          label="This Week"
          value={patients.length}
          icon={Hourglass}
          bgClass="bg-amber-50"
          colorClass="text-amber-600"
          isLoading={isLoading}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-end border-b border-gray-200">
        <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar">
          {[
            { key: 'all', label: 'All Patients' },
            { key: 'favorites', label: 'Favorites' },
            { key: 'critical', label: 'Critical' },
            { key: 'department', label: 'Department' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key as FilterTab)}
              className={`pb-4 px-2 sm:px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Group selector when Department tab is active */}
        {activeTab === 'department' && groups.length > 0 && (
          <div className="pb-4">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">All Departments</option>
              {groups.map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
        )}

        <div className="hidden sm:block pb-4 text-sm font-medium text-gray-500">
          Total: <span className="text-gray-900 font-bold">{totalPatients} Patients</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <span className="text-red-700 font-medium">{error}</span>
          </div>
          <button
            onClick={() => fetchPatients()}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {/* Patients List */}
      {isLoading ? (
        <PatientListSkeleton />
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Users className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No patients found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery
              ? `No patients match "${searchQuery}"`
              : activeTab === 'favorites'
                ? 'You haven\'t added any favorite patients yet'
                : 'Get started by adding your first patient'}
          </p>
          {!searchQuery && activeTab === 'all' && (
            <button
              onClick={onAddNewPatient}
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all"
            >
              <Plus size={20} />
              Add Patient
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {patients.map((patient) => (
            <PatientListItem
              key={patient.id}
              patient={patient}
              onClick={() => onSelectPatient(patient)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && patients.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-bold text-gray-900">{((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalPatients)}</span> of <span className="font-bold text-gray-900">{totalPatients}</span> patients
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="hidden sm:flex items-center gap-1">
              {getPageNumbers().map((page, idx) => (
                typeof page === 'number' ? (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${
                      currentPage === page
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                        : 'border border-transparent text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={idx} className="text-gray-400 px-2 font-medium">...</span>
                )
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsPage;
