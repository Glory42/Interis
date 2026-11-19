// Tiny pub/sub so hooks (outside the React tree's render) can raise a toast
// that the single <Toaster /> mounted in the root layout renders.

export type ToastTone = "default" | "error" | "success";
export type ToastMessage = { id: number; message: string; tone: ToastTone };

type Listener = (toast: ToastMessage) => void;

const listeners = new Set<Listener>();
let nextId = 1;

export const showToast = (message: string, tone: ToastTone = "error"): void => {
  const toast = { id: nextId++, message, tone };
  listeners.forEach((listener) => listener(toast));
};

export const subscribeToToasts = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
