import type { AgentCard } from "./a2a.js";

export function buildAgentCard(baseUrl: string): AgentCard {
  return {
    name: "reports-agent",
    description:
      "Agente especializado en generar reportes ejecutivos y analisis de inventario. " +
      "Obtiene datos del inventory agent via A2A y los transforma en reportes estructurados, " +
      "comparativas entre bodegas y resumenes ejecutivos.",
    url: baseUrl,
    version: "1.0.0",
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    authentication: {
      schemes: ["Bearer"],
    },
    defaultInputModes: ["text"],
    defaultOutputModes: ["text"],
    skills: [
      {
        id: "executive-report",
        name: "Reporte ejecutivo de inventario",
        description:
          "Genera un reporte ejecutivo completo del estado del inventario, " +
          "incluyendo stock por bodega, productos criticos y recomendaciones.",
        tags: ["report", "executive", "inventory", "summary"],
        examples: [
          "Genera un reporte ejecutivo del inventario",
          "Dame un resumen general del estado del stock",
        ],
      },
      {
        id: "warehouse-comparison",
        name: "Comparativa entre bodegas",
        description:
          "Compara el stock, movimientos y estado general entre dos o mas bodegas, " +
          "identificando diferencias y oportunidades de redistribucion.",
        tags: ["comparison", "warehouse", "analysis"],
        examples: [
          "Compara el stock entre la bodega Principal y la bodega Norte",
          "Que diferencias hay entre las bodegas de Cali y Bogota",
        ],
      },
      {
        id: "purchase-analysis",
        name: "Analisis de compras sugeridas",
        description:
          "Analiza los niveles de stock y genera recomendaciones de compra " +
          "priorizadas por urgencia y volumen.",
        tags: ["purchase", "recommendations", "analysis"],
        examples: [
          "Que productos necesito comprar urgentemente",
          "Genera un analisis de compras sugeridas para la bodega Sur",
        ],
      },
    ],
  };
}