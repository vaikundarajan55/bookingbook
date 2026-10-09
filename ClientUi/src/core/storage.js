export const readJSON = (key) => {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
};
export const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));
