/**
 * @file types.ts
 * @description Core TypeScript definitions used across the frontend.
 */

export type Artifact = {
  id?: string;
  html: string;
  type: "web" | "app" | "theme";
  isComplete: boolean;
  title: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isLiked?: boolean;
  isDisliked?: boolean;
  status?: "generating" | "completed";
  variables?: any; // For Theme nodes
  isActive?: boolean;
};
