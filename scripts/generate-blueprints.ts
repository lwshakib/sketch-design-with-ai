import fs from "fs";
import path from "path";
import { parse } from "node-html-parser";

/**
 * Design DSL Generator
 * Compresses standard Tailwind HTML into a semantic "Design Intent" representation.
 * This identifies elite design patterns (Glass, Bento, Grids) while stripping noise.
 */
function getSemanticDSL(html: string): any {
  try {
    const root = parse(html);
    
    // 1. Identify visual traits (Signature Glows, Glassmorphism, Gradients)
    const extractStyles = (el: any) => {
      const classes = el.getAttribute("class") || "";
      return {
        isGlass: classes.includes("backdrop-blur"),
        isGradient: classes.includes("bg-gradient"),
        isBento: classes.includes("grid-cols") || classes.includes("col-span"),
        hasGlow: classes.includes("blur-[") || classes.includes("shadow-"),
        spacing: classes.includes("p-8") || classes.includes("p-10") ? "aggressive" : "standard",
        rounded: classes.includes("rounded-[2") || classes.includes("rounded-[3") ? "extra_large" : "standard"
      };
    };

    // 2. Identify Semantic Components
    const getChildrenDSL = (parent: any, depth = 0): any[] => {
      if (depth > 2) return []; // Limit nesting depth for token efficiency
      
      return parent.childNodes
        .filter((node: any) => node.nodeType === 1)
        .map((el: any) => {
          const tagName = el.tagName.toLowerCase();
          const classes = el.getAttribute("class") || "";
          
          let role = "element";
          if (classes.includes("nav") || tagName === "nav") role = "navigation_bar";
          if (classes.includes("hero")) role = "hero_section";
          if (classes.includes("card")) role = "content_card";
          if (classes.includes("grid")) role = "layout_grid";
          if (tagName === "button") role = "cta_action";
          if (tagName === "h1" || tagName === "h2") role = "expressive_header";
          if (tagName === "canvas" || classes.includes("chart")) role = "data_vis";
          if (classes.includes("bottom-")) role = "app_bottom_nav";

          const children = getChildrenDSL(el, depth + 1);

          return {
            role,
            traits: extractStyles(el),
            ...(children.length > 0 && { components: children })
          };
        }).slice(0, 15); // Limit count to keep it concise
    };

    const body = root.querySelector("body") || root;
    
    return {
      design_intent: {
        typography: html.includes("Outfit") ? "Outfit (Expressive)" : "Inter (Modern)",
        background: html.match(/bg-\[(#[a-fA-F0-9]{3,6})\]/)?.[1] || "default_theme",
        master_style: extractStyles(body)
      },
      layout_patterns: getChildrenDSL(body)
    };
  } catch (error) {
    return { error: "DSL Parsing Failed" };
  }
}

async function main() {
  const categories = ["app_design", "web_design"];
  const examplesDir = path.join(process.cwd(), "examples");

  if (!fs.existsSync(examplesDir)) {
    console.error("Examples directory not found");
    return;
  }

  for (const cat of categories) {
    const catPath = path.join(examplesDir, cat);
    if (!fs.existsSync(catPath)) continue;

    const apps = fs.readdirSync(catPath).filter(f => 
      fs.lstatSync(path.join(catPath, f)).isDirectory()
    );

    for (const app of apps) {
      const appPath = path.join(catPath, app);
      const bpFile = path.join(appPath, "blueprint.json");
      
      console.log(`🔨 Generating Design DSL for ${app}...`);
      
      const htmlFiles = fs.readdirSync(appPath).filter(f => f.endsWith(".html"));
      const screens = htmlFiles.map(file => {
        const filePath = path.join(appPath, file);
        const rawHtml = fs.readFileSync(filePath, "utf-8");
        const dsl = getSemanticDSL(rawHtml);
        
        const title = file
          .replace(".html", "")
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        return {
          title,
          dsl
        };
      });

      const blueprint = {
        app,
        type: cat === "app_design" ? "app" : "web",
        screens
      };

      fs.writeFileSync(bpFile, JSON.stringify(blueprint, null, 2));
      console.log(`✅ Compressed ${app} into DSL concepts.`);
    }
  }
}

main();
