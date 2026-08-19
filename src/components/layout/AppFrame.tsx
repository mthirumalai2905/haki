"use client";

import { Component, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { ShellContext } from "./shell-context";

export { useSearchPalette, useShell } from "./shell-context";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(true);
  const pathname = usePathname();

  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <ShellContext.Provider
      value={{
        openSearch: () => setOpen(true),
        navOpen,
        toggleNav: () => setNavOpen((value) => !value),
      }}
    >
      <div
        className="flex h-screen items-center justify-center bg-cover bg-center p-3"
        style={{ backgroundImage: "url(/haki-landscape.png)" }}
      >
        <div className="mac-window flex h-full w-full overflow-hidden rounded-[12px] bg-white">
          {navOpen ? <Sidebar /> : null}
          <div className="relative z-0 flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
            <PageGuard>{children}</PageGuard>
          </div>
        </div>
      </div>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </ShellContext.Provider>
  );
}

class PageGuard extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prev: { children: ReactNode }) {
    if (prev.children !== this.props.children && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted">
          This page hit a snag. Use the left nav to move to another screen.
        </div>
      );
    }
    return this.props.children;
  }
}
