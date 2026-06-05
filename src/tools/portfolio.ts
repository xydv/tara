import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { portfolioService } from "../services/portfolio";
import { fundService } from "../services/fund";
import { logToolExecution } from "./logger";

export const portfolioTool = createTool({
  id: "portfolioTool",
  description: "handles queries about portfolio summary aggregates (value, cost, gain) and individual holding returns.",
  inputSchema: z.object({
    operation: z.enum(["portfolio_summary", "holding_return"]),
    fundId: z.string().optional(),
  }),
  execute: async (input, context) => {
    const start = performance.now();
    const requestId = (context as any)?.requestContext?.get("requestId") || "unknown";
    let success = true;
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
            const resolvedId = await fundService.resolveFundId(input.fundId) || input.fundId;
            result = returns.find((r) => r.fundId === resolvedId) || null;
          } else {
            result = returns;
          }
          break;
        }
        default:
          throw new Error(`unsupported operation: ${input.operation}`);
      }

      return result;
    } catch (error: any) {
      success = false;
      throw error;
    } finally {
      const durationMs = Math.round(performance.now() - start);
      await logToolExecution({
        requestId,
        tool: "portfolio",
        operation: input.operation,
        input,
        durationMs,
        success,
      });
    }
  },
});
