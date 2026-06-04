
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from "@mastra/duckdb";
import { MastraCompositeStore } from '@mastra/core/storage';
import { Observability, MastraStorageExporter, MastraPlatformExporter, SensitiveDataFilter } from '@mastra/observability';
import { registerApiRoute } from '@mastra/core/server';
import { weatherWorkflow } from './workflows/weather-workflow';
import { tara } from './agents/tara';
import { toolCallAppropriatenessScorer, completenessScorer, translationScorer } from './scorers/weather-scorer';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { tara },
  scorers: { toolCallAppropriatenessScorer: toolCallAppropriatenessScorer, completenessScorer, translationScorer },
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
          const response = await agent.generate(question);
          return c.json({
            answer: response.text,
            toolCalls: response.toolCalls || [],
          });
        },
      }),
    ],
  },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: "mastra-storage",
      url: "file:./mastra.db",
    }),
    domains: {
      observability: await new DuckDBStore().getStore('observability'),
    }
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new MastraStorageExporter(), // Persists observability events to Mastra Storage
          new MastraPlatformExporter(), // Sends observability events to Mastra Platform (if MASTRA_PLATFORM_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});
