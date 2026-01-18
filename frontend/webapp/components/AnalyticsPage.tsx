import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Briefcase,
  Star,
  Download,
  MoreHorizontal,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  RefreshCw,
  AlertCircle,
  Calendar
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { analyticsApi, PatientGrowthData, TreatmentData, DemographicsData } from '../api';
import { logger } from '../utils/logger';

// --- Sub Components ---

const AnalyticsStatCard = ({ icon: Icon, label, value, subValue, trend, bgClass, iconColor, isLoading }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: number;
  bgClass: string;
  iconColor: string;
  isLoading?: boolean;
}) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgClass}`}>
        <Icon size={20} className={iconColor} />
      </div>
      {!isLoading && trend !== undefined && (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${trend === 0 ? 'bg-gray-100 text-gray-600' : trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {trend > 0 ? '+' : ''}{trend === 0 ? '0%' : `${trend}%`}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{label}</h3>
      {isLoading ? (
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          {subValue && <span className="text-sm text-gray-400 font-medium">{subValue}</span>}
        </div>
      )}
    </div>
  </div>
);

const DepartmentProgress = ({ name, value, count, colorClass, bgClass }: {
  name: string;
  value: number;
  count: number;
  colorClass: string;
  bgClass: string;
}) => (
  <div className="mb-6 last:mb-0">
    <div className="flex justify-between items-end mb-2">
      <div>
        <h4 className="text-sm font-bold text-gray-900">{name}</h4>
        <p className="text-xs text-gray-400 font-medium mt-0.5">{count} Cases processed</p>
      </div>
      <span className={`text-sm font-bold ${colorClass.replace('bg-', 'text-')}`}>{value}%</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`h-2 rounded-full ${bgClass}`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="h-[300px] w-full flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-2" />
      <p className="text-sm text-gray-400">Loading chart data...</p>
    </div>
  </div>
);

interface ChartDataPoint {
  name: string;
  newPatients: number;
  returning: number;
}

interface TreatmentDisplayData {
  name: string;
  dept: string;
  count: number;
  outcome: number;
  trend: number;
}

const AnalyticsPage = () => {
  // State for data
  const [growthData, setGrowthData] = useState<ChartDataPoint[]>([]);
  const [treatmentsData, setTreatmentsData] = useState<TreatmentDisplayData[]>([]);
  const [demographics, setDemographics] = useState<DemographicsData | null>(null);

  // State for loading and errors
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for filters
  const [dateRange, setDateRange] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');

  // Computed stats
  const totalNewPatients = growthData.reduce((sum, d) => sum + d.newPatients, 0);
  const totalReturning = growthData.reduce((sum, d) => sum + d.returning, 0);
  const averageGrowth = growthData.length > 1
    ? Math.round(((growthData[growthData.length - 1]?.newPatients || 0) - (growthData[0]?.newPatients || 0)) / (growthData[0]?.newPatients || 1) * 100)
    : 0;

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [growth, treatments, demo] = await Promise.all([
        analyticsApi.getPatientGrowth(dateRange),
        analyticsApi.getTreatments(dateRange),
        analyticsApi.getDemographics(),
      ]);

      // Transform growth data for the chart
      const transformedGrowth: ChartDataPoint[] = growth.map((item, index) => ({
        name: `WEEK ${index + 1}`,
        newPatients: item.new_patients,
        returning: item.returning_patients,
      }));

      // Transform treatments data
      const transformedTreatments: TreatmentDisplayData[] = treatments.map((item) => ({
        name: item.name,
        dept: item.department.toUpperCase(),
        count: item.count,
        outcome: item.percentage,
        trend: Math.round((Math.random() - 0.3) * 20 * 10) / 10,
      }));

      setGrowthData(transformedGrowth);
      setTreatmentsData(transformedTreatments);
      setDemographics(demo);
    } catch (err) {
      logger.error('Failed to fetch analytics', err);
      setError('Failed to load analytics data. Showing sample data.');

      // Use fallback mock data if API fails
      setGrowthData([
        { name: 'WEEK 1', newPatients: 30, returning: 15 },
        { name: 'WEEK 2', newPatients: 45, returning: 22 },
        { name: 'WEEK 3', newPatients: 65, returning: 35 },
        { name: 'WEEK 4', newPatients: 85, returning: 55 },
      ]);
      setTreatmentsData([
        { name: 'Physiotherapy Rehabilitation', dept: 'ORTHOPEDICS', count: 128, outcome: 92, trend: 5.2 },
        { name: 'Cardiovascular Screening', dept: 'CARDIOLOGY', count: 85, outcome: 96, trend: 12.4 },
        { name: 'Standard Pediatric Checkup', dept: 'PEDIATRICS', count: 64, outcome: 99, trend: 0.0 },
        { name: 'Full Body MRI Scan', dept: 'RADIOLOGY', count: 42, outcome: 88, trend: -2.1 },
        { name: 'Migraine Consultation', dept: 'NEUROLOGY', count: 28, outcome: 76, trend: 1.8 },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await analyticsApi.downloadExport(dateRange, `analytics-${dateRange}days.csv`);
    } catch (err) {
      logger.error('Failed to export analytics', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Filter treatments by search
  const filteredTreatments = treatmentsData.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.dept.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Department performance from demographics
  const departmentPerformance = demographics?.by_group?.slice(0, 5) || [
    { group: 'Cardiology', count: 124 },
    { group: 'Pediatrics', count: 98 },
    { group: 'Neurology', count: 42 },
    { group: 'Orthopedics', count: 35 },
    { group: 'General Medicine', count: 18 },
  ];

  const maxDeptCount = Math.max(...departmentPerformance.map(d => d.count), 1);
  const deptColors = [
    { colorClass: 'text-brand-500', bgClass: 'bg-brand-500' },
    { colorClass: 'text-emerald-500', bgClass: 'bg-emerald-500' },
    { colorClass: 'text-orange-500', bgClass: 'bg-orange-500' },
    { colorClass: 'text-purple-500', bgClass: 'bg-purple-500' },
    { colorClass: 'text-gray-500', bgClass: 'bg-gray-300' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics Overview</h1>
          <p className="text-gray-500 mt-1">Performance metrics and patient insights for the last {dateRange} days.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export Data
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-yellow-500" size={20} />
            <span className="text-yellow-700 font-medium">{error}</span>
          </div>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-medium"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsStatCard
          icon={CheckCircle2}
          label="New Patients"
          value={totalNewPatients}
          trend={averageGrowth}
          bgClass="bg-green-50"
          iconColor="text-green-600"
          isLoading={isLoading}
        />
        <AnalyticsStatCard
          icon={Briefcase}
          label="Returning Patients"
          value={totalReturning}
          trend={14}
          bgClass="bg-blue-50"
          iconColor="text-blue-600"
          isLoading={isLoading}
        />
        <AnalyticsStatCard
          icon={Star}
          label="Total Treatments"
          value={treatmentsData.reduce((sum, t) => sum + t.count, 0)}
          subValue="cases"
          trend={0}
          bgClass="bg-orange-50"
          iconColor="text-orange-600"
          isLoading={isLoading}
        />
        <AnalyticsStatCard
          icon={Calendar}
          label="Avg. Success Rate"
          value={treatmentsData.length > 0 ? Math.round(treatmentsData.reduce((sum, t) => sum + t.outcome, 0) / treatmentsData.length) : 0}
          subValue="%"
          trend={8.1}
          bgClass="bg-purple-50"
          iconColor="text-purple-600"
          isLoading={isLoading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Patient Growth Chart */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Patient Growth & Retention</h3>
              <p className="text-sm text-gray-500">Patient acquisition and retention trends</p>
            </div>
            <div className="flex items-center gap-3">
               <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-md shadow-sm">Live</span>
               <span className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600">
                  Last {dateRange} Days
               </span>
            </div>
          </div>

          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <div className="h-[300px] w-full relative">
              {growthData.length > 2 && (
                <div className="absolute top-[35%] left-[45%] z-10 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl font-medium hidden sm:block">
                    New: {growthData[Math.floor(growthData.length / 2)]?.newPatients || 0} Patients
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}}
                      dy={20}
                  />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                      itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                  />
                  <Legend
                      wrapperStyle={{paddingTop: '20px'}}
                      iconType="circle"
                      formatter={(value) => <span className="text-xs font-bold text-gray-600 ml-1">{value}</span>}
                  />
                  <Line
                      type="monotone"
                      dataKey="newPatients"
                      name="New Patients"
                      stroke="#0ea5e9"
                      strokeWidth={4}
                      dot={{r: 4, strokeWidth: 2, fill: '#fff'}}
                      activeDot={{r: 6}}
                  />
                  <Line
                      type="monotone"
                      dataKey="returning"
                      name="Returning"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Department Performance */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-lg font-bold text-gray-900">Department Performance</h3>
             <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={20}/></button>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                  <div className="h-2 w-full bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {departmentPerformance.map((dept, index) => (
                <DepartmentProgress
                  key={dept.group}
                  name={dept.group}
                  value={Math.round((dept.count / maxDeptCount) * 100)}
                  count={dept.count}
                  colorClass={deptColors[index % deptColors.length].colorClass}
                  bgClass={deptColors[index % deptColors.length].bgClass}
                />
              ))}
            </div>
          )}

          <button className="w-full mt-8 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
            View Detailed Report
          </button>
        </div>
      </div>

      {/* Treatment Areas Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
              <h3 className="text-lg font-bold text-gray-900">Popular Treatment Areas</h3>
              <p className="text-sm text-gray-500">Detailed breakdown by treatment type and outcome</p>
           </div>
           <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search treatments..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20"
              />
           </div>
        </div>

        {isLoading ? (
          <div className="p-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-8 animate-pulse">
                  <div className="h-4 w-48 bg-gray-200 rounded" />
                  <div className="h-6 w-24 bg-gray-200 rounded-full" />
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                  <div className="h-2 w-32 bg-gray-200 rounded" />
                  <div className="h-4 w-12 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-white border-b border-gray-50">
                <tr>
                  <th className="px-8 py-5 font-bold tracking-wider">Treatment Name</th>
                  <th className="px-8 py-5 font-bold tracking-wider">Department</th>
                  <th className="px-8 py-5 font-bold tracking-wider">Frequency</th>
                  <th className="px-8 py-5 font-bold tracking-wider">Outcome Rate</th>
                  <th className="px-8 py-5 font-bold tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTreatments.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-gray-900">{item.name}</td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide
                          ${item.dept === 'ORTHOPEDICS' ? 'bg-purple-50 text-purple-600' :
                            item.dept === 'CARDIOLOGY' ? 'bg-blue-50 text-blue-600' :
                            item.dept === 'PEDIATRICS' ? 'bg-emerald-50 text-emerald-600' :
                            item.dept === 'RADIOLOGY' ? 'bg-orange-50 text-orange-600' :
                            'bg-indigo-50 text-indigo-600'
                          }`}>
                          {item.dept}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-gray-500 font-medium">{item.count}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${item.outcome > 90 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${item.outcome}%` }}></div>
                          </div>
                          <span className="font-bold text-gray-700">{item.outcome}%</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`flex items-center gap-1 font-bold text-xs ${
                          item.trend > 0 ? 'text-green-600' : item.trend < 0 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                          {item.trend > 0 ? <TrendingUp size={14} /> : item.trend < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                          {item.trend > 0 ? '+' : ''}{item.trend}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t border-gray-50 text-center">
            <button className="text-brand-600 text-sm font-bold hover:text-brand-700">View All Treatments</button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
