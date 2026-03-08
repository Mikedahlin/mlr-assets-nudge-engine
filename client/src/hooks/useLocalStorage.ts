import { Dispatch, SetStateAction, useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    const fallback = typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;

    if (typeof window === "undefined") return fallback;

    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage quota or serialization errors and keep UI usable.
    }
  }, [key, value]);

  return [value, setValue] as [T, Dispatch<SetStateAction<T>>];
}
