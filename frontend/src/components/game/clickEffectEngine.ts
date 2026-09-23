const CLOVER_PATH = new Path2D(
  "M17.28 9.05a5.5 5.5 0 1 0-10.56 0A5.5 5.5 0 1 0 12 17.66a5.5 5.5 0 1 0 5.28-8.61Z",
);
const CLOVER_STEM_PATH = new Path2D("M12 17.66L12 22");

const CLOVER_PALETTE = [
  { stroke: "#65a30d", fill: "#c8f276", glow: "rgba(190, 242, 100, 0.8)" },
  { stroke: "#4d7c0f", fill: "#dff5ae", glow: "rgba(217, 249, 157, 0.8)" },
  { stroke: "#15803d", fill: "#9eedb8", glow: "rgba(187, 247, 208, 0.8)" },
  { stroke: "#16a34a", fill: "#c4f7d4", glow: "rgba(220, 252, 231, 0.8)" },
  { stroke: "#166534", fill: "#6fe39a", glow: "rgba(134, 239, 172, 0.8)" },
  { stroke: "#84cc16", fill: "#e9f8c8", glow: "rgba(236, 252, 203, 0.8)" },
];

const MAX_PARTICLES = 600;
const MAX_RINGS = 60;
const MAX_DEVICE_PIXEL_RATIO = 2;

const CLOVERS_PER_BURST = 10;
const SPARKLES_PER_BURST = 14;

type Sprite = { canvas: HTMLCanvasElement; size: number };

type ParticleKind = "clover" | "sparkle" | "flash";

type Particle = {
  kind: ParticleKind;
  sprite: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  size: number;
  age: number;
  delay: number;
  life: number;
  phase: number;
};

type Ring = {
  x: number;
  y: number;
  fromRadius: number;
  toRadius: number;
  age: number;
  delay: number;
  life: number;
};

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

const createSpriteCanvas = (size: number, scale: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(size * scale);
  canvas.height = Math.ceil(size * scale);
  const context = canvas.getContext("2d")!;
  context.scale(scale, scale);
  return { canvas, context };
};

const bakeClover = (
  palette: (typeof CLOVER_PALETTE)[number],
  scale: number,
): Sprite => {
  const iconSize = 36;
  const size = iconSize + 28;
  const { canvas, context } = createSpriteCanvas(size, scale);
  context.translate((size - iconSize) / 2, (size - iconSize) / 2);
  context.scale(iconSize / 24, iconSize / 24);
  context.lineWidth = 1.75;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.fillStyle = palette.fill;
  context.strokeStyle = palette.stroke;

  context.shadowColor = palette.glow;
  context.shadowBlur = 10 * scale;
  context.fill(CLOVER_PATH);
  context.shadowColor = "rgba(255, 255, 255, 0.9)";
  context.shadowBlur = 5 * scale;
  context.fill(CLOVER_PATH);

  context.shadowColor = "transparent";
  context.fill(CLOVER_PATH);
  context.stroke(CLOVER_PATH);
  context.stroke(CLOVER_STEM_PATH);
  return { canvas, size };
};

const bakeSparkle = (scale: number): Sprite => {
  const radius = 9;
  const size = radius * 2 + 20;
  const { canvas, context } = createSpriteCanvas(size, scale);
  const center = size / 2;
  context.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    const pointRadius = i % 2 === 0 ? radius : radius * 0.26;
    context.lineTo(
      center + Math.cos(angle) * pointRadius,
      center + Math.sin(angle) * pointRadius,
    );
  }
  context.closePath();
  context.fillStyle = "#fff9db";
  context.shadowColor = "rgba(250, 204, 21, 0.95)";
  context.shadowBlur = 8 * scale;
  context.fill();
  context.shadowColor = "rgba(163, 230, 53, 0.9)";
  context.shadowBlur = 4 * scale;
  context.fill();
  context.shadowColor = "transparent";
  context.fillStyle = "#ffffff";
  context.fill();
  return { canvas, size };
};

const bakeFlash = (scale: number): Sprite => {
  const size = 96;
  const { canvas, context } = createSpriteCanvas(size, scale);
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  gradient.addColorStop(0.35, "rgba(255, 255, 255, 0.55)");
  gradient.addColorStop(0.7, "rgba(217, 249, 157, 0.18)");
  gradient.addColorStop(1, "rgba(217, 249, 157, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return { canvas, size };
};

export class ClickEffectEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly clovers: Sprite[];
  private readonly sparkle: Sprite;
  private readonly flash: Sprite;
  private readonly particles: Particle[] = [];
  private readonly rings: Ring[] = [];
  private readonly isReducedMotion: boolean;
  private pixelRatio = 1;
  private frameId: number | null = null;
  private lastTime = 0;
  private dirty = { left: 0, top: 0, right: 0, bottom: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d")!;
    this.isReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    this.resize();
    const spriteScale = this.pixelRatio;
    this.clovers = CLOVER_PALETTE.map((palette) =>
      bakeClover(palette, spriteScale),
    );
    this.sparkle = bakeSparkle(spriteScale);
    this.flash = bakeFlash(spriteScale);
  }

  resize() {
    this.pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      MAX_DEVICE_PIXEL_RATIO,
    );
    this.canvas.width = Math.round(window.innerWidth * this.pixelRatio);
    this.canvas.height = Math.round(window.innerHeight * this.pixelRatio);
    this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
  }

  burst(x: number, y: number) {
    this.addRing(x, y, 6, 64, 0, 0.55);

    if (this.isReducedMotion) {
      this.start();
      return;
    }

    this.addRing(x, y, 4, 96, 0.1, 0.7);
    this.addParticle({
      kind: "flash",
      sprite: this.flash,
      x,
      y,
      vx: 0,
      vy: 0,
      rotation: 0,
      spin: 0,
      size: 110,
      age: 0,
      delay: 0,
      life: 0.32,
      phase: 0,
    });

    const angleOffset = Math.random() * Math.PI * 2;
    for (let i = 0; i < CLOVERS_PER_BURST; i += 1) {
      const angle =
        angleOffset +
        (Math.PI * 2 * i) / CLOVERS_PER_BURST +
        randomBetween(-0.25, 0.25);
      const speed = randomBetween(260, 420);
      this.addParticle({
        kind: "clover",
        sprite: this.clovers[Math.floor(Math.random() * this.clovers.length)],
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        spin: randomBetween(-4, 4),
        size: randomBetween(52, 76),
        age: 0,
        delay: 0,
        life: randomBetween(0.7, 0.95),
        phase: 0,
      });
    }

    for (let i = 0; i < SPARKLES_PER_BURST; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomBetween(120, 520);
      this.addParticle({
        kind: "sparkle",
        sprite: this.sparkle,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI,
        spin: randomBetween(-6, 6),
        size: randomBetween(24, 44),
        age: 0,
        delay: randomBetween(0, 0.12),
        life: randomBetween(0.45, 0.8),
        phase: Math.random() * Math.PI * 2,
      });
    }

    this.start();
  }

  destroy() {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.particles.length = 0;
    this.rings.length = 0;
  }

  private addParticle(particle: Particle) {
    if (this.particles.length >= MAX_PARTICLES) {
      this.particles.shift();
    }
    this.particles.push(particle);
  }

  private addRing(
    x: number,
    y: number,
    fromRadius: number,
    toRadius: number,
    delay: number,
    life: number,
  ) {
    if (this.rings.length >= MAX_RINGS) {
      this.rings.shift();
    }
    this.rings.push({ x, y, fromRadius, toRadius, age: 0, delay, life });
  }

  private start() {
    if (this.frameId !== null) {
      return;
    }
    this.lastTime = performance.now();
    this.frameId = requestAnimationFrame(this.tick);
  }

  private readonly tick = (time: number) => {
    const deltaSec = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    const context = this.context;
    const { left, top, right, bottom } = this.dirty;
    if (right > left && bottom > top) {
      context.clearRect(left, top, right - left, bottom - top);
    }
    const nextDirty = {
      left: Infinity,
      top: Infinity,
      right: -Infinity,
      bottom: -Infinity,
    };
    const markDirty = (x: number, y: number, half: number) => {
      nextDirty.left = Math.min(nextDirty.left, x - half);
      nextDirty.top = Math.min(nextDirty.top, y - half);
      nextDirty.right = Math.max(nextDirty.right, x + half);
      nextDirty.bottom = Math.max(nextDirty.bottom, y + half);
    };

    let ringWrite = 0;
    for (const ring of this.rings) {
      ring.age += deltaSec;
      const progress = (ring.age - ring.delay) / ring.life;
      if (progress >= 1) {
        continue;
      }
      this.rings[ringWrite] = ring;
      ringWrite += 1;
      if (progress < 0) {
        continue;
      }

      const radius =
        ring.fromRadius +
        (ring.toRadius - ring.fromRadius) * easeOutCubic(progress);
      const alpha = (1 - progress) ** 1.5;
      context.beginPath();
      context.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
      context.lineWidth = 12;
      context.strokeStyle = `rgba(94, 199, 165, ${0.28 * alpha})`;
      context.stroke();
      context.lineWidth = 5;
      context.strokeStyle = `rgba(94, 199, 165, ${0.55 * alpha})`;
      context.stroke();
      context.lineWidth = 2;
      context.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      context.stroke();
      markDirty(ring.x, ring.y, radius + 8);
    }
    this.rings.length = ringWrite;

    let particleWrite = 0;
    for (const particle of this.particles) {
      particle.age += deltaSec;
      const activeAge = particle.age - particle.delay;
      const progress = activeAge / particle.life;
      if (progress >= 1) {
        continue;
      }
      this.particles[particleWrite] = particle;
      particleWrite += 1;
      if (progress < 0) {
        continue;
      }

      let alpha = 1;
      let scale = 1;
      if (particle.kind === "clover") {
        const damping = Math.exp(-4.2 * deltaSec);
        particle.vx *= damping;
        particle.vy = particle.vy * damping + 240 * deltaSec;
        scale =
          progress < 0.12 ? 0.4 + (progress / 0.12) * 0.6 : 1 - progress * 0.35;
        alpha = progress < 0.65 ? 1 : 1 - (progress - 0.65) / 0.35;
      } else if (particle.kind === "sparkle") {
        const damping = Math.exp(-5.5 * deltaSec);
        particle.vx *= damping;
        particle.vy *= damping;
        scale = Math.sin(Math.PI * progress);
        alpha =
          (1 - progress * 0.5) *
          (0.55 + 0.45 * Math.sin(activeAge * 34 + particle.phase));
      } else {
        scale = 0.5 + easeOutCubic(progress) * 1.1;
        alpha = 0.9 * (1 - progress) ** 2;
      }

      particle.x += particle.vx * deltaSec;
      particle.y += particle.vy * deltaSec;
      particle.rotation += particle.spin * deltaSec;

      const drawSize = particle.size * scale;
      if (drawSize <= 0 || alpha <= 0) {
        continue;
      }
      context.globalAlpha = alpha;
      context.setTransform(
        this.pixelRatio * Math.cos(particle.rotation),
        this.pixelRatio * Math.sin(particle.rotation),
        -this.pixelRatio * Math.sin(particle.rotation),
        this.pixelRatio * Math.cos(particle.rotation),
        particle.x * this.pixelRatio,
        particle.y * this.pixelRatio,
      );
      context.drawImage(
        particle.sprite.canvas,
        -drawSize / 2,
        -drawSize / 2,
        drawSize,
        drawSize,
      );
      markDirty(particle.x, particle.y, drawSize * 0.75);
    }
    this.particles.length = particleWrite;
    context.globalAlpha = 1;
    context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);

    this.dirty = {
      left: Math.floor(nextDirty.left),
      top: Math.floor(nextDirty.top),
      right: Math.ceil(nextDirty.right),
      bottom: Math.ceil(nextDirty.bottom),
    };

    if (this.particles.length > 0 || this.rings.length > 0) {
      this.frameId = requestAnimationFrame(this.tick);
      return;
    }

    if (this.dirty.right > this.dirty.left) {
      context.clearRect(
        this.dirty.left,
        this.dirty.top,
        this.dirty.right - this.dirty.left,
        this.dirty.bottom - this.dirty.top,
      );
    }
    this.dirty = { left: 0, top: 0, right: 0, bottom: 0 };
    this.frameId = null;
  };
}
