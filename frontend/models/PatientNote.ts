import { Model } from '@nozbe/watermelondb';
import { field, text, readonly, date, relation } from '@nozbe/watermelondb/decorators';

export default class PatientNote extends Model {
  static table = 'patient_notes';

  static associations = {
    patients: { type: 'belongs_to', key: 'patient_id' },
  };

  @text('content') content;
  @date('timestamp') timestamp;
  @text('visit_type') visitType;
  @text('created_by') createdBy;

  @relation('patients', 'patient_id') patient;
}