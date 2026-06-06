# tara — architecture & design document

this document outlines the engineering decisions, database schema, mathematical models, and design patterns implemented in **tara**.

---

## 1. postgresql schema design

our database design utilizes postgresql types that prioritize exact mathematical correctness and query performance.

### database tables

#### transactions
the single source of truth for all bank/upi transactions.

| column | type | notes |
| :--- | :--- | :--- |
| id | text pk | from source json |
| date | date | transaction date |
| merchant | text | raw merchant name (preserved for display) |
| canonical_merchant | text | normalised merchant name (computed at ingest, used for fuzzy search) |
| category | text | from source; may be uncategorized — never skipped |
| amount | numeric(12,2) | positive = spend, negative = refund |
| currency | text | default inr |
| memo | text | raw upi/neft ref — treated as untrusted, never parsed |

- **indexes**: `transactions_date_idx`, `transactions_category_idx`, `transactions_canonical_merchant_idx`, `transactions_date_category_idx`
- **rationale for canonical_merchant**: raw names vary widely ("swiggy*order", "swiggy instamart", "swiggy bangalore"). normalising at ingest time makes fuzzy search (ilike '%swiggy%') reliable without hardcoded alias lists.

#### funds
mutual fund master list. one row per fund.

| column | type | notes |
| :--- | :--- | :--- |
| id | text pk | stable fund identifier |
| name | text | human-readable name |
| category | text | e.g., large_cap, index, debt |

#### fund_navs
daily nav history. the source json has a nested nav array — the ingest script explodes it to one row per (fund_id, date).

| column | type | notes |
| :--- | :--- | :--- |
| fund_id | text fk → funds | |
| date | date pk | |
| nav | numeric(10,4) | |

- **indexes**: `fund_navs_fund_id_date_idx`

#### holdings
user's current mutual fund positions. one row per fund.

| column | type | notes |
| :--- | :--- | :--- |
| fund_id | text fk → funds | |
| fund_name | text | denormalised for fast display |
| units | numeric(20,6) | units held |
| purchase_date | date | date of purchase |
| purchase_nav | numeric(10,4) | nav at purchase time |

- **indexes**: `holdings_fund_id_idx`


### key design choices
- **exact numeric types**: all transaction amounts, units, purchase navs, and current navs are stored using the `numeric` (decimal) database type.
- **indexes**:
  - `fund_navs_fund_id_date_idx` on `(fund_id, date)`: optimizes query resolution when searching for nav values between start/end dates.
  - `holdings_fund_id_idx` on `fund_id`: ensures fast joins and filters when fetching details for a particular holding.
- **foreign keys**: `fund_navs.fund_id` and `holdings.fund_id` reference `funds.id` to guarantee database-level referential integrity.

---

## 2. tool partitioning & design

we partitioned the agent's functionality into three distinct tools to optimize llm query understanding and limit context length:

1.  **`financetool`**: manages all transaction-related queries (spending totals, category breakdowns, merchant ranks, list transactions). it isolates credit card/checking activity from the investment domain.
2.  **`fundtool`**: resolves public market mutual fund analytics (historical nav details, general period performance, fund return rankings).
3.  **`portfoliotool`**: scopes user-owned asset data (aggregate portfolio value, total cost basis, absolute inr gains, realised holding returns).

**why this division?** it maps cleanly to semantic contexts. the llm does not need to choose from a massive list of individual functions; instead, it selects the domain-appropriate tool and passes the normalized parameters.

---

## 3. data grounding & hallucination prevention

to guarantee that tara only answers questions using actual database entries, we implemented the following strategies:

- **system context injection**: we inject the dynamic current system iso time (`new date().toisostring()`) directly into the prompt. the llm reasons relative to this time to resolve boundaries (e.g., "q1 2025" or "march") to strict `yyyy-mm-dd` strings *before* executing tools, avoiding hardcoded date ranges.
- **strict grounding rules**: the system prompt instructs tara to never answer from general knowledge. if the tools return no records or throw errors, tara must explain that the data is missing rather than inventing figures.
- **transfers exclusion**: to prevent self-transfers (which are not true spending) from polluting total spending metrics, the transaction service excludes the `transfer` category by default unless explicitly asked.
- **command injection prevention**: transaction memos are treated as untrusted data. instructions guide the llm to inspect them solely as text data, ignoring any embedded instructions or command keywords.

---

## 4. mathematical models & algorithms

### spend and net spend
- **spend**: sum of transaction amounts where the category is not `"transfer"`.
- **net spend**: sum of transaction amounts over the selected period. since refunds are stored as negative amounts, they naturally reduce the final sum:
  $$\text{net spend} = \sum (\text{positive expenses}) - \sum (|\text{negative refunds}|)$$

### merchant matching
rather than relying on static, hardcoded merchant alias dictionaries, we resolve names dynamically using tokenization and overlapping string similarity:
1.  tokenize the search query (e.g., `"swiggy"`) by converting it to uppercase and stripping non-word characters.
2.  retrieve unique canonical merchants from the database and score their token overlaps.
3.  filter and retrieve the highest-scoring canonical merchants, executing the database query using an `inarray` clause containing the matching merchants (e.g., matching `"swiggy"`, `"swiggy instamart"`, `"swiggy@ybl"`).

### recurring subscriptions detection
1.  fetch transaction history using `list_transactions`.
2.  group transactions by merchant.
3.  identify groups where transactions occur at regular monthly intervals (~30 day delta) with matching or highly similar amounts (e.g., a recurring netflix subscription charge of 649 inr).

### period return (fund only)
computes the growth of a fund over a specific window of time:
$$\text{period return \%} = \frac{\text{nav}_{\text{end}} - \text{nav}_{\text{start}}}{\text{nav}_{\text{start}}} \times 100$$
*fallback*: if the exact start/end dates do not exist in the database, the service queries for the nearest available nav on or after the start date, and the nearest available nav on or before the end date.

### realised return (user holding)
computes the gain or loss on the user's actual purchased units:
$$\text{realised return \%} = \frac{\text{nav}_{\text{latest}} - \text{nav}_{\text{purchase}}}{\text{nav}_{\text{purchase}}} \times 100$$
this correctly separates "how the fund grew" from "how much money the user made on their specific holding."

### portfolio metrics

- **portfolio current value**: the sum of the current valuation of all holdings:
  $$\text{portfolio current value} = \sum (\text{units} \times \text{nav}_{\text{latest}})$$
- **portfolio total gain (inr)**: the absolute returns in inr across all assets:
  $$\text{portfolio total gain (inr)} = \text{portfolio current value} - \text{portfolio total cost}$$
  where the total cost basis is:
  $$\text{portfolio total cost} = \sum (\text{units} \times \text{nav}_{\text{purchase}})$$
- **portfolio total gain (%)**: the total percentage gain relative to the overall cost basis:
  $$\text{portfolio total gain \%} = \frac{\text{portfolio total gain (inr)}}{\text{portfolio total cost}} \times 100$$

---

## 5. verification & evals

we created three targeted scripts to evaluate and verify correctness:
1.  **`test-services.ts`**: verifies database connections and queries (total spend, fuzzy merchant resolution, period return math, and database table joins).
2.  **`test-tools.ts`**: assures that tool boundaries properly capture input parameters and return the expected structured json outputs.
3.  **`test-agent.ts`**: evaluates end-to-end llm performance on complex questions (such as largest expenses, date ranges, and fund vs holding return comparisons).

---

## 6. observability & telemetry

all requests are logged to `logs/tara.log` as newline-delimited json. we leverage mastra's `requestcontext` to share a unique `requestid` across all asynchronous tool boundaries.

### logging schema
each request log contains:
- `requestid` (uuid)
- `question` (original query)
- `intent` (comma-separated operations executed)
- `startedat` & `completedat` (timestamps)
- `durationms` (request latency)
- `success` (boolean)
- `toolscalled` (array of tool names in execution order)
- `databasetablesread` (unique list of tables accessed)
- `tooldetails` (sanitized inputs, latency, tables read, and errors *per tool execution*)
- `errormessage` (failure details when applicable)

### inspecting a failed run
1.  run `curl http://localhost:4111/logs` to retrieve the logs.
2.  filter the entries to find any logs where `success` is `false`.
3.  inspect the `errormessage` at the request root level, or look inside `tooldetails` to identify which nested tool call failed, showing the specific inputs, latency, and tables read at that moment.

---

## 7. optional milestone: async tool calls

**decision**: not implemented, as we chose to run all tools **synchronously**.

**rationale**: for our present dataset scale, database queries and computations (even ranking all mutual funds) execute in under 100ms. introducing a background queue manager (like bullmq or rabbitmq) and a cache state store (like redis) would add significant architectural overhead, complexity, and polling endpoints without offering any noticeable latency benefit. running tools synchronously keeps the codebase simple, fast, and deterministic.

---

## 8. deployment tradeoffs

- **architecture**: designed to be deployed as a docker container or directly onto nix environments using `devenv`.
- **database tradeoff**: we use postgresql. locally, this runs in nix or docker. for production, a managed postgres instance (e.g., aws rds or neon) provides auto-scaling and high availability but introduces a minor network latency overhead compared to a local instance.
- **serverless vs. vm**: exposing the api through a persistent node.js/hono server on a virtual machine (e.g., aws ec2 or fly.io) keeps database connections active and warm (~5ms query execution), whereas deploying via serverless functions (like vercel or netlify) would yield scale-to-zero pricing but suffer from cold starts and database connection overhead.

---

## 9. failure modes & future improvements

1.  **ambiguous merchant names**: a transaction with a generic merchant name (e.g., "store") might cause incorrect token overlap scoring. *improvement*: integrate semantic similarity search (using vector embeddings) to find similar merchants rather than purely token-based comparisons.
2.  **llm eval pipeline**: set up a continuous integration pipeline using `@mastra/evals` to run synthetic user questions and check the answers against database values.
