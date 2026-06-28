import { create } from "zustand";
import type { UserRole } from "../api/types";

interface SessionState {
  role: UserRole;
  userId: string;
  displayName: string;
  setRole: (role: UserRole) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  role: "author",
  userId: "user-author-01",
  displayName: "Dr. Sarah Chen",
  setRole: (role) => {
    // Multi-role users: update userId/displayName per role for demo purposes
    const profiles: Record<UserRole, { userId: string; displayName: string }> = {
      author:      { userId: "user-author-01",     displayName: "Dr. Sarah Chen" },
      reviewer:    { userId: "user-reviewer-01",   displayName: "Prof. James Okafor" },
      coordinator: { userId: "user-coordinator-01",displayName: "Mark Davidson" },
    };
    set({ role, ...profiles[role] });
  },
}));
