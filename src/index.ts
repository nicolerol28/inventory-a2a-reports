import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();

// Health check
app.get("/", (c) => c.json({ status: "ok", service: "inventory-a2a-reports" }));

const port = Number(process.env.PORT) || 3001;

serve({ fetch: app.fetch, port }, () => {
  console.log(`Reports agent running on port ${port}`);
});