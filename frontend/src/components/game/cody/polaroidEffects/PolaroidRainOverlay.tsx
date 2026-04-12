import React, { useMemo } from "react";

type RainDropVars = React.CSSProperties & {
  "--drop-end-drift"?: string;
  "--drop-mid-drift"?: string;
  "--drop-start-top"?: string;
  "--drop-travel"?: string;
  "--stem-height"?: string;
  "--stem-offset"?: string;
  "--stem-opacity"?: string;
  "--stem-duration"?: string;
  "--stem-top"?: string;
  "--splat-opacity"?: string;
  "--splat-border-opacity"?: string;
  "--splat-shadow-opacity"?: string;
};

type RainDropConfig = {
  frameStyle: RainDropVars;
  bodyStyle: RainDropVars;
  stemStyle: RainDropVars;
  splatStyle: RainDropVars;
  showStem: boolean;
  showSplat: boolean;
};

const createDropConfig = (isBackRow: boolean): RainDropConfig => {
  const left = Math.floor(Math.random() * 100);
  // delay를 최대 8초로 크게 늘려 같은 자리에 재등장하는 텀을 길게 설정
  const delay = Number((Math.random() * 8).toFixed(2));
  const duration = Number(
    (
      (isBackRow ? 1.8 : 1.4) + Math.random() * (isBackRow ? 0.8 : 0.6)
    ).toFixed(2),
  );
  // startTop을 -10% 고정 (drop-body 기준 시작점)
  const startTop = -10;
  const midDrift = (((Math.random() - 0.5) * (isBackRow ? 10 : 16))).toFixed(1);
  const endDrift = (((Math.random() - 0.5) * (isBackRow ? 16 : 26))).toFixed(1);
  const stemChance = Math.random();
  const splatChance = Math.random();
  const stemHeight = (
    (isBackRow ? 140 : 180) + Math.random() * (isBackRow ? 40 : 60)
  ).toFixed(1);
  const stemOffset = (
    (isBackRow ? 1.8 : 1.2) + Math.random() * (isBackRow ? 11.2 : 13.2)
  ).toFixed(1);
  const stemTop = (
    (isBackRow ? 8 : 10) + Math.random() * (isBackRow ? 8 : 10)
  ).toFixed(1);
  const stemOpacity = (
    (isBackRow ? 0.88 : 0.96) + Math.random() * (isBackRow ? 0.07 : 0.04)
  ).toFixed(2);
  const splatOpacity = (
    (isBackRow ? 0.72 : 0.84) + Math.random() * (isBackRow ? 0.1 : 0.08)
  ).toFixed(2);
  const splatBorderOpacity = (
    (isBackRow ? 0.82 : 0.94) + Math.random() * (isBackRow ? 0.08 : 0.06)
  ).toFixed(2);
  const splatShadowOpacity = (
    (isBackRow ? 0.26 : 0.34) + Math.random() * (isBackRow ? 0.08 : 0.08)
  ).toFixed(2);
  const stemDelayShift = ((Math.random() - 0.5) * 0.18).toFixed(2);
  const splatDelayShift = ((Math.random() - 0.5) * 0.08).toFixed(2);
  const stemDuration = (duration * (isBackRow ? 0.7 : 0.64)).toFixed(2);

  return {
    frameStyle: {
      left: `${left}%`,
    },
    bodyStyle: {
      animationDelay: `-${delay.toFixed(2)}s`,
      animationDuration: `${duration.toFixed(2)}s`,
      "--drop-start-top": `${startTop}%`,
      // transform의 %는 요소 자신(78px) 기준이므로 vh로 명시해야 화면 전체 커버
      "--drop-travel": `110vh`,
      "--drop-mid-drift": `${midDrift}px`,
      "--drop-end-drift": `${endDrift}px`,
    },
    stemStyle: {
      animationDelay: `-${(delay + Number(stemDelayShift)).toFixed(2)}s`,
      animationDuration: `${stemDuration}s`,
      "--stem-height": `${stemHeight}px`,
      "--stem-offset": `${stemOffset}px`,
      "--stem-top": `${stemTop}px`,
      "--stem-opacity": stemOpacity,
      "--stem-duration": `${stemDuration}s`,
    },
    splatStyle: {
      animationDelay: `-${(delay + Number(splatDelayShift)).toFixed(2)}s`,
      animationDuration: `${duration.toFixed(2)}s`,
      "--splat-opacity": splatOpacity,
      "--splat-border-opacity": splatBorderOpacity,
      "--splat-shadow-opacity": splatShadowOpacity,
    },
    // stem 빈도를 낮게 유지 (front ~25%, back ~18%)
    showStem: stemChance > (isBackRow ? 0.82 : 0.75),
    // splat 빈도 상향 (front ~75%, back ~65%)
    showSplat: splatChance > (isBackRow ? 0.35 : 0.25),
  };
};

const Raindrop: React.FC<{
  config: RainDropConfig;
  enableSplat?: boolean;
}> = ({ config, enableSplat = true }) => {
  const { frameStyle, bodyStyle, stemStyle, splatStyle, showStem, showSplat } =
    config;

  return (
    <div className="drop" style={frameStyle}>
      <div className="drop-body" style={bodyStyle}>
        {showStem && <div className="stem" style={stemStyle} />}
      </div>
      {enableSplat && showSplat && <div className="splat" style={splatStyle} />}
    </div>
  );
};

export const PolaroidRainOverlay: React.FC<{
  dropCount?: number;
  enableSplat?: boolean;
}> = ({ dropCount = 26, enableSplat = true }) => {
  const frontRow = useMemo(
    () => Array.from({ length: dropCount }, () => createDropConfig(false)),
    [dropCount],
  );
  const backRow = useMemo(
    () =>
      Array.from({ length: Math.max(10, Math.floor(dropCount * 0.55)) }, () =>
        createDropConfig(true),
      ),
    [dropCount],
  );

  return (
    <div
      className={`rain-wrapper back-row-toggle ${enableSplat ? "splat-toggle" : ""}`}
      aria-hidden="true"
    >
      <div className="rain front-row">
        {frontRow.map((config, index) => (
          <Raindrop
            key={`f-${index}`}
            config={config}
            enableSplat={enableSplat}
          />
        ))}
      </div>
      <div className="rain back-row">
        {backRow.map((config, index) => (
          <Raindrop
            key={`b-${index}`}
            config={config}
            enableSplat={enableSplat}
          />
        ))}
      </div>
    </div>
  );
};
