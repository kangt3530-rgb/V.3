import type { ReactNode } from "react";
import { TopNav } from "./TopNav";

interface AppShellProps {
  children: ReactNode;
  /** When true, removes the pt-16 offset (e.g. the Reviewer Console is full-screen) */
  fullScreen?: boolean;
}

export function AppShell({ children, fullScreen = false }: AppShellProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface">
      <TopNav />
      <main className={`flex-1 overflow-hidden ${fullScreen ? "" : "pt-16"}`}>
        {children}
      </main>
    </div>
  );
}
