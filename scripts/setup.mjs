// Creates the env files from the examples (if missing) with a random JWT secret.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const envFiles = [
  {
    example: 'backend/.env.example',
    target: 'backend/.env',
    transform: (content) =>
      content.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${randomBytes(48).toString('hex')}`),
  },
  {
    example: 'frontend/.env.example',
    target: 'frontend/.env.local',
    transform: (content) => content,
  },
];

for (const { example, target, transform } of envFiles) {
  const targetPath = join(root, target);
  if (existsSync(targetPath)) continue;

  const content = readFileSync(join(root, example), 'utf8');
  writeFileSync(targetPath, transform(content), 'utf8');
  console.log(`[setup] created ${target} from ${example}`);
}

const backendEnv = readFileSync(join(root, 'backend/.env'), 'utf8');
if (/^DATABASE_URL=.*ep-xxxx/m.test(backendEnv)) {
  console.warn('\n[setup] Set DATABASE_URL in backend/.env to your Neon connection string.\n');
}
