import { z } from 'zod';
import { daysBetween, isValidIsoDate, MAX_YEAR, MIN_YEAR } from '../../lib/date.js';
import { DAY_STATUSES, MAX_RANGE_DAYS, NOTE_MAX_LENGTH } from './entries.model.js';

// fatal, otherwise zod still runs the range refinements below on an invalid date
export const isoDateSchema = z.string().superRefine((value, ctx) => {
  if (!isValidIsoDate(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Must be a real calendar date in YYYY-MM-DD format between ${MIN_YEAR} and ${MAX_YEAR}`,
      fatal: true,
    });
  }
});

export const entryDateParamsSchema = z.object({ date: isoDateSchema });

export const listEntriesQuerySchema = z
  .object({ from: isoDateSchema, to: isoDateSchema })
  .refine(({ from, to }) => from <= to, {
    message: '`from` must be on or before `to`',
    path: ['from'],
  })
  .refine(({ from, to }) => from > to || daysBetween(from, to) < MAX_RANGE_DAYS, {
    message: `Date range may span at most ${MAX_RANGE_DAYS} days`,
    path: ['to'],
  });

export const upsertEntryBodySchema = z
  .object({
    status: z.enum(DAY_STATUSES, {
      errorMap: () => ({ message: `Status must be one of: ${DAY_STATUSES.join(', ')}` }),
    }),
    note: z
      .string()
      .trim()
      .max(NOTE_MAX_LENGTH, `Note must be at most ${NOTE_MAX_LENGTH} characters`)
      .default(''),
  })
  .strict();
