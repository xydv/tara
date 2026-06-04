import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export async function logToolCall(data: {
  tool: string;
  operation: string;
  input: any;
  durationMs: number;
  success: boolean;
  error?: string;
}) {
  const logDir = join(process.cwd(), "logs");
  await mkdir(logDir, { recursive: true });

  const logFilePath = join(logDir, "tool-calls.jsonl");
  const logEntry =
    JSON.stringify({
      timestamp: new Date().toISOString(),
      ...data,
    }) + "\n";

  await appendFile(logFilePath, logEntry, "utf8");
}
