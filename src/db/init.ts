import "dotenv/config";
import { initDatabase } from "./database";

(async () => {
  try {
    await initDatabase();
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
})();
