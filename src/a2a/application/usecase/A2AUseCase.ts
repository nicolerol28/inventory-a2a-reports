import { reportsAgent } from "../../../agent/index.js";
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
    const result = await reportsAgent.generate([
      { role: "user", content: userText },
    ]);

    return {
      id: taskId,
      status: { state: "completed" },
      artifacts: [
        {
          name: "report",
          description: "Reporte generado por el reports agent",
          parts: [{ type: "text", text: result.text }],
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