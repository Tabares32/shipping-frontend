export const createStorage = (key, defaultValue) => {
  const storedValue = // disabled storage call
  if (storedValue === null) {
    // disabled storage call);
    return defaultValue;
  }
  return JSON.parse(storedValue);
};

export const getStorage = (key) => {
  const storedValue = // disabled storage call
  return storedValue ? JSON.parse(storedValue) : null;
};

export const setStorage = (key, value) => {
  // disabled storage call);
};