"use client";

import { createContext, useContext } from "react";

export const ShellContext = createContext<{
  openSearch: () => void;
  navOpen: boolean;
  toggleNav: () => void;
}>({
  openSearch: () => undefined,
  navOpen: true,
  toggleNav: () => undefined,
});

export function useShell() {
  return useContext(ShellContext);
}

export function useSearchPalette() {
  return useContext(ShellContext);
}
