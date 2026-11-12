import { lstat, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { KNOWLEDGE_RULES, type KnowledgeTopic } from '../shared/knowledgeWorkshop.js';

function area(a: number, b: number): number | null {
  return Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0 && Number.isFinite(a * b)
    ? a * b : null;
}

function speed(a: number, b: number): number | null {
  return Number.isFinite(a) && Number.isFinite(b) && a >= 0 && b > 0 && Number.isFinite(a / b)
    ? a / b : null;
}

const rules = { area, speed };

function ruleModule(topic: Exclude<KnowledgeTopic, 'open'>): string {
  return `export const calculate = ${rules[topic].toString()};\n`;
}

export async function installWorkshopRule(root: string, topic: KnowledgeTopic): Promise<void> {
  if (topic === 'open') return;
  const directory = join(root, 'public');
  await mkdir(directory, { recursive: true });
  if (!(await lstat(directory)).isDirectory()) throw new Error('public 必须是项目内的真实目录');
  const temporary = join(directory, `.workshop-${randomUUID()}.tmp`);
  await writeFile(temporary, ruleModule(topic), { flag: 'wx' });
  await rename(temporary, join(directory, 'knowledge-rule.js'));
}

export async function verifyWorkshopRule(root: string, topic: KnowledgeTopic): Promise<void> {
  if (topic === 'open') return;
  for (const [a, b, expected] of KNOWLEDGE_RULES[topic].samples) {
    if (rules[topic](a, b) !== expected) throw new Error('内置知识规则参考样例未通过');
  }
  const delivered = await readFile(join(root, 'dist', 'knowledge-rule.js'), 'utf8');
  if (delivered !== ruleModule(topic)) throw new Error('构建产物缺少未经修改的内置知识规则模块');
}
