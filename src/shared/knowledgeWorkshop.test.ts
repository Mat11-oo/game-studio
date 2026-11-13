import { describe, expect, it } from 'vitest';
import {
  readWorkshopProposal,
  serializeWorkshopProposal,
  workshopInstructions,
  type WorkshopProposal,
} from './knowledgeWorkshop.js';

const proposal = (levelCount: number): WorkshopProposal => ({
  grade: 5,
  audience: 'self',
  topic: 'area',
  levelCount,
  plan: '长方形面积。',
});

describe('workshop instructions', () => {
  it('uses the requested level count instead of a fixed three', () => {
    const instructions = workshopInstructions(proposal(5));

    expect(instructions).toContain('智慧闯关');
    expect(instructions).toContain('<wisdom_level_contract>');
    expect(instructions).toContain('5 个难度递进的知识关卡');
    expect(instructions).toContain('"levels": { "count": 5 }');
    expect(instructions).toContain('提交前不得显示计算结果');
    expect(instructions).toContain('playability');
    expect(instructions).toContain('"mistake"');
  });

  it('keeps the built-in knowledge rule requirement', () => {
    const instructions = workshopInstructions({ ...proposal(3), topic: 'area' });

    expect(instructions).toContain('/knowledge-rule.js');
    expect(instructions).toContain('calculate(a,b)');
  });
});

describe('workshop level count', () => {
  it('defaults legacy proposals without levelCount to 3', () => {
    const idea = '知识冒险工坊 V1\n' + JSON.stringify({
      grade: 5,
      audience: 'self',
      topic: 'open',
      plan: '旧提案。',
    });

    expect(readWorkshopProposal(idea)?.levelCount).toBe(3);
  });

  it('round-trips a custom level count', () => {
    const idea = serializeWorkshopProposal(proposal(5));

    expect(readWorkshopProposal(idea)?.levelCount).toBe(5);
  });

  it('rejects a level count outside the supported range', () => {
    const idea = '知识冒险工坊 V1\n' + JSON.stringify({
      ...proposal(6),
    });

    expect(readWorkshopProposal(idea)).toBeNull();
  });
});
