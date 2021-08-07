export const sortNumberAscending = (a, b) => a - b;
export const sortNumberDescending = (a, b) => b - a;
export const sortStringAscending = (a, b) => a.localeCompare(b);
export const sortStringDescending = (a, b) => b.localeCompare(a);
export const operatorFunctions = {
  "=": (val1, val2) => val1 === val2,
  ">": (val1, val2) => val1 > val2,
  "<": (val1, val2) => val1 < val2,
  ">=": (val1, val2) => val1 >= val2,
  "<=": (val1, val2) => val1 <= val2,
  "!=": (val1, val2) => val1 != val2,
};