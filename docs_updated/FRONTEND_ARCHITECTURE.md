# HealLog v2.0 - Frontend Architecture

**Version:** 2.0
**Last Updated:** January 2026

---

## 1. Overview

HealLog v2.0 has two frontend applications:

1. **Web Dashboard** - React/Vite application for admin, finance, doctor, and receptionist roles
2. **Mobile PWA** - Expo/React Native application for field staff (nurses, attendants)

---

## 2. Web Dashboard Architecture

### 2.1 Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18+ | UI framework |
| Vite | 5+ | Build tool and dev server |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 3+ | Utility-first CSS |
| Zustand | 4+ | Global state management |
| TanStack Query | 5+ | Server state / API caching |
| React Router | 6+ | Client-side routing |
| Recharts | 2+ | Data visualization |
| react-hot-toast | 2+ | Toast notifications |
| Axios | 1+ | HTTP client |
| react-hook-form | 7+ | Form management |
| Zod | 3+ | Schema validation |

### 2.2 Directory Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   └── manifest.json
│
├── src/
│   ├── pages/                    # Route-based pages
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx     # Admin overview
│   │   │   ├── StaffDirectory.tsx
│   │   │   ├── RosterCalendar.tsx
│   │   │   ├── PatientList.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   └── Settings.tsx
│   │   │
│   │   ├── finance/
│   │   │   ├── Dashboard.tsx     # Financial overview
│   │   │   ├── Invoices.tsx
│   │   │   ├── Payments.tsx
│   │   │   ├── Payroll.tsx
│   │   │   └── Reports.tsx
│   │   │
│   │   ├── doctor/
│   │   │   ├── Dashboard.tsx     # Clinical overview
│   │   │   ├── PatientDetails.tsx
│   │   │   ├── ClinicalNotes.tsx
│   │   │   ├── Prescriptions.tsx
│   │   │   └── CarePlans.tsx
│   │   │
│   │   ├── receptionist/
│   │   │   ├── Dashboard.tsx     # Scheduling overview
│   │   │   ├── BookAppointment.tsx
│   │   │   └── PatientComm.tsx
│   │   │
│   │   └── auth/
│   │       ├── Login.tsx
│   │       ├── ForgotPassword.tsx
│   │       └── OTPVerify.tsx
│   │
│   ├── components/               # Reusable components
│   │   ├── common/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   │
│   │   ├── forms/
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── TimePicker.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── PatientForm.tsx
│   │   │   ├── StaffForm.tsx
│   │   │   ├── RosterForm.tsx
│   │   │   ├── BillingForm.tsx
│   │   │   └── ClinicalForm.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── MetricCard.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── StaffUtilization.tsx
│   │   │   ├── AttendanceSummary.tsx
│   │   │   └── AlertsList.tsx
│   │   │
│   │   ├── roster/
│   │   │   ├── RosterCalendar.tsx
│   │   │   ├── ShiftModal.tsx
│   │   │   ├── StaffAvailability.tsx
│   │   │   └── DragDropShift.tsx
│   │   │
│   │   ├── patient/
│   │   │   ├── PatientCard.tsx
│   │   │   ├── PatientSearch.tsx
│   │   │   ├── VisitHistory.tsx
│   │   │   └── DocumentUpload.tsx
│   │   │
│   │   └── billing/
│   │       ├── InvoiceTable.tsx
│   │       ├── InvoicePreview.tsx
│   │       └── PaymentStatus.tsx
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── usePatients.ts
│   │   ├── useStaff.ts
│   │   ├── useRosters.ts
│   │   ├── useVisits.ts
│   │   ├── useBilling.ts
│   │   ├── usePayroll.ts
│   │   ├── useAnalytics.ts
│   │   └── useDebounce.ts
│   │
│   ├── services/                 # API services
│   │   ├── api.ts                # Axios instance
│   │   ├── authService.ts
│   │   ├── patientService.ts
│   │   ├── staffService.ts
│   │   ├── rosterService.ts
│   │   ├── visitService.ts
│   │   ├── billingService.ts
│   │   ├── payrollService.ts
│   │   └── analyticsService.ts
│   │
│   ├── store/                    # Zustand stores
│   │   ├── authStore.ts
│   │   ├── tenantStore.ts
│   │   ├── uiStore.ts
│   │   └── notificationStore.ts
│   │
│   ├── types/                    # TypeScript types
│   │   ├── api.ts
│   │   ├── domain.ts
│   │   ├── ui.ts
│   │   └── forms.ts
│   │
│   ├── utils/                    # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   │
│   ├── layouts/                  # Layout components
│   │   ├── MainLayout.tsx
│   │   ├── AuthLayout.tsx
│   │   └── DashboardLayout.tsx
│   │
│   ├── routes/                   # Route configuration
│   │   ├── index.tsx
│   │   ├── adminRoutes.tsx
│   │   ├── financeRoutes.tsx
│   │   ├── doctorRoutes.tsx
│   │   └── receptionistRoutes.tsx
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── .env.example
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 2.3 State Management

#### Global State (Zustand)

```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      tenantId: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await authService.login(email, password);
        set({
          user: response.user,
          token: response.access_token,
          tenantId: response.user.tenant_id,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          tenantId: null,
          isAuthenticated: false,
        });
      },

      refreshToken: async () => {
        const newToken = await authService.refresh();
        set({ token: newToken });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        tenantId: state.tenantId,
      }),
    }
  )
);
```

#### Server State (TanStack Query)

```typescript
// hooks/usePatients.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '../services/patientService';

export const usePatients = (filters?: PatientFilters) => {
  return useQuery({
    queryKey: ['patients', filters],
    queryFn: () => patientService.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};
```

### 2.4 Routing Structure

```typescript
// routes/index.tsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'staff', element: <StaffDirectory /> },
      { path: 'patients', element: <PatientList /> },
      { path: 'rosters', element: <RosterCalendar /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  {
    path: '/finance',
    element: <ProtectedRoute allowedRoles={['admin', 'finance']}><DashboardLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <FinanceDashboard /> },
      { path: 'invoices', element: <Invoices /> },
      { path: 'payroll', element: <Payroll /> },
    ],
  },
  // ... other role routes
]);
```

---

## 3. Mobile PWA Architecture

### 3.1 Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.73+ | Cross-platform mobile |
| Expo | 50+ | Development platform |
| Expo Router | 3+ | File-based routing |
| WatermelonDB | 0.28+ | Offline-first database |
| Redux Toolkit | 2+ | State management |
| expo-location | 16+ | GPS/location services |
| expo-camera | 14+ | Photo capture |
| react-native-maps | 1+ | Map navigation |
| Axios | 1+ | HTTP client |

### 3.2 Directory Structure

```
mobile/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout
│   ├── index.tsx                 # Entry redirect
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── otp-verify.tsx
│   │
│   └── (main)/
│       ├── _layout.tsx
│       ├── index.tsx             # Dashboard/Today's shifts
│       ├── schedule.tsx          # Weekly schedule
│       ├── shift/
│       │   ├── [id].tsx          # Shift detail
│       │   └── checkin.tsx
│       ├── payroll.tsx           # Personal payroll
│       └── profile.tsx           # User profile
│
├── src/
│   ├── components/
│   │   ├── ShiftCard.tsx
│   │   ├── CheckInButton.tsx
│   │   ├── TaskCheckbox.tsx
│   │   ├── GPSMap.tsx
│   │   ├── SyncStatus.tsx
│   │   ├── PhotoCapture.tsx
│   │   └── OfflineIndicator.tsx
│   │
│   ├── services/
│   │   ├── api.ts                # API client
│   │   ├── watermelonDB.ts       # Database setup
│   │   ├── sync.ts               # Sync engine
│   │   ├── geolocation.ts        # GPS services
│   │   └── notifications.ts      # Push notifications
│   │
│   ├── models/                   # WatermelonDB models
│   │   ├── schema.ts
│   │   ├── Roster.ts
│   │   ├── Visit.ts
│   │   ├── Task.ts
│   │   └── Patient.ts
│   │
│   ├── store/                    # Redux store
│   │   ├── index.ts
│   │   ├── authSlice.ts
│   │   ├── syncSlice.ts
│   │   └── uiSlice.ts
│   │
│   ├── hooks/
│   │   ├── useDatabase.ts
│   │   ├── useSync.ts
│   │   ├── useLocation.ts
│   │   └── useOffline.ts
│   │
│   ├── utils/
│   │   ├── location.ts           # Haversine, GPS utils
│   │   ├── formatters.ts
│   │   └── constants.ts
│   │
│   └── types/
│       └── index.ts
│
├── assets/
│   ├── images/
│   └── fonts/
│
├── app.json
├── eas.json
├── babel.config.js
└── package.json
```

### 3.3 WatermelonDB Schema

```typescript
// models/schema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'rosters',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'patient_id', type: 'string', isIndexed: true },
        { name: 'patient_name', type: 'string' },
        { name: 'patient_address', type: 'string' },
        { name: 'patient_phone', type: 'string' },
        { name: 'patient_latitude', type: 'number', isOptional: true },
        { name: 'patient_longitude', type: 'number', isOptional: true },
        { name: 'shift_date', type: 'number', isIndexed: true },
        { name: 'shift_start', type: 'string' },
        { name: 'shift_end', type: 'string' },
        { name: 'shift_type', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'synced', type: 'boolean' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'visits',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'roster_id', type: 'string', isIndexed: true },
        { name: 'checkin_time', type: 'number', isOptional: true },
        { name: 'checkin_latitude', type: 'number', isOptional: true },
        { name: 'checkin_longitude', type: 'number', isOptional: true },
        { name: 'checkin_accuracy', type: 'number', isOptional: true },
        { name: 'checkout_time', type: 'number', isOptional: true },
        { name: 'checkout_latitude', type: 'number', isOptional: true },
        { name: 'checkout_longitude', type: 'number', isOptional: true },
        { name: 'visit_notes', type: 'string', isOptional: true },
        { name: 'completion_percentage', type: 'number' },
        { name: 'photo_uris', type: 'string', isOptional: true }, // JSON array
        { name: 'synced', type: 'boolean' },
        { name: 'sync_error', type: 'string', isOptional: true },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'server_id', type: 'string' },
        { name: 'roster_id', type: 'string', isIndexed: true },
        { name: 'description', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'sequence', type: 'number' },
        { name: 'is_completed', type: 'boolean' },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'synced', type: 'boolean' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
```

### 3.4 Sync Service

```typescript
// services/sync.ts
import NetInfo from '@react-native-community/netinfo';
import { database } from './watermelonDB';
import { api } from './api';

class SyncService {
  private isSyncing = false;
  private syncQueue: SyncItem[] = [];

  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) return { status: 'already_syncing' };

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      return { status: 'offline' };
    }

    this.isSyncing = true;

    try {
      // 1. Push local changes
      await this.pushPendingVisits();
      await this.pushPendingTasks();

      // 2. Pull server updates
      await this.pullRosters();

      // 3. Resolve conflicts
      await this.resolveConflicts();

      return { status: 'success' };
    } catch (error) {
      return { status: 'error', error };
    } finally {
      this.isSyncing = false;
    }
  }

  private async pushPendingVisits(): Promise<void> {
    const visits = await database
      .get('visits')
      .query(Q.where('synced', false))
      .fetch();

    if (visits.length === 0) return;

    const payload = visits.map((v) => ({
      local_id: v.id,
      roster_id: v.rosterId,
      checkin_time: v.checkinTime,
      checkin_latitude: v.checkinLatitude,
      checkin_longitude: v.checkinLongitude,
      checkout_time: v.checkoutTime,
      visit_notes: v.visitNotes,
    }));

    const response = await api.post('/v1/visits/batch-sync', { visits: payload });

    // Mark as synced
    await database.write(async () => {
      for (const visit of visits) {
        const serverData = response.data.find(
          (r) => r.local_id === visit.id
        );
        if (serverData) {
          await visit.update((v) => {
            v.serverId = serverData.id;
            v.synced = true;
          });
        }
      }
    });
  }

  private async pullRosters(): Promise<void> {
    const lastSync = await this.getLastSyncTime();
    const response = await api.get('/v1/rosters/sync', {
      params: { since: lastSync },
    });

    await database.write(async () => {
      for (const roster of response.data) {
        const existing = await database
          .get('rosters')
          .query(Q.where('server_id', roster.id))
          .fetch();

        if (existing.length > 0) {
          await existing[0].update((r) => {
            Object.assign(r, this.mapRosterFromServer(roster));
          });
        } else {
          await database.get('rosters').create((r) => {
            Object.assign(r, this.mapRosterFromServer(roster));
          });
        }
      }
    });

    await this.setLastSyncTime(new Date().toISOString());
  }
}

export const syncService = new SyncService();
```

### 3.5 GPS Check-In Flow

```typescript
// app/(main)/shift/checkin.tsx
import * as Location from 'expo-location';
import { database } from '@/services/watermelonDB';
import { haversineDistance } from '@/utils/location';

export default function CheckInScreen() {
  const { rosterId } = useLocalSearchParams();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckIn = async () => {
    setIsLoading(true);

    try {
      // 1. Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is required');
        return;
      }

      // 2. Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);

      // 3. Get roster and patient location
      const roster = await database.get('rosters').find(rosterId);
      const distance = haversineDistance(
        {
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
        },
        {
          lat: roster.patientLatitude,
          lng: roster.patientLongitude,
        }
      );

      // 4. Create visit record
      await database.write(async () => {
        await database.get('visits').create((visit) => {
          visit.rosterId = rosterId;
          visit.checkinTime = Date.now();
          visit.checkinLatitude = currentLocation.coords.latitude;
          visit.checkinLongitude = currentLocation.coords.longitude;
          visit.checkinAccuracy = currentLocation.coords.accuracy;
          visit.synced = false;
          visit.updatedAt = Date.now();
        });
      });

      // 5. Show success
      Alert.alert(
        'Checked In',
        `Distance from patient: ${distance.toFixed(2)} km`
      );

      router.replace(`/shift/${rosterId}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to check in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm Check-In</Text>
      <Text style={styles.subtitle}>
        GPS will capture your location
      </Text>

      {location && (
        <View style={styles.locationInfo}>
          <Text>Accuracy: {location.coords.accuracy?.toFixed(0)}m</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.checkInButton}
        onPress={handleCheckIn}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Checking In...' : 'Confirm Check-In'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 4. UI Component Library

### 4.1 Design Tokens

```typescript
// utils/designTokens.ts
export const colors = {
  primary: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
  },
  secondary: {
    500: '#2196F3',
    600: '#1E88E5',
  },
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    500: '#9E9E9E',
    700: '#616161',
    900: '#212121',
  },
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '600', lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  small: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
};
```

### 4.2 Common Components

```typescript
// components/common/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onPress?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  onPress,
}) => {
  const baseClasses = 'rounded-lg font-medium transition-colors';

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      disabled={disabled || loading}
      onClick={onPress}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
};
```

---

## 5. Performance Optimization

### 5.1 Code Splitting

```typescript
// Lazy load pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const Invoices = lazy(() => import('./pages/finance/Invoices'));
const RosterCalendar = lazy(() => import('./pages/admin/RosterCalendar'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <AdminDashboard />
</Suspense>
```

### 5.2 Memoization

```typescript
// Memoize expensive components
const StaffList = memo(({ staff, onSelect }: StaffListProps) => {
  return (
    <div>
      {staff.map((s) => (
        <StaffCard key={s.id} staff={s} onSelect={onSelect} />
      ))}
    </div>
  );
});

// Memoize callbacks
const handleSelect = useCallback((staffId: string) => {
  setSelectedStaff(staffId);
}, []);
```

### 5.3 Virtual Lists

```typescript
// For large lists
import { FixedSizeList } from 'react-window';

const PatientList = ({ patients }) => (
  <FixedSizeList
    height={600}
    itemCount={patients.length}
    itemSize={80}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        <PatientCard patient={patients[index]} />
      </div>
    )}
  </FixedSizeList>
);
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

```typescript
// components/__tests__/Button.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeInTheDocument();
  });

  it('calls onPress when clicked', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button onPress={onPress}>Click</Button>
    );
    fireEvent.click(getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });

  it('shows spinner when loading', () => {
    const { getByTestId } = render(
      <Button loading>Loading</Button>
    );
    expect(getByTestId('spinner')).toBeInTheDocument();
  });
});
```

### 6.2 Integration Tests

```typescript
// services/__tests__/patientService.test.ts
import { patientService } from '../patientService';
import { server } from '@/mocks/server';

describe('patientService', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches patients', async () => {
    const patients = await patientService.list();
    expect(patients).toHaveLength(10);
    expect(patients[0]).toHaveProperty('id');
  });

  it('creates patient', async () => {
    const newPatient = await patientService.create({
      first_name: 'Test',
      last_name: 'Patient',
      phone: '+919876543210',
    });
    expect(newPatient.id).toBeDefined();
  });
});
```

---

## 7. Build & Deployment

### 7.1 Web Dashboard

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 7.2 Mobile App

```bash
# Development
npx expo start

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## 8. Related Documentation

- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
- [Offline Sync Strategy](./OFFLINE_SYNC_STRATEGY.md)
- [API Reference](./API_REFERENCE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
