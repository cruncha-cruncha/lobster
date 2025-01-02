import { useState } from "react";

// expects each option to have an 'id' and 'name' property
export const SearchSelect = ({
  label,
  value,
  onChange,
  onSelect,
  options,
  disabled,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const [lastSelected, setLastSelected] = useState("");
  return (
    <div>
      <label>{label}</label>
      <div className="border-2 border-stone-800">
        <input
          type="text"
          value={collapsed ? lastSelected : value}
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
    </div>
  );
};
