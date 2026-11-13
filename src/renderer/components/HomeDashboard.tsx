import moonCover from '../assets/workshop/moon.svg';
import rescueCover from '../assets/workshop/rescue.svg';
import {
  ArrowRight,
  Gamepad2,
  Menu,
  Moon,
  Settings,
  Sparkles,
  Sun,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  AppSettings,
  ModelOption,
  ProjectRecord,
  RuntimeStatus,
} from '../../shared/contracts';
import { formatRelative, PROJECT_STATUS_LABELS } from '../ui';
import { ModelPicker } from './ModelPicker';
import { ProjectIconImage } from './ProjectIcon';

import {
  DEFAULT_WORKSHOP_LEVEL_COUNT,
  KNOWLEDGE_RULES,
  WORKSHOP_LEVEL_MAX,
  WORKSHOP_LEVEL_MIN,
  type KnowledgeTopic,
  type WorkshopProposal,
} from '../../shared/knowledgeWorkshop';

const IDEA_STARTERS = [
  { label: '太空种植', subject: '数学 · 长方形面积', cover: moonCover, topic: 'area', prompt: '经营月球温室：为一块块种植床判断长和宽，提交前不显示面积答案，面积不达标会占用额外空间。' },
  { label: '山路救援', subject: '科学 · 平均速率', cover: rescueCover, topic: 'speed', prompt: '驾驶救援车闯关：在时间预算内判断路线与用时，提交前不显示平均速率，答错会加时。' },
] as const;

const FREE_IDEA_STARTERS = [
  {
    label: '像素地牢',
    subject: '动作 · Roguelike',
    prompt: '做一款像素地牢动作游戏：随机房间、近战与冲刺、三种敌人和一个 Boss，死亡后可以重开并保留最佳记录。',
  },
  {
    label: '霓虹突围',
    subject: '射击 · 波次生存',
    prompt: '做一款俯视角霓虹射击游戏：WASD 移动、鼠标瞄准、成波敌人、掉落强化，撑过 5 波后结算评分。',
  },
  {
    label: '深夜食堂',
    subject: '经营 · 资源循环',
    prompt: '做一款深夜食堂经营游戏：有限食材、顾客订单、定价与翻台，经营 7 天后结算评分和结局。',
  },
] as const;

const LEVEL_COUNTS = Array.from(
  { length: WORKSHOP_LEVEL_MAX - WORKSHOP_LEVEL_MIN + 1 },
  (_value, index) => WORKSHOP_LEVEL_MIN + index,
);

type CreationMode = 'knowledge' | 'free';

export interface HomeLaunchInput {
  idea: string;
  model: string | null;
  effort: string | null;
  proposal?: WorkshopProposal;
}

interface HomeDashboardProps {
  runtime: RuntimeStatus;
  settings: AppSettings;
  projects: readonly ProjectRecord[];
  models: readonly ModelOption[];
  imageGenerationAvailable: boolean;
  busy: boolean;
  focusSignal: number;
  onLaunch: (input: HomeLaunchInput) => Promise<void>;
  onOpenProject: (project: ProjectRecord) => void;
  onOpenRail: () => void;
  onOpenSettings: (section?: 'account' | 'environment' | 'media') => void;
  onToggleTheme: () => void;
}

export function HomeDashboard({
  runtime,
  settings,
  projects,
  models,
  imageGenerationAvailable,
  busy,
  focusSignal,
  onLaunch,
  onOpenProject,
  onOpenRail,
  onOpenSettings,
  onToggleTheme,
}: HomeDashboardProps) {
  const [mode, setMode] = useState<CreationMode>('knowledge');
  const [idea, setIdea] = useState('');
  const [grade, setGrade] = useState(5);
  const [audience, setAudience] = useState<WorkshopProposal['audience']>('self');
  const [topic, setTopic] = useState<KnowledgeTopic>('open');
  const [levelCount, setLevelCount] = useState(DEFAULT_WORKSHOP_LEVEL_COUNT);
  const [plan, setPlan] = useState<string | null>(null);
  const ideaInputRef = useRef<HTMLTextAreaElement>(null);
  const [model, setModel] = useState(
    settings.defaultModel ?? models.find((item) => item.isDefault)?.model ?? models[0]?.model ?? '',
  );
  const [effort, setEffort] = useState(settings.defaultEffort);
  const activeModel = useMemo(
    () => models.find((item) => item.model === model) ?? models[0] ?? null,
    [model, models],
  );
  const runtimeReady = runtime.state === 'ready' && Boolean(runtime.account);
  const launchReady = runtimeReady && imageGenerationAvailable && idea.trim().length > 0 && !busy;
  const knowledgeStep = plan === null ? 'idea' : 'plan';

  useEffect(() => {
    if (models.length === 0) {
      setModel('');
      return;
    }
    if (!models.some((item) => item.model === model)) {
      setModel(settings.defaultModel ?? models.find((item) => item.isDefault)?.model ?? models[0]?.model ?? '');
    }
  }, [model, models, settings.defaultModel]);

  useEffect(() => {
    if (focusSignal === 0) return;
    ideaInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ideaInputRef.current?.focus({ preventScroll: true });
  }, [focusSignal]);

  useEffect(() => {
    if (!activeModel) return;
    if (!activeModel.efforts.includes(effort)) {
      setEffort(
        activeModel.efforts.includes(settings.defaultEffort)
          ? settings.defaultEffort
          : activeModel.defaultEffort,
      );
    }
  }, [activeModel, effort, settings.defaultEffort]);

  function switchMode(next: CreationMode) {
    if (busy || next === mode) return;
    setMode(next);
    setPlan(null);
    setIdea('');
  }

  async function submit() {
    if (mode === 'free') {
      if (!launchReady) return;
      await onLaunch({
        idea: idea.trim(),
        model: activeModel?.model ?? null,
        effort: effort || null,
      });
      return;
    }

    if (plan === null) {
      if (idea.trim()) setPlan(`游戏创意：${idea.trim()}\n知识目标：${topic === 'open' ? '按创意确定（知识内容未经核验）' : KNOWLEDGE_RULES[topic].title}\n闯关设计：${levelCount} 个难度递进的关卡，每关由玩家先判断再提交；答错有代价且可纠正，通关有星级与最佳记录。`);
      return;
    }
    if (!launchReady || !plan.trim()) return;
    await onLaunch({
      idea: idea.trim(),
      model: activeModel?.model ?? null,
      effort: effort || null,
      proposal: { grade, audience, topic, levelCount, plan: plan.trim() },
    });
  }

  return (
    <section className="home-dashboard workshop-home">
      <header className="home-toolbar">
        <button
          className="home-mobile-menu"
          type="button"
          aria-label="打开导航"
          onClick={onOpenRail}
        >
          <Menu size={18} />
        </button>
        <div className="home-toolbar-actions">
          <button type="button" aria-label="切换主题" title="切换主题" onClick={onToggleTheme}>
            {settings.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button type="button" aria-label="设置" title="设置" onClick={() => onOpenSettings()}>
            <Settings size={17} />
          </button>
        </div>
      </header>

      <div className="home-scroll">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-content">
            <div className="workshop-banner">
              <span className={`home-loop-status ${runtimeReady ? 'is-ready' : 'is-attention'}`}>
                <i /> {runtimeReady ? '制作已就绪' : '可先编辑创意'} <ArrowRight size={13} />
              </span>
              <h1 id="home-title">{mode === 'knowledge' ? '知识冒险工坊' : '自由创作'}</h1>
              <p>
                {mode === 'knowledge'
                  ? `描述想学的知识和想玩的关卡。先修改并确认提案，再制作 ${WORKSHOP_LEVEL_MIN}–${WORKSHOP_LEVEL_MAX} 关的智慧闯关游戏。`
                  : '描述你想玩的游戏，题材不限。Agent 会完成策划、实现、构建与自动试玩，动作、解谜、射击、经营都可以。'}
              </p>
            </div>
            <div className="home-prompt-card workshop-creator">
              <div className="creation-mode-switch" role="tablist" aria-label="创作模式">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'knowledge'}
                  className={mode === 'knowledge' ? 'is-active' : ''}
                  disabled={busy}
                  onClick={() => switchMode('knowledge')}
                >
                  <span>知识闯关</span>
                  <small>3 关知识游戏</small>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'free'}
                  className={mode === 'free' ? 'is-active' : ''}
                  disabled={busy}
                  onClick={() => switchMode('free')}
                >
                  <span>自由创作 <i>NEW</i></span>
                  <small>动作 / 解谜 / 射击 / 经营</small>
                </button>
              </div>

              <ol className="workshop-steps" aria-label="制作步骤">
                {mode === 'knowledge' ? (
                  <>
                    <li aria-current={knowledgeStep === 'idea' ? 'step' : undefined}><b>01</b> 写创意</li>
                    <li aria-current={knowledgeStep === 'plan' ? 'step' : undefined}><b>02</b> 看提案</li>
                    <li><b>03</b> 制作游戏</li>
                  </>
                ) : (
                  <>
                    <li aria-current={idea.trim() ? undefined : 'step'}><b>01</b> 写创意</li>
                    <li aria-current={idea.trim() ? 'step' : undefined}><b>02</b> 制作游戏</li>
                  </>
                )}
              </ol>

              {mode === 'knowledge' ? (
                <div className="workshop-options">
                  <label>创作方式 <select value={audience} disabled={busy || plan !== null} onChange={(event) => setAudience(event.target.value as WorkshopProposal['audience'])}>
                    <option value="self">学生自创自玩</option><option value="student">老师或家长为学生创作</option>
                  </select></label>
                  <label>目标年级 <select value={grade} disabled={busy || plan !== null} onChange={(event) => setGrade(Number(event.target.value))}>
                    {[4, 5, 6, 7, 8, 9].map((year) => <option key={year} value={year}>{year} 年级</option>)}
                  </select></label>
                  <label>知识主题 <select value={topic} disabled={busy || plan !== null} onChange={(event) => setTopic(event.target.value as KnowledgeTopic)}>
                    <option value="open">自定义 · 知识内容未经核验</option>
                    {Object.entries(KNOWLEDGE_RULES).map(([id, rule]) => <option key={id} value={id}>{rule.title}</option>)}
                  </select></label>
                  <label>关卡数 <select value={levelCount} disabled={busy || plan !== null} onChange={(event) => setLevelCount(Number(event.target.value))}>
                    {LEVEL_COUNTS.map((count) => <option key={count} value={count}>{count} 关</option>)}
                  </select></label>
                </div>
              ) : (
                <p className="free-mode-hint">不需要知识主题或年级。写下玩法、目标、核心循环和想要的风格即可。</p>
              )}

              {mode === 'knowledge' && plan !== null ? (
                <label className="workshop-plan">编辑游戏提案
                  <textarea value={plan} disabled={busy} maxLength={2400} onChange={(event) => setPlan(event.target.value)} />
                </label>
              ) : (
                <textarea
                  ref={ideaInputRef}
                  aria-label="游戏创意"
                  placeholder={mode === 'knowledge'
                    ? '例如：在月球温室里调整种植箱的尺寸，学习长方形面积。'
                    : '例如：做一个像素地牢动作游戏，随机房间、近战与冲刺，带 Boss 和重开。'}
                  value={idea}
                  maxLength={2400}
                  onChange={(event) => setIdea(event.target.value)}
                />
              )}

              <div className="home-prompt-controls">
                {mode === 'knowledge' && plan !== null && <button type="button" disabled={busy} onClick={() => setPlan(null)}>返回创意</button>}
                <ModelPicker
                  models={models}
                  value={activeModel?.model ?? ''}
                  effort={effort}
                  defaultModel={settings.defaultModel}
                  defaultEffort={settings.defaultEffort}
                  disabled={busy}
                  onChange={setModel}
                  onEffortChange={setEffort}
                />
                <span className="home-prompt-spacer" aria-hidden="true" />
                <button
                  type="button"
                  className="workshop-submit"
                  disabled={busy || (mode === 'knowledge' && plan === null ? !idea.trim() : !launchReady)}
                  onClick={() => void submit()}
                >
                  {busy
                    ? '正在创建…'
                    : mode === 'knowledge'
                      ? (plan === null ? '查看提案' : '确认提案并制作')
                      : '开始制作'}
                </button>
              </div>
              {((mode === 'knowledge' && plan !== null) || mode === 'free') && !launchReady && !busy && (
                <p role="status">制作前请在设置中登录并配置图像生成能力。</p>
              )}
            </div>

            {mode === 'knowledge' ? (
              <div className="home-idea-starters" aria-label="游戏创意快捷选项">
                {IDEA_STARTERS.map((starter) => (
                  <button key={starter.label} type="button" disabled={busy || plan !== null} onClick={() => { setIdea(starter.prompt); setTopic(starter.topic); }}>
                    <img src={starter.cover} alt="" width={240} height={100} />
                    <span><small>{starter.subject}</small><strong>{starter.label}</strong></span>
                    <ArrowRight aria-hidden="true" size={18} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="free-idea-starters" aria-label="自由创作快捷选项">
                <span className="free-starters-label">试试这些方向</span>
                {FREE_IDEA_STARTERS.map((starter) => (
                  <button key={starter.label} type="button" disabled={busy} onClick={() => setIdea(starter.prompt)}>
                    <small>{starter.subject}</small>
                    <strong>{starter.label}</strong>
                    <ArrowRight aria-hidden="true" size={14} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="home-projects" aria-labelledby="recent-projects-title">
          <header>
            <div>
              <span>YOUR GAMES</span>
              <h2 id="recent-projects-title">打开游戏</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setIdea('');
                setPlan(null);
                ideaInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                ideaInputRef.current?.focus({ preventScroll: true });
              }}
            >
              写一个新创意 <ArrowRight size={14} />
            </button>
          </header>
          {projects.length > 0 ? (
            <div className="home-project-grid">
              {projects.slice(0, 6).map((project, index) => (
                <button key={project.id} type="button" onClick={() => onOpenProject(project)}>
                  <span className={`home-project-art art-${index % 4}`}>
                    {project.icon ? (
                      <ProjectIconImage project={project} className="project-icon-img" />
                    ) : (
                      <Gamepad2 size={22} />
                    )}
                    <i className={`status-dot status-${project.status}`} />
                  </span>
                  <span className="home-project-copy">
                    <strong>{project.name}</strong>
                    <small>{project.engine === 'godot' ? 'GODOT 4' : 'WEB'} · {PROJECT_STATUS_LABELS[project.status]}</small>
                    <time dateTime={project.updatedAt}>{formatRelative(project.updatedAt)}</time>
                  </span>
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>
          ) : (
            <div className="home-project-empty">
              <Sparkles size={20} />
              <strong>第一个游戏会出现在这里</strong>
              <span>从上面的一句话开始，做一个属于你的游戏。</span>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
