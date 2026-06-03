import { db } from "../db/client";
import { holdings } from "../db/schema/holdings";
import { readJson } from "./utils";

interface HoldingInput {
  fund_id: string;
  fund_name: string;
  units: number;
  purchase_date: string;
  purchase_nav: number;
}

export async function ingestHoldings(filePath: string) {
  const data = await readJson<HoldingInput[]>(filePath);

  const holdingsToInsert: Array<typeof holdings.$inferInsert> = [];

  for (const row of data) {
    if (!row.fund_id) {
      throw new Error("missing fund_id in holding record");
    }
    if (!row.fund_name) {
      throw new Error(`missing fund_name for fund: ${row.fund_id}`);
    }
    if (row.units === undefined || row.units === null) {
      throw new Error(`missing units for fund: ${row.fund_id}`);
    }
    if (!row.purchase_date) {
      throw new Error(`missing purchase_date for fund: ${row.fund_id}`);
    }
    if (row.purchase_nav === undefined || row.purchase_nav === null) {
      throw new Error(`missing purchase_nav for fund: ${row.fund_id}`);
    }

    holdingsToInsert.push({
      fundId: row.fund_id,
      fundName: row.fund_name,
      units: row.units.toString(),
      purchaseDate: row.purchase_date,
      purchaseNav: row.purchase_nav.toString(),
    });
  }

  if (holdingsToInsert.length > 0) {
    await db.insert(holdings).values(holdingsToInsert);
  }

  return {
    holdingsCount: holdingsToInsert.length,
  };
}
