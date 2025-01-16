export const LargeTextInput = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  disabled,
}) => {
  return (
    <fieldset className="large-text-input">
      <label htmlFor={id} className="cursor-pointer">
        {label}
      </label>
      <div className="border-2 border-stone-800">
        <textarea
          id={id}
          placeholder={placeholder}
          onChange={onChange}
          value={value}
          disabled={disabled}
          className="w-full p-2 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
          rows={3}
        />
      </div>
    </fieldset>
  );
};
