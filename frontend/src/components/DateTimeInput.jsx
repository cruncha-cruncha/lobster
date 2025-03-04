import { parse, format, add } from "date-fns";

export const DateTimeInput = ({ id, label, value, onChange, disabled }) => {
  return (
    <fieldset className="w-full">
      <label htmlFor={id} className="cursor-pointer">
        {label}
      </label>
      <div className="border-2 border-stone-800">
        <input
          id={id}
          type="datetime-local"
          onChange={onChange}
          value={value}
          disabled={disabled}
          className="w-full px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
        />
      </div>
    </fieldset>
  );
};

export const formatDateForInput = (dateStr) => {
  if (!dateStr) return "";
  const date = parse(dateStr, "yyyy-MM-dd HH:mm:ss.SSSSSS XXXXX", new Date());
  if (!date) return "";

  const localMinutesOffset = new Date().getTimezoneOffset();
  const minutesOffset = date.getTimezoneOffset();
  const diff = minutesOffset - localMinutesOffset;

  add(date, { minutes: diff });
  return format(date, "yyyy-MM-dd'T'HH:mm");
};

export const formatDateForBackend = (dateStr) => {
  if (!dateStr) return "";
  const date = parse(dateStr, "yyyy-MM-dd'T'HH:mm", new Date());
  if (!date) return "";

  return format(date, "yyyy-MM-dd HH:mm:ss.SSSSSS XXXXX");
};
