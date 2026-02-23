import React from "react";

/**
 * @file modern-shimmer.tsx
 * @description Provides a professional loading skeleton for artifacts.
 * While the AI is streaming HTML or regenerating a screen, this component
 * overlays a clean background with a moving gradient 'shimmer' to indicate
 * active progress without showing a broken or empty UI.
 */

export const ModernShimmer = ({
  type = "app",
  appliedTheme,
}: {
  type?: "web" | "app" | string;
  appliedTheme?: any;
}) => {
  const _isWeb = type === "web";
  return (
    <div
      className="pointer-events-none absolute inset-0 z-50 flex flex-col gap-10 overflow-hidden p-10"
      style={{
        backgroundColor:
          appliedTheme?.cssVars?.background || "var(--background)",
      }}
    >
      {/* Standard Shimmer Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.05) 50%, 
            transparent 100%
          )`,
          width: "100%",
          transform: "skewX(-20deg) translateX(-200%)",
          animation: "shimmer-standard 2.5s infinite linear",
        }}
      />

      <style>{`
        @keyframes shimmer-standard {
          0% { transform: skewX(-20deg) translateX(-250%); }
          100% { transform: skewX(-20deg) translateX(450%); }
        }
      `}</style>
    </div>
  );
};
