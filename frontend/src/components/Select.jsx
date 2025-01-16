// expects each option to have an 'id' and 'name' property
export const Select = ({ id, label, options, value, onChange, disabled }) => {
  return (
    <fieldset className="select">
      <label htmlFor={id} className="cursor-pointer">{label}</label>
      <div className="border-2 border-stone-800">
        <select
          id={id}
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
    </fieldset>
  );
};
