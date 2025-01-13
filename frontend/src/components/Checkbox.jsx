export const Checkbox = ({ label, checked, onChange, disabled }) => {
  return (
    <fieldset className="mt-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <label className="ml-1 inline-block">{label}</label>
    </fieldset>
  );
};
