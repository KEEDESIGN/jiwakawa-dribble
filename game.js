/**
 * DRIBBLE RUNNER 8-BIT
 * サッカー選手ドット絵エンドレスランナー
 */

// =============================================================================
// 1. サウンドエンジン (Web Audio API - 外部ファイル不要のレトロ8bit音源)
// =============================================================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.unlocked = false;
  }

  init() {
    if (!this.enabled) return;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      // iOS Safari等のオーディオコンテキストをアンロック
      if (this.ctx && !this.unlocked) {
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
        this.unlocked = true;
      }
    } catch (e) {
      // 音声再生がブロックされてもゲーム本体を止めない
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled && this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    return this.enabled;
  }

  playTone(freq, type, duration, gainStart = 0.15, gainEnd = 0.001) {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainStart, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(gainEnd, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio not permitted yet
    }
  }

  // ジャンプ音
  playJump() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  // ドリブルのボールキック音
  playKick() {
    this.playTone(90, 'triangle', 0.06, 0.2);
  }

  // DFかわした時の得点音 (ピコーン！)
  playScore() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.08); // A5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  // 審判のファウルホイッスル (ピピーッ！)
  playWhistle() {
    if (!this.enabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // 2つの近接した高周波でうなり（ホイッスル独特の響き）を再現
      const whistle = (freq, start, dur) => {
        const o1 = this.ctx.createOscillator();
        const o2 = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o1.type = 'sawtooth';
        o2.type = 'square';
        o1.frequency.setValueAtTime(freq, start);
        o2.frequency.setValueAtTime(freq * 1.04, start);
        g.gain.setValueAtTime(0.2, start);
        g.gain.linearRampToValueAtTime(0.01, start + dur);
        o1.connect(g);
        o2.connect(g);
        g.connect(this.ctx.destination);
        o1.start(start);
        o2.start(start);
        o1.stop(start + dur);
        o2.stop(start + dur);
      };
      // 短いピッ ＋ 長いピーッ！
      whistle(2200, now, 0.1);
      whistle(2200, now + 0.14, 0.45);
    } catch (e) {}
  }

  // 10人抜きフィーバー歓声
  playCheer() {
    if (!this.enabled || !this.ctx) return;
    // コード分散音
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.15, 0.12), i * 60);
    });
  }

  // レトロサンバ調BGMループ
  startBGM() {
    if (this.bgmTimer) clearInterval(this.bgmTimer);
    const melody = [
      // 軽快な8bitサンバ風ベース＆メロディ
      261.63, 0, 329.63, 392.00,  0, 392.00, 329.63, 0,
      293.66, 0, 349.23, 440.00,  0, 440.00, 349.23, 0,
      329.63, 0, 392.00, 523.25,  0, 523.25, 392.00, 0,
      246.94, 0, 293.66, 392.00,  0, 349.23, 293.66, 0
    ];
    this.bgmStep = 0;
    this.bgmTimer = setInterval(() => {
      if (!this.enabled || !this.ctx) return;
      const freq = melody[this.bgmStep];
      if (freq > 0) {
        this.playTone(freq, 'square', 0.1, 0.05);
      }
      // リズムのビート音（ハイハット風）
      if (this.bgmStep % 2 === 0) {
        this.playTone(120, 'triangle', 0.04, 0.08);
      }
      this.bgmStep = (this.bgmStep + 1) % melody.length;
    }, 130);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

// =============================================================================
// 2. ドット絵ピクセルアートレンダラー
// =============================================================================
// アップロードされたキャラクター（白黒縦縞FUJITSU風、褐色肌、短髪パーマ、ヒゲ）を
// 高精細かつ温かみのあるレトロピクセルグリッドで定義
const COLOR_PALETTE = {
  // プレイヤーカラー（川崎フロンターレ サックスブルー×黒ストライプ）
  SKIN: '#c68652',
  SKIN_SHADOW: '#9c5b2c',
  HAIR: '#261b16',
  HAIR_HIGHLIGHT: '#422f25',
  BEARD: '#18120e',
  EYE: '#120d09',
  JERSEY_BLUE: '#38b6ff',       // 鮮やかなフロンターレ・サックスブルー
  JERSEY_BLUE_SHADOW: '#0984e3',// サックスブルー影
  STRIPE_BLACK: '#1e242b',      // 黒ストライプ
  WHITE: '#ffffff',             // FUJITSUロゴ・ソックス白
  EMBLEM_GOLD: '#f1c40f',
  PANTS_BLACK: '#1e272e',       // フロンターレ伝統の黒パンツ
  PANTS_SHADOW: '#0f141a',
  CLEATS_BLACK: '#2d3436',
  // 相手DFカラー
  DF1_SHIRT: '#e74c3c', // 赤
  DF1_SHADOW: '#c0392b',
  DF2_SHIRT: '#2980b9', // 青
  DF2_SHADOW: '#1f618d',
  DF_SKIN: '#e0a97c',
  DF_HAIR: '#d35400',
  // 芝生・環境
  GRASS_LIGHT: '#2ecc71',
  GRASS_DARK: '#27ae60',
  DIRT: '#8b5a2b',
  PUDDLE: '#3498db'
};

class SpriteRenderer {
  // ピクセルマップからCanvasにドットを描画
  static drawMatrix(ctx, matrix, colorMap, startX, startY, pixelSize = 3) {
    for (let r = 0; r < matrix.length; r++) {
      const row = matrix[r];
      for (let c = 0; c < row.length; c++) {
        const char = row[c];
        if (char !== ' ' && colorMap[char]) {
          ctx.fillStyle = colorMap[char];
          ctx.fillRect(
            startX + c * pixelSize,
            startY + r * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }
  }

  /**
   * アップロード画像を元にした主人公（エースストライカー）
   * 16x24 グリッド
   * フレーム: 0, 1, 2, 3 (ラン/ドリブル), 4 (ジャンプ), 5 (転倒)
   */
  static getPlayerMatrix(frame) {
    // 凡例:
    // H: 髪, S: 肌, s: 肌影, B: ヒゲ, E: 瞳, W: 白, K: 黒ストライプ, L: 水色エンブレム, G: 金, P: パンツ白, p: パンツ影, C: スパイク
    if (frame === 4) {
      // ジャンプ姿勢（膝を曲げてボールと一緒に跳ぶ）
      return [
        "    HHHHHH      ",
        "   HHHHHHHH     ",
        "   HSSSSSSH     ",
        "   HSEESEEH     ",
        "   HSSBBSSH     ",
        "   HSBBBBBH     ",
        "    HBBBBH      ",
        "   WKWWKWKW     ",
        "  WWKWLKWKWW    ",
        "  WWKWKKWKWW    ",
        "   WKWWKWKW     ",
        "   WKWWKWKW     ",
        "    PPPPPP      ",
        "   Pp    pP     ",
        "   SS    SS     ",
        "   WW    WW     ",
        "   CC    CC     ",
        "                ",
        "                ",
        "                "
      ];
    } else if (frame === 5) {
      // ファウル転倒姿勢
      return [
        "                ",
        "                ",
        "    HHHHHH      ",
        "   HSSSSSSH     ",
        "  WKWWKWKW H    ",
        " WWKWLKWKWWH    ",
        " WWKWKKWKWWH    ",
        "  PPPPPP        ",
        "   Pp  SSSS     ",
        "   WW  WWWWCC   ",
        "                "
      ];
    }

    // 走り/ドリブル 4フレーム (0, 1, 2, 3)
    const legFrames = [
      // Frame 0: 右足前、左足後ろ
      [
        "    HHHHHH      ",
        "   HHHHHHHH     ",
        "   HSSSSSSH     ",
        "   HSEESEEH     ",
        "   HSSBBSSH     ",
        "   HSBBBBBH     ",
        "    HBBBBH      ",
        "   WKWWKWKW     ",
        "  WWKWLKWKWW    ",
        "  WWKWKKWKWW    ",
        "   WKWWKWKW     ",
        "   WKWWKWKW     ",
        "    PPPPPP      ",
        "   Pp    pP     ",
        "   SS     SS    ",
        "   SS      SS   ",
        "   WW       WW  ",
        "   CC        CC "
      ],
      // Frame 1: 足の交差
      [
        "    HHHHHH      ",
        "   HHHHHHHH     ",
        "   HSSSSSSH     ",
        "   HSEESEEH     ",
        "   HSSBBSSH     ",
        "   HSBBBBBH     ",
        "    HBBBBH      ",
        "   WKWWKWKW     ",
        "  WWKWLKWKWW    ",
        "  WWKWKKWKWW    ",
        "   WKWWKWKW     ",
        "   WKWWKWKW     ",
        "    PPPPPP      ",
        "     PpPp       ",
        "     SSSS       ",
        "     SSSS       ",
        "     WWWW       ",
        "     CCCC       "
      ],
      // Frame 2: 左足前、右足後ろ（キック）
      [
        "    HHHHHH      ",
        "   HHHHHHHH     ",
        "   HSSSSSSH     ",
        "   HSEESEEH     ",
        "   HSSBBSSH     ",
        "   HSBBBBBH     ",
        "    HBBBBH      ",
        "   WKWWKWKW     ",
        "  WWKWLKWKWW    ",
        "  WWKWKKWKWW    ",
        "   WKWWKWKW     ",
        "   WKWWKWKW     ",
        "    PPPPPP      ",
        "   Pp    pP     ",
        "  SS      SS    ",
        " SS        SS   ",
        " WW         WW  ",
        " CC          CC "
      ],
      // Frame 3: 再び交差
      [
        "    HHHHHH      ",
        "   HHHHHHHH     ",
        "   HSSSSSSH     ",
        "   HSEESEEH     ",
        "   HSSBBSSH     ",
        "   HSBBBBBH     ",
        "    HBBBBH      ",
        "   WKWWKWKW     ",
        "  WWKWLKWKWW    ",
        "  WWKWKKWKWW    ",
        "   WKWWKWKW     ",
        "   WKWWKWKW     ",
        "    PPPPPP      ",
        "     PpPp       ",
        "     SSSS       ",
        "     SSSS       ",
        "     WWWW       ",
        "     CCCC       "
      ]
    ];
    return legFrames[frame % 4];
  }

  // プレイヤーカラーマップ
  static getPlayerColorMap() {
    return {
      'H': COLOR_PALETTE.HAIR,
      'S': COLOR_PALETTE.SKIN,
      's': COLOR_PALETTE.SKIN_SHADOW,
      'B': COLOR_PALETTE.BEARD,
      'E': COLOR_PALETTE.EYE,
      'W': COLOR_PALETTE.JERSEY_BLUE,        // 水色地
      'w': COLOR_PALETTE.JERSEY_BLUE_SHADOW,
      'K': COLOR_PALETTE.STRIPE_BLACK,       // 黒ストライプ
      'L': COLOR_PALETTE.WHITE,              // 胸ロゴ FUJITSU 白文字
      'G': COLOR_PALETTE.EMBLEM_GOLD,
      'P': COLOR_PALETTE.PANTS_BLACK,        // 黒パンツ
      'p': COLOR_PALETTE.PANTS_SHADOW,
      'C': COLOR_PALETTE.CLEATS_BLACK
    };
  }

  // サッカーボール（テルスター柄）
  static drawBall(ctx, x, y, size = 18, angle = 0) {
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.rotate(angle);

    // 外枠＆白ベース
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#222';
    ctx.stroke();

    // 黒五角形パッチ
    ctx.fillStyle = '#222222';
    // 中心パッチ
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const r = size * 0.22;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // 周囲のパッチ3個
    for (let i = 0; i < 3; i++) {
      const a = (i * 2 * Math.PI) / 3;
      const px = Math.cos(a) * (size * 0.4);
      const py = Math.sin(a) * (size * 0.4);
      ctx.beginPath();
      ctx.arc(px, py, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // スライディングDF（背が低く横に長い）
  static drawSlidingDF(ctx, x, y, pixelSize = 3) {
    const matrix = [
      "                                  ",
      "                   HHHH           ",
      "                 HHSSSS           ",
      "               RRRREERRR          ",
      "             RRRRRRRRRRRRR        ",
      "SSSSWWWWCCCCCRRRRRRRRRRRRRR       ",
      "SSSSWWWWCCCCCRRRRRRRRRRRRRR       ",
      "             SSSSWWWWCCCC         "
    ];
    const map = {
      'H': '#2c3e50',
      'S': COLOR_PALETTE.DF_SKIN,
      'R': COLOR_PALETTE.DF1_SHIRT,
      'E': '#000',
      'W': '#ffffff',
      'C': '#222222'
    };
    this.drawMatrix(ctx, matrix, map, x, y, pixelSize);
  }

  // タックルDF（標準体型、前傾で突進）
  static drawTackleDF(ctx, x, y, pixelSize = 3) {
    const matrix = [
      "    HHHHHH      ",
      "   HHHHHHHH     ",
      "   SSSSSSSS     ",
      "   SEEE   S     ",
      "   SSSSSSSS     ",
      "   BBBBBBBB     ",
      "  BBBBBBBBBB    ",
      " BBBBBBBBBBBB   ",
      "  BBBBBBBBBB    ",
      "   BBBBBBBB     ",
      "    WWWWWW      ",
      "   WW    WW     ",
      "   SS     SS    ",
      "   CC      CC   "
    ];
    const map = {
      'H': '#d35400',
      'S': COLOR_PALETTE.DF_SKIN,
      'E': '#000',
      'B': COLOR_PALETTE.DF2_SHIRT,
      'W': '#ffffff',
      'C': '#2c3e50'
    };
    this.drawMatrix(ctx, matrix, map, x, y, pixelSize);
  }

  // 巨漢DF（背が高く大柄）
  static drawBigDF(ctx, x, y, pixelSize = 3.6) {
    const matrix = [
      "      HHHHHH      ",
      "     HHHHHHHH     ",
      "     SSSSSSSS     ",
      "     SEESEE S     ",
      "     SSSSSSSS     ",
      "    RRRRRRRRRR    ",
      "   RRRRRRRRRRRR   ",
      "  RRRRRRRRRRRRRR  ",
      "  RRRRRRRRRRRRRR  ",
      "   RRRRRRRRRRRR   ",
      "    PPPPPPPPPP    ",
      "    Pp      pP    ",
      "    SS      SS    ",
      "    WW      WW    ",
      "    WW      WW    ",
      "    CC      CC    "
    ];
    const map = {
      'H': '#1e272c',
      'S': '#a0522d',
      'E': '#000',
      'R': '#8e44ad', // 紫ユニフォーム
      'P': '#2c3e50',
      'p': '#1a252f',
      'W': '#ffffff',
      'C': '#000000'
    };
    this.drawMatrix(ctx, matrix, map, x, y, pixelSize);
  }

  // 荒れた芝・めくれた土（足を取られるトラップ）
  static drawRoughGrass(ctx, x, y, width, height) {
    // 土の穴
    ctx.fillStyle = '#6e3c15';
    ctx.fillRect(x, y + height - 12, width, 12);
    // 泥水たまり
    ctx.fillStyle = '#4a280c';
    ctx.fillRect(x + 4, y + height - 8, width - 8, 8);
    // 飛び散った芝の破片
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(x - 2, y + height - 16, 6, 6);
    ctx.fillRect(x + width - 4, y + height - 14, 6, 5);
    ctx.fillRect(x + width / 2, y + height - 18, 5, 5);
  }
}

// =============================================================================
// 3. ゲーム本体ロジック
// =============================================================================
class DribbleGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    // 音声
    this.sound = new SoundEngine();

    // DOM要素
    this.scoreValEl = document.getElementById('score-val');
    this.distValEl = document.getElementById('dist-val');
    this.hiscoreValEl = document.getElementById('hiscore-val');
    this.startScreenEl = document.getElementById('start-screen');
    this.gameoverScreenEl = document.getElementById('gameover-screen');
    this.finalScoreEl = document.getElementById('final-score');
    this.finalDistEl = document.getElementById('final-dist');
    this.finalHiscoreEl = document.getElementById('final-hiscore');
    this.newRecordTagEl = document.getElementById('new-record-tag');
    this.gameoverReasonEl = document.getElementById('gameover-reason');
    this.startBtn = document.getElementById('start-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.soundBtn = document.getElementById('sound-toggle');

    // ゲーム状態
    this.state = 'START'; // 'START' | 'PLAYING' | 'GAMEOVER'
    this.score = 0; // かわしたDF数
    this.distance = 0; // 走行距離
    this.hiScore = parseInt(
      localStorage.getItem('townsnap_dribble_hi') ||
      localStorage.getItem('dribble_runner_hi') || '0', 
      10
    );
    this.hiscoreValEl.textContent = this.hiScore;

    // 物理パラメータ
    this.groundY = 360;
    this.speed = 6;
    this.baseSpeed = 6;
    this.maxSpeed = 13;
    this.gravity = 0.72;

    // プレイヤー
    this.player = {
      x: 120,
      y: 0,
      width: 48,
      height: 60,
      vy: 0,
      isGrounded: true,
      jumpHold: false,
      jumpHoldFrames: 0,
      animFrame: 0,
      animTimer: 0
    };

    // ボール
    this.ball = {
      x: 155,
      y: 0,
      size: 18,
      angle: 0,
      bounceOffset: 0
    };

    // 障害物 (DF & 芝トラップ)
    this.obstacles = [];
    this.spawnTimer = 0;
    this.minSpawnInterval = 75; // フレーム
    this.maxSpawnInterval = 130;
    this.currentSpawnInterval = 100;

    // 視覚エフェクト (土煙、ポップアップ文字、花火)
    this.particles = [];
    this.popups = [];

    // 背景パララックス
    this.bgOffsetFar = 0;
    this.bgOffsetMid = 0;
    this.bgOffsetNear = 0;

    this.lastTime = 0;

    this.initEvents();
    this.renderPreview();
    this.resetGame();

    // メインループ開始
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  // プレビュー画面のキャラクター描画
  renderPreview() {
    const previewCanvas = document.getElementById('previewCanvas');
    if (!previewCanvas) return;
    const pCtx = previewCanvas.getContext('2d');
    pCtx.imageSmoothingEnabled = false;
    pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    // 背景
    pCtx.fillStyle = '#1e272e';
    pCtx.fillRect(0, 0, 120, 120);

    // キャラクター（立ちポーズ）
    const matrix = SpriteRenderer.getPlayerMatrix(0);
    const colorMap = SpriteRenderer.getPlayerColorMap();
    SpriteRenderer.drawMatrix(pCtx, matrix, colorMap, 28, 14, 4);

    // ボール
    SpriteRenderer.drawBall(pCtx, 68, 86, 22, 0.2);
  }

  // イベント登録（PC・スマホ両対応）
  initEvents() {
    const container = document.getElementById('game-container');
    const startScreen = document.getElementById('start-screen');
    const gameoverScreen = document.getElementById('gameover-screen');
    const wrapper = document.getElementById('game-wrapper');

    // 画面全体のタップ/クリック時の統一ハンドラ
    const handleGlobalActionDown = (e) => {
      // 音声アンロック（iOS対策）
      this.sound.init();

      // サウンドボタンやGAMES一覧リンクなどの操作は除外
      if (e && e.target) {
        if (e.target.id === 'sound-toggle' || e.target.closest('#sound-toggle')) return;
        if (e.target.classList.contains('hub-btn') || e.target.closest('.hub-btn')) return;
      }

      if (this.state === 'START') {
        if (e && e.cancelable && e.type && e.type.startsWith('touch')) e.preventDefault();
        this.startGame();
      } else if (this.state === 'PLAYING') {
        if (e && e.cancelable && e.type && e.type.startsWith('touch')) e.preventDefault();
        this.jump();
      } else if (this.state === 'GAMEOVER') {
        if (e && e.cancelable && e.type && e.type.startsWith('touch')) e.preventDefault();
        this.restartGame();
      }
    };

    const handleGlobalActionUp = () => {
      this.player.jumpHold = false;
    };

    // 1. キーボード操作
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleGlobalActionDown(e);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        handleGlobalActionUp();
      }
    });

    // 2. モバイルタッチ ＆ マウス（画面全体・コンテナ全体で確実に拾う）
    const bindPointer = (element) => {
      if (!element) return;
      
      // Pointer Events (モダンブラウザ標準)
      element.addEventListener('pointerdown', (e) => {
        handleGlobalActionDown(e);
      });
      element.addEventListener('pointerup', handleGlobalActionUp);
      element.addEventListener('pointercancel', handleGlobalActionUp);

      // Touch Events (iOS Safariフォールバック)
      element.addEventListener('touchstart', (e) => {
        handleGlobalActionDown(e);
      }, { passive: false });
      element.addEventListener('touchend', handleGlobalActionUp, { passive: true });
    };

    bindPointer(this.canvas);
    bindPointer(container);
    bindPointer(startScreen);
    bindPointer(gameoverScreen);
    bindPointer(wrapper);

    // 3. 各ボタンの個別ハンドリング（タップでもクリックでも絶対に100%即座に反応）
    const bindButton = (btn, action) => {
      if (!btn) return;
      const handler = (e) => {
        if (e) {
          e.stopPropagation();
          if (e.cancelable && e.type && e.type.startsWith('touch')) e.preventDefault();
        }
        this.sound.init();
        action();
      };
      btn.addEventListener('pointerdown', handler);
      btn.addEventListener('touchstart', handler, { passive: false });
      btn.addEventListener('click', handler);
    };

    bindButton(this.startBtn, () => this.startGame());
    bindButton(this.restartBtn, () => this.restartGame());
    bindButton(this.soundBtn, () => {
      const enabled = this.sound.toggle();
      this.soundBtn.textContent = enabled ? '🔊 ON' : '🔇 OFF';
    });
  }

  resetGame() {
    this.score = 0;
    this.distance = 0;
    this.speed = this.baseSpeed;
    this.obstacles = [];
    this.particles = [];
    this.popups = [];
    this.spawnTimer = 40; // ゲーム開始直後にすぐスポーンしないよう余裕を持たせる

    this.player.y = this.groundY - this.player.height;
    this.player.vy = 0;
    this.player.isGrounded = true;
    this.player.jumpHold = false;
    this.player.jumpHoldFrames = 0;
    this.player.animFrame = 0;

    this.ball.x = this.player.x + 36;
    this.ball.y = this.groundY - this.ball.size;

    this.scoreValEl.textContent = '0';
    this.distValEl.textContent = '0';
  }

  startGame() {
    this.sound.init();
    this.sound.startBGM();
    this.resetGame();
    this.state = 'PLAYING';
    this.startScreenEl.classList.remove('active');
    this.gameoverScreenEl.classList.remove('active');
  }

  restartGame() {
    this.sound.init();
    this.sound.startBGM();
    this.resetGame();
    this.state = 'PLAYING';
    this.gameoverScreenEl.classList.remove('active');
  }

  gameOver(reason) {
    this.state = 'GAMEOVER';
    this.sound.stopBGM();
    this.sound.playWhistle();

    // ハイスコア判定
    const isNewRecord = this.score > this.hiScore;
    if (isNewRecord) {
      this.hiScore = this.score;
      localStorage.setItem('townsnap_dribble_hi', this.hiScore);
      localStorage.setItem('dribble_runner_hi', this.hiScore);
      this.hiscoreValEl.textContent = this.hiScore;
      this.newRecordTagEl.style.display = 'block';
    } else {
      this.newRecordTagEl.style.display = 'none';
    }

    this.gameoverReasonEl.textContent = reason;
    this.finalScoreEl.textContent = `${this.score} 人`;
    this.finalDistEl.textContent = `${Math.floor(this.distance)} m`;
    this.finalHiscoreEl.textContent = `${this.hiScore} 人`;

    // 画面揺れ
    this.shakeDuration = 18;

    setTimeout(() => {
      this.gameoverScreenEl.classList.add('active');
    }, 600);
  }

  // ジャンプ実行
  jump() {
    if (this.player.isGrounded) {
      this.player.vy = -13.5;
      this.player.isGrounded = false;
      this.player.jumpHold = true;
      this.player.jumpHoldFrames = 0;
      this.sound.playJump();

      // 踏み切り土煙パーティクル
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x: this.player.x + 10 + Math.random() * 20,
          y: this.groundY - 4,
          vx: -(Math.random() * 3 + 1),
          vy: -(Math.random() * 2 + 1),
          size: Math.random() * 4 + 2,
          color: '#27ae60',
          life: 20
        });
      }
    }
  }

  // ===========================================================================
  // 更新ロジック
  // ===========================================================================
  update() {
    if (this.state !== 'PLAYING') return;

    // 距離とスピードの上昇（スーパーマリオのような疾走感）
    this.distance += this.speed * 0.05;
    this.distValEl.textContent = Math.floor(this.distance);

    // 徐々にスピードアップ（最大13まで）
    this.speed = Math.min(this.maxSpeed, this.baseSpeed + (this.distance * 0.006));

    // 背景スクロール
    this.bgOffsetFar += this.speed * 0.15;
    this.bgOffsetMid += this.speed * 0.45;
    this.bgOffsetNear += this.speed;

    // プレイヤー物理更新
    if (!this.player.isGrounded) {
      // ジャンプ長押しによる可変ジャンプ（マリオの小ジャンプ/大ジャンプ仕様）
      if (this.player.jumpHold && this.player.jumpHoldFrames < 10) {
        this.player.vy -= 0.35; // 上昇を維持
        this.player.jumpHoldFrames++;
      }
      this.player.vy += this.gravity;
      this.player.y += this.player.vy;

      // 着地判定
      if (this.player.y >= this.groundY - this.player.height) {
        this.player.y = this.groundY - this.player.height;
        this.player.vy = 0;
        this.player.isGrounded = true;
        this.sound.playKick(); // 着地ドリブル音
      }
    }

    // アニメーション更新
    this.player.animTimer += this.speed * 0.08;
    if (this.player.animTimer >= 1) {
      this.player.animTimer = 0;
      this.player.animFrame = (this.player.animFrame + 1) % 4;
      if (this.player.isGrounded && (this.player.animFrame === 0 || this.player.animFrame === 2)) {
        this.sound.playKick();
      }
    }

    // ボール物理（神業ドリブル：プレイヤーの足元に完全吸い付き！）
    if (this.player.isGrounded) {
      this.ball.x = this.player.x + 36 + Math.sin(this.distance * 0.2) * 4;
      this.ball.y = this.groundY - this.ball.size - Math.abs(Math.sin(this.distance * 0.3) * 6);
      this.ball.angle += 0.25 * (this.speed / 6);
    } else {
      // 空中では足元にしっかりキープして一緒に跳躍
      this.ball.x = this.player.x + 28;
      this.ball.y = this.player.y + this.player.height - 14;
      this.ball.angle += 0.12;
    }

    // 障害物スポーン管理
    this.spawnTimer--;
    if (this.spawnTimer <= 0) {
      this.spawnObstacle();
      const currentInterval = Math.max(
        50,
        Math.floor(this.currentSpawnInterval - this.distance * 0.03)
      );
      this.spawnTimer = currentInterval + Math.floor(Math.random() * 30);
    }

    // 障害物移動＆当たり判定
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= this.speed;

      // スライディングDFの土煙
      if (obs.type === 'slide' && Math.random() < 0.4) {
        this.particles.push({
          x: obs.x + obs.width,
          y: this.groundY - 4,
          vx: Math.random() * 2 + 1,
          vy: -Math.random() * 2,
          size: Math.random() * 4 + 2,
          color: '#27ae60',
          life: 15
        });
      }

      // かわした判定（プレイヤーを通り過ぎた瞬間）
      if (!obs.beaten && obs.x + obs.width < this.player.x) {
        obs.beaten = true;
        this.score++;
        this.scoreValEl.textContent = this.score;
        this.sound.playScore();

        // ポップアップ文字
        const praises = ['NICE CUT!', 'DRIBBLE!', 'FEINT!', 'GENIUS!', 'GO!'];
        const pText = praises[Math.floor(Math.random() * praises.length)];
        this.popups.push({
          x: this.player.x + 20,
          y: this.player.y - 20,
          text: pText,
          life: 35,
          color: '#55efc4'
        });

        // 10人かわすごとにフィーバー歓声
        if (this.score % 10 === 0) {
          this.sound.playCheer();
          this.popups.push({
            x: 400,
            y: 180,
            text: `★ ${this.score}人抜き達成!! ★`,
            life: 60,
            color: '#ffeaa7',
            large: true
          });
        }
      }

      // 当たり判定 (AABB)
      // 少し当たり判定を内側に縮小してフェアで心地よい判定にする
      const pBox = {
        x: this.player.x + 10,
        y: this.player.y + 6,
        w: this.player.width - 20,
        h: this.player.height - 10
      };
      const oBox = {
        x: obs.x + 6,
        y: obs.y + 4,
        w: obs.width - 12,
        h: obs.height - 6
      };

      if (
        pBox.x < oBox.x + oBox.w &&
        pBox.x + pBox.w > oBox.x &&
        pBox.y < oBox.y + oBox.h &&
        pBox.y + pBox.h > oBox.y
      ) {
        let reason = '激しいスライディングに倒された！';
        if (obs.type === 'tackle') reason = 'DFの強烈な体当たりタックルに阻まれた！';
        else if (obs.type === 'big') reason = '巨漢DFの巨大な壁に跳ね返された！';
        else if (obs.type === 'rough') reason = '荒れたピッチに足を取られて転倒！';
        this.gameOver(reason);
        break;
      }

      // 画面外に出たら削除
      if (obs.x + obs.width < -100) {
        this.obstacles.splice(i, 1);
      }
    }

    // パーティクル更新
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // ポップアップ更新
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pop = this.popups[i];
      pop.y -= 1.2;
      pop.life--;
      if (pop.life <= 0) this.popups.splice(i, 1);
    }
  }

  // 障害物スポーン
  spawnObstacle() {
    const rand = Math.random();
    let obs = null;

    if (rand < 0.38) {
      // 1. スライディングDF（低空・横長）
      obs = {
        type: 'slide',
        x: 820,
        y: this.groundY - 26,
        width: 102,
        height: 26,
        beaten: false
      };
    } else if (rand < 0.68) {
      // 2. タックルDF（標準体型）
      obs = {
        type: 'tackle',
        x: 820,
        y: this.groundY - 44,
        width: 48,
        height: 44,
        beaten: false
      };
    } else if (rand < 0.86) {
      // 3. 巨漢DF（背が高い・ジャンプ頂点で抜く）
      obs = {
        type: 'big',
        x: 820,
        y: this.groundY - 60,
        width: 58,
        height: 60,
        beaten: false
      };
    } else {
      // 4. 荒れた芝・泥トラップ（足を取られる）
      obs = {
        type: 'rough',
        x: 820,
        y: this.groundY - 14,
        width: 64,
        height: 14,
        beaten: false
      };
    }

    this.obstacles.push(obs);
  }

  // ===========================================================================
  // 描画ロジック
  // ===========================================================================
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 画面揺れ演出（ゲームオーバー時）
    this.ctx.save();
    if (this.shakeDuration > 0) {
      const dx = (Math.random() - 0.5) * 8;
      const dy = (Math.random() - 0.5) * 8;
      this.ctx.translate(dx, dy);
      this.shakeDuration--;
    }

    // 1. 背景（空・スタジアム・照明）
    this.drawBackground();

    // 2. 芝生ピッチ
    this.drawPitch();

    // 3. 障害物 (DF & 芝トラップ)
    this.drawObstacles();

    // 4. プレイヤー＆サッカーボール
    this.drawPlayerAndBall();

    // 5. パーティクル＆ポップアップ演出
    this.drawEffects();

    this.ctx.restore();
  }

  // 背景描画（昼〜夕〜ナイターへ時間変化する空、スタジアム観客席）
  drawBackground() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 走行距離に応じた空のグラデーション変化
    const cycle = (this.distance % 600) / 600; // 0〜1
    let skyTop = '#1e3799';
    let skyBottom = '#4a69bd';

    if (cycle > 0.4 && cycle <= 0.7) {
      // 夕暮れ
      skyTop = '#b71540';
      skyBottom = '#e55039';
    } else if (cycle > 0.7) {
      // ナイター（夜）
      skyTop = '#0a192f';
      skyBottom = '#172a45';
    }

    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, 240);
    skyGrad.addColorStop(0, skyTop);
    skyGrad.addColorStop(1, skyBottom);
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, w, 240);

    // スタジアム屋根・照明塔 (遠景パララックス)
    this.ctx.fillStyle = '#1e272e';
    for (let x = - (this.bgOffsetFar % 200); x < w + 200; x += 200) {
      // 照明塔ポール
      this.ctx.fillRect(x + 80, 40, 8, 120);
      // カクテルライト
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.fillRect(x + 72, 32, 24, 10);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(x + 76, 34, 16, 6);
      this.ctx.fillStyle = '#1e272e';
    }

    // スタジアム観客席 (中景パララックス)
    const midY = 160;
    this.ctx.fillStyle = '#2f3542';
    this.ctx.fillRect(0, midY, w, 100);

    // 観客のドット（ピコピコ動いて歓声）
    const colors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#ffffff', '#9b59b6'];
    const crowdOffset = Math.floor(this.bgOffsetMid);
    for (let row = 0; row < 5; row++) {
      for (let col = -2; col < 90; col++) {
        const cx = col * 10 - (crowdOffset % 10);
        const cy = midY + 12 + row * 16 + (Math.sin(this.distance * 0.1 + col) > 0.6 ? -2 : 0);
        const cIndex = Math.abs((col * 7 + row * 13) % colors.length);
        this.ctx.fillStyle = colors[cIndex];
        this.ctx.fillRect(cx, cy, 6, 7);
      }
    }

    // スタジアムのスポンサー看板
    this.ctx.fillStyle = '#1e272e';
    this.ctx.fillRect(0, 240, w, 24);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '8px "Press Start 2P", monospace';
    const bannerOffset = Math.floor(this.bgOffsetNear * 0.7);
    const ads = ['★ FUJITSU ★', '⚽ CHAMPIONSHIP ⚽', '★ GO FOR GOAL! ★', '🔥 8-BIT SOCCER 🔥'];
    for (let i = -2; i < 8; i++) {
      const bx = i * 160 - (bannerOffset % 160);
      const text = ads[Math.abs(i) % ads.length];
      this.ctx.fillText(text, bx, 256);
    }
  }

  // 芝生ピッチ描画
  drawPitch() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 芝生ベース（深い緑）
    this.ctx.fillStyle = '#27ae60';
    this.ctx.fillRect(0, 264, w, h - 264);

    // 芝生の刈り込みストライプ模様（横スクロール）
    const stripeWidth = 60;
    const offset = Math.floor(this.bgOffsetNear) % (stripeWidth * 2);
    this.ctx.fillStyle = '#2ecc71';
    for (let x = -stripeWidth * 2 - offset; x < w + stripeWidth; x += stripeWidth * 2) {
      this.ctx.fillRect(x, 264, stripeWidth, h - 264);
    }

    // ピッチのタッチライン白線
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, this.groundY + 1, w, 4);

    // センターサークル/ペナルティエリア風の縦白線が流れる
    const lineSpacing = 350;
    const lineX = lineSpacing - (Math.floor(this.bgOffsetNear) % lineSpacing);
    this.ctx.fillRect(lineX, 264, 5, h - 264);
  }

  // 障害物描画
  drawObstacles() {
    for (const obs of this.obstacles) {
      if (obs.type === 'slide') {
        SpriteRenderer.drawSlidingDF(this.ctx, obs.x, obs.y, 3);
      } else if (obs.type === 'tackle') {
        SpriteRenderer.drawTackleDF(this.ctx, obs.x, obs.y, 3.1);
      } else if (obs.type === 'big') {
        SpriteRenderer.drawBigDF(this.ctx, obs.x, obs.y, 3.75);
      } else if (obs.type === 'rough') {
        SpriteRenderer.drawRoughGrass(this.ctx, obs.x, obs.y, obs.width, obs.height);
      }
    }
  }

  // プレイヤー＆ボール描画
  drawPlayerAndBall() {
    let frame = this.player.animFrame;
    if (this.state === 'GAMEOVER') {
      frame = 5; // クラッシュ転倒
    } else if (!this.player.isGrounded) {
      frame = 4; // ジャンプ
    }

    const matrix = SpriteRenderer.getPlayerMatrix(frame);
    const colorMap = SpriteRenderer.getPlayerColorMap();

    // プレイヤー描画（ドットサイズ3px）
    SpriteRenderer.drawMatrix(
      this.ctx,
      matrix,
      colorMap,
      this.player.x,
      this.player.y,
      3
    );

    // サッカーボール描画（クラッシュ時はボールが遠くへ転がる演出）
    let ballX = this.ball.x;
    let ballY = this.ball.y;
    if (this.state === 'GAMEOVER') {
      ballX += 60;
      ballY = this.groundY - this.ball.size;
    }
    SpriteRenderer.drawBall(this.ctx, ballX, ballY, this.ball.size, this.ball.angle);
  }

  // エフェクト（パーティクル＆ポップアップ文字）
  drawEffects() {
    // 土煙パーティクル
    for (const p of this.particles) {
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    // ポップアップ文字
    for (const pop of this.popups) {
      this.ctx.save();
      this.ctx.font = pop.large ? '16px "Press Start 2P", monospace' : '11px "Press Start 2P", monospace';
      this.ctx.fillStyle = pop.color;
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 3;
      this.ctx.textAlign = 'center';
      this.ctx.strokeText(pop.text, pop.x, pop.y);
      this.ctx.fillText(pop.text, pop.x, pop.y);
      this.ctx.restore();
    }
  }

  // メインゲームループ
  gameLoop(timestamp) {
    this.update();
    this.draw();
    requestAnimationFrame(this.gameLoop.bind(this));
  }
}

// ページロード完了後に初期化
window.addEventListener('DOMContentLoaded', () => {
  new DribbleGame();
});

