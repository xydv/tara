import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { fundService } from "../services/fund";
import { logToolExecution } from "./logger";

export const fundTool = createTool({
  id: "fundTool",
  description: "handles queries about mutual fund returns, latest NAV values, and overall fund performance rankings.",
  inputSchema: z.object({
    operation: z.enum(["period_return", "latest_nav", "fund_ranking"]),
    fundId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
  execute: async (input, context) => {
    const start = performance.now();
    const requestId = (context as any)?.requestContext?.get("requestId") || "unknown";
    let success = true;
    let result: any;
    try {
      switch (input.operation) {
        case "latest_nav": {
          if (!input.fundId) {
            throw new Error("fundId is required for latest_nav");
          }
          const nav = await fundService.getLatestNav(input.fundId);
          result = { fundId: input.fundId, latestNav: nav };
          break;
        }
        case "period_return": {
          if (!input.fundId) {
            throw new Error("fundId is required for period_return");
          }
          if (!input.startDate || !input.endDate) {
            throw new Error("startDate and endDate are required for period_return");
          }
          const returnPct = await fundService.calculatePeriodReturn(
            input.fundId,
            input.startDate,
            input.endDate
          );
          result = { fundId: input.fundId, returnPct };
          break;
        }
        case "fund_ranking": {
          result = await fundService.rankFunds();
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
        tool: "fund",
        operation: input.operation,
        input,
        durationMs,
        success,
      });
    }
  },
});
