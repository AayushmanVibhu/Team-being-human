import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { storageService } from "../services/storageService";

export function usePersistentState<T>(key: string, fallback: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(() => storageService.get(key, fallback));
  useEffect(() => storageService.set(key, state), [key, state]);
  return [state, setState];
}
