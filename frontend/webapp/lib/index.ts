// API modules for the webapp
// These modules provide typed access to backend endpoints

export { patientsApi } from './patients';
export type {
  GetPatientsParams,
  CreatePatientRequest,
  UpdatePatientRequest,
  CreateNoteRequest,
} from './patients';

export { userApi } from './user';
export type {
  UpdateProfileRequest,
  ChangePasswordRequest,
  UserActivity,
} from './user';

export { analyticsApi } from './analytics';
export type {
  PatientGrowthData,
  NotesActivityData,
  WeeklyActivityData,
  DemographicsData,
  TreatmentData,
} from './analytics';

export { paymentsApi } from './payments';
export type {
  CreateCheckoutSessionRequest,
  CheckoutSessionResponse,
  SubscriptionStatus,
  BillingPortalResponse,
} from './payments';

// Re-export auth API from same directory for convenience
export { authApi } from './auth';
