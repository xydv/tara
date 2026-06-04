import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { portfolioService } from "../services/portfolio";
import { logToolCall } from "./logger";

export const portfolioTool = createTool({
  id: "portfolioTool",
  description: "handles queries about portfolio summary aggregates (value, cost, gain) and individual holding returns.",
  inputSchema: z.object({
    operation: z.enum(["portfolio_summary", "holding_return"]),
    fundId: z.string().optional(),
  }),
  execute: async (input) => {
    const start = performance.now();
    let result: any;
    try {
      switch (input.operation) {
        case "portfolio_summary": {
          result = await portfolioService.getPortfolioSummary();
          break;
        }
        case "holding_return": {
          const returns = await portfolioService.getHoldingReturns();
          if (input.fundId) {
            result = returns.find((r) => r.fundId === input.fundId) || null;
          } else {
            result = returns;
          }
          break;
        }
        default:
          throw new Error(`unsupported operation: ${input.operation}`);
      }

      const durationMs = Math.round(performance.now() - start);
      await logToolCall({
        tool: "portfolio",
        operation: input.operation,
        input,
        durationMs,
        success: true,
      });

      return result;
    } catch (error: any) {
      const durationMs = Math.round(performance.now() - start);
      await logToolCall({
        tool: "portfolio",
        operation: input.operation,
        input,
        durationMs,
        success: false,
        error: error.message || String(error),
      });
      throw error;
    }
  },
});
