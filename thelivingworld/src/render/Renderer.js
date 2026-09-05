import { IslandPainter } from './IslandPainter.js';
import { TreePainter } from './TreePainter.js';
import { BuildingPainter } from './BuildingPainter.js';
import { AmbientPainter } from './AmbientPainter.js';
import { EffectsPainter } from './EffectsPainter.js';

/**
 * Renderer — Main orchestrator for the 9:16 vertical canvas.
 *
 * Layout (top to bottom):
 *   0% –  12% : Sky / Top HUD area (drawn by CSS overlay)
 *  12% –  88% : Island + world (canvas)
 *  88% – 100% : Ground / bottom HUD area (drawn by CSS overlay)
 *
 * All drawing is done via specialized painter modules.
 * The Renderer never touches game logic, only reads game state for display.
 */
export class Renderer {
  constructor(canvas) {
    this.c = canvas;
    this.x = canvas.getContext('2d');

    this._island = new IslandPainter();
    this._tree = new TreePainter();
    this._building = new BuildingPainter();
    this._ambient = new AmbientPainter();
    this._effects = new EffectsPainter();

    // Pre-compute stable layout for trees and buildings (seeded)
    this._treeLayout = this._buildTreeLayout();
    this._buildingLayout = this._buildBuildingLayout();

    // Track last processed event for effect triggers
    this._lastEventType = null;
    this._lastEventId = null;

    this.resize();
    addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = devicePixelRatio || 1;
    this.c.width = innerWidth * dpr;
    this.c.height = innerHeight * dpr;
    this.x.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /**
   * Main draw entry point called every frame from main.js
   */
  draw(game, t) {
    const w = innerWidth;
    const h = innerHeight;
    const ctx = this.x;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // 1. Sky + atmosphere
    this._ambient.drawSky(ctx, w, h, t);

    // 2. Island placement — centered, scaled to 9:16 viewport
    const { cx, cy, rx, ry } = this._islandBounds(w, h);

    // 3. Ambient particles (behind island)
    ctx.save();
    ctx.globalAlpha = 0.6;
    this._ambient.drawParticles(ctx, w, h, t);
    ctx.restore();

    // 4. Island base terrain
    this._island.draw(ctx, cx, cy, rx, ry, game.season.era, t);

    // 5. Trees (quantity scales with era)
    this._drawTrees(ctx, cx, cy, rx, ry, game.season.era, t);

    // 6. Buildings (quantity scales with era, appearance by era)
    this._drawBuildings(ctx, cx, cy, rx, ry, game, t);

    // 7. Habitants (up to 12 visible)
    this._drawHabitants(ctx, cx, cy, rx, ry, game, t);

    // 8. Global event aura ring
    if (game.events.current) {
      this._drawEventAura(ctx, cx, cy, rx, ry, game.events.current, t);
    }

    // 9. Visual effects (gifts, follows, storms, meteors…)
    this._triggerNewEffects(game, cx, cy);
    this._effects.draw(ctx, w, h, t);
  }

  /** Island bounds: centered, padded, maintains natural aspect */
  _islandBounds(w, h) {
    // In vertical (9:16) layout, island occupies ~60% of width and ~35% of height
    // It sits in the middle vertical band (roughly 18%–68% from top)
    const isVertical = h > w;
    let cx, cy, rx, ry;

    if (isVertical) {
      rx = w * 0.44;
      ry = rx * 0.48;
      cx = w * 0.5;
      cy = h * 0.47;
    } else {
      // Landscape fallback
      rx = h * 0.36;
      ry = rx * 0.5;
      cx = w * 0.52;
      cy = h * 0.54;
    }

    return { cx, cy, rx, ry };
  }

  _buildTreeLayout() {
    // Seeded stable positions for trees on the island
    let s = 0xabcd1234;
    const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
    const trees = [];
    for (let i = 0; i < 22; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = 0.25 + rng() * 0.58;
      trees.push({
        angle, radius,
        variant: i % 3,
        scale: 0.7 + rng() * 0.55,
        seed: Math.floor(rng() * 100),
        minEra: 1
      });
    }
    return trees;
  }

  _buildBuildingLayout() {
    let s = 0x12345678;
    const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
    const buildings = [];
    // Buildings placed in inner island area
    const positions = [
      { angle: 0.8, radius: 0.28 },
      { angle: 2.4, radius: 0.22 },
      { angle: 4.1, radius: 0.30 },
      { angle: 5.5, radius: 0.18 },
      { angle: 1.5, radius: 0.38 },
      { angle: 3.6, radius: 0.35 },
      { angle: 0.2, radius: 0.42 },
    ];
    for (let i = 0; i < positions.length; i++) {
      buildings.push({
        angle: positions[i].angle,
        radius: positions[i].radius,
        variant: i % 2,
        unlocksAtEra: Math.ceil((i + 1) / 2)
      });
    }
    return buildings;
  }

  _drawTrees(ctx, cx, cy, rx, ry, era, t) {
    // More trees visible as era progresses
    const treeCount = Math.min(this._treeLayout.length, 4 + era * 2);
    for (let i = 0; i < treeCount; i++) {
      const tr = this._treeLayout[i];
      const x = cx + Math.cos(tr.angle) * tr.radius * rx;
      const y = cy + Math.sin(tr.angle) * tr.radius * ry;
      this._tree.draw(ctx, x, y, tr.variant, tr.scale, t, tr.seed);
    }
  }

  _drawBuildings(ctx, cx, cy, rx, ry, game, t) {
    const era = game.season.era;
    for (const bl of this._buildingLayout) {
      if (bl.unlocksAtEra > era) continue;
      const x = cx + Math.cos(bl.angle) * bl.radius * rx;
      const y = cy + Math.sin(bl.angle) * bl.radius * ry;
      this._building.draw(ctx, x, y, era, bl.variant, t);
    }
  }

  _drawHabitants(ctx, cx, cy, rx, ry, game, t) {
    const visible = game.habitants.slice(0, 12);
    for (let i = 0; i < visible.length; i++) {
      const h = visible[i];
      // Distribute habitants in inner island circle
      const angle = (i / visible.length) * Math.PI * 2;
      const r = 0.1 + (i % 3) * 0.08;
      const x = cx + Math.cos(angle) * r * rx;
      const y = cy + Math.sin(angle) * r * ry;
      this._ambient.drawHabitant(ctx, x, y, h.name, h.level, t, i);
    }
  }

  _drawEventAura(ctx, cx, cy, rx, ry, currentEvent, t) {
    const colors = {
      storm: '#90caf9',
      meteor: '#ff8c00',
      eclipse: '#ce93d8',
      rain: '#80cbc4',
      invasion: '#ef9a9a'
    };
    const color = colors[currentEvent.type] || '#ffe082';
    const pulse = 0.5 + Math.sin(t / 500) * 0.5;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 + pulse * 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12 + pulse * 8;
    ctx.globalAlpha = 0.7 + pulse * 0.3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 1.08, ry * 1.08, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Event label above island
    ctx.save();
    ctx.globalAlpha = 0.85 + pulse * 0.15;
    ctx.fillStyle = color;
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillText(`⚡ ${currentEvent.type.toUpperCase()}`, cx, cy - ry - 22);
    ctx.restore();
  }

  _triggerNewEffects(game, cx, cy) {
    // Detect new feed entries to trigger effects (simple heuristic)
    const feed = game.feed;
    if (!feed.length) return;

    const latest = feed[0];
    const id = `${latest.time}-${latest.message}`;
    if (id === this._lastEventId) return;
    this._lastEventId = id;

    const msg = latest.message.toLowerCase();
    if (msg.includes('ajudou') && msg.includes('+')) {
      // Determine tier by amount
      const match = msg.match(/\+(\d+)/);
      const amount = match ? parseInt(match[1]) : 0;
      const tier = amount >= 1200 ? 5 : amount >= 400 ? 4 : amount >= 110 ? 3 : amount >= 30 ? 2 : 1;
      this._effects.trigger('gift', cx, cy, { tier });
    } else if (msg.includes('seguiu')) {
      this._effects.trigger('follow', cx, cy);
    } else if (msg.includes('energia comunit')) {
      this._effects.trigger('like', cx, cy);
    } else if (msg.includes('storm') || msg.includes('tempestade')) {
      this._effects.trigger('storm', cx, cy);
    } else if (msg.includes('meteor')) {
      this._effects.trigger('meteor', cx, cy);
    } else if (msg.includes('eclipse')) {
      this._effects.trigger('eclipse', cx, cy);
    } else if (msg.includes('chuva') || msg.includes('rain')) {
      this._effects.trigger('rain', cx, cy);
    } else if (msg.includes('vitória') || msg.includes('victory')) {
      this._effects.trigger('victory', cx, cy);
    }
  }
}
