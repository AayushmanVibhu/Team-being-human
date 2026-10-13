const prefix = "kinlii:";
export const storageService = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(prefix + key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(prefix + key, JSON.stringify(value));
    } catch {
      /* private browsing fallback stays in React state */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(prefix + key);
    } catch {}
  },
};
