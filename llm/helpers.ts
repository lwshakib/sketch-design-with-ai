import fs from "fs";
import path from "path";
import { parse } from "node-html-parser";

/**
 * Compresses raw HTML into a "Design Blueprint" by stripping text, scripts,
 * and non-essential attributes, leaving only the structural layout and Tailwind classes.
 */
function getDesignBlueprint(html: string): string {
  try {
    const root = parse(html);
    
    // 1. Strip all non-visual/non-structural tags
    root.querySelectorAll("script, style, link, meta, title, svg, path, iframe, noscript").forEach(node => node.remove());

    /**
     * Recursively cleans the DOM tree
     */
    function clean(node: any) {
      if (!node.childNodes) return;

      const toRemove: any[] = [];
      node.childNodes.forEach((child: any) => {
        if (child.nodeType === 3) {
          // It's a text node - remove it to save space
          toRemove.push(child);
        } else if (child.nodeType === 1) {
          // It's an element node - clean its attributes and recurse
          const attrs = { ...child.attributes };
          for (const key in attrs) {
            // Keep ONLY class for Tailwind inspiration
            if (key !== "class") {
              child.removeAttribute(key);
            }
          }
          clean(child);
        } else {
          toRemove.push(child);
        }
      });

      toRemove.forEach(n => n.remove());
    }

    const body = root.querySelector("body") || root;
    clean(body);

    // 2. Return the minified structural HTML
    return body.innerHTML
      .replace(/>\s+</g, "><") // Remove whitespace between tags
      .replace(/\s{2,}/g, " ") // Collapse multiple spaces
      .trim();
  } catch (error) {
    console.warn("[LLM Blueprint] Failed to compress HTML, returning original snippet length:", html.length);
    return html.substring(0, 1000); // Fallback to truncated version
  }
}

export function getAllExamples(): string {
  const baseExamplesDir = path.join(process.cwd(), "examples");
  const categories = ["app_design", "web_design"];
  let blueprintsContent = "<design_blueprints>\n";

  for (const category of categories) {
    const categoryPath = path.join(baseExamplesDir, category);
    const type = category === "app_design" ? "app" : "web";

    if (!fs.existsSync(categoryPath)) continue;

    const appFolders = fs.readdirSync(categoryPath).filter((folder: string) => {
      const folderPath = path.join(categoryPath, folder);
      return fs.lstatSync(folderPath).isDirectory();
    });

    for (const appFolderName of appFolders) {
      const appFolderPath = path.join(categoryPath, appFolderName);
      const files = fs
        .readdirSync(appFolderPath)
        .filter((f: string) => f.endsWith(".html"));

      if (files.length > 0) {
        const blueprintJsonPath = path.join(appFolderPath, "blueprint.json");
        let logicalBlueprint: any = null;
        if (fs.existsSync(blueprintJsonPath)) {
          try {
            logicalBlueprint = JSON.parse(
              fs.readFileSync(blueprintJsonPath, "utf-8"),
            );
          } catch (e) {
            console.warn(`Failed to parse blueprint.json in ${appFolderName}`);
          }
        }

        blueprintsContent += `  <inspiration app="${appFolderName}" type="${type}">\n`;
        if (logicalBlueprint?.vision) {
          blueprintsContent += `    <vision>${logicalBlueprint.vision}</vision>\n`;
        }

        for (const file of files) {
          const filePath = path.join(appFolderPath, file);
          const rawHtml = fs.readFileSync(filePath, "utf-8");
          const structuralHtml = getDesignBlueprint(rawHtml);

          const screenTitle = file
            .replace(".html", "")
            .split("-")
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          const screenMetadata = logicalBlueprint?.screens?.find(
            (s: any) =>
              s.title.toLowerCase() === screenTitle.toLowerCase() ||
              s.title.toLowerCase().includes(screenTitle.toLowerCase()),
          );

          blueprintsContent += `    <blueprint screen="${screenTitle}">\n`;
          if (screenMetadata?.prompt) {
            blueprintsContent += `      <prompt>${screenMetadata.prompt}</prompt>\n`;
          }
          if (screenMetadata?.description) {
            blueprintsContent += `      <description>${screenMetadata.description}</description>\n`;
          }
          blueprintsContent += `      <html>${structuralHtml}</html>\n    </blueprint>\n`;
        }

        blueprintsContent += `  </inspiration>\n`;
      }
    }
  }

  blueprintsContent += "</design_blueprints>";
  return blueprintsContent;
}
