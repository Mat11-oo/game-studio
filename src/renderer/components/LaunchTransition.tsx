import React from 'react';


export type LaunchTransitionPhase = 'running' | 'leaving';

interface LaunchTransitionProps {
  phase: LaunchTransitionPhase;
}

export function LaunchTransition({ phase }: LaunchTransitionProps) {
  return (
    <div
      className={`launch-transition is-${phase}`}
      role="status"
      aria-live="polite"
      aria-label="正在进入游戏制作工作台"
    >
      <div className="launch-transition-copy">
        <strong>正在建立游戏项目</strong>
        <span>正在把游戏提案送进制作工作台</span>
      </div>
      <div className="launch-transition-track" aria-hidden="true">
        <span className="launch-transition-runner">
          <img className="workshop-launch-icon" src={import.meta.env.BASE_URL + 'app-icon.png'} alt="" />
        </span>
      </div>
    </div>
  );
}
