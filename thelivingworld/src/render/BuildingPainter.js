/**
 * BuildingPainter — Stylized era-appropriate buildings with walls,
 * roofs, windows, doors, chimneys, and depth shading.
 *
 * Era groups:
 *  1-2 → Wooden Hut (thatched)
 *  3-4 → Stone Cottage (pitched roof, chimney)
 *  5   → Guild Tower (multi-story)
 *  6   → Fortified Keep (ramparts)
 *  7   → Celestial Palace (glow, turrets)
 */
export class BuildingPainter {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x  left-center x
   * @param {number} y  base y (ground level)
   * @param {number} era  1–7
   * @param {number} variant  0 or 1 for visual variety
   * @param {number} t  animation time
   */
  draw(ctx, x, y, era, variant, t) {
    ctx.save();
    ctx.translate(x, y);

    if (era <= 2) this._drawHut(ctx, variant, t, era);
    else if (era <= 4) this._drawCottage(ctx, variant, t, era);
    else if (era <= 5) this._drawTower(ctx, variant, t, era);
    else if (era <= 6) this._drawKeep(ctx, variant, t, era);
    else this._drawPalace(ctx, variant, t);

    ctx.restore();
  }

  _shadow(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(w * 0.15, 2, w * 0.55, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawHut(ctx, variant, t, era) {
    const w = 30, h = 22;
    this._shadow(ctx, w, h);

    // Walls
    const wallGrad = ctx.createLinearGradient(-w / 2, -h, w / 2, 0);
    wallGrad.addColorStop(0, '#c8956e');
    wallGrad.addColorStop(1, '#8a5c3a');
    ctx.fillStyle = wallGrad;
    ctx.beginPath();
    ctx.rect(-w / 2, -h, w, h);
    ctx.fill();
    ctx.strokeStyle = '#6a3c1a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Thatched roof
    const roofColors = ['#b8860b', '#8b6914', '#d4a520'];
    ctx.fillStyle = roofColors[variant % 3];
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 5, -h);
    ctx.lineTo(0 + variant * 3 - 2, -h - 18);
    ctx.lineTo(w / 2 + 5, -h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6b4f00';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Roof texture lines
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let r = 0; r < 4; r++) {
      ctx.beginPath();
      ctx.moveTo(-w / 2 - 5 + r * 10, -h);
      ctx.lineTo(r * 3 - 4, -h - 18);
      ctx.stroke();
    }
    ctx.restore();

    // Door
    ctx.fillStyle = '#5a3010';
    ctx.beginPath();
    const dx = variant === 0 ? -6 : 3;
    ctx.rect(dx - 4, -13, 8, 13);
    ctx.fill();
    // Arch top of door
    ctx.beginPath();
    ctx.arc(dx, -13, 4, Math.PI, 0);
    ctx.fill();

    // Window
    ctx.fillStyle = '#fffde7';
    ctx.strokeStyle = '#5a3010';
    ctx.lineWidth = 1.5;
    const wx = variant === 0 ? 8 : -8;
    ctx.beginPath();
    ctx.rect(wx - 4, -h + 5, 8, 6);
    ctx.fill();
    ctx.stroke();

    // Smoke from chimney (animated)
    if (era >= 2) {
      this._drawSmoke(ctx, w / 2 - 5, -h - 8, t);
    }
  }

  _drawCottage(ctx, variant, t, era) {
    const w = 36, h = 26;
    this._shadow(ctx, w, h);

    // Stone walls
    const wallGrad = ctx.createLinearGradient(-w / 2, -h, w / 2, 0);
    wallGrad.addColorStop(0, '#c0b090');
    wallGrad.addColorStop(1, '#8a7060');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(-w / 2, -h, w, h);
    ctx.strokeStyle = '#6a5840';
    ctx.lineWidth = 1;
    ctx.strokeRect(-w / 2, -h, w, h);

    // Stone block pattern
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.8;
    for (let row = 0; row < 3; row++) {
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h + row * 9);
      ctx.lineTo(w / 2, -h + row * 9);
      ctx.stroke();
      for (let col = 0; col < 3; col++) {
        const ox = (row % 2 === 0 ? 0 : 6);
        ctx.beginPath();
        ctx.moveTo(-w / 2 + ox + col * 12, -h + row * 9);
        ctx.lineTo(-w / 2 + ox + col * 12, -h + (row + 1) * 9);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Pitched roof
    const roofGrad = ctx.createLinearGradient(0, -h - 20, 0, -h);
    roofGrad.addColorStop(0, '#c84030');
    roofGrad.addColorStop(1, '#8a2c20');
    ctx.fillStyle = roofGrad;
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 4, -h);
    ctx.lineTo(variant === 0 ? -2 : 2, -h - 22);
    ctx.lineTo(w / 2 + 4, -h);
    ctx.closePath();
    ctx.fill();

    // Chimney
    const cx = w / 2 - 8;
    ctx.fillStyle = '#9a7060';
    ctx.fillRect(cx, -h - 20, 7, 14);
    ctx.fillStyle = '#b08070';
    ctx.fillRect(cx - 1, -h - 22, 9, 4);
    this._drawSmoke(ctx, cx + 3, -h - 22, t);

    // Door
    ctx.fillStyle = '#5a3820';
    ctx.beginPath();
    ctx.rect(-6, -h + h - 13, 12, 13);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -h + h - 13, 6, Math.PI, 0);
    ctx.fill();
    // Door knob
    ctx.fillStyle = '#f4c430';
    ctx.beginPath();
    ctx.arc(5, -5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Two windows
    for (const wx of [-13, 13]) {
      ctx.fillStyle = '#e8f4f8';
      ctx.fillRect(wx - 5, -h + 8, 10, 8);
      ctx.strokeStyle = '#5a3820';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wx - 5, -h + 8, 10, 8);
      // Cross pane
      ctx.beginPath();
      ctx.moveTo(wx, -h + 8);
      ctx.lineTo(wx, -h + 16);
      ctx.moveTo(wx - 5, -h + 12);
      ctx.lineTo(wx + 5, -h + 12);
      ctx.stroke();
    }
  }

  _drawTower(ctx, variant, t, era) {
    const w = 28, h = 48;
    this._shadow(ctx, w, h);

    // Tower body
    const wallGrad = ctx.createLinearGradient(-w / 2, -h, w / 2, 0);
    wallGrad.addColorStop(0, '#b0a0c8');
    wallGrad.addColorStop(1, '#7060a0');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(-w / 2, -h, w, h);
    ctx.strokeStyle = '#504070';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-w / 2, -h, w, h);

    // Conical roof
    ctx.fillStyle = '#503090';
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 3, -h);
    ctx.lineTo(0, -h - 28);
    ctx.lineTo(w / 2 + 3, -h);
    ctx.closePath();
    ctx.fill();

    // Flag
    const flagAnim = Math.sin(t / 400) * 3;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(0, -h - 28);
    ctx.lineTo(0, -h - 20);
    ctx.lineTo(10 + flagAnim, -h - 25 + flagAnim * 0.3);
    ctx.closePath();
    ctx.fill();

    // Arched windows
    for (let row = 0; row < 2; row++) {
      ctx.fillStyle = '#fff9c4';
      const wy = -h + 12 + row * 20;
      ctx.fillRect(-4, wy, 8, 10);
      ctx.beginPath();
      ctx.arc(0, wy, 4, Math.PI, 0);
      ctx.fill();
      // Glow
      ctx.fillStyle = `rgba(255, 220, 100, ${0.15 + Math.sin(t / 800 + row) * 0.08})`;
      ctx.beginPath();
      ctx.arc(0, wy + 5, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Door
    ctx.fillStyle = '#3a2060';
    ctx.fillRect(-5, -14, 10, 14);
    ctx.beginPath();
    ctx.arc(0, -14, 5, Math.PI, 0);
    ctx.fill();
  }

  _drawKeep(ctx, variant, t, era) {
    const w = 40, h = 38;
    this._shadow(ctx, w, h);

    // Main keep body
    const wallGrad = ctx.createLinearGradient(-w / 2, -h, w / 2, 0);
    wallGrad.addColorStop(0, '#9a8880');
    wallGrad.addColorStop(1, '#6a5850');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(-w / 2, -h, w, h);

    // Battlements (ramparts)
    ctx.fillStyle = '#8a7870';
    const merlons = 5;
    const mW = w / merlons;
    for (let m = 0; m < merlons; m++) {
      if (m % 2 === 0) {
        ctx.fillRect(-w / 2 + m * mW, -h - 8, mW - 1, 8);
      }
    }
    ctx.strokeStyle = '#5a4840';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-w / 2, -h, w, h);

    // Red banner
    ctx.fillStyle = '#c02020';
    ctx.fillRect(-3, -h - 8, 6, -16);
    ctx.beginPath();
    ctx.moveTo(3, -h - 8);
    ctx.lineTo(3, -h - 20);
    ctx.lineTo(12 + Math.sin(t / 350) * 3, -h - 14);
    ctx.closePath();
    ctx.fill();

    // Gate/door arch
    ctx.fillStyle = '#3a2810';
    ctx.fillRect(-9, -h + h - 16, 18, 16);
    ctx.beginPath();
    ctx.arc(0, -h + h - 16, 9, Math.PI, 0);
    ctx.fill();

    // Windows (arrow slits)
    ctx.fillStyle = '#1a1408';
    for (const wx of [-14, 14]) {
      ctx.fillRect(wx - 2, -h + 10, 4, 10);
    }
    // Torches
    for (const tx of [-w / 2 + 5, w / 2 - 5]) {
      const flicker = Math.sin(t / 120 + tx) * 0.4;
      ctx.fillStyle = `rgba(255, ${160 + flicker * 40}, 50, 0.9)`;
      ctx.beginPath();
      ctx.arc(tx, -h + 8, 3 + flicker, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawPalace(ctx, variant, t) {
    const w = 52, h = 42;
    this._shadow(ctx, w, h);

    // Palace glow aura
    const glowAlpha = 0.08 + Math.sin(t / 1200) * 0.05;
    const aura = ctx.createRadialGradient(0, -h / 2, 10, 0, -h / 2, w);
    aura.addColorStop(0, `rgba(255, 220, 100, ${glowAlpha})`);
    aura.addColorStop(1, 'rgba(255, 220, 100, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, -h / 2, w * 1.2, h * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main body
    const wallGrad = ctx.createLinearGradient(-w / 2, -h, w / 2, 0);
    wallGrad.addColorStop(0, '#f0d890');
    wallGrad.addColorStop(1, '#c0a050');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(-w / 2, -h, w, h);
    ctx.strokeStyle = '#a08030';
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2, -h, w, h);

    // Side turrets
    for (const tx of [-w / 2 - 8, w / 2 - 4]) {
      ctx.fillStyle = '#d4bc70';
      ctx.fillRect(tx, -h - 10, 12, h + 10);
      ctx.strokeStyle = '#a09030';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, -h - 10, 12, h + 10);
      // Turret cap
      ctx.fillStyle = '#c02020';
      ctx.beginPath();
      ctx.moveTo(tx - 2, -h - 10);
      ctx.lineTo(tx + 6, -h - 24);
      ctx.lineTo(tx + 14, -h - 10);
      ctx.closePath();
      ctx.fill();
    }

    // Central dome
    ctx.fillStyle = '#c02020';
    ctx.beginPath();
    ctx.arc(0, -h - 2, 18, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#f0d890';
    ctx.beginPath();
    ctx.arc(0, -h - 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Windows row
    for (let wi = -1; wi <= 1; wi++) {
      const wAlpha = 0.6 + Math.sin(t / 900 + wi * 1.1) * 0.3;
      ctx.fillStyle = `rgba(255, 240, 180, ${wAlpha})`;
      ctx.fillRect(wi * 16 - 5, -h + 10, 10, 14);
      ctx.beginPath();
      ctx.arc(wi * 16, -h + 10, 5, Math.PI, 0);
      ctx.fill();
    }

    // Grand entrance
    ctx.fillStyle = '#6a3000';
    ctx.fillRect(-10, -20, 20, 20);
    ctx.beginPath();
    ctx.arc(0, -20, 10, Math.PI, 0);
    ctx.fill();
    // Gold door trim
    ctx.strokeStyle = '#f0c030';
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -20, 20, 20);
  }

  _drawSmoke(ctx, x, y, t) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    for (let s = 0; s < 3; s++) {
      const phase = (t / 2000 + s * 0.33) % 1;
      const sy = y - phase * 20;
      const sx = x + Math.sin(t / 1000 + s * 2) * 3;
      const sr = 3 + phase * 4;
      ctx.fillStyle = `rgba(200, 190, 180, ${0.6 - phase * 0.6})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
