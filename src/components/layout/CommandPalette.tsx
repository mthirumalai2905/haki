"use client";

import { Command } from "cmdk";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-28 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl"
          >
            <Command className="mac-window overflow-hidden rounded-[14px] bg-white" label="Command palette">
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search Haki..."
                className="h-12 w-full border-b border-line bg-transparent px-4 text-[15px] outline-none placeholder:text-faint"
              />
              <Command.List className="max-h-80 overflow-auto p-2 text-[13px]">
                <Command.Empty className="px-3 py-6 text-muted">No matching actions.</Command.Empty>
                <Command.Group heading="Navigate" className="px-1 py-1 text-[11px] font-medium text-faint">
                  <Item onSelect={() => go("/haki")}>Haki AI</Item>
                  <Item onSelect={() => go("/universal")}>Haki Universal (Beta)</Item>
                  <Item onSelect={() => go("/overview")}>Overview</Item>
                  <Item onSelect={() => go("/sequences")}>Open sequences</Item>
                  <Item onSelect={() => go("/leads")}>Search leads</Item>
                  <Item onSelect={() => go("/leads/import")}>Import leads</Item>
                  <Item onSelect={() => go("/campaigns")}>Search campaigns</Item>
                  <Item onSelect={() => go("/campaigns/new")}>Create campaign</Item>
                  <Item onSelect={() => go("/campaigns")}>Dummy multi-touch campaign</Item>
                  <Item onSelect={() => go("/analytics")}>Open analytics</Item>
                  <Item onSelect={() => go("/settings")}>Settings</Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
          <button
            type="button"
            className="absolute inset-0 -z-10 cursor-default"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Item({
  children,
  onSelect,
}: {
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center rounded-[8px] px-3 py-2 text-ink aria-selected:bg-accent-soft aria-selected:text-accent"
    >
      {children}
    </Command.Item>
  );
}
