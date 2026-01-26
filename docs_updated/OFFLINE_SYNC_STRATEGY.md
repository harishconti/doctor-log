# HealLog v2.0 - Offline Sync Strategy

**Version:** 2.0
**Last Updated:** January 2026

---

## 1. Overview

HealLog's mobile app is built with an **offline-first architecture** using WatermelonDB. This ensures field staff can work reliably in areas with poor network connectivity.

### Key Principles

1. **Local-first**: All data modifications happen locally first
2. **Background sync**: Automatic synchronization when online
3. **Conflict resolution**: Server timestamp wins for conflicts
4. **Eventual consistency**: Data converges to consistent state

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MOBILE APP                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                     UI LAYER                                 │   │
│   │   (React Native Components)                                  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                               │                                      │
│                               ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                  STATE LAYER (Redux)                         │   │
│   │   • Sync status                                              │   │
│   │   • Pending changes count                                    │   │
│   │   • Network status                                           │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                               │                                      │
│                               ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              WatermelonDB (SQLite)                           │   │
│   │   ┌───────────┐  ┌───────────┐  ┌───────────┐               │   │
│   │   │  Rosters  │  │  Visits   │  │   Tasks   │               │   │
│   │   │           │  │           │  │           │               │   │
│   │   │ • synced  │  │ • synced  │  │ • synced  │               │   │
│   │   │ • pending │  │ • pending │  │ • pending │               │   │
│   │   └───────────┘  └───────────┘  └───────────┘               │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                               │                                      │
│                               ▼                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    SYNC ENGINE                               │   │
│   │   • Push pending changes                                     │   │
│   │   • Pull server updates                                      │   │
│   │   • Resolve conflicts                                        │   │
│   │   • Retry failed syncs                                       │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                               │                                      │
└───────────────────────────────│──────────────────────────────────────┘
                                │
                    ════════════│════════════  (Network Boundary)
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          BACKEND                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   POST /v1/visits/batch-sync    ◄────  Push changes                 │
│   GET  /v1/rosters/sync?since=  ◄────  Pull updates                 │
│   POST /v1/tasks/batch-sync     ◄────  Push task completions        │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    PostgreSQL                                │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow

### 3.1 Write Flow (Offline-First)

```
User Action (Check-In)
        │
        ▼
┌──────────────────┐
│  Write to Local  │
│  WatermelonDB    │
│  synced = false  │
└──────────────────┘
        │
        ▼
┌──────────────────┐
│ Update Redux     │
│ pendingCount++   │
└──────────────────┘
        │
        ▼
┌──────────────────┐     Network?      ┌──────────────────┐
│ Queue for Sync   │ ─────────────────▶│ Trigger Sync     │
│                  │      Yes          │ (if online)      │
└──────────────────┘                   └──────────────────┘
        │                                      │
        │ No                                   ▼
        │                              ┌──────────────────┐
        ▼                              │ POST to Backend  │
┌──────────────────┐                   └──────────────────┘
│ Wait for Network │                           │
│                  │                           ▼
└──────────────────┘                   ┌──────────────────┐
                                       │ Update Local     │
                                       │ synced = true    │
                                       │ server_id = ...  │
                                       └──────────────────┘
```

### 3.2 Read Flow

```
Screen Load
        │
        ▼
┌──────────────────┐
│ Query Local DB   │
│ (WatermelonDB)   │
└──────────────────┘
        │
        ▼
┌──────────────────┐
│ Render UI        │
│ Immediately      │
└──────────────────┘
        │
        ▼
┌──────────────────┐     Online?      ┌──────────────────┐
│ Check Network    │ ────────────────▶│ Background Sync  │
│                  │      Yes         │ Pull Updates     │
└──────────────────┘                  └──────────────────┘
                                              │
                                              ▼
                                      ┌──────────────────┐
                                      │ Merge Updates    │
                                      │ to Local DB      │
                                      └──────────────────┘
                                              │
                                              ▼
                                      ┌──────────────────┐
                                      │ UI Auto-Updates  │
                                      │ (Observable)     │
                                      └──────────────────┘
```

---

## 4. Sync Engine Implementation

### 4.1 Core Sync Service

```typescript
// services/sync.ts
import { Q } from '@nozbe/watermelondb';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from './watermelonDB';
import { api } from './api';

const SYNC_KEYS = {
  LAST_SYNC: '@heallog_last_sync',
  SYNC_VERSION: '@heallog_sync_version',
};

class SyncEngine {
  private isSyncing = false;
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  // Initialize network listener
  init() {
    NetInfo.addEventListener((state) => {
      if (state.isConnected && !this.isSyncing) {
        this.sync();
      }
    });
  }

  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { status: 'in_progress' };
    }

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      return { status: 'offline' };
    }

    this.isSyncing = true;
    this.retryCount = 0;

    try {
      // Step 1: Push local changes
      const pushResult = await this.pushChanges();

      // Step 2: Pull server changes
      const pullResult = await this.pullChanges();

      // Step 3: Clean up synced data
      await this.cleanup();

      return {
        status: 'success',
        pushed: pushResult.count,
        pulled: pullResult.count,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        await this.delay(this.retryDelay * this.retryCount);
        return this.sync();
      }
      return { status: 'error', error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  private async pushChanges(): Promise<{ count: number }> {
    let totalPushed = 0;

    // Push visits
    const pendingVisits = await database
      .get('visits')
      .query(Q.where('synced', false))
      .fetch();

    if (pendingVisits.length > 0) {
      const visitPayload = pendingVisits.map((v) => ({
        local_id: v.id,
        roster_id: v.rosterId,
        checkin_time: v.checkinTime
          ? new Date(v.checkinTime).toISOString()
          : null,
        checkin_latitude: v.checkinLatitude,
        checkin_longitude: v.checkinLongitude,
        checkin_accuracy: v.checkinAccuracy,
        checkout_time: v.checkoutTime
          ? new Date(v.checkoutTime).toISOString()
          : null,
        checkout_latitude: v.checkoutLatitude,
        checkout_longitude: v.checkoutLongitude,
        visit_notes: v.visitNotes,
        completion_percentage: v.completionPercentage,
      }));

      const response = await api.post('/v1/visits/batch-sync', {
        visits: visitPayload,
      });

      await database.write(async () => {
        for (const visit of pendingVisits) {
          const serverData = response.data.results.find(
            (r: any) => r.local_id === visit.id
          );
          if (serverData && serverData.status === 'success') {
            await visit.update((v) => {
              v.serverId = serverData.server_id;
              v.synced = true;
            });
            totalPushed++;
          }
        }
      });
    }

    // Push tasks
    const pendingTasks = await database
      .get('tasks')
      .query(Q.where('synced', false))
      .fetch();

    if (pendingTasks.length > 0) {
      const taskPayload = pendingTasks.map((t) => ({
        local_id: t.id,
        server_id: t.serverId,
        is_completed: t.isCompleted,
        completed_at: t.completedAt
          ? new Date(t.completedAt).toISOString()
          : null,
        notes: t.notes,
      }));

      const response = await api.post('/v1/tasks/batch-sync', {
        tasks: taskPayload,
      });

      await database.write(async () => {
        for (const task of pendingTasks) {
          const result = response.data.results.find(
            (r: any) => r.local_id === task.id
          );
          if (result && result.status === 'success') {
            await task.update((t) => {
              t.synced = true;
            });
            totalPushed++;
          }
        }
      });
    }

    return { count: totalPushed };
  }

  private async pullChanges(): Promise<{ count: number }> {
    const lastSync = await AsyncStorage.getItem(SYNC_KEYS.LAST_SYNC);
    let totalPulled = 0;

    // Pull rosters
    const rostersResponse = await api.get('/v1/rosters/sync', {
      params: {
        since: lastSync || '1970-01-01T00:00:00Z',
        limit: 100,
      },
    });

    await database.write(async () => {
      for (const serverRoster of rostersResponse.data.rosters) {
        const existing = await database
          .get('rosters')
          .query(Q.where('server_id', serverRoster.id))
          .fetch();

        if (existing.length > 0) {
          // Update existing
          await existing[0].update((r) => {
            this.mapServerRosterToLocal(r, serverRoster);
          });
        } else {
          // Create new
          await database.get('rosters').create((r) => {
            r.serverId = serverRoster.id;
            this.mapServerRosterToLocal(r, serverRoster);
          });
        }
        totalPulled++;
      }
    });

    // Update last sync timestamp
    await AsyncStorage.setItem(
      SYNC_KEYS.LAST_SYNC,
      new Date().toISOString()
    );

    return { count: totalPulled };
  }

  private mapServerRosterToLocal(local: any, server: any) {
    local.patientId = server.patient_id;
    local.patientName = server.patient.full_name;
    local.patientAddress = server.patient.address;
    local.patientPhone = server.patient.phone;
    local.patientLatitude = server.patient.home_latitude;
    local.patientLongitude = server.patient.home_longitude;
    local.shiftDate = new Date(server.shift_date).getTime();
    local.shiftStart = server.shift_start;
    local.shiftEnd = server.shift_end;
    local.shiftType = server.shift_type;
    local.status = server.status;
    local.notes = server.notes;
    local.synced = true;
    local.updatedAt = Date.now();
  }

  private async cleanup(): Promise<void> {
    // Remove old rosters (older than 7 days and completed)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    await database.write(async () => {
      const oldRosters = await database
        .get('rosters')
        .query(
          Q.and(
            Q.where('shift_date', Q.lt(sevenDaysAgo)),
            Q.where('status', 'completed'),
            Q.where('synced', true)
          )
        )
        .fetch();

      for (const roster of oldRosters) {
        await roster.markAsDeleted();
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const syncEngine = new SyncEngine();
```

### 4.2 Background Sync

```typescript
// services/backgroundSync.ts
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { syncEngine } from './sync';

const BACKGROUND_SYNC_TASK = 'HEALLOG_BACKGROUND_SYNC';

// Define background task
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const result = await syncEngine.sync();

    if (result.status === 'success') {
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else if (result.status === 'offline') {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    } else {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync() {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 5 * 60, // 5 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background sync registered');
  } catch (error) {
    console.error('Failed to register background sync:', error);
  }
}

export async function unregisterBackgroundSync() {
  await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
}
```

---

## 5. Conflict Resolution

### 5.1 Strategy: Last-Write-Wins (Server Timestamp)

```
Client A                   Server                    Client B
   │                         │                          │
   │  Check-in at 9:05       │                          │
   │  (local_ts: 9:05:00)    │                          │
   │ ─────────────────────►  │                          │
   │                         │  Store (server_ts: 9:05:01)
   │                         │                          │
   │                         │                          │  Edit visit note
   │                         │                          │  (local_ts: 9:05:30)
   │                         │  ◄──────────────────────│
   │                         │  Store (server_ts: 9:05:31)
   │                         │                          │
   │  Edit visit note        │                          │
   │  (local_ts: 9:05:25)    │                          │
   │ ─────────────────────►  │                          │
   │                         │                          │
   │  Conflict detected!     │                          │
   │  Server has newer       │                          │
   │  timestamp (9:05:31)    │                          │
   │                         │                          │
   │  Resolution: Merge      │                          │
   │  Keep server version    │                          │
   │  ◄──────────────────────│                          │
   │                         │                          │
```

### 5.2 Conflict Resolution Rules

```typescript
// utils/conflictResolution.ts
interface ConflictResolutionResult {
  action: 'use_local' | 'use_server' | 'merge';
  data: any;
}

function resolveVisitConflict(
  local: Visit,
  server: Visit
): ConflictResolutionResult {
  // Rule 1: If local has no server_id, it's new - push to server
  if (!local.serverId) {
    return { action: 'use_local', data: local };
  }

  // Rule 2: Compare timestamps
  const localUpdatedAt = local.updatedAt;
  const serverUpdatedAt = new Date(server.updated_at).getTime();

  if (serverUpdatedAt > localUpdatedAt) {
    // Server is newer - use server data
    return { action: 'use_server', data: server };
  }

  // Rule 3: Local is newer or same - merge intelligently
  return {
    action: 'merge',
    data: {
      // Take server's validated data (GPS verification, etc.)
      ...server,
      // But keep local notes if they're newer
      visit_notes:
        localUpdatedAt > serverUpdatedAt
          ? local.visitNotes
          : server.visit_notes,
    },
  };
}

function resolveTaskConflict(
  local: Task,
  server: Task
): ConflictResolutionResult {
  // For tasks: once completed, cannot be uncompleted
  if (local.isCompleted || server.is_completed) {
    return {
      action: 'merge',
      data: {
        ...server,
        is_completed: true,
        completed_at: local.completedAt || server.completed_at,
      },
    };
  }

  // Default: server wins
  return { action: 'use_server', data: server };
}
```

---

## 6. Data Integrity

### 6.1 Checksums

```typescript
// utils/integrity.ts
import { createHash } from 'crypto';

function calculateChecksum(data: any): string {
  const json = JSON.stringify(data, Object.keys(data).sort());
  return createHash('md5').update(json).digest('hex');
}

// Include checksum in sync payload
const visitPayload = {
  local_id: visit.id,
  data: visitData,
  checksum: calculateChecksum(visitData),
};

// Backend validates checksum
if (calculateChecksum(payload.data) !== payload.checksum) {
  throw new Error('Data integrity check failed');
}
```

### 6.2 Transaction Safety

```typescript
// All database operations in transactions
await database.write(async () => {
  // Create visit
  const visit = await database.get('visits').create((v) => {
    v.rosterId = rosterId;
    v.checkinTime = Date.now();
    // ...
  });

  // Update roster status
  const roster = await database.get('rosters').find(rosterId);
  await roster.update((r) => {
    r.status = 'in_progress';
  });

  // If any operation fails, entire transaction rolls back
});
```

---

## 7. Network State Management

### 7.1 Network Monitor Hook

```typescript
// hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
      });
    });

    return () => unsubscribe();
  }, []);

  return status;
}
```

### 7.2 Offline Indicator Component

```typescript
// components/OfflineIndicator.tsx
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSyncStatus } from '@/hooks/useSyncStatus';

export function OfflineIndicator() {
  const { isConnected } = useNetworkStatus();
  const { pendingCount, lastSyncTime, isSyncing } = useSyncStatus();

  if (isConnected && pendingCount === 0) {
    return null; // All synced, hide indicator
  }

  return (
    <View style={styles.container}>
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Icon name="wifi-off" />
          <Text>Offline - Changes will sync when connected</Text>
        </View>
      )}

      {pendingCount > 0 && (
        <View style={styles.pendingBanner}>
          <Icon name="cloud-upload" />
          <Text>
            {isSyncing
              ? 'Syncing...'
              : `${pendingCount} changes pending`}
          </Text>
        </View>
      )}

      {lastSyncTime && (
        <Text style={styles.lastSync}>
          Last synced: {formatRelativeTime(lastSyncTime)}
        </Text>
      )}
    </View>
  );
}
```

---

## 8. Sync Status Store

```typescript
// store/syncSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingVisits: number;
  pendingTasks: number;
  syncError: string | null;
  syncProgress: number; // 0-100
}

const initialState: SyncState = {
  isSyncing: false,
  lastSyncTime: null,
  pendingVisits: 0,
  pendingTasks: 0,
  syncError: null,
  syncProgress: 0,
};

export const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
      if (action.payload) {
        state.syncError = null;
        state.syncProgress = 0;
      }
    },

    setSyncProgress: (state, action: PayloadAction<number>) => {
      state.syncProgress = action.payload;
    },

    syncCompleted: (state) => {
      state.isSyncing = false;
      state.lastSyncTime = new Date().toISOString();
      state.syncProgress = 100;
    },

    syncFailed: (state, action: PayloadAction<string>) => {
      state.isSyncing = false;
      state.syncError = action.payload;
    },

    updatePendingCounts: (
      state,
      action: PayloadAction<{ visits: number; tasks: number }>
    ) => {
      state.pendingVisits = action.payload.visits;
      state.pendingTasks = action.payload.tasks;
    },
  },
});
```

---

## 9. API Endpoints for Sync

### 9.1 Batch Sync Visits

```
POST /v1/visits/batch-sync
```

**Request:**
```json
{
  "visits": [
    {
      "local_id": "uuid-local-1",
      "roster_id": "uuid-server-roster",
      "checkin_time": "2026-01-26T09:05:00Z",
      "checkin_latitude": 12.9716,
      "checkin_longitude": 77.5946,
      "checkin_accuracy": 15.5,
      "checkout_time": "2026-01-26T21:00:00Z",
      "visit_notes": "Patient stable"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "local_id": "uuid-local-1",
      "server_id": "uuid-server-visit",
      "status": "success",
      "validation": {
        "distance_from_home": 0.15,
        "arrival_status": "late",
        "location_verified": true
      }
    }
  ]
}
```

### 9.2 Pull Rosters

```
GET /v1/rosters/sync?since=2026-01-25T00:00:00Z&limit=100
```

**Response:**
```json
{
  "success": true,
  "rosters": [
    {
      "id": "uuid-roster",
      "patient": {
        "id": "uuid-patient",
        "full_name": "Ramesh Patel",
        "address": "123 MG Road",
        "phone": "+919876543210",
        "home_latitude": 12.9716,
        "home_longitude": 77.5946
      },
      "shift_date": "2026-01-26",
      "shift_start": "09:00",
      "shift_end": "21:00",
      "shift_type": "12_hour",
      "status": "scheduled",
      "notes": "Wound care required",
      "care_tasks": [
        {
          "id": "uuid-task-1",
          "description": "Check blood pressure",
          "category": "vitals",
          "sequence": 1
        }
      ],
      "updated_at": "2026-01-25T10:00:00Z"
    }
  ],
  "has_more": false,
  "next_cursor": null
}
```

---

## 10. Best Practices

### 10.1 Battery Optimization

- Use `minimumInterval` of 5+ minutes for background sync
- Batch multiple changes into single API call
- Use efficient queries with proper indexes
- Compress large payloads before sync

### 10.2 Storage Management

- Limit local data to 7 days for completed rosters
- Compress images before storing
- Use `markAsDeleted()` instead of hard delete
- Run cleanup after successful sync

### 10.3 Error Handling

- Retry failed syncs with exponential backoff
- Show clear error messages to users
- Log sync failures for debugging
- Allow manual retry trigger

---

## 11. Related Documentation

- [Frontend Architecture](./FRONTEND_ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)
- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
