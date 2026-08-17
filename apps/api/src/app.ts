import { healthResponseSchema } from '@goforlift/contracts';
import cors from 'cors';
import express from 'express';

type AppDependencies = {
  checkDatabaseConnection: () => Promise<void>;
  webOrigin: string;
};

export function createApp({
  checkDatabaseConnection,
  webOrigin,
}: AppDependencies) {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: webOrigin }));
  app.use(express.json());

  app.get('/health', async (_request, response) => {
    try {
      await checkDatabaseConnection();
      response
        .status(200)
        .json(
          healthResponseSchema.parse({ status: 'ok', database: 'connected' }),
        );
    } catch {
      response.status(503).json(
        healthResponseSchema.parse({
          status: 'unavailable',
          database: 'unavailable',
        }),
      );
    }
  });

  return app;
}
