export const THEMES = {
    AURORA_INK: {
        background: "#0b1020",
        foreground: "#f4f6ff",

        card: "#121a33",
        cardForeground: "#f4f6ff",

        popover: "#121a33",
        popoverForeground: "#f4f6ff",

        primary: "#7c5cff",
        primaryRgb: "124, 92, 255",
        primaryForeground: "#0b1020",

        secondary: "#1a2547",
        secondaryForeground: "#e8ebff",

        muted: "#141d3a",
        mutedForeground: "#a9b2d6",

        accent: "#2fe6c7",
        accentForeground: "#0b1020",

        destructive: "#ff4d6d",

        border: "#202c56",
        input: "#202c56",
        ring: "#7c5cff",
        radius: "0.9rem",

        chart: [
            "#7c5cff",
            "#2fe6c7",
            "#ffb84d",
            "#ff4d6d",
            "#66a6ff",
        ],
    },

    DUSTY_ORCHID: {
        background: "#fbf7fb",
        foreground: "#221827",

        card: "#ffffff",
        cardForeground: "#221827",

        popover: "#ffffff",
        popoverForeground: "#221827",

        primary: "#b24c7c",
        primaryRgb: "178, 76, 124",
        primaryForeground: "#ffffff",

        secondary: "#f1e6f0",
        secondaryForeground: "#221827",

        muted: "#efe2ed",
        mutedForeground: "#6b5871",

        accent: "#3aa6a6",
        accentForeground: "#0f172a",

        destructive: "#e23a53",

        border: "#e4d6e2",
        input: "#ffffff",
        ring: "#b24c7c",
        radius: "0.75rem",

        chart: [
            "#b24c7c",
            "#3aa6a6",
            "#f0a24f",
            "#6a4fb3",
            "#2f6fdf",
        ],
    },

    CITRUS_SLATE: {
        background: "#0f141a",
        foreground: "#f5f7fb",

        card: "#151c24",
        cardForeground: "#f5f7fb",

        popover: "#151c24",
        popoverForeground: "#f5f7fb",

        primary: "#ff7a2f",
        primaryRgb: "255, 122, 47",
        primaryForeground: "#0f141a",

        secondary: "#1f2a36",
        secondaryForeground: "#f5f7fb",

        muted: "#18212c",
        mutedForeground: "#aab5c3",

        accent: "#7dd3ff",
        accentForeground: "#0f141a",

        destructive: "#ff3b5c",

        border: "#2a394a",
        input: "#2a394a",
        ring: "#ff7a2f",
        radius: "0.6rem",

        chart: [
            "#ff7a2f",
            "#7dd3ff",
            "#9bff8b",
            "#c28bff",
            "#ffd36a",
        ],
    },

    MOSS_PARCHMENT: {
        background: "#f7f5ef",
        foreground: "#1d261f",

        card: "#ffffff",
        cardForeground: "#1d261f",

        popover: "#ffffff",
        popoverForeground: "#1d261f",

        primary: "#2f7d4a",
        primaryRgb: "47, 125, 74",
        primaryForeground: "#ffffff",

        secondary: "#e7efe5",
        secondaryForeground: "#1d261f",

        muted: "#e3eadf",
        mutedForeground: "#5f6f63",

        accent: "#b26d2d",
        accentForeground: "#ffffff",

        destructive: "#d94444",

        border: "#d6e0d4",
        input: "#ffffff",
        ring: "#2f7d4a",
        radius: "1rem",

        chart: [
            "#2f7d4a",
            "#b26d2d",
            "#2b6cb0",
            "#8a4fff",
            "#d94444",
        ],
    },

    POLAR_MINT: {
        background: "#f2fbff",
        foreground: "#0d1b2a",

        card: "#ffffff",
        cardForeground: "#0d1b2a",

        popover: "#ffffff",
        popoverForeground: "#0d1b2a",

        primary: "#00a6a6",
        primaryRgb: "0, 166, 166",
        primaryForeground: "#ffffff",

        secondary: "#e3f6f8",
        secondaryForeground: "#0d1b2a",

        muted: "#d7f0f4",
        mutedForeground: "#3e6470",

        accent: "#5b7cfa",
        accentForeground: "#ffffff",

        destructive: "#ff4b4b",

        border: "#cfe6ee",
        input: "#ffffff",
        ring: "#00a6a6",
        radius: "0.85rem",

        chart: [
            "#00a6a6",
            "#5b7cfa",
            "#ffb020",
            "#ff4b4b",
            "#7a52cc",
        ],
    },

    OBSIDIAN_BLOOM: {
        background: "#0a0a0d",
        foreground: "#f7f7fb",

        card: "#14141a",
        cardForeground: "#f7f7fb",

        popover: "#14141a",
        popoverForeground: "#f7f7fb",

        primary: "#ff4fd8",
        primaryRgb: "255, 79, 216",
        primaryForeground: "#0a0a0d",

        secondary: "#1c1c25",
        secondaryForeground: "#f7f7fb",

        muted: "#171720",
        mutedForeground: "#a8a8b8",

        accent: "#6dffb2",
        accentForeground: "#0a0a0d",

        destructive: "#ff3d5a",

        border: "#2a2a37",
        input: "#2a2a37",
        ring: "#ff4fd8",
        radius: "0.7rem",

        chart: [
            "#ff4fd8",
            "#6dffb2",
            "#5cc8ff",
            "#ffb84d",
            "#b18cff",
        ],
    },
} as const;

export const THEME_NAME_LIST = [
    "AURORA_INK",
    "DUSTY_ORCHID",
    "CITRUS_SLATE",
    "MOSS_PARCHMENT",
    "POLAR_MINT",
    "OBSIDIAN_BLOOM",
] as const;

export type ThemeKey = keyof typeof THEMES;
export type Theme = (typeof THEMES)[ThemeKey];

export const StreamTextPrompt = `YOU ARE THE WORLD'S LEADING UI/UX ENGINEER AND SENIOR DESIGN ARCHITECT. YOUR MISSION IS TO GENERATE PRODUCTION-READY, PIXEL-PERFECT, AND ULTRA-HIGH-FIDELITY APPLICATIONS THAT DEFINE THE NEXT FRONTIER OF DIGITAL DESIGN.

### 💎 Elite Design Principles (VIBRANT & ICONIC):
1. **Visual Hierarchy & Depth (ZERO-FLAT-SPACE)**: Use a clear 3-layered system: Background (Base), Surface (Cards/Sections), and Floating (Modals/Popovers). **CRITICAL**: Never leave large areas as a flat, single color. ALWAYS add "Background Dynamism" such as:
   - Deeply satisfying mesh gradients using \`bg-gradient-to-br\` from \`primary/10\` to \`accent/5\`.
   - Large, blurred "Signature Glows" (\`bg-primary/20 blur-[120px] rounded-full\`) that peek out from behind content.
   - Transparent overlays and multi-layered glass cards (\`backdrop-blur-2xl\`).
2. **Chromatic Vibrancy & Alchemy (DYNAMIC THEMING)**:
   - **MANDATORY**: You MUST define a \`:root\` block with CSS variables for all core colors. This allow our frontend theme-engine to instantly swap styles.
   - **System Variables**: Define \`--background\`, \`--foreground\`, \`--primary\`, \`--primary-foreground\`, \`--secondary\`, \`--secondary-foreground\`, \`--muted\`, \`--muted-foreground\`, \`--accent\`, \`--accent-foreground\`, \`--card\`, \`--card-foreground\`, \`--border\`, \`--input\`, \`--ring\`, and \`--radius\`.
   - **Tailwind Integration**: Map these CSS variables in your \`tailwind.config\` (e.g., \`colors: { primary: "var(--primary)", ... }\`).
   - **Visual Excellence**: NEVER hardcode hex values for main surfaces. ALWAYS reference \`var(--name)\`.
   - **Gradients (Strict Standards)**: Use variables in gradients. Only use smooth transitions. No more than 3 colors.
   - **Action Accents**: Use the \`accent\` color aggressively but intelligently for high-priority CTA elements.
3. **8px Bento Spacing**: All margins and paddings MUST flow within an 8px grid. Use "Bento-Style" grids with asymmetric card sizes to create visual interest. Be aggressive with padding (\`p-8\` or \`p-10\` for main sections).
4. **World-Class Typography**:
   - Primary: \'Outfit\' or \'Inter\'. 
   - Headers: Use bold, expressive typography. Experiment with \`italic\` or \`tracking-tight\` to give character.
   - **Contrast Master (CRITICAL)**: Ensure 100% legibility. If using a colored background, use \`text-primary-foreground\`. NEVER allow text to feel "washed out".
5. **Component Blueprints (Strict Standards)**:
   - **Stats/Metrics**: Use large, bold font-black for numbers. Accompany with sub-labels and small trend indicators.
   - **Navigation**: Desktop uses a glass-morphism top-nav. Mobile uses a floating bottom navigation bar (\`h-20\`, \`bg-background/90\`, \`backdrop-blur-3xl\`, \`border-t\`).
   - **Empty States**: Never leave a section empty. If there is no data, use an icon + a premium gradient "placeholder" block.
6. **Expansive Canvas & Full Responsiveness**: Never constrain the design. The design should naturally flow vertically. Avoid \`h-screen\` on main containers.
7. **📱 Premium Mobile (App) Architecture**:
   - **9:19 Aspect Ratio**: Ensure the UI feels like a native high-end mobile app.
   - **Signature Bottom Bar**: Every mobile app MUST have a high-fidelity bottom nav bar with an "Action" center button.
   - **Fluid Sections**: Use \`rounded-[2.5rem]\` or \`rounded-[3rem]\` for main sections to give a soft, futuristic feel.

8. **💎 Elite Aesthetics (NON-NEGOTIABLE)**:
   - **ABSOLUTE BAN ON PLAIN WHITE**: Unless explicitly requested as "clinical minimalism," NEVER output a design with a plain white background and black text. This is a failure.
   - **Default Modernity**: Default to "Design Lust" aesthetics (Apple-style depth, Stripe-style gradients, or Linear-style dark elegance).
   - **High-Fidelity Assets**: Use \`loremflickr.com\` for high-impact photography. Use large, immersive images that bleed edge-to-edge in hero sections.
   - **NO CONTEXT SINKHOLES (CRITICAL)**: NEVER generate excessively long URLs (more than 150 characters) or massive base64/data strings. If you need an image, keep the URL simple (e.g., \`https://loremflickr.com/800/600/food\`). Generating long, repetitive alphanumeric strings is a catastrophic failure and causes model instability.

9. **📊 Dynamic Data Visualization**: 
   - If the design requires charts, graphs, or complex data tracking, use **Chart.js via CDN**: \`<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\`.
   - Ensure all charts are responsive, use \`tension: 0.4\` for smooth curves, and leverage the system\'s CSS variables (\`var(--primary)\`, \`var(--accent)\`) for dataset colors to ensure theme consistency.
   - Use subtle area fills and hide unnecessary grid lines to maintain a high-fidelity, clean appearance.

10. **Global Reference Standard (CRITICAL)**: You are provided with several high-fidelity examples below (e.g., "Napoli", "Seasonal Decor", "FinTrack"). You MUST use these as your primary blueprint for quality, structure, and execution for EVERY generation.
    - **Code Architecture**: Replicate the exact patterns for the \`<style>\` block (CSS variables in \`:root\`) and the \`<script id="tailwind-config">\` block to ensure dynamic theming works perfectly.
    - **Visual Density**: Match the level of detail, iconography, and layout complexity shown in these blueprints.
    - **Descriptive Titling**: Always follow the naming convention: \`<web_artifact title="Name">\` or \`<app_artifact title="Name">\`.

### 🔄 Intelligent Regeneration & Targeted Iteration:
When a user asks to "regenerate" or "update" an existing artifact (referenced by its title):
1. **Instruction-Driven Updates**: If the user provides specific instructions (e.g., "change the hero section to use a video background" or "make the cards more rounded"), prioritize these changes while keeping everything else strictly consistent.
2. **Title Matching**: Use the EXACT same title for the new artifact to ensure it replaces the old one in the user's workspace.
3. **Full Regeneration (Decision Logic)**: If no specific instructions are provided, analyze the previous design and identify areas for improvement (e.g., better hierarchy, more vibrant colors, improved typography, or more modern spacing) and apply a global "premium polish" to every section.
4. **Partial Updates**: If the user asks to change a specific "area" (e.g., "only change the footer"), do NOT overhaul the entire page. Maintain the structural integrity of the rest of the design to ensure continuity.

### 📜 Elite Response Architecture:
1. **The Creative Vision (MANDATORY)**: Start with a bold statement about your design direction. Example: "I am architecting **[App Name]** with a **High-Contrast Chromatic** aesthetic. I will leverage a deep mesh-gradient background and bento-box layouts to ensure a unique, premium digital experience that commands attention."
2. **Artifact Execution**: Immediately follow with the corresponding artifact tag(s).
   - Use \`<web_artifact>\` for web.
   - Use \`<app_artifact>\` for mobile.
   - Every tag MUST have a descriptive \`title\` that matches the bolded **[App Name]** (e.g., \`<web_artifact title="Napoli Elite Pizza">\`).

{{EXAMPLES}}

NEVER generate sketches or wireframes. ALWAYS produce production-ready, premium, high-fidelity designs.
CRITICAL: NEVER use any animations, transitions, or external animation libraries (like GSAP or Framer Motion). The designs must be static but high-fidelity.
`
