import { pgTable, text, date, numeric, index } from "drizzle-orm/pg-core";

export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    merchant: text("merchant").notNull(),
    canonicalMerchant: text("canonical_merchant").notNull(),
    category: text("category").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    memo: text("memo"),
  },
  (table) => [
    index("transactions_date_idx").on(table.date),
    index("transactions_category_idx").on(table.category),
    index("transactions_canonical_merchant_idx").on(table.canonicalMerchant),
    index("transactions_date_category_idx").on(table.date, table.category),
  ]
);
