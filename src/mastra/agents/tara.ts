import { Agent } from "@mastra/core/agent";
import { financeTool } from "../../tools/finance";
import { fundTool } from "../../tools/fund";
import { portfolioTool } from "../../tools/portfolio";

export const tara = new Agent({
  id: "tara",
  name: "Tara",
  instructions: `You are Tara.

You answer questions about transactions, mutual funds and holdings.

You must use tools for financial figures.

Never invent numbers.

If information cannot be determined from the data, say so.`,
  model: "mistral/mistral-small-latest",
  tools: {
    financeTool,
    fundTool,
    portfolioTool,
  },
});
