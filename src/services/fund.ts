import { db } from "../db/client";
import { funds } from "../db/schema/funds";
import { fundNavs } from "../db/schema/fund-navs";
import { eq, asc, desc, and, gte, lte } from "drizzle-orm";

export class FundService {
  async getLatestNav(fundId: string): Promise<number> {
    const result = await db
      .select()
      .from(fundNavs)
      .where(eq(fundNavs.fundId, fundId))
      .orderBy(desc(fundNavs.date))
      .limit(1);

    return result[0] ? parseFloat(result[0].nav) : 0;
  }

  async calculatePeriodReturn(
    fundId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    const startNavResult = await db
      .select()
      .from(fundNavs)
      .where(and(eq(fundNavs.fundId, fundId), gte(fundNavs.date, startDate)))
      .orderBy(asc(fundNavs.date))
      .limit(1);

    const endNavResult = await db
      .select()
      .from(fundNavs)
      .where(and(eq(fundNavs.fundId, fundId), lte(fundNavs.date, endDate)))
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

  async rankFunds(): Promise<{ fund: string; returnPct: number }[]> {
    const allFunds = await db.select().from(funds);
    const ranked: { fund: string; returnPct: number }[] = [];

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
          fund: f.name,
          returnPct: parseFloat(returnPct.toFixed(2)),
        });
      }
    }

    return ranked.sort((a, b) => b.returnPct - a.returnPct);
  }
}

export const fundService = new FundService();
