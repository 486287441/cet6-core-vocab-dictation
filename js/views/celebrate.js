import { formatStudyDuration } from "../storage.js";
import { iconSparkles } from "../ui/icons.js";

/**
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {number} options.totalStudyMs
 * @param {number} options.playthrough
 * @param {() => void} options.onReplay
 * @returns {{ destroy: () => void }}
 */
export function renderCelebrate(container, options) {
  const { totalStudyMs, playthrough, onReplay } = options;

  container.innerHTML = `
    <section class="celebrate" aria-labelledby="celebrate-title">
      <canvas class="celebrate__canvas" data-canvas aria-hidden="true"></canvas>
      <hr class="rule rule--short" aria-hidden="true" />
      <div class="celebrate__icon" aria-hidden="true">${iconSparkles}</div>
      <h2 id="celebrate-title" class="celebrate__title">恭喜完搞定六级所有核心词</h2>
      <p class="celebrate__lede">每一批都已背熟，可以安心上考场了。</p>
      <p class="celebrate__time">
        <span class="celebrate__time-label">累计学习</span>
        <span class="celebrate__time-value">${formatStudyDuration(totalStudyMs)}</span>
      </p>
      <p class="celebrate__meta">第 ${playthrough} 轮全库 · 跨天累计时长</p>
      <hr class="rule rule--short" aria-hidden="true" />
      <button type="button" class="celebrate__btn" data-replay>再背一遍</button>
      <p class="celebrate__hint">测试：任意页面按 <kbd class="kbd">Shift</kbd> + <kbd class="kbd">.</kbd> 预览本页</p>
    </section>
  `;

  const canvas = container.querySelector("[data-canvas]");
  const replayBtn = container.querySelector("[data-replay]");
  const confetti = canvas instanceof HTMLCanvasElement ? createConfetti(canvas) : null;
  confetti?.start();

  replayBtn?.addEventListener("click", () => {
    const ok = window.confirm(
      "重新开始全库？进度与累计时长将清零，从第 1 批重新计时。",
    );
    if (ok) onReplay();
  });

  return {
    destroy() {
      confetti?.stop();
      container.innerHTML = "";
    },
  };
}

/**
 * @param {HTMLCanvasElement} canvas
 */
function createConfetti(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  /** @type {number | null} */
  let rafId = null;
  let running = false;

  const colors = ["#1b365d", "#3d5a80", "#6b665b", "#d4d1c5"];
  /** @type {Array<{ x: number, y: number, vx: number, vy: number, w: number, h: number, rot: number, vr: number, color: string }>} */
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function spawn(count) {
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -12 - Math.random() * canvas.height * 0.3,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 1.2 + Math.random() * 2.4,
        w: 4 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.08,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  function draw() {
    if (!running || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.rot += p.vr;

      if (p.y > canvas.height + 20) {
        p.y = -16;
        p.x = Math.random() * canvas.width;
        p.vy = 1.2 + Math.random() * 2;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    rafId = requestAnimationFrame(draw);
  }

  function onResize() {
    resize();
  }

  return {
    start() {
      if (running) return;
      running = true;
      resize();
      spawn(80);
      window.addEventListener("resize", onResize);
      draw();
    },
    stop() {
      running = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      particles = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
