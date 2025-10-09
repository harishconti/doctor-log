import { Database } from '@nozbe/watermelondb';
import adapter from './adapters';
import Patient from './Patient';
import PatientNote from './PatientNote';

export const database = new Database({
  adapter,
  modelClasses: [Patient, PatientNote],
});