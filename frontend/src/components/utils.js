import { parse, format, add } from "date-fns";

export const eqSet = (xs, ys) =>
  xs.size === ys.size && [...xs].every((x) => ys.has(x));

export const formatDateTime = (dateStr) => {
  if (!dateStr) return "";
  const date = parse(dateStr, "yyyy-MM-dd HH:mm:ss.SSSSSS XXXXX", new Date());
  if (!date) return "";

  return format(date, "MM-dd HH:mm");
}
