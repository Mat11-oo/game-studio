import { describe, expect, it } from 'vitest';
import { WISDOM_LEVEL_CONTRACT, workshopInstructions } from './knowledgeWorkshop.js';

describe('workshop instructions', () => {
  it('requires a wisdom level game instead of a single shallow loop', () => {
    const instructions = workshopInstructions({
      grade: 5,
      audience: 'self',
      topic: 'speed',
      plan: '驾驶救援车比较平均速率。',
    });

    expect(instructions).toContain('智慧闯关');
    expect(instructions).toContain(WISDOM_LEVEL_CONTRACT);
    expect(instructions).toContain('至少 3 个难度递进的知识关卡');
    expect(instructions).toContain('提交前不得显示计算结果');
    expect(instructions).toContain('playability');
    expect(instructions).toContain('"mistake"');
  });

  it('keeps the built-in knowledge rule requirement', () => {
    const instructions = workshopInstructions({
      grade: 5,
      audience: 'self',
      topic: 'area',
      plan: '长方形面积。',
    });

    expect(instructions).toContain('/knowledge-rule.js');
    expect(instructions).toContain('calculate(a,b)');
  });
});
