export const Checkbox = ({ label, checked, onChange, disabled }) => {
  return (
    <div>
      <label>{label}</label>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
};
