import type { User } from '../modules/auth/user.repository.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
