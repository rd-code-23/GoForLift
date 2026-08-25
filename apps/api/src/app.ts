/** Composes the Express API and its application-wide middleware. */
import { healthResponseSchema } from '@goforlift/contracts';
import cors from 'cors';
import express, { type RequestHandler, type Router } from 'express';

const JSON_BODY_LIMIT = '100kb';

type ExpressBodyError = Error & {
  type?: string;
};

function isExpressBodyError(error: unknown, type: string) {
  return error instanceof Error && (error as ExpressBodyError).type === type;
}

type AppDependencies = {
  authRouter: Router;
  checkDatabaseConnection: () => Promise<void>;
  csrfErrorHandler: express.ErrorRequestHandler;
  csrfProtection: RequestHandler;
  exerciseRouter: Router;
  sessionMiddleware: RequestHandler;
  trustProxyHops: number;
  webOrigin: string;
};

export function createApp({
  authRouter,
  checkDatabaseConnection,
  csrfErrorHandler,
  csrfProtection,
  exerciseRouter,
  sessionMiddleware,
  trustProxyHops,
  webOrigin,
}: AppDependencies) {
  const app = express();

  app.disable('x-powered-by');
  if (trustProxyHops > 0) {
    app.set('trust proxy', trustProxyHops);
  }
  app.use(cors({ origin: webOrigin, credentials: true }));
  app.use(sessionMiddleware);
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(csrfProtection);
  app.use('/auth', authRouter);
  app.use('/exercises', exerciseRouter);

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

  app.use(csrfErrorHandler);
  app.use(((error, _request, response, next) => {
    void next;

    if (isExpressBodyError(error, 'entity.parse.failed')) {
      response.status(400).json({ error: 'invalid_json' });
      return;
    }

    if (isExpressBodyError(error, 'entity.too.large')) {
      response.status(413).json({ error: 'request_too_large' });
      return;
    }

    console.error('API request failed');
    response.status(500).json({ error: 'internal_server_error' });
  }) satisfies express.ErrorRequestHandler);

  return app;
}
