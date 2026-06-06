import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { transactionService } from "../services/transaction";
import { logToolExecution } from "./logger";

export const financeTool = createTool({
  id: "financeTool",
  description: "handles transaction queries including spending totals, category breakdowns, merchant rankings, largest transactions, and monthly trends.",
  inputSchema: z.object({
    operation: z.enum([
      "total_spend",
      "category_spend",
      "top_merchants",
      "largest_transaction",
      "monthly_breakdown",
      "list_transactions",
    ]),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    category: z.string().optional(),
    merchant: z.string().optional(),
    type: z.enum(["expense", "refund", "all"]).optional(),
    limit: z.number().optional(),
  }),
  execute: async (input, context) => {
    const start = performance.now();
    const requestId = (context as any)?.requestContext?.get("requestId") || "unknown";
    let success = true;
    const toolTrace: any = {
      tool: "finance",
      operation: input.operation,
      input,
      databaseTablesRead: ["transactions"],
    };
    let result: any;
    try {
      switch (input.operation) {
        case "total_spend": {
          const total = await transactionService.getTotalSpend({
            startDate: input.startDate,
            endDate: input.endDate,
            category: input.category,
            merchant: input.merchant,
            type: input.type,
          });
          result = { totalSpend: total };
          break;
        }
        case "category_spend": {
          const breakdown = await transactionService.getCategorySpend({
            startDate: input.startDate,
            endDate: input.endDate,
            category: input.category,
            merchant: input.merchant,
            type: input.type,
          });
          if (input.category) {
            const filtered = breakdown.find(
              (item) => item.category === input.category?.trim().toLowerCase()
            );
            result = filtered || { category: input.category, amount: 0 };
          } else {
            result = breakdown;
          }
          break;
        }
        case "top_merchants": {
          result = await transactionService.getTopMerchants(input.limit || 5, {
            startDate: input.startDate,
            endDate: input.endDate,
            category: input.category,
            merchant: input.merchant,
            type: input.type,
          });
          break;
        }
        case "largest_transaction": {
          result = await transactionService.getLargestTransaction({
            startDate: input.startDate,
            endDate: input.endDate,
            category: input.category,
            merchant: input.merchant,
            type: input.type,
          });
          break;
        }
        case "monthly_breakdown": {
          result = await transactionService.getMonthlySpend({
            startDate: input.startDate,
            endDate: input.endDate,
            category: input.category,
            merchant: input.merchant,
            type: input.type,
          });
          break;
        }
        case "list_transactions": {
          result = await transactionService.getTransactions({
            startDate: input.startDate,
            endDate: input.endDate,
            category: input.category,
            merchant: input.merchant,
            type: input.type,
          }, input.limit);
          break;
        }
        default:
          throw new Error(`unsupported operation: ${input.operation}`);
      }

      return result;
    } catch (error: any) {
      success = false;
      toolTrace.errorMessage = error.message || String(error);
      throw error;
    } finally {
      const durationMs = Math.round(performance.now() - start);
      toolTrace.durationMs = durationMs;
      toolTrace.success = success;

      const traces = (context as any)?.requestContext?.get("toolTraces");
      if (Array.isArray(traces)) {
        traces.push(toolTrace);
      }

      await logToolExecution({
        requestId,
        tool: "finance",
        operation: input.operation,
        input,
        durationMs,
        success,
      });
    }
  },
});
