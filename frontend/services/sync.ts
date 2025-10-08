import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../models/database';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export async function sync() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/sync/pull`, {
          params: { last_pulled_at: lastPulledAt },
        });

        if (response.status !== 200) {
          throw new Error(await response.data);
        }

        const { changes, timestamp } = response.data;
        return { changes, timestamp };

      } catch (error) {
        console.error('Sync pull error:', error);
        throw error;
      }
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/sync/push`, { changes }, {
          params: { last_pulled_at: lastPulledAt },
        });

        if (response.status !== 200) {
          throw new Error(await response.data);
        }
      } catch (error) {
        console.error('Sync push error:', error);
        throw error;
      }
    },
    // migrationsEnabledAtUpdated: true,
  });
}