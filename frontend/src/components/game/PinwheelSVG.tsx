import React from 'react';

const polar = (cx: number, cy: number, r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const halfDiskPath = (cx: number, cy: number, r: number, startDeg: number) => {
    const endDeg = startDeg + 180;
    const p0 = polar(cx, cy, r, startDeg);
    const p1 = polar(cx, cy, r, endDeg);

    return [
        `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)}`,
        `A ${r} ${r} 0 0 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
        `L ${p0.x.toFixed(2)} ${p0.y.toFixed(2)}`,
        'Z',
    ].join(' ');
};

const hexToRgb = (hex: string) => {
    const h = hex.replace('#', '').trim();
    const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(v, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const rgbToHex = (r: number, g: number, b: number) =>
    `#${[r, g, b]
        .map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0'))
        .join('')}`;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpColor = (aHex: string, bHex: string, t: number) => {
    const a = hexToRgb(aHex);
    const b = hexToRgb(bHex);
    return rgbToHex(lerp(a.r, b.r, t), lerp(a.g, b.g, t), lerp(a.b, b.b, t));
};

// ✅ 8개: 빨→주→노→초 (여기서 끝!)
const WARM_STOPS = ['#ff1a1a', '#ff7a00', '#ffd400', '#00c853'];

// ✅ 4개: 거의 흰 하늘색 → 파랑
// "아주 밝은" 느낌을 위해 첫 컬러를 거의 흰색에 가깝게 잡음
const SKY_STOPS = ['#c6e9ff', '#78ccff', '#3c9adb', '#0068b7'];

const ramp = (stops: string[], t01: number) => {
    const n = stops.length;
    const x = t01 * (n - 1);
    const i = Math.min(n - 2, Math.max(0, Math.floor(x)));
    const localT = x - i;
    return lerpColor(stops[i], stops[i + 1], localT);
};

// ✅ 인덱스 기반 컬러: 0~7은 warm, 8~11은 sky
const colorForIndex = (i: number) => {
    if (i <= 7) {
        // 8개 구간: 0..7
        const t = i / 7; // 0..1
        return ramp(WARM_STOPS, t);
    }
    // 4개 구간: 8..11
    const t = (i - 8) / 3; // 0..1
    return ramp(SKY_STOPS, t);
};

type PinwheelProps = {
    reverse?: boolean;
    flipped?: boolean;
    className?: string;
};

const PinwheelSVG: React.FC<PinwheelProps> = ({ reverse, flipped = true, className }) => {
    const centerX = 50;
    const centerY = 50;

    const r = 33;

    const count = 12;
    const step = 360 / count;

    const start = -90;

    const offset = r * 0.3;
    const localCx = centerX;
    const localCy = centerY - offset;

    const innerEdgeShiftX = -10;

    return (
        <div
            className={className ?? 'absolute inset-0 w-full h-full'}
            style={{ animation: `pinwheel-spin 4s linear infinite ${reverse ? 'reverse' : ''}` }}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full">
                <g transform={flipped ? "translate(100 0) scale(-1 1)" : ""}>
                    {Array.from({ length: count }, (_, i) => i)
                        .reverse() // ✅ 마지막(파랑)이 맨 위로 덮이게 유지
                        .map((i) => {
                            // ✅ 색은 “시계방향 빨→…→초(8개)” 후 “밝은 하늘→파랑(4개)”
                            const colorIndex = count - 1 - i;
                            const fill = colorForIndex(colorIndex);

                            return (
                                <g key={i} transform={`rotate(${i * step} ${centerX} ${centerY})`}>
                                    <g transform={`translate(${innerEdgeShiftX} 0)`}>
                                        <path d={halfDiskPath(localCx, localCy, r, start)} fill={fill} />
                                    </g>
                                </g>
                            );
                        })}
                </g>
            </svg>
        </div>
    );
};

export default PinwheelSVG;
