import { pgTable, text, date, numeric, primaryKey, index } from "drizzle-orm/pg-core";
import { funds } from "./funds";

export const fundNavs = pgTable(
  "fund_navs",
  {
    fundId: text("fund_id")
      .notNull()
      .references(() => funds.id),
    date: date("date", { mode: "string" }).notNull(),
    nav: numeric("nav", { precision: 10, scale: 4 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.fundId, table.date] }),
    index("fund_navs_fund_id_date_idx").on(table.fundId, table.date),
  ]
);
