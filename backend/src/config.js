import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Mutable so tests can override config.dataDir directly
export const config = {
  dataDir: '',
  port: 3001,
};

export function initConfig() {
  const raw = process.env.NANOWIKI_DATA_DIR;
  if (!raw) {
    console.error('Error: NANOWIKI_DATA_DIR is not set in .env');
    process.exit(1);
  }
  const resolved = resolve(raw);
  if (!existsSync(resolved)) {
    console.error(`Error: DATA_DIR does not exist: ${resolved}`);
    process.exit(1);
  }
  config.dataDir = resolved;
  config.port = parseInt(process.env.PORT ?? '3001', 10);
}
