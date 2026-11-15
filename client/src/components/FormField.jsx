export default function FormField({ label, name, error, as = 'input', hint, children, ...inputProps }) {
  const Control = as;
  return (
    <label className="field">
      <span>{label}</span>
      <Control name={name} aria-invalid={Boolean(error)} {...inputProps}>
        {children}
      </Control>
      {hint && !error && <small className="field-hint">{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
