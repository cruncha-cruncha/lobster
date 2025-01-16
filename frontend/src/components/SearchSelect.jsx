import { useState } from "react";

// expects each option to have an 'id' and 'name' property
export const SearchSelect = ({
  id,
  label,
  value,
  onChange,
  onSelect,
  options = [],
  disabled,
  showLastSelected = true,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const [lastSelected, setLastSelected] = useState("");
  return (
    <fieldset className="search-select">
      <label htmlFor={id} className="cursor-pointer">{label}</label>
      <div className="border-2 border-stone-800">
        <input
          id={id}
          type="text"
          value={
            showLastSelected && collapsed && lastSelected ? lastSelected : value
          }
          onChange={onChange}
          onFocus={() => setCollapsed(false)}
          onBlur={() => setCollapsed(true)}
          disabled={disabled}
          className="w-full px-2 py-1"
        />
        <ul className={`${collapsed ? "hidden" : ""}`}>
          {options.map((option) => (
            <li
              key={option.id}
              onMouseDown={() => {
                onSelect(option.id);
                setLastSelected(option.name);
              }}
              className="my-1 cursor-pointer px-2"
            >
              {option.name}
            </li>
          ))}
        </ul>
      </div>
    </fieldset>
  );
};
