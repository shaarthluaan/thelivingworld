/**
 * EffectsPainter — Visual effects triggered by TikTok events and global events.
 * All effects are time-limited and self-expire.
 *
 * Effect types:
 *   gift, follow, like, storm, meteor, eclipse, rain, victory
 */
export class EffectsPainter {
  constructor() {
    this._effects = [];
  }

  /**
   * Trigger an effect by name. tier is optional (for gifts).
   * cx, cy = island center canvas coords.
   */
  trigger(type, cx, cy, options = {}) {
    const now = performance.now();
    switch (type) {
      case 'gift':
        this._spawnGiftBurst(cx, cy, options.tier || 1, now);
        break;
      case 'follow':
        this._spawnFollowRibbon(cx, cy, now);
        break;
      case 'like':
        this._spawnLikeHearts(cx, cy, now);
        break;
      case 'storm':
        this._effects.push({ kind: 'storm', start: now, duration: 4000, cx, cy });
        break;
      case 'meteor':
        this._effects.push({ kind: 'meteor', start: now, duration: 2500, cx, cy });
        break;
      case 'eclipse':
        this._effects.push({ kind: 'eclipse', start: now, duration: 5000, cx, cy });
        break;
      case 'rain':
        this._effects.push({ kind: 'rain', start: now, duration: 6000, cx, cy });
        this._spawnRainDrops(cx, cy, now);
        break;
      case 'victory':
        this._spawnVictoryFireworks(cx, cy, now);
        break;
    }
  }

  _spawnGiftBurst(cx, cy, tier, now) {
    const colors = ['#ffe082', '#ff80ab', '#80deea', '#b39ddb', '#ff8a65'];
    const count = 8 + tier * 4;
    const duration = 900 + tier * 200;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 60 + tier * 30 + Math.random() * 40;
      this._effects.push({
        kind: 'burst_circle',
        start: now,
        duration,
        cx, cy,
        angle,
        speed,
        color: colors[i % colors.length],
        r: 5 + tier * 2
      });
    }
    if (tier >= 4) {
      // Extra star spray for top tier gifts
      this._effects.push({ kind: 'star_spray', start: now, duration: 1800, cx, cy });
    }
  }

  _spawnFollowRibbon(cx, cy, now) {
    this._effects.push({ kind: 'follow_ring', start: now, duration: 1200, cx, cy });
  }

  _spawnLikeHearts(cx, cy, now) {
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      this._effects.push({
        kind: 'heart',
        start: now + i * 80,
        duration: 1400,
        cx: cx + (Math.random() - 0.5) * 60,
        cy,
        angle,
        speed: 40 + Math.random() * 30
      });
    }
  }

  _spawnRainDrops(cx, cy, now) {
    for (let i = 0; i < 40; i++) {
      this._effects.push({
        kind: 'raindrop',
        start: now + Math.random() * 3000,
        duration: 800,
        cx: cx + (Math.random() - 0.5) * 200,
        cy: cy - 180,
        speed: 150 + Math.random() * 80
      });
    }
  }

  _spawnVictoryFireworks(cx, cy, now) {
    const colors = ['#ff5252', '#ffd740', '#69f0ae', '#448aff', '#e040fb'];
    for (let f = 0; f < 5; f++) {
      const fx = cx + (Math.random() - 0.5) * 120;
      const fy = cy - 60 - Math.random() * 80;
      setTimeout(() => {
        const t = performance.now();
        for (let i = 0; i < 12; i++) {
          this._effects.push({
            kind: 'burst_circle',
            start: t,
            duration: 1200,
            cx: fx, cy: fy,
            angle: (i / 12) * Math.PI * 2,
            speed: 50 + Math.random() * 40,
            color: colors[f % colors.length],
            r: 4
          });
        }
      }, f * 300);
    }
  }

  /**
   * Draw all active effects. Call once per frame.
   */
  draw(ctx, w, h, t) {
    const now = performance.now();
    // Purge expired effects
    this._effects = this._effects.filter(e => now - e.start < e.duration);

    for (const e of this._effects) {
      const progress = (now - e.start) / e.duration;  // 0→1
      ctx.save();
      switch (e.kind) {
        case 'burst_circle': this._drawBurstCircle(ctx, e, progress); break;
        case 'heart': this._drawHeart(ctx, e, progress); break;
        case 'follow_ring': this._drawFollowRing(ctx, e, progress); break;
        case 'storm': this._drawStorm(ctx, e, progress, w, h); break;
        case 'meteor': this._drawMeteor(ctx, e, progress, w, h); break;
        case 'eclipse': this._drawEclipse(ctx, e, progress, w, h); break;
        case 'rain': this._drawRainOverlay(ctx, e, progress, w, h); break;
        case 'raindrop': this._drawRaindrop(ctx, e, progress); break;
        case 'star_spray': this._drawStarSpray(ctx, e, progress, w, h); break;
      }
      ctx.restore();
    }
  }

  _drawBurstCircle(ctx, e, p) {
    const alpha = 1 - p;
    const dist = e.speed * p;
    const x = e.cx + Math.cos(e.angle) * dist;
    const y = e.cy + Math.sin(e.angle) * dist;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(x, y, e.r * (1 - p * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }

  _drawHeart(ctx, e, p) {
    const alpha = p < 0.7 ? 1 : (1 - p) / 0.3;
    const x = e.cx + Math.cos(e.angle) * e.speed * p;
    const y = e.cy + Math.sin(e.angle) * e.speed * p;
    const size = 8 * (1 - p * 0.3);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ff4d8d';
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 10, size / 10);
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.bezierCurveTo(-5, -8, -10, -3, 0, 5);
    ctx.bezierCurveTo(10, -3, 5, -8, 0, -3);
    ctx.fill();
    ctx.restore();
  }

  _drawFollowRing(ctx, e, p) {
    const r = 20 + p * 80;
    const alpha = (1 - p) * 0.8;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#69f0ae';
    ctx.lineWidth = 3 - p * 2;
    ctx.beginPath();
    ctx.arc(e.cx, e.cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  _drawStorm(ctx, e, p, w, h) {
    // Lightning flash
    if (p < 0.15 || (p > 0.5 && p < 0.6)) {
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#90caf9';
      ctx.fillRect(0, 0, w, h);
    }
    // Dark cloud overlay at top
    const cloudAlpha = Math.sin(p * Math.PI) * 0.45;
    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.4);
    grad.addColorStop(0, `rgba(50, 60, 80, ${cloudAlpha})`);
    grad.addColorStop(1, 'rgba(50, 60, 80, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h * 0.4);
    // Lightning bolt
    if (p > 0.1 && p < 0.25) {
      ctx.globalAlpha = (0.25 - p) / 0.15;
      ctx.strokeStyle = '#e8f5e9';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 10;
      const lx = e.cx + (Math.random() - 0.5) * 60;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx - 15, h * 0.2);
      ctx.lineTo(lx + 10, h * 0.3);
      ctx.lineTo(lx - 5, h * 0.45);
      ctx.stroke();
    }
  }

  _drawMeteor(ctx, e, p, w, h) {
    // Streak from top-right
    const startX = w * 0.9, startY = 0;
    const endX = e.cx, endY = e.cy;
    const x = startX + (endX - startX) * Math.min(1, p * 2);
    const y = startY + (endY - startY) * Math.min(1, p * 2);

    if (p < 0.5) {
      // Streak trail
      const trailLen = 80;
      const tx = x - Math.cos(Math.atan2(endY - startY, endX - startX)) * trailLen;
      const ty = y - Math.sin(Math.atan2(endY - startY, endX - startX)) * trailLen;
      const streakGrad = ctx.createLinearGradient(tx, ty, x, y);
      streakGrad.addColorStop(0, 'rgba(255,140,0,0)');
      streakGrad.addColorStop(1, 'rgba(255, 220, 80, 0.9)');
      ctx.strokeStyle = streakGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(x, y);
      ctx.stroke();
      // Fireball
      ctx.fillStyle = '#ff8c00';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Impact glow at center
      const impact = (p - 0.5) / 0.5;
      const alpha = (1 - impact) * 0.6;
      const r = 20 + impact * 60;
      const glow = ctx.createRadialGradient(e.cx, e.cy, 0, e.cx, e.cy, r);
      glow.addColorStop(0, `rgba(255, 180, 40, ${alpha})`);
      glow.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(e.cx, e.cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawEclipse(ctx, e, p, w, h) {
    // Purple vignette that fades in then out
    const alpha = p < 0.2 ? p / 0.2 * 0.5 : p > 0.8 ? (1 - p) / 0.2 * 0.5 : 0.5;
    const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.15, w / 2, h / 2, h * 0.75);
    vignette.addColorStop(0, 'rgba(80, 0, 120, 0)');
    vignette.addColorStop(1, `rgba(40, 0, 80, ${alpha})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // Glowing ring of eclipse light
    const ringAlpha = Math.sin(p * Math.PI) * 0.6;
    ctx.strokeStyle = `rgba(200, 160, 255, ${ringAlpha})`;
    ctx.lineWidth = 8 + Math.sin(p * Math.PI * 4) * 3;
    ctx.shadowColor = '#c8a0ff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(e.cx, e.cy - 40, 50, 0, Math.PI * 2);
    ctx.stroke();
  }

  _drawRainOverlay(ctx, e, p, w, h) {
    const alpha = Math.sin(p * Math.PI) * 0.15;
    ctx.fillStyle = `rgba(100, 150, 220, ${alpha})`;
    ctx.fillRect(0, 0, w, h);
  }

  _drawRaindrop(ctx, e, p) {
    const x = e.cx + Math.sin(p * 2) * 5;
    const y = e.cy + p * e.speed;
    ctx.globalAlpha = 0.5 * (1 - p);
    ctx.strokeStyle = '#90caf9';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y - 10);
    ctx.stroke();
  }

  _drawStarSpray(ctx, e, p, w, h) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 30 + p * 100;
      const x = e.cx + Math.cos(angle) * dist;
      const y = e.cy + Math.sin(angle) * dist;
      const alpha = (1 - p) * 0.8;
      ctx.globalAlpha = alpha;
      this._drawStar(ctx, x, y, 6 * (1 - p * 0.7), '#ffd700');
    }
  }

  _drawStar(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const ai = a + (2 * Math.PI) / 10;
      if (i === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.lineTo(x + Math.cos(ai) * r * 0.4, y + Math.sin(ai) * r * 0.4);
    }
    ctx.closePath();
    ctx.fill();
  }
}
