import type { CSSProperties } from "react";
import "./TakeoutCup.css";

export type Props = {
  holderImage?: string;
  className?: string;
};

export const TakeoutCup = ({ holderImage, className = "" }: Props) => {
  const rootClassName = ["takeout-cup", className].filter(Boolean).join(" ");

  const rootStyle = holderImage
    ? ({ "--takeout-holder-image": `url("${holderImage}")` } as CSSProperties)
    : undefined;

  return (
    <div className={rootClassName} style={rootStyle} aria-label="cartoon takeout cup">
      <div className="takeout-cup__straw" aria-hidden="true" />

      <div className="takeout-cup__lid" aria-hidden="true">
        <div className="takeout-cup__lid-dome" />
        <div className="takeout-cup__lid-rim" />
      </div>

      <div className="takeout-cup__body" aria-hidden="true">
        <div className="takeout-cup__sleeve" />
      </div>
    </div>
  );
};

export default TakeoutCup;
