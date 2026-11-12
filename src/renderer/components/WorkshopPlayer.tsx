import { useEffect, useRef, useState } from 'react';
import { KNOWLEDGE_RULES, type WorkshopProposal } from '../../shared/knowledgeWorkshop';

interface Props {
  projectId: string;
  name: string;
  url: string;
  version: string;
  proposal: WorkshopProposal;
}

export function WorkshopPlayer({ projectId, name, url, version, proposal }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const snapshot = useRef('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [ready, setReady] = useState(false);
  const origin = new URL(url).origin;
  const storageKey = `workshop-save:${projectId}:${version}`;
  const rule = proposal.topic === 'open' ? null : KNOWLEDGE_RULES[proposal.topic];

  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow || event.origin !== origin) return;
      const message = event.data;
      if (!message || typeof message !== 'object') return;
      if (message.type === 'workshop:ready') {
        setReady(true);
      } else if (message.type === 'workshop:state') {
        const { variables, recentActions, result } = message;
        if (!variables || typeof variables !== 'object' || Array.isArray(variables)
          || !Array.isArray(recentActions) || typeof result !== 'string') return;
        const entries = Object.entries(variables);
        if (entries.length > 16 || entries.some(([key, value]) =>
          key.length > 40 || typeof value !== 'string' || value.length > 100)
          || recentActions.length > 10 || recentActions.some((action) => typeof action !== 'string' || action.length > 140)
          || result.length > 500) return;
        const text = JSON.stringify({ version, variables, recentActions, result });
        if (text.length <= 4000) snapshot.current = text;
      } else if (message.type === 'workshop:save') {
        try {
          const saved = JSON.stringify(message.data);
          if (!saved || saved.length > 64_000) throw new Error('存档太大');
          localStorage.setItem(storageKey, saved);
          setSaveMessage('本版本进度已保存');
        } catch {
          setSaveMessage('保存失败，请重试');
        }
      }
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [origin, storageKey, version]);

  function load() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        setSaveMessage('这个版本还没有存档');
        return;
      }
      frame.current?.contentWindow?.postMessage({ type: 'workshop:load', data: JSON.parse(saved) }, origin);
      setSaveMessage('已发送本版本存档');
    } catch {
      setSaveMessage('无法读取本版本存档');
    }
  }

  async function ask() {
    if (busy || !question.trim()) return;
    if (!snapshot.current) {
      setAnswer('伙伴还没有收到实验状态。先在游戏中操作一次，再试试。');
      return;
    }
    setBusy(true);
    setAnswer('');
    try {
      setAnswer(await window.noobi.askWorkshop(projectId, question.trim(), snapshot.current));
    } catch {
      setAnswer('伙伴暂时无法回答。你可以继续游戏，稍后重试。');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <div className="workshop-stage">
      <iframe ref={frame} src={url} title={`${name} 游戏预览`} sandbox="allow-scripts allow-same-origin allow-pointer-lock" />
    </div>
    <section className="workshop-player" aria-label="游戏存档与实验伙伴">
      <div className="workshop-options">
        <strong>{rule ? `内置规则 · ${rule.title}` : '知识内容未经核验'}</strong>
        <button type="button" onClick={load} disabled={!ready}>继续本版本存档</button>
        <span role="status">{saveMessage}</span>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); void ask(); }}>
        <input aria-label="向实验伙伴提问" value={question} maxLength={500} onChange={(event) => setQuestion(event.target.value)} placeholder="为什么会出现这个结果？" />
        <button type="submit" disabled={busy || !question.trim()}>{busy ? '伙伴正在思考…' : '问实验伙伴'}</button>
      </form>
      {answer && <p role="status">{answer}</p>}
    </section>
  </>;
}
