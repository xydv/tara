import { pool } from "../src/db/client";
import { db } from "../src/db/client";
import { funds } from "../src/db/schema/funds";
import { fundNavs } from "../src/db/schema/fund-navs";
import { holdings } from "../src/db/schema/holdings";
import { transactions } from "../src/db/schema/transactions";
import { ingestFunds } from "../src/ingest/funds";
import { ingestHoldings } from "../src/ingest/holdings";
import { ingestTransactions } from "../src/ingest/transactions";

async function main() {
  const datasetPath = process.env.DATA_DIR || process.env.data_dir || process.argv[2];

  if (!datasetPath) {
    throw new Error("no dataset path");
  }

  console.log(`clearing database`);

  await db.delete(fundNavs);
  await db.delete(holdings);
  await db.delete(funds);
  await db.delete(transactions);
  console.log(`db cleaned.`);

  console.log(`ingesting data from: ${datasetPath}...`);

  const { fundsCount, navsCount } = await ingestFunds(
    `${datasetPath}/funds.json`
  );

  const { holdingsCount } = await ingestHoldings(
    `${datasetPath}/holdings.json`
  );

  const { transactionsCount } = await ingestTransactions(
    `${datasetPath}/transactions.json`
  );

  console.log(`funds: ${fundsCount}`);
  console.log(`nav points: ${navsCount}`);
  console.log(`holdings: ${holdingsCount}`);
  console.log(`transactions: ${transactionsCount}`);
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("ingestion failed:", error);
    await pool.end();
    process.exit(1);
  });
