import { parse, format, add } from "date-fns";

export const eqSet = (xs, ys) =>
  xs.size === ys.size && [...xs].every((x) => ys.has(x));

export const formatDateTime = (dateStr) => {
  if (!dateStr) return "";
  const date = parse(dateStr, "yyyy-MM-dd HH:mm:ss.SSSSSS XXXXX", new Date());
  if (!date) return "";

  return format(date, "MM-dd HH:mm");
}

export const formatOxfordComma = (arr) => {
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return arr.join(" and ");
  return `${arr.slice(0, -1).join(", ")}, and ${arr.slice(-1)}`;
}
