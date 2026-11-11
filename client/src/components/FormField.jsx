// Pole formularza z etykietą i komunikatem błędu pod spodem.
export default function FormField({ label, name, error, ...inputProps }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} aria-invalid={Boolean(error)} {...inputProps} />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
