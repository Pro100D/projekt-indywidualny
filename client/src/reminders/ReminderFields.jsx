import FormField from '../components/FormField.jsx';
import { REMINDER_TYPES } from './format.js';

export default function ReminderFields({ values, errors = {}, onChange, autoFocus = false }) {
  return (
    <div className="reminder-fields">
      <FormField label="O czym przypomnieć" name="title" placeholder="np. Wymiana filtra" autoFocus={autoFocus}
        maxLength={120} value={values.title} onChange={onChange} error={errors.title} />
      <FormField label="Typ" name="type" as="select" value={values.type} onChange={onChange} error={errors.type}>
        {REMINDER_TYPES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </FormField>
      <FormField label="Termin" name="dueDate" type="date" value={values.dueDate} onChange={onChange} error={errors.dueDate} />
    </div>
  );
}
