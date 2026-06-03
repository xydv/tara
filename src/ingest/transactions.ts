import { db } from "../db/client";
import { transactions } from "../db/schema/transactions";
import { readJson } from "./utils";
import { normalizeCategory, normalizeMerchant } from "./normalize";

interface TransactionInput {
  id: string;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  currency: string;
  memo?: string;
}

export async function ingestTransactions(filePath: string) {
  const data = await readJson<TransactionInput[]>(filePath);

  const txsToInsert: Array<typeof transactions.$inferInsert> = [];

  for (const row of data) {
    if (!row.id) {
      throw new Error("missing transaction id");
    }
    if (!row.date) {
      throw new Error(`missing date for transaction: ${row.id}`);
    }
    if (!row.merchant) {
      throw new Error(`missing merchant for transaction: ${row.id}`);
    }
    if (!row.category) {
      throw new Error(`missing category for transaction: ${row.id}`);
    }
    if (row.amount === undefined || row.amount === null) {
      throw new Error(`missing amount for transaction: ${row.id}`);
    }
    if (!row.currency) {
      throw new Error(`missing currency for transaction: ${row.id}`);
    }

    txsToInsert.push({
      id: row.id,
      date: row.date,
      merchant: row.merchant,
      canonicalMerchant: normalizeMerchant(row.merchant),
      category: normalizeCategory(row.category),
      amount: row.amount.toString(),
      currency: row.currency,
      memo: row.memo || null,
    });
  }

  if (txsToInsert.length > 0) {
    await db.insert(transactions).values(txsToInsert);
  }

  return {
    transactionsCount: txsToInsert.length,
  };
}
