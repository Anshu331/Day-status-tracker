import { Router, type RequestHandler } from 'express';
import { createEntriesController } from './entries.controller.js';
import type { EntriesService } from './entries.service.js';

interface EntriesRouterDependencies {
  entriesService: EntriesService;
  authenticate: RequestHandler;
}

export function createEntriesRouter({ entriesService, authenticate }: EntriesRouterDependencies) {
  const router = Router();
  const controller = createEntriesController(entriesService);

  router.get('/', controller.list);
  router.get('/:date', controller.getByDate);
  router.put('/:date', authenticate, controller.upsert);
  router.delete('/:date', authenticate, controller.remove);

  return router;
}
