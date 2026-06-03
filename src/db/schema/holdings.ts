import { pgTable, text, date, numeric, index } from "drizzle-orm/pg-core";
import { funds } from "./funds";

export const holdings = pgTable(
  "holdings",
  {
    fundId: text("fund_id")
      .notNull()
      .references(() => funds.id),
    fundName: text("fund_name").notNull(),
    units: numeric("units", { precision: 20, scale: 6 }).notNull(),
    purchaseDate: date("purchase_date", { mode: "string" }).notNull(),
    purchaseNav: numeric("purchase_nav", { precision: 10, scale: 4 }).notNull(),
  },
  (table) => [
    index("holdings_fund_id_idx").on(table.fundId),
  ]
);
