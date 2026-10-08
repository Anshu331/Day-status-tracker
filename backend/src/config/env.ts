import { z } from 'zod';

export const SESSION_COOKIE_NAME = 'dst_session';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL is required' })
    .regex(/^postgres(ql)?:\/\//, 'DATABASE_URL must be a postgres:// connection string'),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_TTL_SECONDS: z.coerce.number().int().positive().default(28_800),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  TRUST_PROXY: z.string().default('loopback'),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  SEED_ADMIN_USERNAME: z.preprocess(emptyToUndefined, z.string().trim().min(3).max(64).optional()),
  SEED_ADMIN_PASSWORD: z.preprocess(emptyToUndefined, z.string().min(8).max(128).optional()),
});

export type Environment = 'development' | 'test' | 'production';
export type LogLevel = z.infer<typeof envSchema>['LOG_LEVEL'];

export interface AppConfig {
  env: Environment;
  port: number;
  logLevel: LogLevel;
  database: {
    url: string;
    poolMax: number;
  };
  auth: {
    jwtSecret: string;
    tokenTtlSeconds: number;
    bcryptRounds: number;
    cookieName: string;
    cookieSecure: boolean;
    loginRateLimitMax: number;
  };
  trustProxy: boolean | number | string;
  seedUser: { username: string; password: string } | null;
}

function parseTrustProxy(value: string): boolean | number | string {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const env = result.data;

  return {
    env: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    database: {
      url: env.DATABASE_URL,
      poolMax: env.DATABASE_POOL_MAX,
    },
    auth: {
      jwtSecret: env.JWT_SECRET,
      tokenTtlSeconds: env.JWT_TTL_SECONDS,
      bcryptRounds: env.BCRYPT_ROUNDS,
      cookieName: SESSION_COOKIE_NAME,
      cookieSecure: env.NODE_ENV === 'production',
      loginRateLimitMax: env.LOGIN_RATE_LIMIT_MAX,
    },
    trustProxy: parseTrustProxy(env.TRUST_PROXY),
    seedUser:
      env.SEED_ADMIN_USERNAME && env.SEED_ADMIN_PASSWORD
        ? { username: env.SEED_ADMIN_USERNAME, password: env.SEED_ADMIN_PASSWORD }
        : null,
  };
}
