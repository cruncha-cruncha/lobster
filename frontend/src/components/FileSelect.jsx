export const FileSelect = ({ id, label, onChange }) => {
  return (
    <fieldset className="search-select">
      <label htmlFor={id} className="cursor-pointer">
        {label}
      </label>
      <input
        id={id}
        type="file"
        onChange={onChange}
        className="block"
        accept="image/png, image/jpeg"
        multiple
      />
    </fieldset>
  );
};
