import { Mastra } from '@mastra/core/mastra';
import { registerApiRoute } from '@mastra/core/server';
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

          try {
            const response = await agent.generate(question);
            return c.json({
              answer: response.text
            });
          } catch (error: any) {
            return c.json({
              answer: "error occurred"
            });
          }
        },
      }),
    ],
  },
});
