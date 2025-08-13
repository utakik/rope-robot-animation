let baseR = 20, maxDelta = 60;
let r = baseR, pressure = 0, prevX, prevY, speed = 0;
let cnv;

let lastShot = 0;
const SHOT_INTERVAL = 2000;
const bullets = [];

function setup() {
  cnv = createCanvas(windowWidth, windowHeight);
  noStroke();
  colorMode(RGB, 255); // RGBモードに固定（0〜255）

  cnv.position(0, 0);
  cnv.style('position', 'fixed');
  cnv.style('touch-action', 'none');
  document.body.style.overscrollBehavior = 'none';
  window.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

  cnv.elt.addEventListener('pointermove', (e) => { pressure = e.pressure || 0; });
  cnv.elt.addEventListener('pointerup',     () => pressure = 0);
  cnv.elt.addEventListener('pointercancel', () => pressure = 0);
  cnv.elt.addEventListener('pointerout',    () => pressure = 0);
}

function draw() {
  background(245);

  updateBullets();

  if (prevX !== undefined) {
    const dx = mouseX - prevX, dy = mouseY - prevY;
    speed = 0.9*speed + 0.1*sqrt(dx*dx + dy*dy);
  }
  maybeShoot();

  const targetR = baseR + (pressure > 0
    ? pressure * maxDelta
    : constrain(map(speed, 0, 40, 0, maxDelta), 0, maxDelta));
  r = lerp(r, targetR, 0.2);

  // メイン円（グレー値は速度に応じて変化）
  const gray = map(speed, 0, 40, 50, 200); // 50〜200の明るさ
  fill(gray);
  ellipse(mouseX, mouseY, r*2, r*2);

  fill(0);
  text(`pressure:${pressure.toFixed(2)}  r:${r.toFixed(1)}  bullets:${bullets.length}`, 10, 20);

  prevX = mouseX; prevY = mouseY;
}

function maybeShoot(){
  const now = millis();
  if (now - lastShot < SHOT_INTERVAL) return;

  let vx = 0, vy = 0;
  if (prevX !== undefined) { vx = mouseX - prevX; vy = mouseY - prevY; }
  let len = sqrt(vx*vx + vy*vy);
  if (len < 0.001) { vx = 1; vy = 0; len = 1; }
  vx /= len; vy /= len;

  const spd = 6 + map(constrain(speed, 0, 40), 0, 40, 0, 8);

  spawnBullet(mouseX, mouseY,  vx*spd,  vy*spd);
  spawnBullet(mouseX, mouseY, -vy*spd,  vx*spd);

  r = baseR;
  lastShot = now;
}

function spawnBullet(x, y, vx, vy){
  bullets.push({
    x, y, vx, vy,
    r: 10,
    life: 255,
    gray: random(80, 220) // 発射時に明るさをランダム化
  });
}

function updateBullets(){
  for (const b of bullets){
    b.x += b.vx; b.y += b.vy;
    b.vx *= 0.995; b.vy *= 0.995;
    b.r  *= 0.995;
    b.life -= 3.5;

    fill(b.gray, b.gray, b.gray, constrain(b.life, 0, 255));
    noStroke();
    ellipse(b.x, b.y, b.r*2, b.r*2);
  }
  for (let i = bullets.length-1; i >= 0; --i){
    const b = bullets[i];
    if (b.life <= 0 || b.x < -50 || b.x > width+50 || b.y < -50 || b.y > height+50) {
      bullets.splice(i,1);
    }
  }
}

function touchMoved(){ return false; }
function windowResized(){ resizeCanvas(windowWidth, windowHeight); }
