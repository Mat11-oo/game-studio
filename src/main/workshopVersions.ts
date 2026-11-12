import { randomUUID } from 'node:crypto';
import { cp, lstat, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

interface Versions {
  current: string;
  previous: string | null;
}

export async function readWorkshopVersions(directory: string): Promise<Versions | null> {
  try {
    const value = JSON.parse(await readFile(join(directory, 'versions.json'), 'utf8')) as Versions;
    const valid = (id: unknown) => typeof id === 'string' && /^[a-f0-9-]{36}$/u.test(id);
    if (!valid(value.current) || (value.previous !== null && !valid(value.previous))) {
      throw new Error('游戏版本记录无效');
    }
    return value;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

export async function publishWorkshopVersion(directory: string, root: string): Promise<void> {
  await mkdir(directory, { recursive: true });
  const versions = await readWorkshopVersions(directory);
  const current = randomUUID();
  const target = join(directory, current);
  const manifest = join(directory, `${current}.json`);
  try {
    await cp(root, target, {
      recursive: true,
      errorOnExist: true,
      force: false,
      filter: async (path) => {
        const name = basename(path);
        if (path !== root && (name === 'node_modules' || name === '.git' || name === '.env' || name.startsWith('.env.'))) return false;
        const entry = await lstat(path);
        if (!entry.isFile() && !entry.isDirectory()) throw new Error('游戏成品含有不受支持的文件');
        return true;
      },
    });
    await writeFile(manifest, JSON.stringify({ current, previous: versions?.current ?? null }), { flag: 'wx' });
    await rename(manifest, join(directory, 'versions.json'));
  } catch (error) {
    await Promise.allSettled([rm(target, { recursive: true, force: true }), rm(manifest, { force: true })]);
    throw error;
  }
  if (versions?.previous) await rm(join(directory, versions.previous), { recursive: true, force: true }).catch(() => undefined);
}

export async function restoreWorkshopVersion(
  directory: string,
  root: string,
  version: string,
): Promise<string> {
  const versions = await readWorkshopVersions(directory);
  if (!versions || version !== versions.previous) throw new Error('上一可玩版本已变化，请刷新后重试');
  const parent = dirname(root);
  const operation = randomUUID();
  const staged = join(parent, `.workshop-restore-${operation}`);
  const backup = join(parent, `.workshop-backup-${operation}`);
  const manifest = join(directory, `${operation}.json`);
  let moved = false;
  let installed = false;
  try {
    await cp(join(directory, version), staged, { recursive: true, force: false, errorOnExist: true });
    await writeFile(manifest, JSON.stringify({ current: version, previous: versions.current }), { flag: 'wx' });
    await rename(root, backup);
    moved = true;
    await rename(staged, root);
    installed = true;
    await rename(manifest, join(directory, 'versions.json'));
    return backup;
  } catch (error) {
    if (moved) {
      try {
        if (installed) await rename(root, staged);
        await rename(backup, root);
      } catch {
        throw new Error(`恢复中断，原工程保存在：${backup}`, { cause: error });
      }
    }
    throw error;
  } finally {
    await Promise.allSettled([rm(staged, { recursive: true, force: true }), rm(manifest, { force: true })]);
  }
}
