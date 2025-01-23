export const TextInput = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  disabled,
  hideText,
}) => {
  return (
    <fieldset className="text-input">
      <label htmlFor={id} className="cursor-pointer">
        {label}
      </label>
      <div className="border-2 border-stone-800">
        <input
          id={id}
          type={!hideText ? "text" : "password"}
          placeholder={placeholder}
          onChange={onChange}
          value={value}
          disabled={disabled}
          className="w-full px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
        />
      </div>
    </fieldset>
  );
};
