export const Checkbox = ({ id, label, checked, onChange, disabled }) => {
  return (
    <fieldset className="checkbox mt-1">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <label htmlFor={id} className="ml-1 inline-block cursor-pointer">
        {label}
      </label>
    </fieldset>
  );
};
