import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { transactionService } from "../services/transaction";

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
    ]),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    category: z.string().optional(),
    merchant: z.string().optional(),
    limit: z.number().optional(),
  }),
  execute: async (input) => {
    let result: any;
    try {
      switch (input.operation) {
        case "total_spend": {
          const total = await transactionService.getTotalSpend({
            startDate: input.startDate,
            endDate: input.endDate,
            category: input.category,
            merchant: input.merchant,
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
          });
          break;
        }
        case "largest_transaction": {
          result = await transactionService.getLargestTransaction({
            startDate: input.startDate,
            endDate: input.endDate,
            category: input.category,
            merchant: input.merchant,
          });
          break;
        }
        case "monthly_breakdown": {
          result = await transactionService.getMonthlySpend({
            startDate: input.startDate,
            endDate: input.endDate,
            category: input.category,
            merchant: input.merchant,
          });
          break;
        }
        default:
          throw new Error(`unsupported operation: ${input.operation}`);
      }

      return result;
    } catch (error: any) {
      throw error;
    }
  },
});
