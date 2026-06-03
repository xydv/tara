import { pgTable, text } from "drizzle-orm/pg-core";

export const funds = pgTable("funds", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
});
