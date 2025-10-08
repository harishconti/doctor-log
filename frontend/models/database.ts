import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { mySchema } from './schema';
import migrations from './migrations';
import Patient from './Patient';
import PatientNote from './PatientNote';

const adapter = new SQLiteAdapter({
  schema: mySchema,
  migrations,
  jsi: true,
  onSetUpError: (error) => {
    console.error('Failed to load database', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Patient, PatientNote],
});