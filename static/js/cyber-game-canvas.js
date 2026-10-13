/* ═══════════════════════════════════════════════════════════
   CyberVault — Hacking Mini-Game Canvas
   Particle Orb Defense with glowing trails & HUD overlay
   Drop-in: call CyberGameCanvas.init('canvas-id') anywhere
   ═══════════════════════════════════════════════════════════ */
'use strict';

var CyberGameCanvas = (function () {

  /* ── Audio engine (Web Audio API) ──────────────────────── */
  var _audioCtx = null;
  function _ctx() {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
  }

  function playTone(freq, type, dur, vol) {
    try {
      var ctx = _ctx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol || 0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  }

  function sfxShoot()   { playTone(660, 'square', 0.08, 0.12); }
  function sfxHit()     { playTone(220, 'sawtooth', 0.14, 0.18); }
  function sfxLevelUp() { [523, 659, 784].forEach(function(f, i) { setTimeout(function(){ playTone(f,'sine',0.18,0.22); }, i*90); }); }
  function sfxDeath()   { playTone(110, 'sawtooth', 0.4, 0.2); }

  /* ── Vector helpers ─────────────────────────────────────── */
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function rand(min, max) { return min + Math.random() * (max - min); }

  /* ── Particle class ─────────────────────────────────────── */
  function Particle(x, y, color) {
    this.x  = x; this.y = y;
    this.vx = rand(-4, 4); this.vy = rand(-4, 4);
    this.life = 1; this.decay = rand(0.018, 0.042);
    this.r  = rand(2, 5);
    this.color = color || '#00d4ff';
  }
  Particle.prototype.update = function() {
    this.x += this.vx; this.y += this.vy;
    this.vy += 0.06;                          // gravity
    this.life -= this.decay;
    this.r  *= 0.97;
  };
  Particle.prototype.draw = function(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur  = 8;
    ctx.fill();
    ctx.restore();
  };

  /* ── Orb (enemy) class ──────────────────────────────────── */
  function Orb(cw, ch, speed) {
    var edge = Math.floor(Math.random() * 4);
    if (edge === 0) { this.x = rand(0, cw); this.y = -20; }
    else if (edge === 1) { this.x = cw + 20; this.y = rand(0, ch); }
    else if (edge === 2) { this.x = rand(0, cw); this.y = ch + 20; }
    else { this.x = -20; this.y = rand(0, ch); }
    this.r     = rand(10, 20);
    this.hp    = Math.ceil(this.r / 8);
    this.maxHp = this.hp;
    this.speed = speed || 1.2;
    this.angle = 0;
    var hue    = Math.floor(rand(160, 320));
    this.color = 'hsl(' + hue + ',90%,60%)';
    this.glow  = 'hsl(' + hue + ',100%,75%)';
  }
  Orb.prototype.moveTo = function(tx, ty) {
    var dx = tx - this.x, dy = ty - this.y;
    var d  = Math.hypot(dx, dy) || 1;
    this.x += (dx / d) * this.speed;
    this.y += (dy / d) * this.speed;
    this.angle += 0.04;
  };
  Orb.prototype.draw = function(ctx) {
    ctx.save();
    // Glow ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r + 4, 0, Math.PI * 2);
    ctx.strokeStyle = this.glow;
    ctx.lineWidth   = 1.5;
    ctx.globalAlpha = 0.35;
    ctx.shadowColor = this.glow;
    ctx.shadowBlur  = 18;
    ctx.stroke();
    // Body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    var grad = ctx.createRadialGradient(this.x - this.r*0.3, this.y - this.r*0.3, 1, this.x, this.y, this.r);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.4, this.color);
    grad.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle   = grad;
    ctx.globalAlpha = 0.92;
    ctx.shadowColor = this.color;
    ctx.shadowBlur  = 22;
    ctx.fill();
    // HP bar
    var bw = this.r * 2.2, bh = 4;
    var bx = this.x - bw / 2, by = this.y - this.r - 10;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#0a1a2a';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = this.color;
    ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
    ctx.restore();
  };

  /* ── Bullet class ───────────────────────────────────────── */
  function Bullet(x, y, tx, ty) {
    this.x = x; this.y = y;
    var d  = Math.hypot(tx - x, ty - y) || 1;
    var spd = 9;
    this.vx = ((tx - x) / d) * spd;
    this.vy = ((ty - y) / d) * spd;
    this.r  = 4;
    this.trail = [];
  }
  Bullet.prototype.update = function() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 10) this.trail.shift();
    this.x += this.vx; this.y += this.vy;
  };
  Bullet.prototype.draw = function(ctx) {
    // Trail
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < this.trail.length; i++) {
      var alpha = (i / this.trail.length) * 0.5;
      ctx.beginPath();
      ctx.arc(this.trail[i].x, this.trail[i].y, this.r * (i / this.trail.length), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,212,255,' + alpha + ')';
      ctx.fill();
    }
    // Head
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur  = 16;
    ctx.fill();
    ctx.restore();
  };

  /* ── Main init function ─────────────────────────────────── */
  function init(canvasId) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    /* Responsive resize */
    function resize() {
      var parent = canvas.parentElement;
      canvas.width  = parent ? parent.clientWidth  : 700;
      canvas.height = parent ? Math.min(parent.clientWidth * 0.55, 480) : 380;
    }
    resize();
    window.addEventListener('resize', resize);

    /* State */
    var state = {
      running: false,
      score: 0,
      energy: 100,
      level: 1,
      lives: 3,
      orbsKilled: 0,
      orbsNeeded: 5,
      frame: 0
    };

    var player   = { x: 0, y: 0 };   // mouse / touch position
    var orbs     = [];
    var bullets  = [];
    var particles = [];
    var lastShot = 0;
    var SHOT_CD  = 320;               // ms between auto-shots

    /* Input */
    canvas.addEventListener('mousemove', function(e) {
      var r = canvas.getBoundingClientRect();
      player.x = e.clientX - r.left;
      player.y = e.clientY - r.top;
    });
    canvas.addEventListener('touchmove', function(e) {
      e.preventDefault();
      var r = canvas.getBoundingClientRect();
      player.x = e.touches[0].clientX - r.left;
      player.y = e.touches[0].clientY - r.top;
    }, { passive: false });

    canvas.addEventListener('click', function(e) {
      if (!state.running) { startGame(); return; }
      var r = canvas.getBoundingClientRect();
      shoot(e.clientX - r.left, e.clientY - r.top);
    });
    canvas.addEventListener('touchend', function(e) {
      if (!state.running) { startGame(); return; }
      var r = canvas.getBoundingClientRect();
      shoot(e.changedTouches[0].clientX - r.left, e.changedTouches[0].clientY - r.top);
    });

    /* Core centre point (vault) */
    function vaultX() { return canvas.width  / 2; }
    function vaultY() { return canvas.height / 2; }

    function shoot(tx, ty) {
      var now = Date.now();
      if (now - lastShot < SHOT_CD) return;
      lastShot = now;
      bullets.push(new Bullet(vaultX(), vaultY(), tx, ty));
      sfxShoot();
    }

    function spawnOrb() {
      var spd = 0.9 + state.level * 0.18;
      orbs.push(new Orb(canvas.width, canvas.height, spd));
    }

    function explode(x, y, color, count) {
      for (var i = 0; i < (count || 18); i++) {
        particles.push(new Particle(x, y, color));
      }
    }

    function startGame() {
      state.running   = true;
      state.score     = 0;
      state.energy    = 100;
      state.level     = 1;
      state.lives     = 3;
      state.orbsKilled = 0;
      state.orbsNeeded = 5;
      orbs = []; bullets = []; particles = [];
      player.x = vaultX(); player.y = vaultY();
    }

    /* ── Grid background ────────────────────────────────── */
    function drawGrid() {
      var cw = canvas.width, ch = canvas.height;
      var step = 36;
      ctx.save();
      ctx.strokeStyle = 'rgba(0,212,255,0.055)';
      ctx.lineWidth = 0.5;
      for (var x = 0; x < cw; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
      }
      for (var y = 0; y < ch; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
      }
      ctx.restore();
    }

    /* ── Vault (player core) ─────────────────────────────── */
    function drawVault(t) {
      var vx = vaultX(), vy = vaultY();
      ctx.save();
      // Outer pulse ring
      var pulse = 0.5 + 0.5 * Math.sin(t * 0.04);
      ctx.beginPath();
      ctx.arc(vx, vy, 46 + pulse * 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,212,255,' + (0.12 + pulse * 0.1) + ')';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Middle ring
      ctx.beginPath();
      ctx.arc(vx, vy, 32, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,212,255,0.45)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur  = 14;
      ctx.stroke();
      // Core
      var grad = ctx.createRadialGradient(vx - 6, vy - 6, 2, vx, vy, 22);
      grad.addColorStop(0, '#a0e8ff');
      grad.addColorStop(0.5, '#00d4ff');
      grad.addColorStop(1, '#003a55');
      ctx.beginPath();
      ctx.arc(vx, vy, 22, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur  = 28;
      ctx.fill();
      // Rotating spokes
      ctx.translate(vx, vy);
      ctx.rotate(t * 0.012);
      ctx.strokeStyle = 'rgba(0,212,255,0.6)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 6;
      for (var i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(i * Math.PI / 4) * 22, Math.sin(i * Math.PI / 4) * 22);
        ctx.stroke();
      }
      ctx.restore();
    }

    /* ── HUD ─────────────────────────────────────────────── */
    function drawHUD() {
      var cw = canvas.width;
      ctx.save();
      ctx.font = '600 13px "Share Tech Mono", monospace';
      ctx.fillStyle = '#00d4ff';
      ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 6;
      ctx.fillText('SCORE: ' + state.score, 14, 22);
      ctx.fillText('LVL ' + state.level, 14, 40);
      ctx.fillStyle = '#7fddff';
      ctx.shadowBlur = 0;
      ctx.fillText('LIVES: ' + '♥ '.repeat(state.lives).trim(), cw - 110, 22);
      ctx.fillText('ORBS: ' + state.orbsKilled + '/' + state.orbsNeeded, cw - 110, 40);
      // Energy bar
      var bw = Math.min(cw * 0.35, 200);
      var bx = cw / 2 - bw / 2, by = 10;
      ctx.fillStyle = 'rgba(0,20,35,0.7)';
      ctx.fillRect(bx, by, bw, 10);
      var ec = state.energy > 60 ? '#00d4ff' : state.energy > 30 ? '#f1c40f' : '#e74c3c';
      ctx.fillStyle = ec;
      ctx.shadowColor = ec; ctx.shadowBlur = 8;
      ctx.fillRect(bx, by, bw * (state.energy / 100), 10);
      ctx.strokeStyle = 'rgba(0,212,255,0.35)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.strokeRect(bx, by, bw, 10);
      ctx.fillStyle = 'rgba(0,212,255,0.6)';
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillText('ENERGY', bx, by + 24);
      ctx.restore();
    }

    /* ── Aim line ────────────────────────────────────────── */
    function drawAim() {
      if (!state.running) return;
      var vx = vaultX(), vy = vaultY();
      ctx.save();
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = 'rgba(0,212,255,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.lineTo(player.x, player.y);
      ctx.stroke();
      ctx.setLineDash([]);
      // Crosshair
      ctx.strokeStyle = 'rgba(0,212,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 8;
      var s = 8;
      ctx.beginPath();
      ctx.moveTo(player.x - s, player.y); ctx.lineTo(player.x + s, player.y);
      ctx.moveTo(player.x, player.y - s); ctx.lineTo(player.x, player.y + s);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,212,255,0.3)';
      ctx.stroke();
      ctx.restore();
    }

    /* ── Start screen ────────────────────────────────────── */
    function drawStartScreen() {
      var cw = canvas.width, ch = canvas.height;
      // Dark overlay
      ctx.save();
      ctx.fillStyle = 'rgba(3,7,13,0.82)';
      ctx.fillRect(0, 0, cw, ch);
      // Title
      ctx.textAlign = 'center';
      ctx.font = 'bold 28px "Oswald", sans-serif';
      ctx.fillStyle = '#00d4ff';
      ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 20;
      ctx.fillText('VAULT DEFENDER', cw / 2, ch / 2 - 44);
      ctx.font = '14px "Share Tech Mono", monospace';
      ctx.fillStyle = 'rgba(0,212,255,0.75)';
      ctx.shadowBlur = 6;
      ctx.fillText('Move cursor / touch to aim', cw / 2, ch / 2 - 12);
      ctx.fillText('Click / tap to shoot & start', cw / 2, ch / 2 + 10);
      // Blinking prompt
      if (Math.floor(Date.now() / 600) % 2 === 0) {
        ctx.font = 'bold 15px "Share Tech Mono", monospace';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 12;
        ctx.fillText('[ CLICK TO BEGIN ]', cw / 2, ch / 2 + 46);
      }
      ctx.restore();
    }

    /* ── Game Over screen ────────────────────────────────── */
    function drawGameOver() {
      var cw = canvas.width, ch = canvas.height;
      ctx.save();
      ctx.fillStyle = 'rgba(3,7,13,0.88)';
      ctx.fillRect(0, 0, cw, ch);
      ctx.textAlign = 'center';
      ctx.font = 'bold 30px "Oswald", sans-serif';
      ctx.fillStyle = '#e74c3c';
      ctx.shadowColor = '#e74c3c'; ctx.shadowBlur = 20;
      ctx.fillText('VAULT BREACHED', cw / 2, ch / 2 - 40);
      ctx.font = '15px "Share Tech Mono", monospace';
      ctx.fillStyle = '#00d4ff'; ctx.shadowBlur = 8;
      ctx.fillText('FINAL SCORE: ' + state.score, cw / 2, ch / 2);
      ctx.fillText('LEVEL REACHED: ' + state.level, cw / 2, ch / 2 + 24);
      if (Math.floor(Date.now() / 700) % 2 === 0) {
        ctx.fillStyle = '#fff'; ctx.shadowBlur = 12;
        ctx.fillText('[ CLICK TO RETRY ]', cw / 2, ch / 2 + 60);
      }
      ctx.restore();
    }

    /* ── Auto-shoot at nearest orb ───────────────────────── */
    var lastAutoShot = 0;
    function autoShoot() {
      var now = Date.now();
      if (now - lastAutoShot < SHOT_CD) return;
      if (!orbs.length) return;
      var nearest = orbs.reduce(function(a, b) {
        return dist(b, { x: vaultX(), y: vaultY() }) < dist(a, { x: vaultX(), y: vaultY() }) ? b : a;
      });
      if (dist(nearest, { x: vaultX(), y: vaultY() }) < canvas.width * 0.6) {
        lastAutoShot = now;
        bullets.push(new Bullet(vaultX(), vaultY(), nearest.x, nearest.y));
        sfxShoot();
      }
    }

    /* ── Main loop ───────────────────────────────────────── */
    var gameOver = false;
    var orbSpawnTimer = 0;
    var SPAWN_INTERVAL = 120;

    function loop() {
      requestAnimationFrame(loop);
      var cw = canvas.width, ch = canvas.height;
      state.frame++;

      // Clear with slight trail for glow effect
      ctx.fillStyle = 'rgba(3,7,13,0.78)';
      ctx.fillRect(0, 0, cw, ch);

      drawGrid();
      drawVault(state.frame);
      drawAim();

      if (!state.running) {
        if (gameOver) drawGameOver();
        else drawStartScreen();
        return;
      }

      // Spawn orbs
      orbSpawnTimer++;
      if (orbSpawnTimer >= SPAWN_INTERVAL) {
        orbSpawnTimer = 0;
        SPAWN_INTERVAL = Math.max(40, 120 - state.level * 8);
        spawnOrb();
      }

      autoShoot();

      // Update & draw orbs
      for (var i = orbs.length - 1; i >= 0; i--) {
        orbs[i].moveTo(vaultX(), vaultY());
        orbs[i].draw(ctx);

        // Reached vault?
        if (dist(orbs[i], { x: vaultX(), y: vaultY() }) < 26) {
          explode(orbs[i].x, orbs[i].y, orbs[i].color, 24);
          orbs.splice(i, 1);
          state.energy = Math.max(0, state.energy - 20);
          state.lives--;
          sfxHit();
          if (state.lives <= 0) {
            state.running = false;
            gameOver = true;
            sfxDeath();
          }
        }
      }

      // Update & draw bullets
      for (var j = bullets.length - 1; j >= 0; j--) {
        bullets[j].update();
        bullets[j].draw(ctx);
        // Out of bounds
        if (bullets[j].x < -20 || bullets[j].x > cw + 20 || bullets[j].y < -20 || bullets[j].y > ch + 20) {
          bullets.splice(j, 1); continue;
        }
        // Hit orb?
        for (var k = orbs.length - 1; k >= 0; k--) {
          if (dist(bullets[j], orbs[k]) < orbs[k].r + bullets[j].r) {
            explode(orbs[k].x, orbs[k].y, orbs[k].color, 12);
            orbs[k].hp--;
            if (orbs[k].hp <= 0) {
              explode(orbs[k].x, orbs[k].y, orbs[k].color, 26);
              state.score += 10 * state.level;
              state.orbsKilled++;
              state.energy = Math.min(100, state.energy + 5);
              orbs.splice(k, 1);
              // Level up?
              if (state.orbsKilled >= state.orbsNeeded) {
                state.level++;
                state.orbsKilled = 0;
                state.orbsNeeded = 5 + state.level * 2;
                sfxLevelUp();
                // Show level banner briefly
                showBanner('LEVEL ' + state.level + ' — BREACH ESCALATING');
              }
            }
            bullets.splice(j, 1);
            break;
          }
        }
      }

      // Update & draw particles
      for (var p = particles.length - 1; p >= 0; p--) {
        particles[p].update();
        particles[p].draw(ctx);
        if (particles[p].life <= 0) particles.splice(p, 1);
      }

      drawHUD();
    }

    /* ── Level banner ────────────────────────────────────── */
    var banner = { text: '', alpha: 0 };
    function showBanner(text) { banner.text = text; banner.alpha = 1.0; }
    // Inject banner draw into loop — patch after loop definition
    var _origLoop = loop;
    loop = function() {
      _origLoop();
      if (banner.alpha > 0) {
        var cw = canvas.width, ch = canvas.height;
        ctx.save();
        ctx.globalAlpha = banner.alpha;
        ctx.textAlign = 'center';
        ctx.font = 'bold 20px "Oswald", sans-serif';
        ctx.fillStyle = '#00d4ff';
        ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 18;
        ctx.fillText(banner.text, cw / 2, ch / 2 - 70);
        ctx.restore();
        banner.alpha -= 0.012;
      }
    };

    // Restart on game over click
    canvas.addEventListener('click', function() {
      if (gameOver) { gameOver = false; startGame(); }
    });

    loop();
  }

  return { init: init };

})();
