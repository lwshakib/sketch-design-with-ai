import fs from "fs";
import path from "path";

export function getAllExamples(): string {
  const baseExamplesDir = path.join(process.cwd(), "examples");
  const categories = ["app_design", "web_design"];
  let examplesContent = "<examples>\n";

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
        examplesContent += `  <example>\n`;

        for (const file of files) {
          const filePath = path.join(appFolderPath, file);
          const fileContent = fs.readFileSync(filePath, "utf-8");

          // Convert filename to screen name: dashboard.html -> Dashboard
          const screenName = file
            .replace(".html", "")
            .split("-")
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          examplesContent += `    <artifact appName="${appFolderName}" screenName="${screenName}" type="${type}">\n${fileContent}\n    </artifact>\n`;
        }

        examplesContent += `  </example>\n`;
      }
    }
  }

  examplesContent += "</examples>";
  return examplesContent;
}
