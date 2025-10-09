import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { mySchema } from '../schema';
import migrations from '../migrations';

const adapter = new LokiJSAdapter({
  schema: mySchema,
  migrations,
  useWebWorker: false,
  useIncrementalIndexedDB: true, // Corrected option
  onSetUpError: (error) => {
    console.error('Failed to load database', error);
  },
});

export default adapter;