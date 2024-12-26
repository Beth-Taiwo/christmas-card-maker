import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { eventHandler } from "h3";

// Convert import.meta.url to a directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFonts = eventHandler(async (event) => {
  const fontsDir = path.resolve(__dirname, "../../public/fonts");
  try {
    const files = await fs.readdir(fontsDir);
    const fontFiles = files.filter(
      (file) => file.endsWith(".ttf") || file.endsWith(".otf")
    );
    return fontFiles;
  } catch (err) {
    console.error(err);
    return { error: "Failed to get fonts" };
  }
});

export default getFonts;
