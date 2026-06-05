import { db } from "../db/client";
import { funds } from "../db/schema/funds";
import { fundNavs } from "../db/schema/fund-navs";
import { eq, asc, desc, and, gte, lte, sql } from "drizzle-orm";

export class FundService {
  async resolveFundId(identifier: string): Promise<string | null> {
    if (!identifier) return null;

    // 1. Check if there is an exact match by ID
    const byId = await db
      .select()
      .from(funds)
      .where(eq(funds.id, identifier))
      .limit(1);
    if (byId[0]) return byId[0].id;

    // 2. Check for exact match by name (case-insensitive)
    const byName = await db
      .select()
      .from(funds)
      .where(sql`lower(${funds.name}) = ${identifier.trim().toLowerCase()}`)
      .limit(1);
    if (byName[0]) return byName[0].id;

    // 3. Try fuzzy/substring match
    const allFunds = await db.select().from(funds);
    const normalizedQuery = identifier.toLowerCase();
    for (const f of allFunds) {
      if (
        f.name.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.includes(f.name.toLowerCase())
      ) {
        return f.id;
      }
    }

    return null;
  }

  async getLatestNav(fundId: string): Promise<number> {
    const resolvedId = await this.resolveFundId(fundId) || fundId;
    const result = await db
      .select()
      .from(fundNavs)
      .where(eq(fundNavs.fundId, resolvedId))
      .orderBy(desc(fundNavs.date))
      .limit(1);

    return result[0] ? parseFloat(result[0].nav) : 0;
  }

  async calculatePeriodReturn(
    fundId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    const resolvedId = await this.resolveFundId(fundId) || fundId;
    const startNavResult = await db
      .select()
      .from(fundNavs)
      .where(and(eq(fundNavs.fundId, resolvedId), gte(fundNavs.date, startDate)))
      .orderBy(asc(fundNavs.date))
      .limit(1);

    const endNavResult = await db
      .select()
      .from(fundNavs)
      .where(and(eq(fundNavs.fundId, resolvedId), lte(fundNavs.date, endDate)))
      .orderBy(desc(fundNavs.date))
      .limit(1);

    if (!startNavResult[0] || !endNavResult[0]) {
      throw new Error("nav data not found");
    }

    const startNav = parseFloat(startNavResult[0].nav);
    const endNav = parseFloat(endNavResult[0].nav);

    if (startNav === 0) return 0;

    return ((endNav - startNav) / startNav) * 100;
  }

  async rankFunds(): Promise<{ fundId: string; fund: string; returnPct: number }[]> {
    const allFunds = await db.select().from(funds);
    const ranked: { fundId: string; fund: string; returnPct: number }[] = [];

    for (const f of allFunds) {
      const earliest = await db
        .select()
        .from(fundNavs)
        .where(eq(fundNavs.fundId, f.id))
        .orderBy(asc(fundNavs.date))
        .limit(1);

      const latest = await db
        .select()
        .from(fundNavs)
        .where(eq(fundNavs.fundId, f.id))
        .orderBy(desc(fundNavs.date))
        .limit(1);

      if (earliest[0] && latest[0]) {
        const startVal = parseFloat(earliest[0].nav);
        const endVal = parseFloat(latest[0].nav);
        const returnPct = startVal !== 0 ? ((endVal - startVal) / startVal) * 100 : 0;
        ranked.push({
          fundId: f.id,
          fund: f.name,
          returnPct: parseFloat(returnPct.toFixed(2)),
        });
      }
    }

    return ranked.sort((a, b) => b.returnPct - a.returnPct);
  }
}

export const fundService = new FundService();
