import { db } from "../db/client";
import { transactions } from "../db/schema/transactions";
import { and, eq, gte, lte, sql, inArray, ne, desc } from "drizzle-orm";

export interface SpendFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  merchant?: string;
}

export class TransactionService {
  private tokenize(text: string): string[] {
    return text
      .toUpperCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  private getOverlapScore(queryTokens: string[], merchantTokens: string[]): number {
    let matches = 0;
    for (const qToken of queryTokens) {
      if (merchantTokens.some((mToken) => mToken.includes(qToken) || qToken.includes(mToken))) {
        matches++;
      }
    }
    return matches;
  }

  async findMerchants(query: string): Promise<string[]> {
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    const allMerchants = await db
      .selectDistinct({ canonicalMerchant: transactions.canonicalMerchant })
      .from(transactions);

    const scored = allMerchants
      .map((m) => {
        const merchantTokens = this.tokenize(m.canonicalMerchant);
        const score = this.getOverlapScore(queryTokens, merchantTokens);
        return { merchant: m.canonicalMerchant, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return [];
    const maxScore = scored[0].score;
    return scored
      .filter((item) => item.score === maxScore)
      .map((item) => item.merchant);
  }

  private async buildConditions(filters?: SpendFilters) {
    const conditions = [];
    if (filters?.category) {
      if (filters.category.toLowerCase().trim() === "transfer") {
        conditions.push(eq(transactions.category, "transfer"));
      } else {
        conditions.push(eq(transactions.category, filters.category.toLowerCase().trim()));
      }
    } else {
      // By default, exclude transfers from spending calculations
      conditions.push(ne(transactions.category, "transfer"));
    }
    if (filters?.startDate) {
      conditions.push(gte(transactions.date, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(transactions.date, filters.endDate));
    }
    if (filters?.merchant) {
      const matchedMerchants = await this.findMerchants(filters.merchant);
      if (matchedMerchants.length > 0) {
        conditions.push(inArray(transactions.canonicalMerchant, matchedMerchants));
      } else {
        conditions.push(eq(transactions.canonicalMerchant, "__NON_EXISTENT__"));
      }
    }
    return conditions;
  }

  async getTotalSpend(filters?: SpendFilters): Promise<number> {
    const conditions = await this.buildConditions(filters);

    const result = await db
      .select({ total: sql<string>`sum(${transactions.amount})` })
      .from(transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result[0]?.total ? parseFloat(result[0].total) : 0;
  }

  async getCategorySpend(filters?: SpendFilters): Promise<{ category: string; amount: number }[]> {
    const conditions = await this.buildConditions(filters);

    const result = await db
      .select({
        category: transactions.category,
        amount: sql<string>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(transactions.category)
      .orderBy(sql`sum(${transactions.amount}) desc`);

    return result.map((r) => ({
      category: r.category,
      amount: r.amount ? parseFloat(r.amount) : 0,
    }));
  }

  async getTopMerchants(limit: number = 5, filters?: SpendFilters): Promise<{ merchant: string; spend: number }[]> {
    const conditions = await this.buildConditions(filters);

    const result = await db
      .select({
        merchant: transactions.canonicalMerchant,
        spend: sql<string>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(transactions.canonicalMerchant)
      .orderBy(sql`sum(${transactions.amount}) desc`)
      .limit(limit);

    return result.map((r) => ({
      merchant: r.merchant,
      spend: r.spend ? parseFloat(r.spend) : 0,
    }));
  }

  async getLargestTransaction(filters?: SpendFilters) {
    const conditions = await this.buildConditions(filters);

    const result = await db
      .select()
      .from(transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${transactions.amount} desc`)
      .limit(1);

    if (!result[0]) return null;

    return {
      ...result[0],
      amount: parseFloat(result[0].amount),
    };
  }

  async getMonthlySpend(filters?: SpendFilters): Promise<{ month: string; amount: number }[]> {
    const conditions = await this.buildConditions(filters);
    const monthSql = sql<string>`to_char(${transactions.date}, 'YYYY-MM')`;

    const result = await db
      .select({
        month: monthSql,
        amount: sql<string>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(monthSql)
      .orderBy(monthSql);

    return result.map((r) => ({
      month: r.month,
      amount: r.amount ? parseFloat(r.amount) : 0,
    }));
  }

  async getTransactions(filters?: SpendFilters, limit?: number): Promise<any[]> {
    const conditions = await this.buildConditions(filters);
    const result = await db
      .select()
      .from(transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(transactions.date))
      .limit(limit || 1000);

    return result.map(r => ({
      ...r,
      amount: parseFloat(r.amount),
    }));
  }
}

export const transactionService = new TransactionService();
