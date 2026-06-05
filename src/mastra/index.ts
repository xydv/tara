import { Mastra } from '@mastra/core/mastra';
import { registerApiRoute } from '@mastra/core/server';
import { RequestContext } from '@mastra/core/request-context';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { logAskRequest } from '../tools/logger';
import { tara } from './agents/tara';

export const mastra = new Mastra({
  agents: { tara },
  server: {
    apiRoutes: [
      registerApiRoute('/ask', {
        method: 'POST',
        requiresAuth: false,
        handler: async (c) => {
          const body = await c.req.json();
          const question = body.question;
          const mastraInstance = c.get('mastra');
          const agent = mastraInstance.getAgent('tara');

          const requestId = randomUUID();
          const requestContext = new RequestContext();
          requestContext.set('requestId', requestId);
          requestContext.set('toolTraces', []);

          const startedAt = new Date().toISOString();
          const startTime = performance.now();

          try {
            const response = await agent.generate(question, { requestContext });
            const completedAt = new Date().toISOString();
            const durationMs = Math.round(performance.now() - startTime);
            const toolDetails = (requestContext.get('toolTraces') as any[]) || [];
            const toolCalls = toolDetails.length;
            const toolsCalled = toolDetails.map((t: any) => t.tool);
            const databaseTablesRead = Array.from(new Set(toolDetails.flatMap((t: any) => t.databaseTablesRead)));
            const intent = toolDetails.map((t: any) => t.operation).join(', ') || 'general';

            await logAskRequest({
              requestId,
              question,
              intent,
              startedAt,
              completedAt,
              durationMs,
              toolCalls,
              success: true,
              toolsCalled,
              toolDetails,
              databaseTablesRead,
            });

            return c.json({
              answer: response.text
            });
          } catch (error: any) {
            const completedAt = new Date().toISOString();
            const durationMs = Math.round(performance.now() - startTime);
            const toolDetails = (requestContext.get('toolTraces') as any[]) || [];
            const toolCalls = toolDetails.length;
            const toolsCalled = toolDetails.map((t: any) => t.tool);
            const databaseTablesRead = Array.from(new Set(toolDetails.flatMap((t: any) => t.databaseTablesRead)));
            const intent = toolDetails.map((t: any) => t.operation).join(', ') || 'general';

            await logAskRequest({
              requestId,
              question,
              intent,
              startedAt,
              completedAt,
              durationMs,
              toolCalls,
              success: false,
              toolsCalled,
              toolDetails,
              databaseTablesRead,
              errorMessage: error.message || String(error),
            });

            return c.json({
              answer: "error occurred"
            });
          }
        },
      }),
      registerApiRoute('/logs', {
        method: 'GET',
        requiresAuth: false,
        handler: async (c) => {
          const logFilePath = join(process.cwd(), 'logs', 'tara.log');
          if (!existsSync(logFilePath)) {
            return c.text('');
          }
          const content = await readFile(logFilePath, 'utf8');
          return c.text(content);
        },
      }),
    ],
  },
});
