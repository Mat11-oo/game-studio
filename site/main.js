(() => {
  const root = document.documentElement;
  const LANG_KEY = 'noobi-site-lang';

  const TITLES = {
    en: '游戏工坊 — Turn one idea into a playable game',
    zh: '游戏工坊 — 一句创意，变成可玩游戏',
  };
  const DESCRIPTIONS = {
    en: '游戏工坊 is a local-first desktop production agent that turns one game idea into a reviewed, playable Web or Godot 4 game with Codex App Server.',
    zh: '游戏工坊是一个本地优先的桌面游戏制作 Agent：把一句创意，变成经过审查、可以游玩的 Web 或 Godot 4 游戏。',
  };

  const toggle = document.getElementById('lang-toggle');
  const metaDescription = document.querySelector('meta[name="description"]');

  function currentLang() {
    return root.dataset.lang === 'zh' ? 'zh' : 'en';
  }

  function applyLanguage(lang, persist) {
    const next = lang === 'zh' ? 'zh' : 'en';
    root.dataset.lang = next;
    root.lang = next === 'zh' ? 'zh-CN' : 'en';
    document.title = TITLES[next];
    if (metaDescription) metaDescription.setAttribute('content', DESCRIPTIONS[next]);
    if (toggle) {
      toggle.textContent = next === 'zh' ? 'EN' : '中文';
      toggle.setAttribute('aria-label', next === 'zh' ? 'Switch to English' : '切换到中文');
    }
    if (persist) {
      try {
        localStorage.setItem(LANG_KEY, next);
      } catch (_) { /* storage unavailable */ }
    }
  }

  applyLanguage(currentLang(), false);

  if (toggle) {
    toggle.addEventListener('click', () => {
      applyLanguage(currentLang() === 'zh' ? 'en' : 'zh', true);
    });
  }

  /* ---------- Copy the quick-start command ---------- */

  const copyButton = document.getElementById('copy-btn');
  const quickstart = document.getElementById('quickstart');

  async function writeClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (_) {
        ok = false;
      }
      area.remove();
      return ok;
    }
  }

  if (copyButton && quickstart) {
    let restoreTimer = 0;
    copyButton.addEventListener('click', async () => {
      const lang = currentLang();
      const ok = await writeClipboard(quickstart.textContent || '');
      window.clearTimeout(restoreTimer);
      copyButton.textContent = ok
        ? (lang === 'zh' ? '已复制' : 'Copied')
        : (lang === 'zh' ? '复制失败' : 'Copy failed');
      restoreTimer = window.setTimeout(() => {
        applyLanguage(currentLang(), false);
        copyButton.innerHTML = '<span class="lang-en">Copy</span><span class="lang-zh">复制</span>';
      }, 1800);
    });
  }

  /* ---------- Reveal on scroll ---------- */

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = document.querySelectorAll(
    '.section-head, .demo-card, .feature-card, .pipeline li, .loop-note, .workbench-copy, .workbench-shot, .start-copy, .code-card, .final-inner',
  );

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealTargets.forEach((element, index) => {
      element.classList.add('will-reveal');
      element.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
      observer.observe(element);
    });
  }
})();
