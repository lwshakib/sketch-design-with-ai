import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const { GLM_WORKER_URL, CLOUDFLARE_API_KEY } = process.env;

if (!GLM_WORKER_URL || !CLOUDFLARE_API_KEY) {
  console.error("Missing env");
  process.exit(1);
}

const SYSTEM = `YOU ARE THE WORLD'S LEADING PRODUCT ARCHITECT.
Return ONLY the JSON object. 
Schema: { vision: string, screens: [{ title: string, description: string, prompt: string }] }`;

async function generateBlueprint(appName: string, html: string) {
  const res = await axios.post(GLM_WORKER_URL!, {
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: `AppName: ${appName}\n\nExisting HTML:\n${html}` }
    ],
    response_format: { type: "json_schema", json_schema: { name: "b", strict: true, schema: { type: "object", properties: { vision: { type: "string" }, screens: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, prompt: { type: "string" } }, required: ["title", "description", "prompt"] } } }, required: ["vision", "screens"] } } }
  }, {
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${CLOUDFLARE_API_KEY}` }
  });
  return res.data.choices?.[0]?.message?.content;
}

async function main() {
  const categories = ["app_design", "web_design"];
  for (const cat of categories) {
    const catPath = path.join(process.cwd(), "examples", cat);
    if (!fs.existsSync(catPath)) continue;
    const apps = fs.readdirSync(catPath).filter(f => fs.lstatSync(path.join(catPath, f)).isDirectory());
    for (const app of apps) {
      const appPath = path.join(catPath, app);
      const bpFile = path.join(appPath, "blueprint.json");
      if (fs.existsSync(bpFile)) continue;
      console.log(`Generating for ${app}...`);
      const html = fs.readdirSync(appPath).filter(f => f.endsWith(".html")).map(f => `--- ${f} ---\n${fs.readFileSync(path.join(appPath, f), "utf-8").substring(0, 3000)}`).join("\n");
      try {
        const bp = await generateBlueprint(app, html);
        fs.writeFileSync(bpFile, bp);
        console.log(`Saved ${app}/blueprint.json`);
      } catch (err: any) {
        console.error(`Error for ${app}:`, err.message);
      }
    }
  }
}
main();
