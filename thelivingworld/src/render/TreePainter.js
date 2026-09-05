/**
 * TreePainter — Three stylized tree variants with layered canopies,
 * shaped trunks, shadow and subtle wind animation.
 *
 * Variant 0: Oak  — wide, round, multi-layer
 * Variant 1: Pine — tall, triangular tiers
 * Variant 2: Bush — low shrub cluster with optional flowers
 */
export class TreePainter {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x  center-base x
   * @param {number} y  base y
   * @param {number} variant 0=oak, 1=pine, 2=bush
   * @param {number} scale  size multiplier (0.7 – 1.3)
   * @param {number} t  animation timestamp
   * @param {number} seed  per-tree stable seed for color/sway variation
   */
  draw(ctx, x, y, variant, scale, t, seed) {
    const sway = Math.sin(t / 2000 + seed * 1.7) * 1.8; // degrees
    ctx.save();
    ctx.translate(x, y);

    switch (variant % 3) {
      case 0: this._drawOak(ctx, scale, sway, seed, t); break;
      case 1: this._drawPine(ctx, scale, sway, seed); break;
      case 2: this._drawBush(ctx, scale, sway, seed, t); break;
    }

    ctx.restore();
  }

  _drawOak(ctx, scale, sway, seed, t) {
    const h = 38 * scale;
    const trunkW = 6 * scale;

    // Shadow on ground
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(4 * scale, 2, trunkW * 2.2, trunkW * 0.8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Trunk
    ctx.save();
    ctx.rotate((sway * Math.PI) / 180 * 0.3);
    const trunkGrad = ctx.createLinearGradient(-trunkW, -h, trunkW, -h * 0.1);
    trunkGrad.addColorStop(0, '#7a5230');
    trunkGrad.addColorStop(1, '#5a3a1a');
    ctx.fillStyle = trunkGrad;
    ctx.beginPath();
    ctx.moveTo(-trunkW * 0.5, 0);
    ctx.bezierCurveTo(-trunkW * 0.8, -h * 0.3, -trunkW * 0.6, -h * 0.7, -trunkW * 0.3, -h);
    ctx.bezierCurveTo(trunkW * 0.3, -h, trunkW * 0.6, -h * 0.7, trunkW * 0.5, -h * 0.4);
    ctx.bezierCurveTo(trunkW * 0.7, -h * 0.1, trunkW * 0.5, 0, trunkW * 0.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Canopy layers (bottom to top)
    const colors = ['#2d6e1f', '#3d8a2c', '#52a838'];
    const variants = [
      { dy: 0,      rx: 26 * scale, ry: 18 * scale },
      { dy: -14 * scale, rx: 22 * scale, ry: 17 * scale },
      { dy: -26 * scale, rx: 16 * scale, ry: 13 * scale },
    ];
    ctx.save();
    ctx.rotate((sway * Math.PI) / 180);
    ctx.translate(0, -h);
    for (let i = 0; i < 3; i++) {
      const v = variants[i];
      const grad = ctx.createRadialGradient(-v.rx * 0.2, v.dy - v.ry * 0.2, v.rx * 0.1, 0, v.dy, v.rx);
      grad.addColorStop(0, colors[i]);
      grad.addColorStop(1, '#1a4a10');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse((seed % 5 - 2) * scale, v.dy, v.rx, v.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Highlight shimmer
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    ctx.ellipse(-8 * scale, variants[2].dy - 4 * scale, 10 * scale, 7 * scale, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawPine(ctx, scale, sway, seed) {
    const h = 52 * scale;
    const trunkW = 4 * scale;

    // Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(3 * scale, 2, trunkW * 2, trunkW * 0.6, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Trunk
    ctx.fillStyle = '#6b4226';
    ctx.beginPath();
    ctx.rect(-trunkW * 0.5, -h * 0.28, trunkW, h * 0.28);
    ctx.fill();

    // Three triangular tiers, bottom to top
    const tiers = [
      { y: -h * 0.28, halfW: 20 * scale, height: 22 * scale, color: '#1e5c18' },
      { y: -h * 0.52, halfW: 15 * scale, height: 18 * scale, color: '#2a7a22' },
      { y: -h * 0.72, halfW: 10 * scale, height: 14 * scale, color: '#3a9230' },
    ];

    ctx.save();
    ctx.rotate((sway * Math.PI) / 180 * 0.5);
    for (const tier of tiers) {
      ctx.fillStyle = tier.color;
      ctx.beginPath();
      ctx.moveTo(0, tier.y - tier.height);
      ctx.lineTo(-tier.halfW + (seed % 3 - 1) * 2, tier.y);
      ctx.lineTo(tier.halfW + (seed % 3 - 1), tier.y);
      ctx.closePath();
      ctx.fill();
      // Snow-like highlight on top tier
      if (tier === tiers[2]) {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.moveTo(0, tier.y - tier.height);
        ctx.lineTo(-tier.halfW * 0.4, tier.y - tier.height * 0.5);
        ctx.lineTo(tier.halfW * 0.4, tier.y - tier.height * 0.5);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  _drawBush(ctx, scale, sway, seed, t) {
    const baseR = 14 * scale;

    // Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.13)';
    ctx.beginPath();
    ctx.ellipse(2, 2, baseR * 1.4, baseR * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bush clusters
    const clusters = [
      { dx: -baseR * 0.5, dy: 0,          r: baseR * 0.75, color: '#3a7a2a' },
      { dx:  baseR * 0.5, dy: -baseR * 0.1, r: baseR * 0.7,  color: '#2d6e1f' },
      { dx:  0,           dy: -baseR * 0.4, r: baseR * 0.8,  color: '#4a9038' },
    ];

    ctx.save();
    ctx.rotate((sway * Math.PI) / 180 * 0.4);
    for (const cl of clusters) {
      const grad = ctx.createRadialGradient(cl.dx - cl.r * 0.2, cl.dy - cl.r * 0.2, cl.r * 0.1, cl.dx, cl.dy, cl.r);
      grad.addColorStop(0, cl.color);
      grad.addColorStop(1, '#1a3d10');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cl.dx, cl.dy, cl.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Small flower dots on bush
    if (seed % 3 === 0) {
      const fc = ['#ffb347', '#ff8fab', '#fff176'];
      for (let f = 0; f < 3; f++) {
        const fa = (f / 3) * Math.PI * 2 + seed;
        const fx = Math.cos(fa) * baseR * 0.5;
        const fy = Math.sin(fa) * baseR * 0.35 - baseR * 0.3;
        const sway2 = Math.sin(t / 1500 + f * 1.2) * 0.06;
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(sway2);
        ctx.fillStyle = fc[f % fc.length];
        ctx.beginPath();
        ctx.arc(0, 0, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }
}
