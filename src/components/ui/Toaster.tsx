"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastTone = "default" | "good" | "warn" | "bad";

export type ToastAction = {
  label: string;
  tone?: "danger" | "ghost";
  onClick: () => void | Promise<void>;
};

export type ToastInput = {
  title: string;
  body?: string;
  tone?: ToastTone;
  duration?: number;
  actions?: ToastAction[];
};

type ToastItem = ToastInput & { id: string };

const ToastContext = createContext<{
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}>({
  toast: () => "",
  dismiss: () => undefined,
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((current) => [...current.slice(-3), { ...input, id }]);
      return id;
    },
    [],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      <div className="relative h-full w-full min-h-0">
        {children}
        <div className="pointer-events-none absolute bottom-4 right-4 z-50 flex w-[320px] flex-col gap-2">
          <AnimatePresence>
            {items.map((item) => (
              <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const sticky = item.duration === 0 || Boolean(item.actions?.length);

  useEffect(() => {
    if (sticky) return;
    const wait = item.duration ?? 4200;
    const timer = window.setTimeout(onDismiss, wait);
    return () => window.clearTimeout(timer);
  }, [item.duration, onDismiss, sticky]);

  const bar =
    item.tone === "good"
      ? "bg-good"
      : item.tone === "warn"
        ? "bg-warn"
        : item.tone === "bad"
          ? "bg-bad"
          : "bg-accent";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      className="pointer-events-auto overflow-hidden rounded-[14px] border border-line bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
    >
      <div className={cn("h-0.5 w-full", bar)} />
      <div className="flex items-start gap-2 px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium tracking-[-0.02em] text-ink">{item.title}</div>
          {item.body ? <p className="mt-0.5 text-[12px] leading-5 text-muted">{item.body}</p> : null}
          {item.actions?.length ? (
            <div className="mt-2.5 flex justify-end gap-1.5">
              {item.actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => void action.onClick()}
                  className={cn(
                    "h-7 rounded-[8px] px-2.5 text-[12px] font-medium",
                    action.tone === "danger"
                      ? "bg-bad text-white hover:brightness-105"
                      : "bg-[#f2f2f7] text-ink hover:bg-[#e8e8ed]",
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button type="button" onClick={onDismiss} className="rounded-[6px] p-0.5 text-faint hover:bg-[#f2f2f7] hover:text-ink">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
