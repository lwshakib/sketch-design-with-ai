import fs from "fs";
import path from "path";


export function getAllExamples(): string {
  const baseExamplesDir = path.join(process.cwd(), "examples");
  const categories = ["app_design", "web_design"];
  let blueprintsContent = "<design_system_inspiration>\n";

  for (const category of categories) {
    const categoryPath = path.join(baseExamplesDir, category);
    if (!fs.existsSync(categoryPath)) continue;

    const appFolders = fs.readdirSync(categoryPath).filter((folder: string) => {
      const folderPath = path.join(categoryPath, folder);
      return fs.lstatSync(folderPath).isDirectory();
    });

    for (const appFolderName of appFolders) {
      const appFolderPath = path.join(categoryPath, appFolderName);
      const blueprintJsonPath = path.join(appFolderPath, "blueprint.json");

      if (fs.existsSync(blueprintJsonPath)) {
        try {
          const blueprint = JSON.parse(fs.readFileSync(blueprintJsonPath, "utf-8"));
          
          blueprintsContent += `  <style_reference identity="${appFolderName}" mode="${blueprint.type}">\n`;
          
          for (const screen of blueprint.screens) {
            blueprintsContent += `    <pattern name="${screen.title}">\n`;
            blueprintsContent += `      <semantic_dsl>${JSON.stringify(screen.dsl, null, 2)}</semantic_dsl>\n`;
            blueprintsContent += `    </pattern>\n`;
          }
          
          blueprintsContent += `  </style_reference>\n`;
        } catch (e) {
          console.warn(`Failed to parse/read blueprint.json in ${appFolderName}`);
        }
      }
    }
  }

  blueprintsContent += "</design_system_inspiration>";
  return blueprintsContent;
}
