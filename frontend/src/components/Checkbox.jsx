export const Checkbox = ({ label, checked, onChange, disabled }) => {
  return (
    <div>
      <label>{label}</label>
      <div className="border-2 border-stone-800">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="w-full px-2 py-1"
        />
      </div>
    </div>
  );
};
