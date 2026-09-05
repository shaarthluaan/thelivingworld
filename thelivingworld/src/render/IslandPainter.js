/**
 * IslandPainter — Draws a stylized organic island with layered terrain,
 * paths, rocks, flowers, soil variation and depth.
 *
 * Receives the canvas context (cx), game state, and animation time (t).
 * Uses seeded pseudo-random for stable decoration placement.
 */
export class IslandPainter {
  constructor() {
    // Pre-compute stable decoration positions so they don't shift each frame
    this._decorations = this._buildDecorations();
  }

  /** Cheap seeded LCG for stable pseudo-random positions */
  _rng(seed) {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  }

  _buildDecorations() {
    const rng = this._rng(0xdeadbeef);
    const decs = [];
    // rocks
    for (let i = 0; i < 14; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = 0.35 + rng() * 0.52;
      decs.push({ kind: 'rock', angle, radius, size: 2 + rng() * 5 });
    }
    // flowers
    for (let i = 0; i < 22; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = 0.15 + rng() * 0.6;
      const colors = ['#ff8fab', '#ffb347', '#fff176', '#c8e6c9', '#b39ddb'];
      decs.push({ kind: 'flower', angle, radius, color: colors[Math.floor(rng() * colors.length)], size: 3 + rng() * 3 });
    }
    // grass tufts
    for (let i = 0; i < 18; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = 0.1 + rng() * 0.65;
      decs.push({ kind: 'grass', angle, radius, size: 4 + rng() * 5 });
    }
    return decs;
  }

  /**
   * Draw the full island centered at (cx, cy) with semi-axes (rx, ry).
   * era: 1–7, t: animation timestamp in ms
   */
  draw(ctx, cx, cy, rx, ry, era, t) {
    ctx.save();
    ctx.translate(cx, cy);

    this._drawShadow(ctx, rx, ry);
    this._drawBeach(ctx, rx, ry);
    this._drawGrass(ctx, rx, ry, era);
    this._drawInnerVariation(ctx, rx, ry, era);
    this._drawPath(ctx, rx, ry);
    this._drawDecorations(ctx, rx, ry, era, t);

    ctx.restore();
  }

  _drawShadow(ctx, rx, ry) {
    // Drop shadow beneath island for depth
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 18;
    ctx.fillStyle = 'rgba(0,0,0,0.01)';
    ctx.beginPath();
    ctx.ellipse(0, 10, rx * 0.92, ry * 0.88, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawBeach(ctx, rx, ry) {
    // Outer beach/shore ring
    const grad = ctx.createRadialGradient(0, 10, rx * 0.5, 0, 10, rx * 1.05);
    grad.addColorStop(0, '#c8a96e');
    grad.addColorStop(0.6, '#b8915a');
    grad.addColorStop(1, '#8a6a40');
    ctx.fillStyle = grad;
    ctx.beginPath();
    this._organicEllipse(ctx, 0, 8, rx, ry);
    ctx.fill();
  }

  _drawGrass(ctx, rx, ry, era) {
    // Grass body — color shifts with era
    const eraColors = [
      ['#5a9e48', '#74c257'],  // 1 Descoberta — fresh spring
      ['#4e9e50', '#6cbf5a'],  // 2 Fundação
      ['#45996a', '#62c87e'],  // 3 Expansão — lush
      ['#3d9470', '#58bf89'],  // 4 Prosperidade
      ['#7b7bbf', '#9a9ae0'],  // 5 Mistério — purple hue
      ['#8a3a3a', '#b55a5a'],  // 6 Ameaça — dark red
      ['#c8a020', '#f0c030'],  // 7 Ascensão — golden
    ];
    const [dark, light] = eraColors[Math.min(era - 1, 6)];
    const grad = ctx.createRadialGradient(-rx * 0.15, -ry * 0.2, rx * 0.1, 0, 0, rx * 0.95);
    grad.addColorStop(0, light);
    grad.addColorStop(0.65, dark);
    grad.addColorStop(1, '#2d5a20');

    ctx.fillStyle = grad;
    ctx.beginPath();
    this._organicEllipse(ctx, 0, -4, rx * 0.88, ry * 0.82);
    ctx.fill();
  }

  _drawInnerVariation(ctx, rx, ry, era) {
    // Subtle inner terrain patches for depth
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-rx * 0.18, -ry * 0.22, rx * 0.28, ry * 0.2, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(rx * 0.22, ry * 0.15, rx * 0.2, ry * 0.16, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawPath(ctx, rx, ry) {
    // Stone path from center radiating outward
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = '#d4b896';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.setLineDash([8, 12]);

    // Path going lower-right
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(rx * 0.18, ry * 0.15, rx * 0.38, ry * 0.3, rx * 0.55, ry * 0.42);
    ctx.stroke();

    // Path going upper-left
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-rx * 0.12, -ry * 0.18, -rx * 0.25, -ry * 0.32, -rx * 0.38, -ry * 0.42);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.restore();
  }

  _drawDecorations(ctx, rx, ry, era, t) {
    for (const dec of this._decorations) {
      const x = Math.cos(dec.angle) * dec.radius * rx;
      const y = Math.sin(dec.angle) * dec.radius * ry;

      if (dec.kind === 'rock') {
        this._drawRock(ctx, x, y, dec.size);
      } else if (dec.kind === 'flower') {
        this._drawFlower(ctx, x, y, dec.size, dec.color, t);
      } else if (dec.kind === 'grass' && era >= 1) {
        this._drawGrassTuft(ctx, x, y, dec.size, t);
      }
    }
  }

  _drawRock(ctx, x, y, size) {
    ctx.save();
    ctx.fillStyle = '#9e8c78';
    ctx.strokeStyle = '#7a6b5a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.2, size * 1.3, size * 0.8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.ellipse(x - size * 0.2, y - size * 0.1, size * 0.5, size * 0.3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawFlower(ctx, x, y, size, color, t) {
    ctx.save();
    const sway = Math.sin(t / 1800 + x * 0.05) * 0.08;
    ctx.translate(x, y);
    ctx.rotate(sway);
    // Stem
    ctx.strokeStyle = '#5a8c3a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -size * 1.4);
    ctx.stroke();
    // Petals
    ctx.fillStyle = color;
    for (let p = 0; p < 5; p++) {
      const pa = (p / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(pa) * size * 0.6, -size * 1.4 + Math.sin(pa) * size * 0.6, size * 0.5, size * 0.4, pa, 0, Math.PI * 2);
      ctx.fill();
    }
    // Center
    ctx.fillStyle = '#fff176';
    ctx.beginPath();
    ctx.arc(0, -size * 1.4, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawGrassTuft(ctx, x, y, size, t) {
    ctx.save();
    ctx.strokeStyle = '#6abf50';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    const sway = Math.sin(t / 2200 + y * 0.03) * 0.12;
    for (let b = -1; b <= 1; b++) {
      ctx.save();
      ctx.translate(x + b * size * 0.6, y);
      ctx.rotate(b * 0.3 + sway);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(size * 0.3, -size * 0.7, 0, -size * 1.1);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Draw an organic (slightly wobbly) ellipse using bezier curves.
   * Provides a more natural island silhouette than ctx.ellipse.
   */
  _organicEllipse(ctx, cx, cy, rx, ry) {
    const wobble = [
      [0, 1.0], [0.08, 0.96], [0.18, 1.04], [0.3, 0.97],
      [0.4, 1.02], [0.5, 0.95], [0.6, 1.03], [0.7, 0.98],
      [0.8, 1.05], [0.9, 0.97], [1.0, 1.0]
    ];
    ctx.moveTo(cx + rx * wobble[0][1], cy);
    const pts = wobble.map(([t, w]) => ({
      x: cx + Math.cos(t * Math.PI * 2) * rx * w,
      y: cy + Math.sin(t * Math.PI * 2) * ry * w
    }));
    for (let i = 0; i < pts.length; i++) {
      const curr = pts[i];
      const next = pts[(i + 1) % pts.length];
      const mx = (curr.x + next.x) / 2;
      const my = (curr.y + next.y) / 2;
      ctx.quadraticCurveTo(curr.x, curr.y, mx, my);
    }
    ctx.closePath();
  }
}
