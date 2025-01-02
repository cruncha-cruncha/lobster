// expects each option to have an 'id' and 'name' property
export const SearchSelect = ({ label, value, onChange, onSelect, options, disabled }) => {
    return (
      <div>
        <label>{label}</label>
        <div className="border-2 border-stone-800">
          <input
            type="text"
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full px-2 py-1"
          />
          <ul>
            {options.map((option) => (
              <li key={option.id} onClick={() => onSelect(option.id)}>
                {option.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };
  