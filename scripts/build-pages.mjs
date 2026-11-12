import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const output = join(root, 'dist/pages');
const site = join(root, 'site');
const demo = join(root, 'dist/demo');

async function assertNotEmpty(directory, label) {
  try {
    const entries = await readdir(directory);
    if (entries.length === 0) throw new Error('empty');
  } catch {
    throw new Error(`${label} is missing or empty: ${directory}`);
  }
}

await assertNotEmpty(site, 'Landing site');
await assertNotEmpty(demo, 'Demo build');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

await cp(site, output, { recursive: true });
await cp(demo, join(output, 'demo'), { recursive: true });
await writeFile(join(output, '.nojekyll'), '');

process.stdout.write(`GitHub Pages bundle written to ${output}\n`);
