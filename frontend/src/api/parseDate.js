import { parseJSON } from "date-fns";

export const parseDate = (dateStr) => {
  const date = parseJSON(dateStr);
  if (isNaN(date)) {
    return null;
  }

  return date;
}