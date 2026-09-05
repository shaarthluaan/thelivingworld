export class UI {
  constructor(game, provider, audio, tiktokProvider) {
    this.game = game;
    this.provider = provider;
    this.audio = audio;
    this.tiktokProvider = tiktokProvider;
    this.tab = 'contribution';
    this._rankingsVisible = false;

    // DOM refs
    this.hud = document.querySelector('#hud');
    this.ranks = document.querySelector('#rankings');
    this.feed = document.querySelector('#feed');
    this.dev = document.querySelector('#dev');

    // Build static HUD skeleton once (only inner content swapped on re-render)
    this._buildHudSkeleton();
    this._buildRankingsToggle();

    // F2 toggles Dev Panel
    addEventListener('keydown', e => {
      if (e.key === 'F2') { e.preventDefault(); this.dev.hidden = !this.dev.hidden; }
    });

    // Initial render
    this.render();

    // Re-render on game state change
    game.onChange(() => this.render());

    // Re-render on provider status change
    tiktokProvider?.bus.on('providerStatus', () => this.render());
  }

  _buildHudSkeleton() {
    this.hud.innerHTML = `
      <div id="hud-title">THE LIVING WORLD</div>
      <div id="hud-era"></div>
      <div id="hud-progress-wrap">
        <div id="hud-progress-bar"><div id="hud-progress-fill"></div></div>
        <div id="hud-progress-val"></div>
      </div>
      <div id="hud-status-row"></div>
    `;
    this._hudEra = this.hud.querySelector('#hud-era');
    this._hudFill = this.hud.querySelector('#hud-progress-fill');
    this._hudVal = this.hud.querySelector('#hud-progress-val');
    this._hudStatusRow = this.hud.querySelector('#hud-status-row');
  }

  _buildRankingsToggle() {
    // Add a small toggle button for mobile
    const btn = document.createElement('button');
    btn.id = 'rankings-toggle';
    btn.textContent = '🏆';
    btn.title = 'Rankings';
    btn.addEventListener('click', () => this._toggleRankings());
    document.body.appendChild(btn);
    this._toggleBtn = btn;
    // Also allow clicking anywhere on the rankings panel header to toggle
    this.ranks.addEventListener('click', e => {
      if (e.target === this.ranks || e.target.tagName === 'H2') this._toggleRankings();
    });
  }

  _toggleRankings() {
    this._rankingsVisible = !this._rankingsVisible;
    this.ranks.classList.toggle('hidden', !this._rankingsVisible);
    if (this._rankingsVisible) this.render();
  }

  render() {
    const g = this.game;
    const s = this.tiktokProvider?.getStatus() || {};
    const era = g.config.eras[g.season.era - 1];
    const next = g.config.eras[g.season.era]?.threshold || g.config.eras.at(-1).threshold;
    const pct = Math.min(100, g.season.progress / next * 100);

    // ── HUD update (no full innerHTML replacement) ────────────
    this._hudEra.textContent = `ERA ${g.season.era} · ${era.name}  ·  ${g.habitants.length} Habitantes`;
    this._hudFill.style.width = `${pct.toFixed(1)}%`;
    this._hudVal.textContent = g.season.progress >= 1000
      ? `${(g.season.progress / 1000).toFixed(1)}k`
      : String(g.season.progress);

    // Status pills
    const wsSt = s.status || 'DISCONNECTED';
    const wsClass = wsSt === 'CONNECTED' ? 'ws-conn' : 'ws-disc';
    const wsLabel = wsSt === 'CONNECTED' ? `✦ ${esc(s.username || 'LIVE')}` : wsSt;
    const eventPill = g.events.current
      ? `<span class="status-pill event-active">⚡ ${g.events.current.type.toUpperCase()}</span>`
      : '';
    this._hudStatusRow.innerHTML = `
      <span class="status-pill online">ONLINE</span>
      <span class="status-pill ${wsClass}">${wsLabel}</span>
      ${eventPill}
    `;

    // ── Rankings (only update when visible) ───────────────────
    if (this._rankingsVisible) {
      this.ranks.innerHTML = `
        <h2>🏆 Rankings</h2>
        <div class="tabs">
          ${[['contribution', 'Contribuição'], ['exploration', 'Exploração'], ['defense', 'Defesa']]
            .map(([key, label]) => `<button data-tab="${key}" class="${this.tab === key ? 'active' : ''}">${label}</button>`)
            .join('')}
        </div>
        <ol>${g.rank(this.tab).map(p =>
          `<li>${esc(p.name)} <b>${p[this.tab]}</b></li>`
        ).join('') || '<li>Aguardando...</li>'}</ol>
      `;
      this.ranks.querySelectorAll('[data-tab]').forEach(b => {
        b.onclick = () => { this.tab = b.dataset.tab; this.render(); };
      });
    } else {
      this.ranks.classList.add('hidden');
    }

    // ── Feed ──────────────────────────────────────────────────
    this.feed.innerHTML = g.feed.slice(0, 5)
      .map(x => `<div class="feedItem">${esc(x.message)}</div>`)
      .join('') || '<div class="feedItem">🏝 A ilha desperta. Pressione F2 para simular eventos.</div>';

    // ── Dev Panel ─────────────────────────────────────────────
    this.dev.innerHTML = `
      <h2>Painel de Desenvolvimento</h2>
      <div class="small">MockEventProvider · ambiente offline · F2 para fechar</div>
      <div style="margin-bottom:6px">
        ${[['join','Join'],['follow','Follow'],['like','Like'],['comment','!explorar'],
           ['gift','Gift 1'],['gift','Gift 2'],['gift','Gift 3'],['gift','Gift 4'],['gift','Gift 5'],
           ['streak','Streak'],['storm','Storm'],['meteor','Meteor'],['eclipse','Eclipse'],['invasion','Invasion']]
          .map(([a, b], i) => `<button data-action="${a}" data-i="${i}">${b}</button>`)
          .join('')}
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:8px">
        <button data-action="100">Simular 100</button>
        <button data-action="1000">Simular 1.000</button>
        <button data-action="save">Salvar</button>
        <button data-action="load">Carregar</button>
        <button data-action="reset">Reset</button>
        <button data-action="check">Integridade</button>
        <button data-action="audio">Áudio: ${this.audio.enabled ? 'ON' : 'OFF'}</button>
      </div>
      <div style="margin-top:8px;font-size:10px;color:#8aaccc;line-height:1.6">
        Recebidos: ${s.eventsReceived || 0} ·
        Processados: ${s.eventsProcessed || 0} ·
        Ignorados: ${(s.eventsIgnored || 0) + g.stats.ignored} ·
        Falhos: ${(s.eventsFailed || 0) + g.stats.failed}
        <br>Fila: ${s.queue || 0} · Último: ${s.lastEvent || '—'}
        ${s.lastEventTime ? `· ${new Date(s.lastEventTime).toLocaleTimeString()}` : ''}
        <br>Habitantes: ${g.habitants.length} · Temporada: ${g.season.era}/7
      </div>
    `;

    this.dev.querySelectorAll('[data-action]').forEach(b => {
      b.onclick = () => this.action(b.dataset.action, +b.dataset.i);
    });
  }

  // ── Dev panel actions — all existing behavior preserved ────
  action(a, i) {
    const p = this.provider;
    const g = this.game;

    if (a === 'join' || a === 'follow' || a === 'like') {
      p.send(a);
    } else if (a === 'comment') {
      p.send('comment', { comment: '!explorar' });
    } else if (a === 'gift') {
      const vals = [1, 10, 50, 200, 1000];
      p.send('gift', { diamondCount: vals[Math.min(4, Math.max(0, i - 4))] });
    } else if (a === 'streak') {
      p.send('gift', { diamondCount: 50, repeatCount: 5, repeatEnd: true });
    } else if (['storm', 'meteor', 'eclipse', 'invasion'].includes(a)) {
      g.startEvent(a);
    } else if (a === '100' || a === '1000') {
      const n = +a;
      for (let z = 0; z < n; z++) {
        p.send(
          z % 4 === 0 ? 'gift' : z % 4 === 1 ? 'like' : z % 4 === 2 ? 'comment' : 'follow',
          z % 4 === 0 ? { diamondCount: 10 } : z % 4 === 2 ? { comment: '!construir' } : {}
        );
      }
      g.flushLikes(true);
    } else if (a === 'save') {
      g.save();
    } else if (a === 'load') {
      location.reload();
    } else if (a === 'reset') {
      if (confirm('Reiniciar a temporada local?')) {
        g.storage.clear();
        g.reset();
        g.notify();
      }
    } else if (a === 'check') {
      alert(g.integrity() ? '✅ Estado íntegro' : '❌ Falha de integridade');
    } else if (a === 'audio') {
      this.audio.toggle();
      this.render();
    }
  }
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
