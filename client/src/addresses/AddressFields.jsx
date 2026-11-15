import FormField from '../components/FormField.jsx';

export default function AddressFields({ values, errors = {}, onChange, showDefault = true, autoFocus = false }) {
  return (
    <>
      <FormField label="Nazwa" name="label" placeholder="np. Mieszkanie Warszawa" autoFocus={autoFocus}
        value={values.label} onChange={onChange} error={errors.label} />
      <div className="form-row">
        <FormField label="Ulica" name="street" placeholder="np. Marszałkowska 10/5"
          value={values.street} onChange={onChange} />
        <FormField label="Miasto" name="city" placeholder="np. Warszawa"
          value={values.city} onChange={onChange} />
      </div>
      {showDefault && (
        <label className="checkbox">
          <input type="checkbox" name="isDefault" checked={values.isDefault} onChange={onChange} />
          Ustaw jako adres domyślny
        </label>
      )}
    </>
  );
}
