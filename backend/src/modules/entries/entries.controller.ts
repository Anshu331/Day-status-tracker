import type { Request, Response } from 'express';
import { requireUser } from '../../middleware/authenticate.js';
import {
  entryDateParamsSchema,
  listEntriesQuerySchema,
  upsertEntryBodySchema,
} from './entries.schemas.js';
import type { EntriesService } from './entries.service.js';

export function createEntriesController(entriesService: EntriesService) {
  return {
    async list(req: Request, res: Response): Promise<void> {
      const { from, to } = listEntriesQuerySchema.parse(req.query);
      res.json({ data: await entriesService.listInRange(from, to) });
    },

    async getByDate(req: Request, res: Response): Promise<void> {
      const { date } = entryDateParamsSchema.parse(req.params);
      res.json({ data: await entriesService.getByDate(date) });
    },

    async upsert(req: Request, res: Response): Promise<void> {
      const { date } = entryDateParamsSchema.parse(req.params);
      const input = upsertEntryBodySchema.parse(req.body);
      const { entry, created } = await entriesService.save(date, input, requireUser(req));
      res.status(created ? 201 : 200).json({ data: entry });
    },

    async remove(req: Request, res: Response): Promise<void> {
      const { date } = entryDateParamsSchema.parse(req.params);
      await entriesService.remove(date);
      res.status(204).end();
    },
  };
}
