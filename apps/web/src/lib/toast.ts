import { useSyncExternalStore } from "react";

export type Toast = {
  id: number;
  title: string;
  detail: string | null;
};

const TOAST_DURATION_MS = 6_000;
const MAX_TOASTS = 3;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

const emit = (next: Toast[]): void => {
  toasts = next;
  listeners.forEach((listener) => listener());
};

export const dismissToast = (id: number): void => {
  clearTimeout(timers.get(id));
  timers.delete(id);
  emit(toasts.filter((toast) => toast.id !== id));
};

export const clearToasts = (): void => {
  timers.forEach((timer) => clearTimeout(timer));
  timers.clear();
  emit([]);
};

// The same failure repeated (a user retrying a toggle while the API is down)
// replaces its earlier toast instead of stacking copies of it.
export const showToast = (title: string, detail: string | null = null): void => {
  const repeated = toasts.find((toast) => toast.title === title && toast.detail === detail);
  if (repeated) {
    dismissToast(repeated.id);
  }

  while (toasts.length >= MAX_TOASTS) {
    dismissToast(toasts[0].id);
  }

  const toast: Toast = { id: nextId++, title, detail };
  emit([...toasts, toast]);
  timers.set(
    toast.id,
    setTimeout(() => dismissToast(toast.id), TOAST_DURATION_MS),
  );
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = (): Toast[] => toasts;

export const useToasts = (): Toast[] => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
