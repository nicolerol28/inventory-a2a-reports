import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import jwt from "jsonwebtoken";
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  Task,
  TextPart,
} from "../a2a/domain/model/a2a.js";

function generateServiceToken(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      sub: "reports-agent",
      role: "service",
    },
    secret,
    { expiresIn: "1h" }
  );
}

function getBaseUrl(): string {
  const url = process.env.INVENTORY_AGENT_URL;
  if (!url) {
    throw new Error("INVENTORY_AGENT_URL is not configured");
  }
  return url;
}

const FETCH_TIMEOUT_MS = 60_000;

export const queryInventoryAgent = createTool({
  id: "queryInventoryAgent",
  description:
    "Consulta al inventory agent via protocolo A2A para obtener datos de inventario. " +
    "Usa esta tool para cualquier informacion sobre productos, stock, movimientos, " +
    "bodegas, categorias, proveedores o reportes de compra.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("La consulta en lenguaje natural para el inventory agent"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    response: z.string(),
    taskId: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ query }) => {
    const baseUrl = getBaseUrl();
    const token = generateServiceToken();

    // Paso 1: descubrimiento 
    const cardController = new AbortController();
    const cardTimeout = setTimeout(() => cardController.abort(), FETCH_TIMEOUT_MS);

    try {
      const cardResponse = await fetch(`${baseUrl}/.well-known/agent.json`, {
        signal: cardController.signal,
      });
      clearTimeout(cardTimeout);

      if (!cardResponse.ok) {
        return {
          success: false,
          response: "",
          error: `No se pudo descubrir el inventory agent: HTTP ${cardResponse.status}`,
        };
      }
    } catch (err) {
      clearTimeout(cardTimeout);
      const message = err instanceof Error ? err.message : "Unknown error";
      return {
        success: false,
        response: "",
        error: `No se pudo conectar al inventory agent: ${message}`,
      };
    }

    // Paso 2: enviar tarea via JSON-RPC 2.0
    const rpcRequest: JsonRpcRequest = {
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method: "message/send",
      params: {
        message: {
          role: "user",
          parts: [{ type: "text", text: query }],
        },
      },
    };

    const a2aController = new AbortController();
    const a2aTimeout = setTimeout(() => a2aController.abort(), FETCH_TIMEOUT_MS);

    let a2aResponse: Response;
    try {
      a2aResponse = await fetch(`${baseUrl}/a2a`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rpcRequest),
        signal: a2aController.signal,
      });
      clearTimeout(a2aTimeout);
    } catch (err) {
      clearTimeout(a2aTimeout);
      const message = err instanceof Error ? err.message : "Unknown error";
      return {
        success: false,
        response: "",
        error: `Error de conexion con el inventory agent: ${message}`,
      };
    }

    if (!a2aResponse.ok) {
      return {
        success: false,
        response: "",
        error: `Error del inventory agent: HTTP ${a2aResponse.status}`,
      };
    }

    let rpcResponse: JsonRpcResponse;
    try {
      rpcResponse = (await a2aResponse.json()) as JsonRpcResponse;
    } catch {
      return { success: false, response: "", error: "Respuesta no-JSON del inventory agent" };
    }

    if ("error" in rpcResponse) {
      return {
        success: false,
        response: "",
        error: `Error A2A: ${rpcResponse.error.message}`,
      };
    }

    // Verificar estado de la tarea
    const task = rpcResponse.result as Task;

    if (task.status.state !== "completed") {
      const detail = (task.status.message?.parts ?? [])
        .filter((p): p is TextPart => p.type === "text")
        .map((p) => p.text)
        .join(" ");
      return {
        success: false,
        response: "",
        error: detail || `Tarea en estado inesperado: ${task.status.state}`,
      };
    }

    const artifactText = (task.artifacts ?? [])
      .flatMap((artifact) => artifact.parts)
      .filter((part): part is TextPart => part.type === "text")
      .map((part) => part.text)
      .join("\n\n");

    const statusText = (task.status.message?.parts ?? [])
      .filter((part): part is TextPart => part.type === "text")
      .map((part) => part.text)
      .join("\n\n");

    const responseText = artifactText || statusText;

    return {
      success: true,
      response: responseText || "El inventory agent no retorno contenido",
      taskId: task.id,
    };
  },
});