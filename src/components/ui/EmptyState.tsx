"use client";

import { motion } from "motion/react";
import { Button } from "./Button";

export function EmptyState({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-start gap-3 rounded-[14px] border border-line bg-white px-6 py-10"
    >
      <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-ink">{title}</h3>
      <p className="max-w-md text-[13px] leading-6 text-muted">{body}</p>
      {action && onAction ? <Button onClick={onAction}>{action}</Button> : null}
    </motion.div>
  );
}
