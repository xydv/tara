import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const LOG_FILE = join(process.cwd(), "logs", "tara.log");

async function ensureLogDir() {
  await mkdir(join(process.cwd(), "logs"), { recursive: true });
}

export interface ToolTrace {
  tool: string;
  operation: string;
  input: any;
  databaseTablesRead: string[];
  durationMs: number;
  success: boolean;
  errorMessage?: string | null;
}

export interface AskRequestTrace {
  requestId: string;
  question: string;
  intent?: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  toolCalls: number;
  success: boolean;
  toolsCalled: string[];
  toolDetails: ToolTrace[];
  databaseTablesRead: string[];
  errorMessage?: string | null;
}

export async function logAskRequest(data: AskRequestTrace) {
  await ensureLogDir();
  const entry = JSON.stringify(data) + "\n";
  await appendFile(LOG_FILE, entry, "utf8");
}

export async function logToolExecution(data: {
  requestId: string;
  tool: string;
  operation: string;
  input: any;
  durationMs: number;
  success: boolean;
}) {
  await ensureLogDir();
  const entry = JSON.stringify(data) + "\n";
  await appendFile(LOG_FILE, entry, "utf8");
}
