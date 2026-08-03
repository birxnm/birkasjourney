/*
 * Toast.jsx — Brief bottom-centre message, shown through the useToast() hook.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const ToastContext = createContext(() => {});

const VISIBLE_MS = 3200;

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const show = useCallback((message, isError = false) => {
    setToast({ message, isError, key: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), VISIBLE_MS);
    return () => clearTimeout(timer.current);
  }, [toast]);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={`toast${toast ? " show" : ""}${toast?.isError ? " error" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast?.message}
      </div>
    </ToastContext.Provider>
  );
}

/** show(message, isError?) — the one way to surface a transient message. */
export function useToast() {
  return useContext(ToastContext);
}
