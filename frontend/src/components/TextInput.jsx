export const TextInput = ({
  label,
  placeholder,
  value,
  onChange,
  disabled,
}) => {
  return (
    <div>
      <label>{label}</label>
      <div className="border-2 border-stone-800">
        <input
          type="text"
          placeholder={placeholder}
          onChange={onChange}
          value={value}
          disabled={disabled}
          className="w-full px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
        />
      </div>
    </div>
  );
};
