// --- Rope-Bot minimal 2D (stable & short) ---------------------------

let target, head, segments = [];
const SEG_NUM = 16;     // 節の数（重ければ下げる）
const SEG_LEN = 16;     // 節の間隔
const FOLLOW  = 0.30;   // ターゲット追従の速さ
const DAMP    = 0.80;   // 減衰
let particles = [];

// 色
const COL_GRID  = [0, 255, 200];
const COL_BOT   = [255, 120, 255];
const COL_TRAIL = [255, 200, 120];
const COL_GATE  = [120, 160, 255];

function setup(){
  createCanvas(windowWidth, windowHeight);  // ← 2D。WEBGLは使わない
  pixelDensity(1);
  noStroke();

  target = createVector(width*0.35, height*0.35);
  head   = createVector(width*0.25, height*0.30);

  segments.length = 0;
  for (let i=0; i<SEG_NUM; i++){
    segments.push(createVector(head.x - i*SEG_LEN, head.y));
  }
}

function windowResized(){ resizeCanvas(windowWidth, windowHeight); }

function draw(){
  background(0);
  drawGrid();

  // ターゲット（指/マウス）にスムーズ追従
  const mx = constrain(mouseX, 0, width);
  const my = constrain(mouseY, 0, height);
  target.x += (mx - target.x) * 0.20;
  target.y += (my - target.y) * 0.20;

  // 先端（head）をターゲットへ
  head.x += (target.x - head.x) * FOLLOW;
  head.y += (target.y - head.y) * FOLLOW;

  // 先端を第1節へ反映
  segments[0].x += (head.x - segments[0].x) * 0.6;
  segments[0].y += (head.y - segments[0].y) * 0.6;

  // 距離を保ちながら各節を引き寄せ（簡易IK）
  for (let i=1; i<SEG_NUM; i++){
    const a = segments[i-1], b = segments[i];
    const dx = a.x - b.x, dy = a.y - b.y;
    const d = max(1, sqrt(dx*dx + dy*dy));
    const t = (d - SEG_LEN) / d;
    b.x += dx * t * 0.5;
    b.y += dy * t * 0.5;

    // 慣性減衰（ふるまい安定化）
    b.x = lerp(b.x, a.x - (a.x - b.x)*DAMP, 0.2);
    b.y = lerp(b.y, a.y - (a.y - b.y)*DAMP, 0.2);
  }

  // 尾の粒子（視覚的に80s風）
  particles.push({ x: segments[SEG_NUM-1].x, y: segments[SEG_NUM-1].y, a: 180, r: random(1,3),
                   vx: random(-0.4,0.4), vy: random(-0.4,0.4)-0.2 });
  noStroke();
  for (const p of particles){
    fill(COL_TRAIL[0], COL_TRAIL[1], COL_TRAIL[2], p.a);
    circle(p.x, p.y, p.r*2);
    p.x += p.vx; p.y += p.vy; p.a -= 3; p.r *= 0.99;
  }
  for (let i=particles.length-1; i>=0; i--) if (particles[i].a<=0) particles.splice(i,1);

  drawGate();
  drawBot();
}

function drawGrid(){
  stroke(COL_GRID[0], COL_GRID[1], COL_GRID[2], 80);
  strokeWeight(1);
  const step=50, tilt=0.45, vanishY=height*0.65;
  for (let x=-width; x<width*2; x+=step)
    line(x, vanishY, lerp(x, width*0.5, tilt), height);
  for (let y=vanishY; y<height; y+=step){
    const t = map(y, vanishY, height, 0, 1);
    const l = lerp(0, width*0.25, t*tilt);
    const r = lerp(width, width*0.75, t*tilt);
    line(l, y, r, y);
  }
  noStroke();
}

function drawGate(){
  const gx = width*0.85, gy = height*0.8;
  const glow = map(dist(head.x, head.y, gx, gy), 0, width, 220, 40);
  noFill(); stroke(COL_GATE[0], COL_GATE[1], COL_GATE[2], glow); strokeWeight(3);
  arc(gx, gy, 220, 220, PI, TWO_PI);
  strokeWeight(1.5);
  for (let i=0;i<6;i++) arc(gx, gy, 220-i*24, 220-i*24, PI, TWO_PI);
  noStroke(); fill(COL_GATE[0], COL_GATE[1], COL_GATE[2], 18); ellipse(gx, gy, 260, 90);
}

function drawBot(){
  for (let i=0; i<SEG_NUM-1; i++){
    const a = segments[i], b = segments[i+1];
    const d = max(1, dist(a.x,a.y,b.x,b.y));
    const nx = (a.y-b.y)/d, ny = (b.x-a.x)/d;
    const t  = i/(SEG_NUM-1);
    const w  = lerp(16, 6, t);
    fill(COL_BOT[0], COL_BOT[1], COL_BOT[2], 160);
    quad(a.x+nx*w, a.y+ny*w, b.x+nx*w*0.9, b.y+ny*w*0.9,
         b.x-nx*w*0.9, b.y-ny*w*0.9, a.x-nx*w, a.y-ny*w);
  }
  const pulse = 0.6 + 0.4*sin(frameCount*0.07);
  fill(COL_BOT[0], COL_BOT[1], COL_BOT[2], 220);
  circle(head.x, head.y, 28+6*pulse);
  fill(0,140); circle(head.x-6, head.y-3, 6); circle(head.x+4, head.y+2, 4);
}

function touchMoved(){ return false; } // スクロール抑止
