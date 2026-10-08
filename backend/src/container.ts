import type { AppConfig } from './config/env.js';
import type { Database } from './db/database.js';
import type { Logger } from './lib/logger.js';
import { PasswordHasher } from './lib/password.js';
import { TokenService } from './lib/token.js';
import { AuthService } from './modules/auth/auth.service.js';
import { UserRepository } from './modules/auth/user.repository.js';
import { EntriesRepository } from './modules/entries/entries.repository.js';
import { EntriesService } from './modules/entries/entries.service.js';

export interface Container {
  config: AppConfig;
  logger: Logger;
  db: Database;
  authService: AuthService;
  entriesService: EntriesService;
}

export function createContainer(config: AppConfig, logger: Logger, db: Database): Container {
  const userRepository = new UserRepository(db);
  const entriesRepository = new EntriesRepository(db);

  const authService = new AuthService(
    userRepository,
    new PasswordHasher(config.auth.bcryptRounds),
    new TokenService(config.auth.jwtSecret, config.auth.tokenTtlSeconds),
  );
  const entriesService = new EntriesService(entriesRepository);

  return { config, logger, db, authService, entriesService };
}
