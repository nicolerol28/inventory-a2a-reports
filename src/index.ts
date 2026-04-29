import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { a2aRouter } from "./a2a/api/controller/A2AController.js";
import { reportsRouter } from "./reports/api/controller/ReportsController.js";

const requiredEnvVars = ["GOOGLE_GENERATIVE_AI_API_KEY", "INVENTORY_AGENT_URL", "JWT_SECRET"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

if (process.env.NODE_ENV === "production" && !process.env.REPORTS_UI_URL) {
  console.warn("Warning: REPORTS_UI_URL not set, CORS will block all origins");
}

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
if (isNaN(port)) {
  console.error(`Invalid PORT value: ${process.env.PORT}`);
  process.exit(1);
}

const app = new Hono();

const allowedOrigins = process.env.NODE_ENV === "production"
  ? [process.env.REPORTS_UI_URL].filter(Boolean) as string[]
  : ["http://localhost:5173", "http://localhost:5174"];

app.use("/*", cors({
  origin: allowedOrigins,
  allowMethods: ["GET", "POST"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Health check
app.get("/", (c) => c.json({ status: "ok", service: "inventory-a2a-reports" }));

app.route("/", a2aRouter);
app.route("/", reportsRouter);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Reports agent running on port ${port}`);
});