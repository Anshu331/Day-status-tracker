import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SESSION_COOKIE_NAME } from '../src/config/env.js';
import { TokenService } from '../src/lib/token.js';
import {
  createAuthenticatedAgent,
  createTestApp,
  createTestConfig,
  createTestDatabase,
  TEST_USER,
  type TestApp,
  type TestDatabase,
} from './helpers.js';

const getSetCookie = (headers: Record<string, unknown>): string => {
  const value = headers['set-cookie'];
  return Array.isArray(value) ? value.join(';') : String(value ?? '');
};

describe('auth API', () => {
  let testDb: TestDatabase;
  let ctx: TestApp;

  beforeAll(async () => {
    testDb = await createTestDatabase();
  });

  afterAll(() => testDb.close());

  beforeEach(async () => {
    await testDb.reset();
    ctx = createTestApp(testDb.db);
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await ctx.container.authService.register(TEST_USER.username, TEST_USER.password);
    });

    it('sets an httpOnly session cookie and returns the user on valid credentials', async () => {
      const res = await request(ctx.app).post('/api/auth/login').send(TEST_USER).expect(200);

      expect(res.body.data).toMatchObject({ id: 1, username: TEST_USER.username });
      expect(res.body.data).not.toHaveProperty('passwordHash');
      expect(new Date(res.body.data.createdAt).toISOString()).toBe(res.body.data.createdAt);

      const cookie = getSetCookie(res.headers);
      expect(cookie).toContain(`${SESSION_COOKIE_NAME}=`);
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Lax/i);
    });

    it('treats usernames case-insensitively', async () => {
      await request(ctx.app)
        .post('/api/auth/login')
        .send({ ...TEST_USER, username: TEST_USER.username.toUpperCase() })
        .expect(200);
    });

    it('rejects a wrong password with a generic message', async () => {
      const res = await request(ctx.app)
        .post('/api/auth/login')
        .send({ ...TEST_USER, password: 'wrong-password' })
        .expect(401);

      expect(res.body.error).toEqual({
        code: 'UNAUTHORIZED',
        message: 'Invalid username or password',
      });
    });

    it('rejects an unknown user with the same generic message', async () => {
      const res = await request(ctx.app)
        .post('/api/auth/login')
        .send({ username: 'nobody', password: 'whatever-password' })
        .expect(401);

      expect(res.body.error.message).toBe('Invalid username or password');
    });

    it('validates the request body', async () => {
      const res = await request(ctx.app).post('/api/auth/login').send({}).expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: 'username' })]),
      );
    });

    it('rate-limits repeated failed attempts', async () => {
      const limited = createTestApp(testDb.db, {
        auth: { ...createTestConfig().auth, loginRateLimitMax: 2 },
      });
      const attempt = () =>
        request(limited.app).post('/api/auth/login').send({ username: 'x', password: 'y' });

      await attempt().expect(401);
      await attempt().expect(401);
      const res = await attempt().expect(429);
      expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
    });
  });

  describe('user registration', () => {
    it('rejects a duplicate username regardless of case', async () => {
      await ctx.container.authService.register('Alice', 'password-one');
      await expect(ctx.container.authService.register('alice', 'password-two')).rejects.toMatchObject({
        statusCode: 409,
        code: 'CONFLICT',
      });
    });

    it('creates the seed user only when no users exist', async () => {
      const seed = { username: 'admin', password: 'Admin@12345' };
      expect(await ctx.container.authService.ensureSeedUser(seed)).toMatchObject({ username: 'admin' });
      expect(await ctx.container.authService.ensureSeedUser(seed)).toBeNull();
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 without a session', async () => {
      await request(ctx.app).get('/api/auth/me').expect(401);
    });

    it('returns the current user with a valid session', async () => {
      const agent = await createAuthenticatedAgent(ctx);
      const res = await agent.get('/api/auth/me').expect(200);
      expect(res.body.data.username).toBe(TEST_USER.username);
    });

    it('rejects a token signed with a different secret', async () => {
      const forged = new TokenService('another-secret-that-is-also-long-enough!!', 3600).sign({
        userId: 1,
        username: TEST_USER.username,
      });

      await request(ctx.app)
        .get('/api/auth/me')
        .set('Cookie', `${SESSION_COOKIE_NAME}=${forged}`)
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears the session cookie', async () => {
      const agent = await createAuthenticatedAgent(ctx);

      const res = await agent.post('/api/auth/logout').expect(204);
      expect(getSetCookie(res.headers)).toMatch(new RegExp(`${SESSION_COOKIE_NAME}=;`));

      await agent.get('/api/auth/me').expect(401);
    });
  });
});
