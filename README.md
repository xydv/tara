# tara — finance-research agent

tara is an ai-powered agentic financial assistant built using the mastra framework, typescript, drizzle orm, and postgresql. it enables users to ask complex questions about personal transactions, spending trends, mutual fund returns, and investment portfolio values.

---

## technical stack & configuration

- **framework**: mastra (v1.x)
- **runtime**: node.js (>= 22.13.0)
- **language**: typescript
- **database**: postgresql (queried using drizzle orm)
- **llm provider**: mistral ai
- **llm model**: `mistral/mistral-large-latest`

---

## environment variables

create a `.env` file in the root directory with the following variables (a `.env.example` is given for reference):

```env
database_url="postgresql://postgres:postgres@localhost:5432/tara"
mistral_api_key="your-mistral-api-key"
```

---

## local development & nix/devenv setup

this project is configured with nix and `devenv` for a reproducible development environment.

### running without nix
if you are not using nix, you can run the project using standard node.js:
1. ensure you have node.js (>= 22.13.0) installed on your system.
2. install dependencies:
   ```bash
   npm install
   ```
3. configure your `.env` file as described above.
4. follow the database setup and server execution steps below.

### 1. entering the shell (optional)
to start the shell and automatically load your local environment variables via `secretspec`:
```bash
devenv --secretspec-provider dotenv shell
```

### 2. database setup
to set up your local postgresql instance:
1. ensure a postgresql database exists at the connection string specified in your `.env`.
2. generate and run the migrations to create the schema (`transactions`, `funds`, `fund_navs`, `holdings`):
   ```bash
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```
3. run the data ingestion script to load sample data (`data/sample_a/`):
   ```bash
   data_dir=./data/sample_a npx tsx scripts/ingest.ts
   ```

### 3. running the server
to run the mastra dev server locally:
```bash
npm run dev
```
the server will start at:
- **api server**: `http://localhost:4111`
- **mastra console / studio**: `http://localhost:4111`

### 4. running verification tests
- **test services**: `npm run test-services`
- **test tools**: `npm run test-tools`
- **test agent**: `npm run test-agent`

---

## api endpoints

### 1. ask tara (`post /ask`)
sends a financial query to the agent.

- **request**:
  ```bash
  curl -x post http://localhost:4111/ask \
    -h "content-type: application/json" \
    -d '{"question": "how much did i spend on food in march 2025 after refunds?"}'
  ```
- **response**:
  ```json
  {
    "answer": "..."
  }
  ```

### 2. view logs (`get /logs`)
retrieves the unified request and tool execution logs.

- **request**:
  ```bash
  curl http://localhost:4111/logs
  ```

---

## unified logging & tracing

all `/ask` requests and tool executions are traced and logged to `logs/tara.log` as structured json lines. the logs capture:
- unique `requestid` uuid
- original user question
- detected user intent (mapped from execution operations)
- an ordered list of tools called (`toolscalled`)
- sanitized tool inputs & detailed trace of each tool execution (`tooldetails`)
- list of database tables read (`databasetablesread` - e.g. `["transactions"]` or `["funds", "fund_navs"]`)
- request latency (`durationms`)
- status (`success` boolean) and error messages/fallback reasons when applicable

---

## deployment

the production environment is hosted and deployed on hetzner cloud infrastructure.

to build the production bundle:
```bash
npm run build
```
to run the built server:
```bash
npm run start
```