import { type ReactNode, useEffect } from "react";
import { TopNav } from "./TopNav";
import { useSessionStore } from "../../store/sessionStore";
import { useAIPrefsStore } from "../../store/aiPrefsStore";

interface AppShellProps {
  children: ReactNode;
  /** When true, removes the pt-16 offset (e.g. the Reviewer Console is full-screen) */
  fullScreen?: boolean;
}

export function AppShell({ children, fullScreen = false }: AppShellProps) {
  const userId = useSessionStore((s) => s.userId);
  const loadForUser = useAIPrefsStore((s) => s.loadForUser);

  useEffect(() => {
    loadForUser(userId);
  }, [userId, loadForUser]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface">
      <TopNav />
      <main className={`flex-1 overflow-hidden ${fullScreen ? "" : "pt-16"}`}>
        {children}
      </main>
    </div>
  );
}
