import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource/press-start-2p/latin-400.css';
import '@fontsource/alfa-slab-one/latin-400.css';
import '@fontsource-variable/manrope/index.css';
import '@fontsource/zcool-kuaile/chinese-simplified-400.css';
import '@vp-tw/cjk-web-fonts-fusion-pixel-font/dist/12px/proportional/zh_hans/Fusion-Pixel-12px-Proportional-Simplified-Chinese.css';
import { App } from '../src/renderer/App';
import '../src/renderer/styles.css';
import './demo.css';
import { installDemoApi } from './mock/demoApi';

installDemoApi();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
