import type {
  AgentEvent,
  AppSettings,
  AssetPlanRecord,
  BootstrapPayload,
  EnvironmentStatusSnapshot,
  ExtensionSettingsSnapshot,
  FileNode,
  GameAssetRecord,
  GameplayExperienceReport,
  GameplayExperienceCheck,
  NoobiApi,
  ProjectInspectorPayload,
  ProjectRecord,
  RuntimeStatus,
} from '../../src/shared/contracts';
import { serializeWorkshopProposal } from '../../src/shared/knowledgeWorkshop';

const SEED_ID = 'moonlit-greenhouse';
const DEMO_ROOT = '/Users/demo/Noobi Workspace';
const DEMO_TIME = Date.now();

const iso = (offsetMs: number) => new Date(DEMO_TIME + offsetMs).toISOString();

const MODELS = [
  {
    id: 'gpt-5.6-sol',
    model: 'gpt-5.6-sol',
    displayName: 'GPT-5.6 Sol',
    description: 'Frontier coding model for full production runs.',
    isDefault: true,
    defaultEffort: 'medium',
    efforts: ['low', 'medium', 'high', 'xhigh'],
  },
  {
    id: 'gpt-5.6-luna',
    model: 'gpt-5.6-luna',
    displayName: 'GPT-5.6 Luna',
    description: 'Faster iteration for small repairs and prompts.',
    isDefault: false,
    defaultEffort: 'low',
    efforts: ['low', 'medium', 'high'],
  },
];

const RUNTIME: RuntimeStatus = {
  state: 'ready',
  binaryPath: '/Applications/Noobi.ai.app/Contents/Resources/codex',
  version: 'codex-cli 0.148.0',
  codexHome: '~/Library/Application Support/Noobi.ai/codex-home',
  account: { type: 'chatgpt', email: 'demo@example.com', planType: 'Plus' },
  models: MODELS,
  capabilities: {
    namespaceTools: true,
    imageGeneration: true,
    externalImageGeneration: true,
    webSearch: true,
  },
  error: null,
};

const SETTINGS: AppSettings = {
  defaultWorkspace: DEMO_ROOT,
  defaultModel: 'gpt-5.6-sol',
  defaultEffort: 'medium',
  defaultNoobiStageMode: 'solo',
  defaultNoobiSoloSceneId: 'classic',
  defaultNoobiSceneId: 'collaboration',
  defaultNoobiPackId: 'classic',
  defaultNoobiCrew: [
    { packId: 'classic', role: 'planner' },
    { packId: 'twilight', role: 'artist' },
    { packId: 'hellokitty', role: 'engineer' },
    { packId: 'starforge', role: 'tester' },
  ],
  theme: 'dark',
};

const AREA_PLAN =
  '游戏创意：经营一座月光温室，为三块苗床铺设营养土。\n'
  + '知识目标：数学 · 长方形面积。用长 × 宽计算面积，并处理去掉工具区后的剩余面积。\n'
  + '闯关设计：三关递进，先判断再提交；答错失去一片能量叶并给出思路提示，通关按剩余能量结算星级。';

const SEED_IDEA = serializeWorkshopProposal({
  grade: 5,
  audience: 'self',
  topic: 'area',
  plan: AREA_PLAN,
});

interface ScriptStep {
  kind: AgentEvent['kind'];
  stage: AgentEvent['stage'];
  title: string;
  message: string;
  method?: string;
}

const SCRIPT: ScriptStep[] = [
  {
    kind: 'plan',
    stage: 'brief',
    title: '拆解三关知识结构',
    message: '目标年级：5 年级；知识规则：长方形面积 = 长 × 宽。\n第一关正向求面积，第二关由面积反求长，第三关处理带工具区的剩余面积。每关都需要玩家先判断再提交，答错扣除能量并给出可纠正的提示。',
  },
  {
    kind: 'lifecycle',
    stage: 'scaffold',
    title: '创建 Web 工程骨架',
    message: '工作区：moonlit-greenhouse\n引擎：Web（Vite + 原生 Canvas/DOM）\n已创建 index.html、styles.css、src/levels.js、src/knowledge-rule.js 与 .noobi/playtest.json。',
  },
  {
    kind: 'tool',
    stage: 'scaffold',
    title: '安装工程依赖',
    message: '> npm install\nadded 0 packages, audited 1 package in 0.4s\n工程保持零运行时依赖，构建与试玩均由宿主执行。',
    method: 'host.shell',
  },
  {
    kind: 'file',
    stage: 'scaffold',
    title: '写入页面骨架',
    message: 'apply_patch: index.html, styles.css\n建立月光温室场景、HUD、苗床尺寸标注与三关控制面板。',
    method: 'apply_patch',
  },
  {
    kind: 'plan',
    stage: 'gdd',
    title: '设计难度曲线',
    message: '第 1 关 4 × 3 → 12 平方米；第 2 关面积 24、宽 4 → 长 6；第 3 关 5 × 4 去掉 2 × 2 工具区 → 16 平方米。干扰项分别覆盖相加、除法方向错误与忘记扣除工具区。',
  },
  {
    kind: 'file',
    stage: 'gdd',
    title: '写入关卡数据',
    message: 'apply_patch: src/levels.js\n三关题目、选项、提示语、错误代价与星级规则已数据化，提交前不渲染任何答案。',
    method: 'apply_patch',
  },
  {
    kind: 'tool',
    stage: 'assets',
    title: '生成月光温室背景',
    message: 'imagegen.generate({\n  prompt: "moonlit greenhouse, glass roof, planting beds, pixel art, deep pine green and amber",\n  size: "1200x675"\n}) → assets/greenhouse-bg.png',
    method: 'imagegen.generate',
  },
  {
    kind: 'tool',
    stage: 'assets',
    title: '生成月光花与种子包',
    message: 'imagegen.generate ×2 → assets/moonflower.png, assets/seed-packet.png\n素材已登记到 manifest，并等待生产代码真实引用。',
    method: 'imagegen.generate',
  },
  {
    kind: 'file',
    stage: 'assets',
    title: '接入生成素材',
    message: 'apply_patch: src/scene.js, styles.css\n背景、月光花与种子包均已通过真实路径引用，宿主重新校验生成来源与引用关系。',
    method: 'apply_patch',
  },
  {
    kind: 'assistant',
    stage: 'world',
    title: '搭建月光温室场景',
    message: '玻璃屋顶、月光、萤火与苗床分层绘制；苗床尺寸标注随关卡变化，第三关显示工具区遮罩。',
  },
  {
    kind: 'plan',
    stage: 'world',
    title: '标注苗床尺寸',
    message: '第二关只显示宽 4 米与面积 24 平方米，长保持「? 米」；第三关在右下角叠加 2 × 2 米工具区，并明确提示不铺营养土。',
  },
  {
    kind: 'assistant',
    stage: 'code',
    title: '实现面积判定与反馈',
    message: '玩家选中答案后才能提交；答对播放幼苗生长并计入星级，答错扣除 1 片能量叶，展示「长 × 宽」或「面积 ÷ 宽」的推导思路，允许原地重试。',
  },
  {
    kind: 'file',
    stage: 'code',
    title: '写入游戏逻辑',
    message: 'apply_patch: src/game.js, src/state.js\n实现关卡状态机、能量、星级、最佳记录与 workshop:save/load 存档协议。',
    method: 'apply_patch',
  },
  {
    kind: 'tool',
    stage: 'verify',
    title: '构建正式版本',
    message: '> npm run build\nvite v6.0.7 building for production...\n✓ 12 modules transformed.\ndist/index.html  0.42 kB\n构建完成，0 错误 0 警告。',
    method: 'host.shell',
  },
  {
    kind: 'lifecycle',
    stage: 'verify',
    title: '构建通过',
    message: '产物已写入 .noobi/build/，宿主开始加载正式构建并执行隐藏浏览器试玩。',
  },
  {
    kind: 'tool',
    stage: 'verify',
    title: '自动试玩：三关与错误路径',
    message: 'playtest.run\n✓ 第 1 关可见，提交前不显示 12\n✓ 第 2 关反求长，错误输入触发扣能量与提示\n✓ 第 3 关工具区被正确扣除\n✓ 重开后最佳记录保留',
    method: 'playtest.run',
  },
  {
    kind: 'assistant',
    stage: 'complete',
    title: '交付可玩版本',
    message: '正式构建、玩法验证与体验评测全部通过。可以在右侧直接游玩，也可以继续提出修改要求。',
  },
];

const EXPERIENCE_CHECKS: GameplayExperienceCheck[] = [
  { id: 'load', label: '正式构建加载', status: 'pass', message: '页面在 640ms 内完成首屏渲染，无空白。', durationMs: 640 },
  { id: 'runtime-errors', label: '运行时错误', status: 'pass', message: '控制台与 pageerror 均无异常。', durationMs: 12 },
  { id: 'visible-surface', label: '可见画面', status: 'pass', message: '苗床、尺寸标注与选项均可辨认。', durationMs: 300 },
  { id: 'input-response', label: '输入响应', status: 'pass', message: '鼠标与键盘选择均能更新提交按钮状态。', durationMs: 460 },
  { id: 'continuous-render', label: '动画连续性', status: 'pass', message: '幼苗生长与萤火动画持续渲染，无掉帧尖峰。', durationMs: 2200 },
  { id: 'restart', label: '重新开始', status: 'pass', message: '重开后回到第 1 关，最佳记录保留。', durationMs: 520 },
  { id: 'success-gated', label: '通关判定', status: 'pass', message: '三关全部答对后才显示收获结算。', durationMs: 900 },
  { id: 'failure-path', label: '错误代价', status: 'pass', message: '连续答错耗尽能量，失败结算可重新开始。', durationMs: 1400 },
  { id: 'level-progression', label: '关卡推进', status: 'pass', message: '第 1 关 → 第 2 关 → 第 3 关文本随进度变化。', durationMs: 2800 },
];

const EXPERIENCE_REPORT: GameplayExperienceReport = {
  version: 1,
  verdict: 'pass',
  score: 94,
  checkedAt: iso(-9 * 60 * 1000),
  durationMs: 9312,
  reportPath: '.noobi/experience-report.json',
  summary: '三关结构完整，提交前不泄露答案，错误路径有代价且可纠正，重开与最佳记录正常。',
  checks: EXPERIENCE_CHECKS,
};

const ASSETS: GameAssetRecord[] = [
  {
    id: 'asset-greenhouse-bg',
    name: '月光温室夜景',
    kind: 'image',
    source: 'generated',
    relativePath: 'assets/greenhouse-bg.png',
    mimeType: 'image/png',
    size: 27678,
    sha256: '4b9c1c0d9f2a…',
    createdAt: iso(-18 * 60 * 1000),
    prompt: 'moonlit greenhouse, glass roof, planting beds, pixel art, deep pine green and amber',
    provider: 'Codex ImageGen',
  },
  {
    id: 'asset-moonflower',
    name: '月光花',
    kind: 'image',
    source: 'generated',
    relativePath: 'assets/moonflower.png',
    mimeType: 'image/png',
    size: 5617,
    sha256: '6a3f8b21c4d0…',
    createdAt: iso(-17 * 60 * 1000),
    prompt: 'moonflower sprite, amber petals, transparent background',
    provider: 'Codex ImageGen',
  },
  {
    id: 'asset-seed-packet',
    name: '种子包',
    kind: 'image',
    source: 'procedural',
    relativePath: 'assets/seed-packet.png',
    mimeType: 'image/png',
    size: 4185,
    sha256: '9d0e2f77a1b3…',
    createdAt: iso(-16 * 60 * 1000),
    prompt: 'procedural seed packet card for the greenhouse UI',
  },
];

const PLAN: AssetPlanRecord[] = [
  {
    id: 'plan-greenhouse-bg',
    projectId: SEED_ID,
    name: '月光温室夜景',
    kind: 'image',
    prompt: 'moonlit greenhouse, glass roof, planting beds, pixel art',
    required: true,
    status: 'ready',
    attemptCount: 1,
    assetId: 'asset-greenhouse-bg',
    relativePath: 'assets/greenhouse-bg.png',
    route: 'codex-imagegen',
    createdAt: iso(-18 * 60 * 1000),
    updatedAt: iso(-18 * 60 * 1000),
  },
];

const FILE_CONTENTS: Record<string, string> = {
  'index.html': '<!doctype html>\n<html lang="zh-CN">\n  <head>\n    <meta charset="utf-8" />\n    <title>月光温室</title>\n  </head>\n  <body>\n    <div id="app"></div>\n    <script type="module" src="/src/game.js"></script>\n  </body>\n</html>\n',
  'src/game.js': "import { LEVELS } from './levels.js';\nimport { createState, submitAnswer } from './state.js';\n\nconst app = document.querySelector('#app');\nconst state = createState(LEVELS);\n\nfunction render() {\n  app.innerHTML = template(state);\n  bindEvents();\n}\n\napp.addEventListener('click', (event) => {\n  const button = event.target.closest('[data-answer]');\n  if (button) submitAnswer(state, Number(button.dataset.answer), render);\n});\n\nrender();\n",
  'src/levels.js': 'export const LEVELS = [\n  { x: 4, y: 3, answer: 12, options: [7, 12, 14] },\n  { x: 6, y: 4, answer: 6, options: [5, 6, 8], area: 24 },\n  { x: 5, y: 4, answer: 16, options: [18, 16, 20], cut: 4 },\n];\n',
  'src/knowledge-rule.js': '// Verified by the host against the OpenStax rectangle-area reference.\nexport function calculate(length, width) {\n  if (!Number.isFinite(length) || !Number.isFinite(width)) return null;\n  if (length <= 0 || width <= 0) return null;\n  return length * width;\n}\n',
  'src/state.js': "export function createState(levels) {\n  return { level: 0, stars: 0, energy: 3, levels };\n}\n\nexport function submitAnswer(state, value, render) {\n  const level = state.levels[state.level];\n  if (value !== level.answer) {\n    state.energy -= 1;\n    render();\n    return;\n  }\n  state.stars += state.energy;\n  state.level += 1;\n  render();\n}\n",
  'package.json': '{\n  "name": "moonlit-greenhouse",\n  "private": true,\n  "type": "module",\n  "scripts": {\n    "build": "vite build",\n    "preview": "vite preview"\n  }\n}\n',
  '.noobi/playtest.json': '{\n  "levels": { "count": 3 },\n  "journey": [\n    { "action": "load", "assert": ["visible"] },\n    { "action": "mistake", "inputs": ["#option-7 #submit"], "assert": ["text-visible 能量"] },\n    { "action": "solve", "inputs": ["#option-12 #submit"], "assert": ["text-visible 第 2 关"] },\n    { "action": "solve", "inputs": ["#option-6 #submit"], "assert": ["text-visible 第 3 关"] },\n    { "action": "solve", "inputs": ["#option-16 #submit"], "assert": ["text-visible 收获"] }\n  ]\n}\n',
  '.noobi/experience-report.json': JSON.stringify(EXPERIENCE_REPORT, null, 2),
};

const FILE_TREE: FileNode[] = [
  { name: 'src', relativePath: 'src', type: 'directory', children: [
    { name: 'game.js', relativePath: 'src/game.js', type: 'file', size: 512 },
    { name: 'levels.js', relativePath: 'src/levels.js', type: 'file', size: 268 },
    { name: 'knowledge-rule.js', relativePath: 'src/knowledge-rule.js', type: 'file', size: 242 },
    { name: 'state.js', relativePath: 'src/state.js', type: 'file', size: 388 },
  ] },
  { name: 'assets', relativePath: 'assets', type: 'directory', children: [
    { name: 'greenhouse-bg.png', relativePath: 'assets/greenhouse-bg.png', type: 'file', size: 27678 },
    { name: 'moonflower.png', relativePath: 'assets/moonflower.png', type: 'file', size: 5617 },
    { name: 'seed-packet.png', relativePath: 'assets/seed-packet.png', type: 'file', size: 4185 },
  ] },
  { name: '.noobi', relativePath: '.noobi', type: 'directory', children: [
    { name: 'playtest.json', relativePath: '.noobi/playtest.json', type: 'file', size: 640 },
    { name: 'experience-report.json', relativePath: '.noobi/experience-report.json', type: 'file', size: 1800 },
  ] },
  { name: 'index.html', relativePath: 'index.html', type: 'file', size: 224 },
  { name: 'package.json', relativePath: 'package.json', type: 'file', size: 158 },
];

const ENVIRONMENT: EnvironmentStatusSnapshot = {
  state: 'ready',
  tools: [
    { id: 'codex', label: 'Codex App Server', state: 'ready', version: '0.148.0', binaryPath: '/Applications/Noobi.ai.app/Contents/Resources/codex', configuredPath: null, source: 'bundled', message: '运行时已就绪，演示环境使用模拟会话。' },
    { id: 'node', label: 'Node.js', state: 'ready', version: '22.20.0', binaryPath: '/opt/homebrew/bin/node', configuredPath: null, source: 'path', message: '满足 >= 22 的要求。' },
    { id: 'godot', label: 'Godot 4', state: 'ready', version: '4.7.1.stable', binaryPath: '/Applications/Godot.app', configuredPath: null, source: 'application', message: '导出模板与编辑器版本匹配。' },
  ],
  exportTemplates: {
    state: 'ready',
    expectedVersion: '4.7.1.stable',
    basePath: '~/Library/Application Support/Godot/export_templates',
    versionPath: '~/Library/Application Support/Godot/export_templates/4.7.1.stable',
    installedVersions: ['4.7.1.stable'],
    targets: { web: true, macos: true, windows: true, linux: true },
    issues: [],
  },
  canCreateGodotProjects: true,
  canExportGodotProjects: true,
  checkedAt: iso(-60 * 1000),
};

const EXTENSIONS: ExtensionSettingsSnapshot = {
  mediaProviders: [
    { capability: 'image', provider: 'Codex ImageGen', model: 'gpt-image-1', endpoint: '', enabled: true, hasApiKey: true, keyHint: 'demo-••••', status: 'ready', statusMessage: '演示环境模拟连接', lastTestedAt: iso(-120000) },
    { capability: 'audio', provider: 'Procedural', model: 'noobi-synth', endpoint: '', enabled: true, hasApiKey: false, keyHint: null, status: 'ready', statusMessage: '程序化音频回退', lastTestedAt: null },
    { capability: 'model3d', provider: 'Three.js fallback', model: 'procedural', endpoint: '', enabled: true, hasApiKey: false, keyHint: null, status: 'ready', statusMessage: '程序化 3D 回退', lastTestedAt: null },
  ],
  skills: [
    { id: 'game-design', name: 'Game Design', description: '把关卡、变量和反馈设计成可验证的玩法契约。', source: 'built-in', path: null, enabled: true },
    { id: 'playtest-review', name: 'Playtest Review', description: '读取自动试玩证据，独立判断是否通过。', source: 'built-in', path: null, enabled: true },
    { id: 'pixel-art', name: 'Pixel Art Direction', description: '约束生成素材的配色、比例与像素密度。', source: 'user', path: '~/Noobi/skills/pixel-art', enabled: true },
  ],
  mcpServers: [
    { id: 'workspace-files', name: 'workspace-files', transport: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem', DEMO_ROOT], url: null, enabled: true, bearerTokenEnvVar: null, status: 'connected', statusMessage: '只读访问演示工作区' },
  ],
  promptTemplates: [
    { id: 'planner', name: 'Planner', description: '只读拆解任务与验收标准。', content: '你是只读 Planner。为知识闯关游戏拆解关卡、变量、错误代价与验收标准。', enabled: true, customized: false },
    { id: 'implementer', name: 'Implementer', description: '在独立工程目录中实现。', content: '你是 Implementer。在隔离目录内实现可构建、可试玩的游戏，不修改知识规则模块。', enabled: true, customized: false },
    { id: 'reviewer', name: 'Reviewer', description: '独立检查真实产物。', content: '你是只读 Reviewer。检查构建产物、玩法证据和知识正确性，输出 playability 评分。', enabled: true, customized: false },
    { id: 'repair', name: 'Repair', description: '针对失败项做最小修复。', content: '你是同一个 Implementer。只修复 Reviewer 或试玩失败的具体项，保留已通过的行为。', enabled: true, customized: false },
  ],
};

const listeners = {
  agent: new Set<(event: AgentEvent) => void>(),
  project: new Set<(project: ProjectRecord) => void>(),
  runtime: new Set<(status: RuntimeStatus) => void>(),
  approval: new Set<(approval: unknown) => void>(),
  approvalClosed: new Set<(token: string) => void>(),
  assets: new Set<(payload: { projectId: string; assets: GameAssetRecord[] }) => void>(),
  plans: new Set<(payload: { projectId: string; assetPlans: AssetPlanRecord[] }) => void>(),
};

const seedProject = (): ProjectRecord => ({
  id: SEED_ID,
  name: '月光温室',
  pinned: true,
  idea: SEED_IDEA,
  root: `${DEMO_ROOT}/moonlit-greenhouse`,
  createdAt: iso(-42 * 60 * 1000),
  updatedAt: iso(-8 * 60 * 1000),
  status: 'completed',
  stage: 'complete',
  engine: 'web',
  targetFrameRate: 60,
  noobiPackOverrideId: null,
  noobiCrewOverride: null,
  model: 'gpt-5.6-sol',
  threadId: 'thread_moonlit_demo',
  toolsetVersion: 3,
  activeTurnId: null,
  lastError: null,
  icon: { path: '.noobi/icon.png', source: 'ai', updatedAt: iso(-35 * 60 * 1000) },
});

interface DemoState {
  projects: ProjectRecord[];
  events: Record<string, AgentEvent[]>;
  settings: AppSettings;
  runtime: RuntimeStatus;
  timers: Map<string, number[]>;
  sequence: number;
  iconUrl: string | null;
}

const state: DemoState = {
  projects: [seedProject()],
  events: {},
  settings: { ...SETTINGS },
  runtime: { ...RUNTIME },
  timers: new Map(),
  sequence: 0,
  iconUrl: null,
};

function scriptEvents(projectId: string, prompt: string | null, startAt: number): AgentEvent[] {
  const list: AgentEvent[] = [];
  if (prompt) {
    list.push({
      id: `${projectId}-user`,
      projectId,
      kind: 'user',
      title: '新的制作要求',
      message: prompt,
      stage: 'brief',
      timestamp: new Date(startAt).toISOString(),
    });
  }
  const offset = prompt ? 1 : 0;
  SCRIPT.forEach((step, index) => {
    list.push({
      id: `${projectId}-step-${index}`,
      projectId,
      kind: step.kind,
      title: step.title,
      message: step.message,
      stage: step.stage,
      timestamp: new Date(startAt + (index + offset) * 35 * 1000).toISOString(),
      method: step.method,
    });
  });
  return list;
}

state.events[SEED_ID] = scriptEvents(SEED_ID, null, DEMO_TIME - 42 * 60 * 1000);

const projectById = (id: string): ProjectRecord => {
  const project = state.projects.find((item) => item.id === id);
  if (!project) throw new Error('演示项目不存在');
  return project;
};

function emitProject(project: ProjectRecord) {
  for (const listener of listeners.project) listener(project);
}

function emitEvent(event: AgentEvent) {
  const list = state.events[event.projectId] ?? (state.events[event.projectId] = []);
  list.push(event);
  for (const listener of listeners.agent) listener(event);
}

function replaceProject(project: ProjectRecord) {
  state.projects = state.projects.map((item) => (item.id === project.id ? project : item));
  emitProject(project);
}

function previewBase(): string {
  return new URL('game/', document.baseURI).href;
}

function fileTree(): FileNode[] {
  return FILE_TREE.map((node) => ({ ...node }));
}

function inspect(projectId: string): ProjectInspectorPayload {
  const project = projectById(projectId);
  const ready = project.status === 'completed';
  return {
    previewUrl: ready ? previewBase() : '',
    workshopPreview: ready
      ? { current: '2026.11.13-1', previous: null, previousPreviewUrl: '' }
      : undefined,
    files: ready ? fileTree() : [],
    assets: ready ? ASSETS : [],
    assetPlans: [],
    imageGenerationGate: ready
      ? { state: 'trusted-referenced', relativePaths: ['assets/greenhouse-bg.png', 'assets/moonflower.png'] }
      : { state: 'missing', relativePaths: [] },
    experienceReport: ready ? EXPERIENCE_REPORT : null,
  };
}

function iconDataUrl(): string {
  if (state.iconUrl) return state.iconUrl;
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#16271e';
  ctx.fillRect(0, 0, 96, 96);
  ctx.strokeStyle = 'rgba(143, 205, 169, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, 84, 84);
  ctx.fillStyle = '#f2e2b3';
  ctx.beginPath();
  ctx.arc(67, 29, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a3324';
  ctx.fillRect(18, 66, 60, 14);
  ctx.strokeStyle = '#7fd0a4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(48, 66);
  ctx.lineTo(48, 44);
  ctx.stroke();
  ctx.fillStyle = '#8fd6aa';
  ctx.beginPath();
  ctx.ellipse(37, 48, 11, 6, -0.6, 0, Math.PI * 2);
  ctx.ellipse(60, 42, 11, 6, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#efbc63';
  ctx.fillRect(28, 30, 3, 3);
  ctx.fillRect(76, 52, 2, 2);
  state.iconUrl = canvas.toDataURL('image/png');
  return state.iconUrl;
}

function clearTimers(projectId: string) {
  const timers = state.timers.get(projectId);
  if (!timers) return;
  for (const timer of timers) window.clearTimeout(timer);
  state.timers.delete(projectId);
}

function beginRun(project: ProjectRecord, prompt: string): ProjectRecord {
  clearTimers(project.id);
  state.events[project.id] = [];
  const running: ProjectRecord = {
    ...project,
    status: 'running',
    stage: 'brief',
    activeTurnId: `turn_demo_${++state.sequence}`,
    lastError: null,
    threadId: project.threadId ?? `thread_demo_${state.sequence}`,
    updatedAt: new Date().toISOString(),
  };
  replaceProject(running);
  const startAt = Date.now();
  emitEvent({
    id: `${project.id}-user-${state.sequence}`,
    projectId: project.id,
    kind: 'user',
    title: '新的制作要求',
    message: prompt,
    stage: 'brief',
    timestamp: new Date(startAt).toISOString(),
  });
  const timers: number[] = [];
  SCRIPT.forEach((step, index) => {
    const timer = window.setTimeout(() => {
      const current = projectById(project.id);
      if (current.status !== 'running') return;
      emitEvent({
        id: `${project.id}-run-${state.sequence}-${index}`,
        projectId: project.id,
        kind: step.kind,
        title: step.title,
        message: step.message,
        stage: step.stage,
        timestamp: new Date().toISOString(),
        method: step.method,
      });
      const last = index === SCRIPT.length - 1;
      const updated: ProjectRecord = {
        ...current,
        stage: step.stage,
        status: last ? 'completed' : 'running',
        activeTurnId: last ? null : current.activeTurnId,
        updatedAt: new Date().toISOString(),
      };
      replaceProject(updated);
      if (last) {
        state.timers.delete(project.id);
        for (const listener of listeners.assets) {
          listener({ projectId: project.id, assets: ASSETS });
        }
      }
    }, 900 + index * 720);
    timers.push(timer);
  });
  state.timers.set(project.id, timers);
  return running;
}

function deriveName(text: string): string {
  const cleaned = text.replace(/^游戏创意：/u, '').split('\n')[0]?.trim() ?? '';
  if (!cleaned) return '月光温室';
  return cleaned.length > 16 ? `${cleaned.slice(0, 16)}…` : cleaned;
}

const api: NoobiApi = {
  async bootstrap(): Promise<BootstrapPayload> {
    return {
      projects: state.projects,
      settings: state.settings,
      runtime: state.runtime,
      events: state.events,
    };
  },

  async restoreWorkshop(projectId) {
    return { project: projectById(projectId), backup: `${projectById(projectId).root}/.noobi/backup` };
  },

  async askWorkshop(_projectId, question) {
    await new Promise((resolve) => setTimeout(resolve, 550));
    if (question.includes('面积') || question.includes('为什么')) {
      return '把苗床想成一行行方格：长 4、宽 3，就是 4 行、每行 3 格，一共 12 格，所以是 12 平方米。答错会失去 1 片能量叶，但可以原地重试。';
    }
    return '这是在线演示中的模拟实验伙伴。真实版本会结合当前关卡、变量和你的操作记录来回答。';
  },

  async refreshRuntime() {
    state.runtime = { ...RUNTIME, account: { type: 'chatgpt', email: 'demo@example.com', planType: 'Plus' } };
    for (const listener of listeners.runtime) listener(state.runtime);
    return state.runtime;
  },

  async startLogin() {
    return {
      type: 'chatgpt',
      loginId: 'demo-login',
      authUrl: 'https://chatgpt.com/',
      verificationUrl: 'https://chatgpt.com/',
      userCode: 'NOOBI-DEMO',
    };
  },

  async logout() {
    state.runtime = { ...state.runtime, account: null };
    for (const listener of listeners.runtime) listener(state.runtime);
    return state.runtime;
  },

  async chooseDirectory() {
    return state.settings.defaultWorkspace;
  },

  async chooseProjectDirectory() {
    return state.settings.defaultWorkspace;
  },

  async createProject(input) {
    const name = deriveName(input.workshopProposal?.plan ?? input.idea);
    const id = `demo-project-${++state.sequence}`;
    const project: ProjectRecord = {
      id,
      name,
      pinned: false,
      idea: input.workshopProposal
        ? serializeWorkshopProposal(input.workshopProposal)
        : input.idea,
      root: `${state.settings.defaultWorkspace}/${name.replace(/[^\w\u4e00-\u9fa5-]+/gu, '-')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      stage: 'brief',
      engine: 'web',
      targetFrameRate: 60,
      noobiPackOverrideId: null,
      noobiCrewOverride: null,
      model: input.model ?? state.settings.defaultModel,
      threadId: null,
      toolsetVersion: 3,
      activeTurnId: null,
      lastError: null,
      icon: null,
    };
    state.projects = [project, ...state.projects];
    state.events[id] = [];
    emitProject(project);
    return project;
  },

  async renameProject(projectId, name) {
    const project = { ...projectById(projectId), name: name.trim() || projectById(projectId).name, updatedAt: new Date().toISOString() };
    replaceProject(project);
    return project;
  },

  async setProjectPinned(projectId, pinned) {
    const project = { ...projectById(projectId), pinned, updatedAt: new Date().toISOString() };
    replaceProject(project);
    return project;
  },

  async deleteProject(projectId) {
    const project = projectById(projectId);
    clearTimers(projectId);
    state.projects = state.projects.filter((item) => item.id !== projectId);
    delete state.events[projectId];
    return project;
  },

  async runProject(input) {
    const project = projectById(input.projectId);
    if (project.status === 'running') return project;
    return beginRun(project, input.prompt);
  },

  async stopProject(projectId) {
    clearTimers(projectId);
    const project = projectById(projectId);
    if (project.status !== 'running') return project;
    const stopped: ProjectRecord = {
      ...project,
      status: 'stopped',
      activeTurnId: null,
      updatedAt: new Date().toISOString(),
    };
    replaceProject(stopped);
    emitEvent({
      id: `${projectId}-stopped-${state.sequence}`,
      projectId,
      kind: 'lifecycle',
      title: '制作已停止',
      message: '演示运行已中止。可以重新启动，继续查看完整的制作流程。',
      stage: stopped.stage,
      timestamp: new Date().toISOString(),
    });
    return stopped;
  },

  async revealProject(projectId) {
    return projectById(projectId);
  },

  async importProjectAssets() {
    return ASSETS;
  },

  async importDroppedProjectAssets() {
    return ASSETS;
  },

  async retryAssetPlan(projectId, planId) {
    return PLAN.find((item) => item.id === planId) ?? {
      ...PLAN[0]!,
      id: planId,
      projectId,
    };
  },

  async inspectProject(projectId) {
    return inspect(projectId);
  },

  async evaluateProjectExperience() {
    await new Promise((resolve) => setTimeout(resolve, 1400));
    return { ...EXPERIENCE_REPORT, checkedAt: new Date().toISOString() };
  },

  async cancelProjectExperience() {
    /* no-op */
  },

  async readProjectFile(_projectId, relativePath) {
    const content = FILE_CONTENTS[relativePath];
    if (content === undefined) throw new Error(`无法读取 ${relativePath}`);
    return { relativePath, content, truncated: false, binary: false };
  },

  async getProjectIcon() {
    const dataUrl = iconDataUrl();
    return dataUrl ? { dataUrl, updatedAt: iso(-35 * 60 * 1000) } : null;
  },

  async saveProjectNoobiPack(projectId, packId) {
    const project = { ...projectById(projectId), noobiPackOverrideId: packId };
    replaceProject(project);
    return project;
  },

  async saveProjectNoobiCrew(projectId, crew) {
    const project = { ...projectById(projectId), noobiCrewOverride: crew ? [...crew] : null };
    replaceProject(project);
    return project;
  },

  async saveSettings(patch) {
    state.settings = { ...state.settings, ...patch };
    return state.settings;
  },

  async getEnvironmentStatus() {
    return ENVIRONMENT;
  },

  async refreshEnvironmentStatus() {
    return { ...ENVIRONMENT, checkedAt: new Date().toISOString() };
  },

  async chooseGodotExecutable() {
    return '/Applications/Godot.app';
  },

  async saveGodotExecutable() {
    return ENVIRONMENT;
  },

  async getExtensionSettings() {
    return EXTENSIONS;
  },

  async saveMediaProvider(input) {
    const current = EXTENSIONS.mediaProviders.find((item) => item.capability === input.capability);
    const updated = {
      ...(current ?? EXTENSIONS.mediaProviders[0]!),
      provider: input.provider,
      model: input.model,
      endpoint: input.endpoint,
      enabled: input.enabled,
      hasApiKey: Boolean(input.apiKey) || current?.hasApiKey || false,
      status: 'ready' as const,
      statusMessage: '演示环境模拟连接',
    };
    const index = EXTENSIONS.mediaProviders.findIndex((item) => item.capability === input.capability);
    if (index >= 0) EXTENSIONS.mediaProviders[index] = updated;
    return updated;
  },

  async testMediaProvider(capability) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return {
      capability,
      ok: true,
      message: '演示环境：连接测试通过（模拟）。',
      latencyMs: 187,
      testedAt: new Date().toISOString(),
    };
  },

  async listSkills() {
    return EXTENSIONS.skills;
  },

  async setSkillEnabled(input) {
    const skill = EXTENSIONS.skills.find((item) => item.id === input.id);
    if (!skill) throw new Error('Skill 不存在');
    skill.enabled = input.enabled;
    return skill;
  },

  async listMcpServers() {
    return EXTENSIONS.mcpServers;
  },

  async saveMcpServer(input) {
    const existing = EXTENSIONS.mcpServers.find((item) => item.id === input.id);
    if (existing) {
      existing.enabled = input.enabled;
      existing.command = input.command ?? existing.command;
      existing.args = input.args ?? existing.args;
      existing.url = input.url ?? existing.url;
      existing.bearerTokenEnvVar = input.bearerTokenEnvVar ?? existing.bearerTokenEnvVar;
      return existing;
    }
    const created = {
      id: input.id,
      transport: input.transport,
      command: input.command ?? null,
      args: input.args ?? [],
      url: input.url ?? null,
      enabled: input.enabled,
      bearerTokenEnvVar: input.bearerTokenEnvVar ?? null,
      status: 'connected' as const,
      statusMessage: '演示环境模拟连接',
    };
    EXTENSIONS.mcpServers.push(created);
    return created;
  },

  async removeMcpServer(id) {
    const index = EXTENSIONS.mcpServers.findIndex((item) => item.id === id);
    if (index >= 0) EXTENSIONS.mcpServers.splice(index, 1);
  },

  async listPromptTemplates() {
    return EXTENSIONS.promptTemplates;
  },

  async savePromptTemplate(input) {
    const template = EXTENSIONS.promptTemplates.find((item) => item.id === input.id);
    if (!template) throw new Error('提示词不存在');
    template.content = input.content;
    template.enabled = input.enabled;
    template.customized = true;
    return template;
  },

  async resetPromptTemplate(id) {
    const template = EXTENSIONS.promptTemplates.find((item) => item.id === id);
    if (!template) throw new Error('提示词不存在');
    template.customized = false;
    return template;
  },

  async resolveApproval() {
    /* no-op */
  },

  onAgentEvent(listener) {
    listeners.agent.add(listener);
    return () => listeners.agent.delete(listener);
  },

  onProjectChanged(listener) {
    listeners.project.add(listener);
    return () => listeners.project.delete(listener);
  },

  onRuntimeChanged(listener) {
    listeners.runtime.add(listener);
    return () => listeners.runtime.delete(listener);
  },

  onApproval(listener) {
    listeners.approval.add(listener);
    return () => listeners.approval.delete(listener);
  },

  onApprovalClosed(listener) {
    listeners.approvalClosed.add(listener);
    return () => listeners.approvalClosed.delete(listener);
  },

  onAssetsChanged(listener) {
    listeners.assets.add(listener);
    return () => listeners.assets.delete(listener);
  },

  onAssetPlansChanged(listener) {
    listeners.plans.add(listener);
    return () => listeners.plans.delete(listener);
  },
};

export function installDemoApi() {
  (window as Window & { noobi?: NoobiApi }).noobi = api;
  document.documentElement.dataset.demo = 'true';
}
