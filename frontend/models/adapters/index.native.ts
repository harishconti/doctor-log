import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { mySchema } from '../schema';
import migrations from '../migrations';

const adapter = new SQLiteAdapter({
  schema: mySchema,
  migrations,
  jsi: true,
  onSetUpError: (error) => {
    console.error('Failed to load database', error);
  },
});

export default adapter;