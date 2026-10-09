import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { ENV } from '../server/src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRequire = createRequire(path.resolve(__dirname, '../server/package.json'));
const mongoose = serverRequire('mongoose');

async function reset() {
  const confirmArg = process.argv.includes('--confirm');
  const confirmEnv = process.env.RESET_CONFIRM === 'true';

  if (!confirmArg && !confirmEnv) {
    console.error('⚠️ SAFETY CHECK TRIGGERED: Resetting database requires explicit confirmation.');
    console.error('Run: node scripts/reset.js --confirm');
    console.error('or set RESET_CONFIRM=true in environment.');
    process.exit(1);
  }

  if (ENV.NODE_ENV === 'production') {
    console.error('❌ FATAL: Database reset is strictly prohibited in production environment.');
    process.exit(1);
  }

  console.log(`Connecting to ${ENV.MONGODB_URI}...`);
  await mongoose.connect(ENV.MONGODB_URI);

  console.log('Dropping collections...');
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
    console.log(`  Cleared collection: ${key}`);
  }

  console.log('Database successfully reset.');
  await mongoose.disconnect();
}

reset().catch(err => {
  console.error('Reset error:', err);
  process.exit(1);
});
