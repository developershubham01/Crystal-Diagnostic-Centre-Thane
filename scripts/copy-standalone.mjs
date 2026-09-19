import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, '.next', 'standalone');

if (fs.existsSync(standaloneDir)) {
  const staticSrc = path.join(rootDir, '.next', 'static');
  const staticDest = path.join(standaloneDir, '.next', 'static');
  
  const publicSrc = path.join(rootDir, 'public');
  const publicDest = path.join(standaloneDir, 'public');

  const dbSrc = path.join(rootDir, 'db');
  const dbDest = path.join(standaloneDir, 'db');

  if (fs.existsSync(staticSrc)) {
    fs.mkdirSync(path.dirname(staticDest), { recursive: true });
    fs.cpSync(staticSrc, staticDest, { recursive: true });
    console.log('Successfully copied .next/static to standalone build.');
  }

  if (fs.existsSync(publicSrc)) {
    fs.cpSync(publicSrc, publicDest, { recursive: true });
    console.log('Successfully copied public to standalone build.');
  }

  if (fs.existsSync(dbSrc)) {
    fs.cpSync(dbSrc, dbDest, { recursive: true });
    console.log('Successfully copied db to standalone build.');
  }
}
