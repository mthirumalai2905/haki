"use client";

import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "motion/react";

type Props = HTMLMotionProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: Props) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.12 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[10px] font-medium tracking-[-0.01em] disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" ? "h-8 px-3 text-[13px]" : "h-9 px-3.5 text-[13px]",
        variant === "primary" && "bg-accent text-white shadow-[0_1px_0_rgba(255,255,255,0.25)_inset] hover:brightness-105",
        variant === "secondary" && "border border-line-strong bg-white text-ink hover:bg-[#f5f5f7]",
        variant === "ghost" && "text-muted hover:bg-[#f2f2f7] hover:text-ink",
        variant === "danger" && "bg-bad text-white hover:brightness-105",
        className,
      )}
      {...props}
    />
  );
}
