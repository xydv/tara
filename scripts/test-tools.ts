import { financeTool } from "../src/tools/finance";
import { fundTool } from "../src/tools/fund";
import { portfolioTool } from "../src/tools/portfolio";
import { pool } from "../src/db/client";

async function main() {
  console.log("testing tools");

  // @ts-ignore
  const topMerchants = await financeTool.execute({
    operation: "top_merchants",
    limit: 5,
  });
  console.log("top merchants:", topMerchants);

  // @ts-ignore
  const totalSpendFood = await financeTool.execute({
    operation: "total_spend",
    category: "food",
  });
  console.log("total spend on food:", totalSpendFood);

  // @ts-ignore
  const fundRanking = await fundTool.execute({
    operation: "fund_ranking",
  },);
  console.log("fund ranking:", fundRanking);

  // @ts-ignore
  const portfolioSummary = await portfolioTool.execute({
    operation: "portfolio_summary",
  });
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
