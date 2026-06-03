CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"merchant" text NOT NULL,
	"canonical_merchant" text NOT NULL,
	"category" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text NOT NULL,
	"memo" text
);
--> statement-breakpoint
CREATE TABLE "funds" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_navs" (
	"fund_id" text NOT NULL,
	"date" date NOT NULL,
	"nav" numeric(10, 4) NOT NULL,
	CONSTRAINT "fund_navs_fund_id_date_pk" PRIMARY KEY("fund_id","date")
);
--> statement-breakpoint
CREATE TABLE "holdings" (
	"fund_id" text NOT NULL,
	"fund_name" text NOT NULL,
	"units" numeric(20, 6) NOT NULL,
	"purchase_date" date NOT NULL,
	"purchase_nav" numeric(10, 4) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fund_navs" ADD CONSTRAINT "fund_navs_fund_id_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_fund_id_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "transactions_category_idx" ON "transactions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "transactions_canonical_merchant_idx" ON "transactions" USING btree ("canonical_merchant");--> statement-breakpoint
CREATE INDEX "transactions_date_category_idx" ON "transactions" USING btree ("date","category");--> statement-breakpoint
CREATE INDEX "fund_navs_fund_id_date_idx" ON "fund_navs" USING btree ("fund_id","date");--> statement-breakpoint
CREATE INDEX "holdings_fund_id_idx" ON "holdings" USING btree ("fund_id");