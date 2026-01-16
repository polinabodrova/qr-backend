import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import qrcodesRouter from "./routes/qrcodes";
import redirectRouter from "./routes/redirect";
import { initDatabase } from "./db/database";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

const redirectLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 redirects per minute
});

// Routes
app.use("/api/qrcodes", limiter, qrcodesRouter);
app.use("/r", redirectLimiter, redirectRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Initialize database and start server
(async () => {
  try {
    await initDatabase();
    console.log("Database initialized");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
})();
