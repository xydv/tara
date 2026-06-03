import { db } from "../db/client";
import { funds } from "../db/schema/funds";
import { fundNavs } from "../db/schema/fund-navs";
import { readJson } from "./utils";
import { normalizeCategory } from "./normalize";

interface NavPoint {
  date: string;
  value: number;
}

interface FundInput {
  id: string;
  name: string;
  category: string;
  nav?: NavPoint[];
}

export async function ingestFunds(filePath: string) {
  const data = await readJson<FundInput[]>(filePath);

  const fundsToInsert: Array<typeof funds.$inferInsert> = [];
  const navsToInsert: Array<typeof fundNavs.$inferInsert> = [];

  for (const fund of data) {
    if (!fund.id) {
      throw new Error("missing fund id");
    }
    if (!fund.name) {
      throw new Error(`missing name for fund: ${fund.id}`);
    }
    if (!fund.category) {
      throw new Error(`missing category for fund: ${fund.id}`);
    }

    fundsToInsert.push({
      id: fund.id,
      name: fund.name,
      category: normalizeCategory(fund.category),
    });

    if (fund.nav) {
      for (const point of fund.nav) {
        if (!point.date) {
          throw new Error(`missing date in NAV point for fund: ${fund.id}`);
        }
        if (point.value === undefined || point.value === null) {
          throw new Error(`missing value in NAV point for fund: ${fund.id}`);
        }

        navsToInsert.push({
          fundId: fund.id,
          date: point.date,
          nav: point.value.toString(),
        });
      }
    }
  }

  if (fundsToInsert.length > 0) {
    await db.insert(funds).values(fundsToInsert);
  }

  if (navsToInsert.length > 0) {
    await db.insert(fundNavs).values(navsToInsert);
  }

  return {
    fundsCount: fundsToInsert.length,
    navsCount: navsToInsert.length,
  };
}
