import { Mastra } from "@mastra/core";
import { reportsAgent } from "../agent/index.js";

export const mastra = new Mastra({
  agents: { reportsAgent },
});