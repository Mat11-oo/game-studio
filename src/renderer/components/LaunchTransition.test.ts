import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { LaunchTransition } from './LaunchTransition';

describe('LaunchTransition', () => {
  it('renders the workshop handoff with its own icon', () => {
    const markup = renderToStaticMarkup(createElement(LaunchTransition, { phase: 'running' }));

    expect(markup).toContain('正在建立游戏项目');
    expect(markup).toContain('正在把游戏提案送进制作工作台');
    expect(markup).toContain('launch-transition-runner');
    expect(markup).toContain('app-icon.png');
  });
});
