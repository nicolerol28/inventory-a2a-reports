import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { a2aRouter } from "./a2a/api/controller/A2AController.js";

const app = new Hono();

// Health check
app.get("/", (c) => c.json({ status: "ok", service: "inventory-a2a-reports" }));

app.route("/", a2aRouter);

const port = Number(process.env.PORT) || 3001;

serve({ fetch: app.fetch, port }, () => {
  console.log(`Reports agent running on port ${port}`);
  console.log(`Agent Card: http://localhost:${port}/.well-known/agent.json`);
  console.log(`A2A endpoint: http://localhost:${port}/a2a`);
});