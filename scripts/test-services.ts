import { transactionService } from "../src/services/transaction";
import { fundService } from "../src/services/fund";
import { portfolioService } from "../src/services/portfolio";
import { pool } from "../src/db/client";

async function main() {
  console.log("testing services");

  const totalSpend = await transactionService.getTotalSpend();
  console.log("total spend:", totalSpend);

  const foodSpend = await transactionService.getTotalSpend({ category: "food" });
  console.log("total spend on food:", foodSpend);

  const categorySpend = await transactionService.getCategorySpend();
  console.log("category spend breakdown:", categorySpend);

  const topMerchants = await transactionService.getTopMerchants(5);
  console.log("top 5 merchants:", topMerchants);

  const largestTx = await transactionService.getLargestTransaction();
  console.log("largest transaction:", largestTx);

  const monthlySpend = await transactionService.getMonthlySpend();
  console.log("monthly spend:", monthlySpend);

  console.log("\ntesting fund service");

  const latestNav = await fundService.getLatestNav("fund_gold");
  console.log("latest nav for apex gold (fund_gold):", latestNav);

  const returnPct = await fundService.calculatePeriodReturn(
    "fund_gold",
    "2023-04-01",
    "2025-03-01"
  );
  console.log("apex gold 2-year return (%):", returnPct);

  const rankedFunds = await fundService.rankFunds();
  console.log("ranked funds by return:", rankedFunds);

  console.log("\ntesting portfolio service");

  const holdingReturns = await portfolioService.getHoldingReturns();
  console.log("individual holding returns:", holdingReturns);

  const portfolioSummary = await portfolioService.getPortfolioSummary();
  console.log("portfolio summary:", portfolioSummary);
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("test failed:", error);
    await pool.end();
    process.exit(1);
  });
