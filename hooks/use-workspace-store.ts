import { create } from "zustand";

export interface Workspace {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkspaceStore {
  workspaces: Workspace[];
  credits: number | null;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCredits: (credits: number | null) => void;
  fetchCredits: () => Promise<void>;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaces: [],
  credits: null,
  setWorkspaces: (workspaces) => set({ workspaces }),
  setCredits: (credits) => set({ credits }),
  fetchCredits: async () => {
    try {
      const response = await fetch("/api/user/credits");
      const data = await response.json();
      if (data.credits !== undefined) {
        set({ credits: data.credits });
      }
    } catch (error) {
      console.error("Failed to fetch credits", error);
    }
  },
  addWorkspace: (workspace) =>
    set((state) => ({ workspaces: [workspace, ...state.workspaces] })),
  updateWorkspace: (id, updates) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    })),
  deleteWorkspace: (id) =>
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
    })),
}));
