export const LargeTextInput = ({
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
        <textarea
          placeholder={placeholder}
          onChange={onChange}
          value={value}
          disabled={disabled}
          className="w-full p-2 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
          rows={3}
        />
      </div>
    </div>
  );
};
