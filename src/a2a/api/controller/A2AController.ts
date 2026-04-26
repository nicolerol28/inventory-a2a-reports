import { Hono } from "hono";
import type { AppEnv } from "../../infrastructure/auth/types.js";
import { authMiddleware } from "../../infrastructure/auth/authMiddleware.js";
import { buildAgentCard } from "../../domain/model/agent-card.js";
import { handleA2AMessage } from "../../application/usecase/A2AUseCase.js";
import type { JsonRpcRequest, Message } from "../../domain/model/a2a.js";

export const a2aRouter = new Hono<AppEnv>();

a2aRouter.get("/.well-known/agent.json", (c) => {
  const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`;
  return c.json(buildAgentCard(baseUrl));
});

a2aRouter.post("/a2a", authMiddleware, async (c) => {
  let body: JsonRpcRequest;

  try {
    body = await c.req.json();
  } catch {
    return c.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      400
    );
  }

  if (body.jsonrpc !== "2.0" || body.id == null || !body.method) {
    return c.json(
      { jsonrpc: "2.0", id: body.id ?? null, error: { code: -32600, message: "Invalid Request" } },
      400
    );
  }

  if (body.method !== "message/send") {
    return c.json(
      { jsonrpc: "2.0", id: body.id, error: { code: -32601, message: `Method not found: ${String(body.method).slice(0, 64)}` } },
      400
    );
  }

  const params = body.params as { message?: { role?: string; parts?: unknown[] } } | undefined;
  const message = params?.message;

  if (!message || !message.role || !Array.isArray(message.parts)) {
    return c.json(
      { jsonrpc: "2.0", id: body.id, error: { code: -32602, message: "Invalid params: message with role and parts required" } },
      400
    );
  }

  const totalTextLength = message.parts
    .filter((p): p is { type: "text"; text: string } => typeof p === "object" && p !== null && (p as { type: string }).type === "text")
    .reduce((sum, p) => sum + p.text.length, 0);

  if (totalTextLength > 8000) {
    return c.json(
      { jsonrpc: "2.0", id: body.id, error: { code: -32602, message: "Invalid params: message text exceeds maximum length" } },
      400
    );
  }

  try {
    const task = await handleA2AMessage(message as Message);
    return c.json({ jsonrpc: "2.0", id: body.id, result: task });
  } catch (err) {
    console.error("[A2A] Internal error:", err);
    return c.json(
      { jsonrpc: "2.0", id: body.id, error: { code: -32603, message: "Internal server error" } },
      500
    );
  }
});