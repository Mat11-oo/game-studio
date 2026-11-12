import { mkdtemp, mkdir, readFile, rm, symlink, writeFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { installWorkshopRule, verifyWorkshopRule } from './workshopRules.js';
import { publishWorkshopVersion, readWorkshopVersions, restoreWorkshopVersion } from './workshopVersions.js';

describe('knowledge game delivery', () => {
  let directory: string;
  let root: string;
  let versions: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'workshop-delivery-'));
    root = join(directory, 'project');
    versions = join(directory, 'versions');
    await mkdir(join(root, 'dist'), { recursive: true });
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it.each(['area', 'speed'] as const)('checks %s examples and rejects a modified rule module', async (topic) => {
    await installWorkshopRule(root, topic);
    const delivered = join(root, 'dist', 'knowledge-rule.js');
    await copyFile(join(root, 'public', 'knowledge-rule.js'), delivered);
    await expect(verifyWorkshopRule(root, topic)).resolves.toBeUndefined();
    await writeFile(delivered, 'export const calculate = () => 99;');
    await expect(verifyWorkshopRule(root, topic)).rejects.toThrow();
  });

  it('preserves the two published builds when a candidate fails to publish', async () => {
    const page = join(root, 'dist', 'index.html');
    await writeFile(page, 'original');
    await publishWorkshopVersion(versions, root);
    await writeFile(page, 'second');
    await publishWorkshopVersion(versions, root);
    const published = await readWorkshopVersions(versions);
    expect(published?.previous).toBeTruthy();
    await symlink(page, join(root, 'dist', 'unsafe.html'));
    await expect(publishWorkshopVersion(versions, root)).rejects.toThrow();
    expect(await readWorkshopVersions(versions)).toEqual(published);
    expect(await readFile(join(versions, published!.previous!, 'dist', 'index.html'), 'utf8')).toBe('original');
    expect(await readFile(join(versions, published!.current, 'dist', 'index.html'), 'utf8')).toBe('second');
  });

  it('restores the older source and build while keeping the replaced project in a backup', async () => {
    const source = join(root, 'game.js');
    const page = join(root, 'dist', 'index.html');
    await writeFile(source, 'old source');
    await writeFile(page, 'old build');
    await publishWorkshopVersion(versions, root);
    await writeFile(source, 'new source');
    await writeFile(page, 'new build');
    await publishWorkshopVersion(versions, root);
    const before = (await readWorkshopVersions(versions))!;
    const backup = await restoreWorkshopVersion(versions, root, before.previous!);
    expect(await readFile(source, 'utf8')).toBe('old source');
    expect(await readFile(page, 'utf8')).toBe('old build');
    expect(await readFile(join(backup, 'game.js'), 'utf8')).toBe('new source');
    expect(await readWorkshopVersions(versions)).toEqual({ current: before.previous, previous: before.current });
  });

});
