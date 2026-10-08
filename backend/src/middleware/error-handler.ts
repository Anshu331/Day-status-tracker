import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, NotFoundError } from '../lib/errors.js';
import type { Logger } from '../lib/logger.js';

// body-parser errors (malformed JSON, payload too large)
interface HttpLikeError {
  status?: number;
  statusCode?: number;
  expose?: boolean;
  type?: string;
  message: string;
}

const isHttpLikeError = (error: unknown): error is HttpLikeError =>
  error instanceof Error && ('status' in error || 'statusCode' in error);

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
};

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error instanceof ZodError) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      });
      return;
    }

    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
      return;
    }

    if (isHttpLikeError(error)) {
      const status = error.status ?? error.statusCode ?? 500;
      if (status >= 400 && status < 500 && error.expose !== false) {
        const isMalformedJson = error.type === 'entity.parse.failed';
        res.status(status).json({
          error: {
            code: isMalformedJson ? 'MALFORMED_JSON' : 'BAD_REQUEST',
            message: isMalformedJson ? 'Request body contains malformed JSON' : error.message,
          },
        });
        return;
      }
    }

    (req.log ?? logger).error({ err: error }, 'Unhandled error');
    res.status(500).json({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
    });
  };
}
