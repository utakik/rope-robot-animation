// --- 80s Rope-Bot Scene ---------------------------------------------

let target;            // 追従ターゲット（マウス/タッチ位置）
let head;              // 先頭（ロボットの頭）
let segments = [];     // ひもの節
const SEG_NUM = 50;    // 節の数（増やすと長く柔らかく）
const SEG_LEN = 16;    // 節間距離
const FOLLOW = 0.1;    // 追従の強さ
const DAMP   = 0.86;   // 減衰
let particles = [];    // 尾の粒子

// 色（ネオン風）
const COL_GRID  = [0, 255, 200];
const COL_BOT   = [255, 120, 255];
const COL_TRail = [255, 200, 120];
const COL_GATE  = [120, 160, 255];

function setup(){
  createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);
  noStroke();
  target = createVector(0, 0);
  head   = createVector(-width*0.15, -height*0.1);

  // ひも（head から後ろへSEG_NUM節を初期生成）
  segments = [];
  for (let i=0; i<SEG_NUM; i++){
    segments.push(createVector(head.x - i*SEG_LEN, head.y));
  }
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}

function draw(){
  background(0);

  // 2Dっぽく描く（WEBGL座標をスクリーンに合わせる）
  resetMatrix();
  ortho(-width/2, width/2, height/2, -height/2, -1000, 1000);
  translate(-width/2, -height/2);

  drawGrid();
  updateTarget();
  updateRope();
  drawTrail();
  drawGate();
  drawBot();
  fadeParticles();
}

// -------- Grid (80s) -------------------------------------------------
function drawGrid(){
  push();
  stroke(COL_GRID[0], COL_GRID[1], COL_GRID[2], 80);
  strokeWeight(1);

  // パースっぽい斜めグリッド
  const step = 50;
  const tilt = 0.45;         // 傾き
  const vanishY = height*0.65;
  for (let x=-width; x<width*2; x+=step){
    line(x, vanishY, lerp(x, width*0.5, tilt), height);
  }
  for (let y=vanishY; y<height; y+=step){
    const t = map(y, vanishY, height, 0, 1);
    const left  = lerp(0, width*0.25, t*tilt);
    const right = lerp(width, width*0.75, t*tilt);
    line(left, y, right, y);
  }
  pop();
}

// -------- Target (mouse/touch) --------------------------------------
function updateTarget(){
  // 画面端でのタッチでも確実に拾う
  const mx = constrain(mouseX, 0, width);
  const my = constrain(mouseY, 0, height);
  // スムーズに追従
  target.x += (mx - target.x) * 0.2;
  target.y += (my - target.y) * 0.2;
}

// -------- Rope physics ----------------------------------------------
function updateRope(){
  // 先頭は目標へ
  const toT = p5.Vector.sub(target, head).mult(FOLLOW);
  head.add(toT);

  // 先頭の位置を反映
  segments[0].x += (head.x - segments[0].x) * 0.6;
  segments[0].y += (head.y - segments[0].y) * 0.6;

  // 各節を前の節へ引き寄せ、距離を保つ
  for (let i=1; i<SEG_NUM; i++){
    const prev = segments[i-1];
    const cur  = segments[i];
    const dir  = p5.Vector.sub(prev, cur);
    const dist = dir.mag() || 1;
    dir.mult((dist - SEG_LEN) / dist); // 目標距離へ
    cur.add(dir.mult(0.5));
    // ちょっと慣性
    cur.x = lerp(cur.x, prev.x - (prev.x - cur.x)*DAMP, 0.2);
    cur.y = lerp(cur.y, prev.y - (prev.y - cur.y)*DAMP, 0.2);
  }

  // 粒子（尾）
  particles.push({
    x: segments[SEG_NUM-1].x,
    y: segments[SEG_NUM-1].y,
    vx: random(-0.4,0.4),
    vy: random(-0.4,0.4)-0.2,
    a: 180,
    r: random(1,3)
  });
}

// -------- Draw trail particles --------------------------------------
function drawTrail(){
  noStroke();
  for (const p of particles){
    fill(COL_TRail[0], COL_TRail[1], COL_TRail[2], p.a);
    circle(p.x, p.y, p.r*2);
    p.x += p.vx; p.y += p.vy;
    p.a -= 3; p.r *= 0.99;
  }
}

function fadeParticles(){
  for (let i=particles.length-1; i>=0; i--){
    if (particles[i].a <= 0) particles.splice(i,1);
  }
}

// -------- Gate (glowing warehouse) ----------------------------------
function drawGate(){
  const gx = width*0.85, gy = height*0.8;
  const distToGate = dist(head.x, head.y, gx, gy);
  const glow = map(distToGate, 0, width, 220, 40);

  push();
  noFill();
  stroke(COL_GATE[0], COL_GATE[1], COL_GATE[2], glow);
  strokeWeight(3);
  // 半円ドーム
  arc(gx, gy, 220, 220, PI, TWO_PI);
  strokeWeight(1.5);
  for (let i=0;i<6;i++){
    arc(gx, gy, 220- i*24, 220- i*24, PI, TWO_PI);
  }
  pop();

  // 近づくと門の輝度が増す
  push();
  noStroke();
  fill(COL_GATE[0], COL_GATE[1], COL_GATE[2], 18);
  ellipse(gx, gy, 260, 90);
  pop();
}

// -------- Draw bot (head + flexible body) ---------------------------
function drawBot(){
  // 身体（チューブ）を太さグラデで描く
  for (let i=0; i<SEG_NUM-1; i++){
    const a = segments[i], b = segments[i+1];
    const d = dist(a.x,a.y,b.x,b.y) || 1;
    const nx = (a.y-b.y)/d, ny = (b.x-a.x)/d; // 法線
    const t  = i/(SEG_NUM-1);
    const w  = lerp(16, 6, t);               // 太さ
    const a1 = createVector(a.x + nx*w, a.y + ny*w);
    const a2 = createVector(a.x - nx*w, a.y - ny*w);
    const b1 = createVector(b.x + nx*w*0.9, b.y + ny*w*0.9);
    const b2 = createVector(b.x - nx*w*0.9, b.y - ny*w*0.9);

    fill(COL_BOT[0], COL_BOT[1], COL_BOT[2], 160);
    quad(a1.x,a1.y, b1.x,b1.y, b2.x,b2.y, a2.x,a2.y);
  }

  // 頭（丸＋パネル）
  push();
  noStroke();
  const pulse = 0.6 + 0.4*sin(frameCount*0.07);
  fill(COL_BOT[0], COL_BOT[1], COL_BOT[2], 220);
  circle(head.x, head.y, 28+6*pulse);
  fill(0, 140);
  circle(head.x-6, head.y-3, 6);
  circle(head.x+4, head.y+2, 4);
  pop();
}

// -------- Input (touch friendly) ------------------------------------
function touchMoved(){ return false; } // 画面スクロール阻止
