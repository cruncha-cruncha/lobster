export const DateTimeInput = ({ label, value, onChange, disabled }) => {
  return (
    <div>
      <label>{label}</label>
      <div className="border-2 border-stone-800">
        <input
          type="datetime-local"
          onChange={onChange}
          value={value}
          disabled={disabled}
          className="w-full px-2 py-1 ring-sky-500 transition-shadow focus-visible:outline-none focus-visible:ring-2"
        />
      </div>
    </div>
  );
};

export const formatDateForInput = (dateStr) => {
  if (!dateStr) return "";
  const data = RegExp(
    /(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}):\d{2}.\d* (?:\+|\-)(\d{2}:\d{2}):\d{2}/,
  ).exec(dateStr);
  if (!data) return "";

  const localMinutesOffset = new Date().getTimezoneOffset();
  const minutesOffset = (() => {
    const sign = data[3].split(":")[0] === "+" ? 1 : -1;
    let [hours, minutes] = data[3].split(":");
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    return sign * (hours * 60 + minutes);
  })();
  const diff = minutesOffset - localMinutesOffset;

  if (diff === 0) return `${data[1]}T${data[2]}`;
  let [hours, minutes] = data[2].split(":");
  hours = (parseInt(hours) + Math.floor(diff / 60)).toString().padStart(2, '0');
  minutes = (parseInt(minutes) + (diff % 60)).toString().padStart(2, '0');
  return `${data[1]}T${hours}:${minutes}`;
};

export const formatDateForBackend = (dateStr) => {
  if (!dateStr) return "st";
  const data = RegExp(/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/).exec(dateStr);
  if (!data) return "bleg";

  const offset = new Date().getTimezoneOffset();
  const sign = offset < 0 ? "+" : "-";
  const hours = Math.abs(Math.floor(offset / 60)).toString().padStart(2, '0');
  const minutes = Math.abs(offset % 60).toString().padStart(2, '0');
  return `${data[1]} ${data[2]}:00.000000 ${sign}${hours}:${minutes}:00`;
};
