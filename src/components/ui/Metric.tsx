"use client";

import { motion } from "motion/react";

export function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[12px] border border-line bg-white px-4 py-3.5"
    >
      <div className="text-[11px] font-medium text-faint">{label}</div>
      <div className="mt-1.5 text-[26px] font-semibold tracking-[-0.03em] text-ink">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted">{hint}</div> : null}
    </motion.div>
  );
}
