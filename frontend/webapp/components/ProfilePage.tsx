import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Award,
  BookOpen,
  Lock,
  Bell,
  Clock,
  ChevronRight,
  PenSquare,
  FileText,
  Activity,
  CheckCircle2,
  Eye,
  Search,
  Users,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { userApi, ChangePasswordRequest } from '../api';
import { logger } from '../utils/logger';

const ActivityItem = ({ type, patient, date, status, icon: Icon, iconColor, bgColor }: {
  type: string;
  patient: string | null;
  date: string;
  status: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
}) => {
    const getStatusStyles = (status: string) => {
        switch(status) {
            case 'Completed': return 'bg-green-50 text-green-600';
            case 'Pending Review': return 'bg-yellow-50 text-yellow-600';
            case 'Archived': return 'bg-gray-100 text-gray-500';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group cursor-pointer border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-4 w-1/3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgColor}`}>
                    <Icon size={18} className={iconColor} />
                </div>
                <span className="text-sm font-bold text-gray-900">{type}</span>
            </div>

            <div className="flex items-center gap-3 w-1/4">
                {patient ? (
                    <>
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">
                           {patient.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <span className="text-sm text-gray-600 font-medium">{patient}</span>
                    </>
                ) : (
                    <span className="text-sm text-gray-400 italic">Internal Staff</span>
                )}
            </div>

            <div className="text-sm text-gray-500 w-1/4">
                {date}
            </div>

            <div className="flex items-center justify-between w-1/6">
                 <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${getStatusStyles(status)}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'Completed' ? 'bg-green-500' : status === 'Pending Review' ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                    {status}
                 </span>
                 <button className="text-gray-300 hover:text-brand-600 transition-colors">
                    <Eye size={18} />
                 </button>
            </div>
        </div>
    );
};

// Change Password Modal Component
const ChangePasswordModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }

    setIsLoading(true);
    try {
      const data: ChangePasswordRequest = {
        current_password: currentPassword,
        new_password: newPassword,
      };
      await userApi.changePassword(data);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err: any) {
      logger.error('Failed to change password', err);
      if (err.response?.status === 400) {
        setError('Current password is incorrect');
      } else {
        setError('Failed to change password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle2 className="mx-auto text-green-500 mb-4" size={48} />
            <p className="text-gray-900 font-bold">Password changed successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="text-red-500" size={16} />
                <span className="text-red-700 text-sm font-medium">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="Enter new password (min 12 characters)"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { user } = useAuthStore();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // User data from auth store with fallbacks
  const userName = user?.full_name || 'Doctor';
  const userEmail = user?.email || 'email@heallog.com';
  const userPhone = user?.phone || 'Not provided';
  const userSpecialty = user?.medical_specialty || 'Medical Professional';
  const userRole = user?.role || 'doctor';
  const userPlan = user?.plan || 'basic';
  const userInitial = userName.charAt(0).toUpperCase();
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A';

  // Calculate profile completeness
  const profileFields = [user?.full_name, user?.email, user?.phone, user?.medical_specialty, user?.profile_photo];
  const completedFields = profileFields.filter(Boolean).length;
  const profileCompleteness = Math.round((completedFields / profileFields.length) * 100);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account settings and professional details.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-600/20 transition-all active:scale-95">
          <PenSquare size={16} />
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                {/* Personal Information Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-brand-50 p-2 rounded-lg text-brand-600">
                             <User size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                            <p className="text-base font-bold text-gray-900">{userName}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Account ID</label>
                            <p className="text-base font-bold text-gray-900">{user?.id?.slice(0, 8).toUpperCase() || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Specialty</label>
                            <p className="text-base font-bold text-gray-900">{userSpecialty}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Role</label>
                            <p className="text-base font-bold text-gray-900 capitalize">{userRole}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <Mail size={16} className="text-gray-400" />
                                {userEmail}
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</label>
                             <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <Phone size={16} className="text-gray-400" />
                                {userPhone}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full h-px bg-gray-100 mb-8"></div>

                {/* Account Details Section */}
                <div className="mb-8">
                     <div className="flex items-center gap-3 mb-4">
                         <div className="bg-brand-50 p-2 rounded-lg text-brand-600">
                             <BookOpen size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Account Details</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Plan</label>
                            <p className="text-base font-bold text-gray-900 capitalize">{userPlan} Plan</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Member Since</label>
                            <p className="text-base font-bold text-gray-900">{memberSince}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Subscription Status</label>
                            <p className={`text-base font-bold capitalize ${user?.subscription_status === 'active' ? 'text-green-600' : 'text-gray-900'}`}>
                                {user?.subscription_status || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Verified</label>
                            <p className={`text-base font-bold ${user?.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                                {user?.is_verified ? 'Verified' : 'Pending'}
                            </p>
                        </div>
                    </div>
                </div>

                 <div className="w-full h-px bg-gray-100 mb-8"></div>

                 {/* Security Section */}
                 <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-brand-50 p-2 rounded-lg text-brand-600">
                             <Award size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Security</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Password</h4>
                                <p className="text-xs text-gray-500">Last changed: Unknown</p>
                            </div>
                            <button
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors"
                            >
                                Change Password
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900">Two-Factor Authentication</h4>
                                <p className="text-xs text-gray-500">Add extra security to your account</p>
                            </div>
                            <span className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-full text-xs font-bold">
                                Not Enabled
                            </span>
                        </div>
                    </div>
                 </div>
            </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-8">
            {/* Profile Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="relative inline-block mb-4">
                    {user?.profile_photo ? (
                        <img
                            src={user.profile_photo}
                            alt={userName}
                            className="w-32 h-32 rounded-full border-4 border-gray-50 shadow-md object-cover"
                        />
                    ) : (
                        <div className="w-32 h-32 rounded-full border-4 border-gray-50 shadow-md bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-4xl">
                            {userInitial}
                        </div>
                    )}
                    <div className={`absolute bottom-1 right-1 ${user?.is_verified ? 'bg-green-500' : 'bg-yellow-500'} text-white p-1.5 rounded-full border-4 border-white`}>
                        <CheckCircle2 size={16} />
                    </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{userName}</h2>
                <p className="text-brand-600 font-medium text-sm mb-1 capitalize">{userRole}</p>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">{userSpecialty}</p>

                <div className="mt-8 space-y-2">
                    <button
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium text-gray-700 group"
                    >
                        <div className="flex items-center gap-3">
                            <Lock size={18} className="text-gray-400 group-hover:text-gray-600" />
                            Change Password
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium text-gray-700 group">
                        <div className="flex items-center gap-3">
                            <Bell size={18} className="text-gray-400 group-hover:text-gray-600" />
                            Notification Preferences
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium text-gray-700 group">
                        <div className="flex items-center gap-3">
                            <Clock size={18} className="text-gray-400 group-hover:text-gray-600" />
                            Availability Settings
                        </div>
                        <ChevronRight size={16} className="text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Profile Completeness */}
            <div className="bg-brand-50/50 rounded-3xl border border-brand-100 p-6">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="text-sm font-bold text-brand-900">Profile Completeness</h3>
                    <span className="text-sm font-bold text-brand-600">{profileCompleteness}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-2.5 mb-3 border border-brand-100">
                    <div
                        className="bg-brand-500 h-2.5 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.3)] transition-all"
                        style={{ width: `${profileCompleteness}%` }}
                    ></div>
                </div>
                <p className="text-xs text-brand-600/80 font-medium text-center">
                    {profileCompleteness < 100 ? 'Complete your profile to unlock all features' : 'Your profile is complete!'}
                </p>
            </div>
        </div>
      </div>

      {/* Activity History */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <div>
                <h3 className="text-lg font-bold text-gray-900">Activity History</h3>
                <p className="text-sm text-gray-500">Recent actions and consultations performed.</p>
             </div>
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search activity..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20 placeholder-gray-400"
                />
             </div>
        </div>

        <div>
            <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex text-xs font-bold text-gray-400 uppercase tracking-wider">
                <div className="w-1/3 pl-4">Activity Type</div>
                <div className="w-1/4">Related Patient</div>
                <div className="w-1/4">Date & Time</div>
                <div className="w-1/6">Status</div>
            </div>

            <ActivityItem
                type="Consultation Report"
                patient="John Doe"
                date="Oct 24, 2024 - 10:30 AM"
                status="Completed"
                icon={FileText}
                bgColor="bg-blue-50"
                iconColor="text-blue-600"
            />
            <ActivityItem
                type="Prescription Update"
                patient="Sarah Williams"
                date="Oct 23, 2024 - 04:15 PM"
                status="Pending Review"
                icon={Activity}
                bgColor="bg-orange-50"
                iconColor="text-orange-600"
            />
            <ActivityItem
                type="Lab Results Analysis"
                patient="Michael Johnson"
                date="Oct 23, 2024 - 02:00 PM"
                status="Completed"
                icon={Activity}
                bgColor="bg-purple-50"
                iconColor="text-purple-600"
            />
             <ActivityItem
                type="Department Meeting"
                patient={null}
                date="Oct 22, 2024 - 09:00 AM"
                status="Archived"
                icon={Users}
                bgColor="bg-blue-50"
                iconColor="text-blue-600"
            />
        </div>

        <div className="p-4 border-t border-gray-50 text-center">
            <button className="text-brand-600 text-sm font-bold hover:text-brand-700">View Full Activity Log</button>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

export default ProfilePage;
