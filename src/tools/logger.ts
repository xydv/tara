import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const LOG_FILE = join(process.cwd(), "logs", "tara.log");

async function ensureLogDir() {
  await mkdir(join(process.cwd(), "logs"), { recursive: true });
}

export async function logAskRequest(data: {
  requestId: string;
  question: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  toolCalls: number;
  success: boolean;
}) {
  await ensureLogDir();
  const entry = JSON.stringify({
    ...data,
  }) + "\n";
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
  const entry = JSON.stringify({
    ...data,
  }) + "\n";
  await appendFile(LOG_FILE, entry, "utf8");
}
