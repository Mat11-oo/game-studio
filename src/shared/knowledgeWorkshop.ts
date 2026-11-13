export const KNOWLEDGE_RULES = {
  area: {
    title: '数学 · 长方形面积',
    description: '面积 = 长 × 宽。两边使用相同长度单位，结果使用平方单位。有效长方形的两边均大于零。',
    source: 'https://openstax.org/books/prealgebra-2e/pages/9-4-use-properties-of-rectangles-triangles-and-trapezoids',
    samples: [[3, 4, 12], [0.5, 2, 1], [0, 4, null], [-1, 4, null]],
  },
  speed: {
    title: '科学 · 平均速率',
    description: '平均速率 = 总路程 ÷ 总时间。路程非负，时间必须大于零。米和秒对应米每秒。',
    source: 'https://openstax.org/books/physics/pages/2-2-speed-and-velocity',
    samples: [[120, 30, 4], [0, 10, 0], [10, 0, null], [-1, 2, null]],
  },
} as const;

export type KnowledgeTopic = keyof typeof KNOWLEDGE_RULES | 'open';

export const WORKSHOP_LEVEL_MIN = 3;
export const WORKSHOP_LEVEL_MAX = 8;
export const DEFAULT_WORKSHOP_LEVEL_COUNT = 3;

export interface WorkshopProposal {
  grade: number;
  audience: 'self' | 'student';
  topic: KnowledgeTopic;
  /** Number of knowledge levels the game must ship. Legacy proposals default to 3. */
  levelCount: number;
  plan: string;
}

export function isWorkshopLevelCount(value: unknown): value is number {
  return Number.isInteger(value)
    && (value as number) >= WORKSHOP_LEVEL_MIN
    && (value as number) <= WORKSHOP_LEVEL_MAX;
}

export function workshopLevelCount(proposal: Pick<WorkshopProposal, 'levelCount'>): number {
  return isWorkshopLevelCount(proposal.levelCount)
    ? proposal.levelCount
    : DEFAULT_WORKSHOP_LEVEL_COUNT;
}

export function isWorkshopProposal(value: unknown): value is WorkshopProposal {
  if (!value || typeof value !== 'object') return false;
  const proposal = value as WorkshopProposal;
  return Number.isInteger(proposal.grade) && proposal.grade >= 4 && proposal.grade <= 9
    && (proposal.audience === 'self' || proposal.audience === 'student')
    && (proposal.topic === 'area' || proposal.topic === 'speed' || proposal.topic === 'open')
    && (proposal.levelCount === undefined || isWorkshopLevelCount(proposal.levelCount))
    && typeof proposal.plan === 'string' && Boolean(proposal.plan.trim()) && proposal.plan.length <= 6000;
}

export function readWorkshopProposal(idea: string): WorkshopProposal | null {
  const prefix = '知识冒险工坊 V1\n';
  if (!idea.startsWith(prefix)) return null;
  try {
    const value: unknown = JSON.parse(idea.slice(prefix.length));
    return isWorkshopProposal(value)
      ? { ...value, levelCount: workshopLevelCount(value) }
      : null;
  } catch {
    return null;
  }
}

export function serializeWorkshopProposal(proposal: WorkshopProposal): string {
  return '知识冒险工坊 V1\n' + JSON.stringify(proposal);
}

/**
 * 「智慧闯关」production contract. It extends the generic game harness with a
 * multi-level, knowledge-driven structure that the deterministic host playtest
 * can actually verify: a declared mistake path, visible level labels, and a
 * terminal success state that cannot be on screen from the start.
 */
export function wisdomLevelContract(levelCount: number = DEFAULT_WORKSHOP_LEVEL_COUNT): string {
  return `<wisdom_level_contract>
本项目是「智慧闯关」知识游戏。除通用制作契约外，必须满足：
1. 关卡结构：${levelCount} 个难度递进的知识关卡。每关包含一个必须由玩家运用知识做出的决策，以及可观察的过关或失败判定。
2. 答案延迟：提交前不得显示计算结果、正确答案或是否达标；只显示已知条件与玩家输入。
3. 错误代价：答错必须产生代价（生命、时间、星级或进度）并且可以纠正；错误反馈要讲清思路，不能只显示叉号。
4. 关卡可见性：HUD 必须显示「第 N 关」，切换关卡后该文本随之变化，标题、分数或进度条不能代替关卡编号。
5. 结算与重玩：通关或失败都有星级或分数结算与最佳记录；支持重开与当前关卡重试。
6. 存档：通过 workshop:save/load 保存关卡、星级、得分与最佳记录，恢复后从对应关卡继续。
7. 试玩契约：在通用 .noobi/playtest.json 字段上增加
   "actions": { ..., "mistake": { "inputs": [PlaytestInput...] } },
   "levels": { "count": ${levelCount} }，
   journey 中必须有至少一个 action="mistake" 的步骤，用 text-visible 断言错误反馈与代价；每个关卡都要有一条通过的 text-visible「第 N 关」断言（N=1..levels.count）；success 必须包含 text-visible 结算断言，且该文本不得在开局就出现。
8. 审查：Reviewer 必须返回 playability 评分（agency、clarity、challenge、feedback、replay、learning，0-5），任一项低于 3 即 repair。
</wisdom_level_contract>`;
}

export const WISDOM_LEVEL_CONTRACT = wisdomLevelContract();

export function workshopInstructions(proposal: WorkshopProposal): string {
  const rule = proposal.topic === 'open' ? null : KNOWLEDGE_RULES[proposal.topic];
  return [
    '以已确认提案制作中文 Web 2D 智慧闯关知识游戏。保持用户指定的世界和玩法。知识必须驱动操作、变量反馈和游戏目标。按年级调整术语、数值和提示。修改时保留未要求变动的提案内容。',
    `年级：${proposal.grade}。创作者：${proposal.audience === 'self' ? '学生自创' : '老师或家长为学生创作'}。`,
    `关卡数量：${workshopLevelCount(proposal)}。`,
    proposal.plan,
    rule
      ? `内置规则：${rule.title}。依据：${rule.source}。条件：${rule.description}。必须由实际玩法调用 /knowledge-rule.js 导出的 calculate(a,b)，用返回值决定反馈或目标。Vite 中可用 await import(/* @vite-ignore */ location.origin + '/knowledge-rule.js')，保留 public 文件原样。null 表示无效输入。不要修改该模块。其他知识标明未经核验。`
      : '在游戏内持续显示「知识内容未经核验」，避免将推测写成已核验事实。',
    '游戏进行中至少有一个需要玩家持续操作或反复判断的核心循环。玩家操作必须改变进度、代价或结果。提供可纠正的错误反馈；关键决策不得由自动演出代替。',
    wisdomLevelContract(workshopLevelCount(proposal)),
    '自动试玩必须覆盖一次变量变化及其对反馈或目标的影响，以及一次错误决策的代价。审查时核对正确单位、边界输入、屏幕上观察到的结果，以及保存和读取进度的接口。',
    '仅在游戏嵌入宿主时，通过 postMessage 与工坊通信。发送给 parent 的消息格式为 {type:"workshop:ready"} 或 {type:"workshop:state", variables:{中文变量名:"数值及单位"}, recentActions:["最近的玩家操作"], result:"当前观察结果"}，在初始化和每次操作后更新，variables 最多 16 个字段，recentActions 最多 10 条。游戏提供明确的保存按钮，保存时发送 {type:"workshop:save", data:可 JSON 序列化的当前游玩进度}，仅用宿主返回的 {type:"workshop:load", data} 恢复。监听时校验 event.source === parent。单独打开时游戏仍须可玩。AI 伙伴由宿主提供。',
  ].join('\n\n');
}
