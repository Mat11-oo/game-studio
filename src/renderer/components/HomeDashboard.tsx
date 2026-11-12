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

import { KNOWLEDGE_RULES, type KnowledgeTopic, type WorkshopProposal } from '../../shared/knowledgeWorkshop';

const IDEA_STARTERS = [
  { label: '太空种植', subject: '数学 · 长方形面积', cover: moonCover, topic: 'area', prompt: '经营月球温室：为 3 个种植任务判断长和宽，提交前不显示面积答案，面积不达标会占用额外空间。' },
  { label: '山路救援', subject: '科学 · 平均速率', cover: rescueCover, topic: 'speed', prompt: '驾驶救援车闯 3 关：在时间预算内判断路线与用时，提交前不显示平均速率，答错会加时。' },
] as const;

export interface HomeLaunchInput {
  idea: string;
  model: string | null;
  effort: string | null;
  proposal: WorkshopProposal;
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
  const [idea, setIdea] = useState('');
  const [grade, setGrade] = useState(5);
  const [audience, setAudience] = useState<WorkshopProposal['audience']>('self');
  const [topic, setTopic] = useState<KnowledgeTopic>('open');
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

  async function submit() {
    if (plan === null) {
      if (idea.trim()) setPlan(`游戏创意：${idea.trim()}\n知识目标：${topic === 'open' ? '按创意确定（知识内容未经核验）' : KNOWLEDGE_RULES[topic].title}\n闯关设计：至少 3 个难度递进的关卡，每关由玩家先判断再提交；答错有代价且可纠正，通关有星级与最佳记录。`);
      return;
    }
    if (!launchReady || !plan.trim()) return;
    await onLaunch({
      idea: idea.trim(),
      model: activeModel?.model ?? null,
      effort: effort || null,
      proposal: { grade, audience, topic, plan: plan.trim() },
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
                <i /> {runtimeReady ? '制作已就绪' : '可先编辑创意与提案'} <ArrowRight size={13} />
              </span>
              <h1 id="home-title">知识冒险工坊</h1>
              <p>描述想学的知识和想玩的关卡。先修改并确认提案，再制作至少 3 关的智慧闯关游戏。</p>
            </div>
            <div className="home-prompt-card workshop-creator">
              <ol className="workshop-steps" aria-label="制作步骤">
                <li aria-current={plan === null ? 'step' : undefined}><b>01</b> 写创意</li>
                <li aria-current={plan !== null ? 'step' : undefined}><b>02</b> 看提案</li>
                <li><b>03</b> 制作游戏</li>
              </ol>
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
              </div>
              {plan === null ? (
                <textarea ref={ideaInputRef} aria-label="游戏创意" placeholder="例如：在月球温室里调整种植箱的尺寸，学习长方形面积。" value={idea} maxLength={2400} onChange={(event) => setIdea(event.target.value)} />
              ) : (
                <label className="workshop-plan">编辑游戏提案
                  <textarea value={plan} disabled={busy} maxLength={2400} onChange={(event) => setPlan(event.target.value)} />
                </label>
              )}
              <div className="home-prompt-controls">
                {plan !== null && <button type="button" disabled={busy} onClick={() => setPlan(null)}>返回创意</button>}
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
                <button type="button" className="workshop-submit"
                  disabled={busy || (plan === null ? !idea.trim() : !launchReady || !plan.trim())}
                  onClick={() => void submit()}>
                  {busy ? '正在创建…' : plan === null ? '查看提案' : '确认提案并制作'}
                </button>
              </div>
              {plan !== null && !launchReady && !busy && <p role="status">制作前请在设置中登录并配置图像生成能力。</p>}
            </div>
            <div className="home-idea-starters" aria-label="游戏创意快捷选项">
              {IDEA_STARTERS.map((starter) => (
                <button key={starter.label} type="button" disabled={busy || plan !== null} onClick={() => { setIdea(starter.prompt); setTopic(starter.topic); }}>
                  <img src={starter.cover} alt="" width={240} height={100} />
                  <span><small>{starter.subject}</small><strong>{starter.label}</strong></span>
                  <ArrowRight aria-hidden="true" size={18} />
                </button>
              ))}
            </div>
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
              <span>从上面的一句话开始，确认提案后开始制作。</span>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

