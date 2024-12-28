// expects each option to have an 'id' and 'name' property
export const Select = ({ label, options, value, onChange, disabled }) => {
  return (
    <div>
      <label>{label}</label>
      <div className="border-y-2 border-stone-800">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full px-2 py-1"
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
