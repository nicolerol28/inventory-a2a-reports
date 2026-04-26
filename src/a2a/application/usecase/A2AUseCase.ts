import crypto from "node:crypto";
import { mastra } from "../../../mastra/index.js";
import type { Task, Message, TextPart } from "../../domain/model/a2a.js";

export async function handleA2AMessage(message: Message): Promise<Task> {
  const taskId = crypto.randomUUID();

  const userText = message.parts
    .filter((p): p is TextPart => p.type === "text")
    .map((p) => p.text)
    .join("\n");

  if (!userText.trim()) {
    return {
      id: taskId,
      status: {
        state: "failed",
        message: {
          role: "agent",
          parts: [{ type: "text", text: "El mensaje no contiene texto" }],
        },
      },
    };
  }

  try {
    const agent = mastra.getAgent("reportsAgent");

    const result = await agent.generate(userText, {
      modelSettings: { maxOutputTokens: 4096 },
    });

    const responseText =
      typeof result.text === "string" ? result.text : String(result.text);

    return {
      id: taskId,
      status: { state: "completed" },
      artifacts: [
        {
          name: "report",
          description: "Reporte generado por el reports agent",
          parts: [{ type: "text", text: responseText }],
        },
      ],
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido";
    return {
      id: taskId,
      status: {
        state: "failed",
        message: {
          role: "agent",
          parts: [{ type: "text", text: `Error al generar reporte: ${errorMessage}` }],
        },
      },
    };
  }
}