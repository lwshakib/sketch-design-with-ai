import { create } from "zustand";
import { type Artifact } from "@/lib/artifact-renderer";

export interface Project {
  id: string;
  title: string;
  messages: any[];
  canvasData?: any;
  themes?: any[];
  shareToken?: string | null;
}

interface ProjectState {
  // Project Info
  projectId: string | null;
  project: Project | null;
  
  // Content State
  artifacts: Artifact[];
  throttledArtifacts: Artifact[];
  attachments: { url: string; isUploading: boolean }[];
  input: string;
  designPlan: { screens: any[], _markdown?: string };
  realtimeStatus: { message: string; status: string; currentScreen?: string; messageId?: string } | null;
  realtimeStatuses: Record<string, { message: string; status: string; currentScreen?: string }>;
  loading: boolean;
  websiteUrl: string | null;
  messages: any[];
  messageParts: any[];

  // Canvas State
  zoom: number;
  canvasOffset: { x: number; y: number };
  framePos: { x: number; y: number };
  dynamicFrameHeights: Record<string, number>;
  artifactPreviewModes: Record<string, 'app' | 'web' | 'tablet' | null>;
  selectedArtifactIds: Set<string>;
  selectionBox: { x1: number; y1: number; x2: number; y2: number } | null;

  // Interaction State
  activeTool: 'select' | 'hand' | 'interact';
  isPanning: boolean;
  isDraggingFrame: boolean;
  isResizing: boolean;
  resizingHandle: string | null;

  // UI State
  leftSidebarMode: 'chat';
  secondarySidebarMode: 'none' | 'properties' | 'theme';
  isCodeViewerOpen: boolean;
  isGenerating: boolean;
  viewingCode: string;
  viewingTitle: string;
  isRegenerateDialogOpen: boolean;
  regenerateInstructions: string;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  isEditTitleDialogOpen: boolean;
  editingTitle: string;
  isDeleteDialogOpen: boolean;
  isExportSheetOpen: boolean;
  exportArtifactIndex: number | null;
  hasCopied: boolean;
  isPlanDialogOpen: boolean;
  viewingPlan: any;
  isPromptDialogOpen: boolean;
  viewingPrompt: string;
  isSidebarVisible: boolean;
  is3xMode: boolean;
  regeneratingArtifactIds: Set<string>;
  isCommandMenuOpen: boolean;
  isSettingsDialogOpen: boolean;
  isShareDialogOpen: boolean;
  isVariationsSheetOpen: boolean;
  variationsArtifactIndex: number | null;
  variationOptions: number;
  variationCreativeRange: 'refine' | 'explore' | 'reimagine';
  variationCustomInstructions: string;
  variationAspects: string[];

  // Theme & Selection
  activeThemeId: string | null;
  appliedTheme: any | null;
  selectedEl: HTMLElement | null;

  // Actions
  setProjectId: (id: string | null) => void;
  setProject: (project: Project | null) => void;
  setArtifacts: (val: Artifact[] | ((prev: Artifact[]) => Artifact[])) => void;
  setThrottledArtifacts: (val: Artifact[] | ((prev: Artifact[]) => Artifact[])) => void;
  setAttachments: (val: { url: string; isUploading: boolean }[] | ((prev: { url: string; isUploading: boolean }[]) => { url: string; isUploading: boolean }[])) => void;
  setInput: (input: string) => void;
  setDesignPlan: (designPlan: { screens: any[], _markdown?: string }) => void;
  setRealtimeStatus: (status: { message: string; status: string; currentScreen?: string; messageId?: string } | null) => void;
  setRealtimeStatuses: (val: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => void;
  setLoading: (loading: boolean) => void;
  setIs3xMode: (mode: boolean) => void;

  setZoom: (val: number | ((prev: number) => number)) => void;
  setCanvasOffset: (val: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setFramePos: (val: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setDynamicFrameHeights: (val: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
  setArtifactPreviewModes: (val: Record<string, 'app' | 'web' | 'tablet' | null> | ((prev: Record<string, 'app' | 'web' | 'tablet' | null>) => Record<string, 'app' | 'web' | 'tablet' | null>)) => void;
  setSelectedArtifactIds: (val: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setSelectionBox: (box: { x1: number; y1: number; x2: number; y2: number } | null) => void;

  setActiveTool: (tool: 'select' | 'hand' | 'interact') => void;
  setIsPanning: (isPanning: boolean) => void;
  setIsDraggingFrame: (isDraggingFrame: boolean) => void;
  setIsResizing: (isResizing: boolean) => void;
  setResizingHandle: (handle: string | null) => void;

  setLeftSidebarMode: (mode: 'chat') => void;
  setSecondarySidebarMode: (mode: 'none' | 'properties' | 'theme') => void;
  setIsCodeViewerOpen: (open: boolean) => void;
  setIsGenerating: (generating: boolean) => void;
  setViewingCode: (code: string) => void;
  setViewingTitle: (title: string) => void;
  setIsRegenerateDialogOpen: (open: boolean) => void;
  setRegenerateInstructions: (instructions: string) => void;
  setIsSaving: (saving: boolean) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setIsEditTitleDialogOpen: (open: boolean) => void;
  setEditingTitle: (title: string) => void;
  setIsDeleteDialogOpen: (open: boolean) => void;
  setIsExportSheetOpen: (open: boolean) => void;
  setExportArtifactIndex: (index: number | null) => void;
  setHasCopied: (copied: boolean) => void;
  setIsPlanDialogOpen: (open: boolean) => void;
  setViewingPlan: (plan: any) => void;
  setIsPromptDialogOpen: (open: boolean) => void;
  setViewingPrompt: (prompt: string) => void;
  setIsSidebarVisible: (visible: boolean) => void;
  setWebsiteUrl: (url: string | null) => void;
  setRegeneratingArtifactIds: (val: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setMessages: (val: any[] | ((prev: any[]) => any[])) => void;
  setMessageParts: (val: any[] | ((prev: any[]) => any[])) => void;
  setIsCommandMenuOpen: (open: boolean) => void;
  setIsSettingsDialogOpen: (open: boolean) => void;
  setIsShareDialogOpen: (open: boolean) => void;
  setIsVariationsSheetOpen: (open: boolean) => void;
  setVariationsArtifactIndex: (index: number | null) => void;
  setVariationOptions: (val: number | ((prev: number) => number)) => void;
  setVariationCreativeRange: (range: 'refine' | 'explore' | 'reimagine') => void;
  setVariationCustomInstructions: (instructions: string) => void;
  setVariationAspects: (val: string[] | ((prev: string[]) => string[])) => void;

  setActiveThemeId: (id: string | null) => void;
  setAppliedTheme: (theme: any | null) => void;
  setSelectedEl: (el: HTMLElement | null | ((prev: HTMLElement | null) => HTMLElement | null)) => void;
  
  updateState: (updates: Partial<ProjectState>) => void;
  resetProjectState: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  // Initial State
  projectId: null,
  project: null,
  artifacts: [],
  throttledArtifacts: [],
  attachments: [],
  input: "",
  designPlan: { screens: [] },
  realtimeStatus: null,
  realtimeStatuses: {},
  loading: true,
  websiteUrl: null,
  messages: [],
  messageParts: [],

  zoom: 1,
  canvasOffset: { x: 0, y: 0 },
  framePos: { x: 0, y: 0 },
  dynamicFrameHeights: {},
  artifactPreviewModes: {},
  selectedArtifactIds: new Set(),
  selectionBox: null,

  activeTool: 'select',
  isPanning: false,
  isDraggingFrame: false,
  isResizing: false,
  resizingHandle: null,

  leftSidebarMode: 'chat',
  secondarySidebarMode: 'none',
  isCodeViewerOpen: false,
  isGenerating: false,
  viewingCode: "",
  viewingTitle: "",
  isRegenerateDialogOpen: false,
  regenerateInstructions: "",
  isSaving: false,
  hasUnsavedChanges: false,
  isEditTitleDialogOpen: false,
  editingTitle: "",
  isDeleteDialogOpen: false,
  isExportSheetOpen: false,
  exportArtifactIndex: null,
  hasCopied: false,
  isPlanDialogOpen: false,
  viewingPlan: null,
  isPromptDialogOpen: false,
  viewingPrompt: "",
  isSidebarVisible: true,
  is3xMode: false,
  regeneratingArtifactIds: new Set(),
  isCommandMenuOpen: false,
  isSettingsDialogOpen: false,
  isShareDialogOpen: false,
  isVariationsSheetOpen: false,
  variationsArtifactIndex: null,
  variationOptions: 3,
  variationCreativeRange: 'explore',
  variationCustomInstructions: "",
  variationAspects: [],

  activeThemeId: null,
  appliedTheme: null,
  selectedEl: null,

  // Actions
  setProjectId: (projectId) => set({ projectId }),
  setProject: (project) => set({ project }),
  setArtifacts: (val) => set((state) => ({ artifacts: typeof val === 'function' ? val(state.artifacts) : val })),
  setThrottledArtifacts: (val) => set((state) => ({ throttledArtifacts: typeof val === 'function' ? val(state.throttledArtifacts) : val })),
  setAttachments: (val) => set((state) => ({ attachments: typeof val === 'function' ? val(state.attachments) : val })),
  setInput: (input) => set({ input }),
  setDesignPlan: (designPlan) => set({ designPlan }),
  setRealtimeStatus: (realtimeStatus) => set({ realtimeStatus }),
  setRealtimeStatuses: (val) => set((state) => ({ realtimeStatuses: typeof val === 'function' ? val(state.realtimeStatuses) : val })),
  setLoading: (loading) => set({ loading }),
  setIs3xMode: (is3xMode) => set({ is3xMode }),

  setZoom: (val) => set((state) => ({ zoom: typeof val === 'function' ? val(state.zoom) : val })),
  setCanvasOffset: (val) => set((state) => ({ canvasOffset: typeof val === 'function' ? val(state.canvasOffset) : val })),
  setFramePos: (val) => set((state) => ({ framePos: typeof val === 'function' ? val(state.framePos) : val })),
  setDynamicFrameHeights: (val) => set((state) => ({ dynamicFrameHeights: typeof val === 'function' ? val(state.dynamicFrameHeights) : val })),
  setArtifactPreviewModes: (val) => set((state) => ({ artifactPreviewModes: typeof val === 'function' ? val(state.artifactPreviewModes) : val })),
  setSelectedArtifactIds: (val) => set((state) => ({ selectedArtifactIds: typeof val === 'function' ? val(state.selectedArtifactIds) : val })),
  setSelectionBox: (selectionBox) => set({ selectionBox }),

  setActiveTool: (activeTool) => set({ activeTool }),
  setIsPanning: (isPanning) => set({ isPanning }),
  setIsDraggingFrame: (isDraggingFrame) => set({ isDraggingFrame }),
  setIsResizing: (isResizing) => set({ isResizing }),
  setResizingHandle: (resizingHandle) => set({ resizingHandle }),

  setLeftSidebarMode: (leftSidebarMode) => set({ leftSidebarMode }),
  setSecondarySidebarMode: (secondarySidebarMode) => set({ secondarySidebarMode }),
  setIsCodeViewerOpen: (isCodeViewerOpen) => set({ isCodeViewerOpen }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setViewingCode: (viewingCode) => set({ viewingCode }),
  setViewingTitle: (viewingTitle) => set({ viewingTitle }),
  setIsRegenerateDialogOpen: (isRegenerateDialogOpen) => set({ isRegenerateDialogOpen }),
  setRegenerateInstructions: (regenerateInstructions) => set({ regenerateInstructions }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setHasUnsavedChanges: (hasUnsavedChanges) => set({ hasUnsavedChanges }),
  setIsEditTitleDialogOpen: (isEditTitleDialogOpen) => set({ isEditTitleDialogOpen }),
  setEditingTitle: (editingTitle) => set({ editingTitle }),
  setIsDeleteDialogOpen: (isDeleteDialogOpen) => set({ isDeleteDialogOpen }),
  setIsExportSheetOpen: (isExportSheetOpen) => set({ isExportSheetOpen }),
  setExportArtifactIndex: (exportArtifactIndex) => set({ exportArtifactIndex }),
  setHasCopied: (hasCopied) => set({ hasCopied }),
  setIsPlanDialogOpen: (isPlanDialogOpen) => set({ isPlanDialogOpen }),
  setViewingPlan: (viewingPlan) => set({ viewingPlan }),
  setIsPromptDialogOpen: (isPromptDialogOpen) => set({ isPromptDialogOpen }),
  setViewingPrompt: (viewingPrompt) => set({ viewingPrompt }),
  setIsSidebarVisible: (isSidebarVisible) => set({ isSidebarVisible }),
  setWebsiteUrl: (websiteUrl) => set({ websiteUrl }),
  setRegeneratingArtifactIds: (val) => set((state) => ({ regeneratingArtifactIds: typeof val === 'function' ? val(state.regeneratingArtifactIds) : val })),
  setMessages: (val) => set((state) => ({ messages: typeof val === 'function' ? val(state.messages) : val })),
  setMessageParts: (val) => set((state) => ({ messageParts: typeof val === 'function' ? val(state.messageParts) : val })),
  setIsCommandMenuOpen: (isCommandMenuOpen) => set({ isCommandMenuOpen }),
  setIsSettingsDialogOpen: (isSettingsDialogOpen) => set({ isSettingsDialogOpen }),
  setIsShareDialogOpen: (isShareDialogOpen) => set({ isShareDialogOpen }),
  setIsVariationsSheetOpen: (isVariationsSheetOpen) => set({ isVariationsSheetOpen }),
  setVariationsArtifactIndex: (variationsArtifactIndex) => set({ variationsArtifactIndex }),
  setVariationOptions: (val) => set((state) => ({ variationOptions: typeof val === 'function' ? val(state.variationOptions) : val })),
  setVariationCreativeRange: (variationCreativeRange) => set({ variationCreativeRange }),
  setVariationCustomInstructions: (variationCustomInstructions) => set({ variationCustomInstructions }),
  setVariationAspects: (val) => set((state) => ({ variationAspects: typeof val === 'function' ? val(state.variationAspects) : val })),

  setActiveThemeId: (activeThemeId) => set({ activeThemeId }),
  setAppliedTheme: (appliedTheme) => set({ appliedTheme }),
  setSelectedEl: (val) => set((state) => ({ selectedEl: typeof val === 'function' ? val(state.selectedEl) : val })),
  
  updateState: (updates) => set((state) => ({ ...state, ...updates })),
  resetProjectState: () => set({
    projectId: null,
    project: null,
    artifacts: [],
    throttledArtifacts: [],
    attachments: [],
    input: "",
    designPlan: { screens: [] },
    realtimeStatus: null,
    realtimeStatuses: {},
    loading: true,
    websiteUrl: null,
    messages: [],
    messageParts: [],
    zoom: 1,
    canvasOffset: { x: 0, y: 0 },
    framePos: { x: 0, y: 0 },
    dynamicFrameHeights: {},
    artifactPreviewModes: {},
    selectedArtifactIds: new Set(),
    selectionBox: null,
    activeTool: 'select',
    isPanning: false,
    isDraggingFrame: false,
    isResizing: false,
    resizingHandle: null,
    leftSidebarMode: 'chat',
    secondarySidebarMode: 'none',
    isCodeViewerOpen: false,
    isGenerating: false,
    viewingCode: "",
    viewingTitle: "",
    isRegenerateDialogOpen: false,
    regenerateInstructions: "",
    isSaving: false,
    hasUnsavedChanges: false,
    isEditTitleDialogOpen: false,
    editingTitle: "",
    isDeleteDialogOpen: false,
    isExportSheetOpen: false,
    exportArtifactIndex: null,
    hasCopied: false,
    isPlanDialogOpen: false,
    viewingPlan: null,
    isPromptDialogOpen: false,
    viewingPrompt: "",
    isSidebarVisible: true,
    is3xMode: false,
    activeThemeId: null,
    appliedTheme: null,
    selectedEl: null,
    regeneratingArtifactIds: new Set(),
  }),
}));
