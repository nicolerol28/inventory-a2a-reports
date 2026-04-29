import { Hono } from "hono";
import type { AppEnv } from "../../../a2a/infrastructure/auth/types.js";
import { authMiddleware } from "../../../a2a/infrastructure/auth/authMiddleware.js";
import { mastra } from "../../../mastra/index.js";

export const reportsRouter = new Hono<AppEnv>();

reportsRouter.post("/reports", authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body || typeof body.query !== "string" || !body.query.trim()) {
    return c.json({ error: "Se requiere un campo 'query' con texto" }, 400);
  }

  const query = body.query.trim();

  if (query.length > 2000) {
    return c.json({ error: "El query excede el limite de 2000 caracteres" }, 400);
  }

  try {
    const agent = mastra.getAgent("reportsAgent");

    const result = await agent.generate(query, {
      modelSettings: { maxOutputTokens: 8192 },
    });

    const report = typeof result.text === "string" ? result.text : String(result.text);

    return c.json({ report });
  } catch (err) {
    console.error("[Reports] Error generating report:", err);
    return c.json({ error: "Error interno al generar el reporte" }, 500);
  }
});