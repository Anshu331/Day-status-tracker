import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  createAuthenticatedAgent,
  createTestApp,
  createTestDatabase,
  TEST_USER,
  type TestApp,
  type TestDatabase,
} from './helpers.js';

type Agent = Awaited<ReturnType<typeof createAuthenticatedAgent>>;

describe('entries API', () => {
  let testDb: TestDatabase;
  let ctx: TestApp;
  let agent: Agent;

  beforeAll(async () => {
    testDb = await createTestDatabase();
  });

  afterAll(() => testDb.close());

  beforeEach(async () => {
    await testDb.reset();
    ctx = createTestApp(testDb.db);
    agent = await createAuthenticatedAgent(ctx);
  });

  describe('public reads', () => {
    it('lists entries in a range without authentication', async () => {
      await agent.put('/api/entries/2026-03-10').send({ status: 'great', note: 'Shipped v1' });
      await agent.put('/api/entries/2026-04-01').send({ status: 'bad' });

      const res = await request(ctx.app)
        .get('/api/entries')
        .query({ from: '2026-03-01', to: '2026-03-31' })
        .expect(200);

      expect(res.body.data).toEqual([
        expect.objectContaining({ date: '2026-03-10', status: 'great', note: 'Shipped v1' }),
      ]);
    });

    it('returns a single entry including who last updated it', async () => {
      await agent.put('/api/entries/2026-03-10').send({ status: 'good', note: 'Solid day' });

      const res = await request(ctx.app).get('/api/entries/2026-03-10').expect(200);

      expect(res.body.data).toMatchObject({
        date: '2026-03-10',
        status: 'good',
        note: 'Solid day',
        updatedBy: TEST_USER.username,
      });
    });

    it('returns 404 for a day without an entry', async () => {
      const res = await request(ctx.app).get('/api/entries/2026-03-11').expect(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it.each([
      ['an impossible day', { from: '2026-02-30', to: '2026-03-01' }],
      ['a reversed range', { from: '2026-03-02', to: '2026-03-01' }],
      ['a range over 366 days', { from: '2025-01-01', to: '2026-01-02' }],
      ['missing bounds', {}],
    ])('rejects %s', async (_label, query) => {
      const res = await request(ctx.app).get('/api/entries').query(query).expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('accepts a full leap year range', async () => {
      await request(ctx.app)
        .get('/api/entries')
        .query({ from: '2024-01-01', to: '2024-12-31' })
        .expect(200);
    });
  });

  describe('authenticated writes', () => {
    it('requires authentication to create, update or delete', async () => {
      const anonymous = request(ctx.app);
      await anonymous.put('/api/entries/2026-03-10').send({ status: 'good' }).expect(401);
      await anonymous.delete('/api/entries/2026-03-10').expect(401);
    });

    it('creates with 201 and updates with 200', async () => {
      const created = await agent
        .put('/api/entries/2026-03-10')
        .send({ status: 'okay', note: '  first draft  ' })
        .expect(201);
      expect(created.body.data).toMatchObject({ status: 'okay', note: 'first draft' });

      const updated = await agent
        .put('/api/entries/2026-03-10')
        .send({ status: 'great', note: 'revised' })
        .expect(200);
      expect(updated.body.data).toMatchObject({ status: 'great', note: 'revised' });
      expect(updated.body.data.createdAt).toBe(created.body.data.createdAt);
    });

    it('accepts 29 February only in leap years', async () => {
      await agent.put('/api/entries/2024-02-29').send({ status: 'good' }).expect(201);
      await agent.put('/api/entries/2025-02-29').send({ status: 'good' }).expect(400);
    });

    it.each([
      ['an unknown status', { status: 'amazing' }],
      ['a missing status', { note: 'hello' }],
      ['an over-long note', { status: 'good', note: 'x'.repeat(1001) }],
      ['unexpected fields', { status: 'good', updatedBy: 'someone-else' }],
    ])('rejects %s', async (_label, body) => {
      const res = await agent.put('/api/entries/2026-03-10').send(body).expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects malformed JSON', async () => {
      const res = await agent
        .put('/api/entries/2026-03-10')
        .set('Content-Type', 'application/json')
        .send('{"status": ')
        .expect(400);
      expect(res.body.error.code).toBe('MALFORMED_JSON');
    });

    it('keeps the entry when its last editor is deleted', async () => {
      await agent.put('/api/entries/2026-03-10').send({ status: 'good' }).expect(201);
      await testDb.db.query('DELETE FROM users');

      const res = await request(ctx.app).get('/api/entries/2026-03-10').expect(200);
      expect(res.body.data).toMatchObject({ status: 'good', updatedBy: null });
    });

    it('deletes an entry and returns 404 on a repeated delete', async () => {
      await agent.put('/api/entries/2026-03-10').send({ status: 'off' }).expect(201);

      await agent.delete('/api/entries/2026-03-10').expect(204);
      await agent.delete('/api/entries/2026-03-10').expect(404);
      await request(ctx.app).get('/api/entries/2026-03-10').expect(404);
    });
  });

  it('responds with a JSON 404 for unknown routes', async () => {
    const res = await request(ctx.app).get('/api/does-not-exist').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
