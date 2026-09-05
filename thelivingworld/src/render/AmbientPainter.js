/**
 * AmbientPainter — Floating particles, stars, and sky ambiance.
 * Runs entirely on requestAnimationFrame time (t), no external timers.
 */
export class AmbientPainter {
  constructor() {
    // Pre-compute stable star positions
    this._stars = this._buildStars(60);
    // Particle pool — reused each frame
    this._particles = this._buildParticles(35);
  }

  _rng(seed) {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  }

  _buildStars(count) {
    const rng = this._rng(0xc0ffee42);
    return Array.from({ length: count }, (_, i) => ({
      x: rng(),  // fraction of width
      y: rng() * 0.55,  // upper sky only
      r: 0.5 + rng() * 1.5,
      twinkleOffset: rng() * Math.PI * 2
    }));
  }

  _buildParticles(count) {
    const rng = this._rng(0xfeedbeef);
    return Array.from({ length: count }, (_, i) => ({
      xFrac: 0.15 + rng() * 0.7,  // horizontal fraction of canvas
      yBase: 0.25 + rng() * 0.55, // starting vertical fraction
      speed: 0.00004 + rng() * 0.00008,
      alpha: 0.3 + rng() * 0.5,
      r: 1.2 + rng() * 2.2,
      offset: rng() * Math.PI * 2,
      color: ['#c8e6ff', '#ffe0a0', '#d0f0c0', '#ffc8e8', '#e8d0ff'][Math.floor(rng() * 5)]
    }));
  }

  /**
   * Draw sky background with day/night cycle.
   */
  drawSky(ctx, w, h, t) {
    const night = (Math.sin(t / 30000) + 1) / 2;  // 0 = day, 1 = night

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
    if (night < 0.4) {
      // Daytime
      skyGrad.addColorStop(0, `hsl(210, 70%, ${50 + night * 10}%)`);
      skyGrad.addColorStop(0.5, `hsl(200, 60%, ${65 + night * 8}%)`);
      skyGrad.addColorStop(1, `hsl(190, 40%, ${78 + night * 5}%)`);
    } else {
      // Dusk to night
      const n = (night - 0.4) / 0.6;
      skyGrad.addColorStop(0, `hsl(${230 + n * 20}, ${60 + n * 20}%, ${35 - n * 20}%)`);
      skyGrad.addColorStop(0.5, `hsl(${220 + n * 15}, 50%, ${45 - n * 18}%)`);
      skyGrad.addColorStop(1, `hsl(210, 35%, ${60 - n * 22}%)`);
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars (visible at night)
    if (night > 0.25) {
      const starAlpha = Math.min(1, (night - 0.25) / 0.3);
      for (const star of this._stars) {
        const twinkle = 0.6 + Math.sin(t / 1500 + star.twinkleOffset) * 0.4;
        ctx.fillStyle = `rgba(255, 250, 230, ${starAlpha * twinkle * star.alpha || starAlpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x * w, star.y * h, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Moon or sun
    if (night > 0.5) {
      const moonX = w * 0.78;
      const moonY = h * 0.1;
      const moonAlpha = Math.min(1, (night - 0.5) * 2);
      // Glow
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, 22);
      moonGlow.addColorStop(0, `rgba(255, 250, 200, ${moonAlpha * 0.25})`);
      moonGlow.addColorStop(1, 'rgba(255, 250, 200, 0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
      ctx.fill();
      // Moon body
      ctx.fillStyle = `rgba(250, 245, 215, ${moonAlpha * 0.95})`;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 10, 0, Math.PI * 2);
      ctx.fill();
      // Crescent shadow
      ctx.fillStyle = `rgba(120, 140, 180, ${moonAlpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(moonX + 4, moonY - 2, 9, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Sun
      const sunAlpha = 1 - night * 2;
      const sunX = w * 0.75;
      const sunY = h * 0.12;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 30);
      sunGlow.addColorStop(0, `rgba(255, 240, 140, ${sunAlpha * 0.4})`);
      sunGlow.addColorStop(1, 'rgba(255, 240, 140, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 240, 140, ${sunAlpha * 0.95})`;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 13, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant clouds (only daytime)
    if (night < 0.5) {
      this._drawClouds(ctx, w, h, t, 1 - night * 2);
    }
  }

  _drawClouds(ctx, w, h, t, alpha) {
    const clouds = [
      { xFrac: 0.15, y: h * 0.08, scale: 1.0, speed: 0.000012 },
      { xFrac: 0.55, y: h * 0.13, scale: 0.7, speed: 0.000008 },
      { xFrac: 0.82, y: h * 0.07, scale: 0.85, speed: 0.00001 },
    ];
    ctx.save();
    ctx.globalAlpha = alpha * 0.5;
    for (const cl of clouds) {
      const cx = ((cl.xFrac + t * cl.speed) % 1.2 - 0.1) * w;
      this._drawCloud(ctx, cx, cl.y, cl.scale);
    }
    ctx.restore();
  }

  _drawCloud(ctx, x, y, scale) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const puffs = [
      { dx: 0, dy: 0, r: 18 },
      { dx: 20, dy: -5, r: 22 },
      { dx: 42, dy: 0, r: 16 },
      { dx: 60, dy: 4, r: 14 },
    ];
    for (const p of puffs) {
      ctx.beginPath();
      ctx.arc(x + p.dx * scale, y + p.dy * scale, p.r * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Draw ambient floating sparkle particles.
   */
  drawParticles(ctx, w, h, t) {
    for (const p of this._particles) {
      const phase = (t * p.speed + p.offset) % (Math.PI * 2);
      const y = p.yBase * h - (phase / (Math.PI * 2)) * h * 0.2;
      const x = p.xFrac * w + Math.sin(phase * 2 + p.offset) * 8;
      const alpha = p.alpha * Math.sin(phase);
      if (alpha <= 0) continue;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /**
   * Draw a simple habitant dot with name tag.
   */
  drawHabitant(ctx, x, y, name, level, t, index) {
    const bob = Math.sin(t / 700 + index * 1.3) * 2;
    ctx.save();
    ctx.translate(x, y + bob);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const bodyColor = level >= 8 ? '#ffd700' : level >= 5 ? '#c890e8' : level >= 3 ? '#64b5f6' : '#ef9a9a';
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Head
    ctx.fillStyle = '#ffd5b8';
    ctx.beginPath();
    ctx.arc(0, -9, 4, 0, Math.PI * 2);
    ctx.fill();

    // Name tag (only show first name, truncated)
    if (name) {
      const shortName = name.split(' ')[0].substring(0, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      const tw = ctx.measureText(shortName).width + 6;
      ctx.beginPath();
      ctx.roundRect(-tw / 2, -22, tw, 11, 3);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 7px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(shortName, 0, -16.5);
    }

    ctx.restore();
  }
}
