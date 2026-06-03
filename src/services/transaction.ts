import { db } from "../db/client";
import { transactions } from "../db/schema/transactions";
import { and, eq, gte, lte, sql } from "drizzle-orm";

export interface SpendFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
}

export class TransactionService {
  async getTotalSpend(filters?: SpendFilters): Promise<number> {
    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(transactions.category, filters.category.toLowerCase().trim()));
    }
    if (filters?.startDate) {
      conditions.push(gte(transactions.date, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(transactions.date, filters.endDate));
    }

    const result = await db
      .select({ total: sql<string>`sum(${transactions.amount})` })
      .from(transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result[0]?.total ? parseFloat(result[0].total) : 0;
  }

  async getCategorySpend(): Promise<{ category: string; amount: number }[]> {
    const result = await db
      .select({
        category: transactions.category,
        amount: sql<string>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .groupBy(transactions.category)
      .orderBy(sql`sum(${transactions.amount}) desc`);

    return result.map((r) => ({
      category: r.category,
      amount: r.amount ? parseFloat(r.amount) : 0,
    }));
  }

  async getTopMerchants(limit: number = 5): Promise<{ merchant: string; spend: number }[]> {
    const result = await db
      .select({
        merchant: transactions.canonicalMerchant,
        spend: sql<string>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .groupBy(transactions.canonicalMerchant)
      .orderBy(sql`sum(${transactions.amount}) desc`)
      .limit(limit);

    return result.map((r) => ({
      merchant: r.merchant,
      spend: r.spend ? parseFloat(r.spend) : 0,
    }));
  }

  async getLargestTransaction() {
    const result = await db
      .select()
      .from(transactions)
      .orderBy(sql`${transactions.amount} desc`)
      .limit(1);

    if (!result[0]) return null;

    return {
      ...result[0],
      amount: parseFloat(result[0].amount),
    };
  }

  async getMonthlySpend(): Promise<{ month: string; amount: number }[]> {
    const monthSql = sql<string>`to_char(${transactions.date}, 'YYYY-MM')`;
    const result = await db
      .select({
        month: monthSql,
        amount: sql<string>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .groupBy(monthSql)
      .orderBy(monthSql);

    return result.map((r) => ({
      month: r.month,
      amount: r.amount ? parseFloat(r.amount) : 0,
    }));
  }
}

export const transactionService = new TransactionService();
