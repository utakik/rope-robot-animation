let baseR = 20;        // 最小半径
let maxDelta = 60;     // 筆圧で増える最大分
let r = baseR;
let pressure = 0;      // 0〜1
let prevX, prevY, speed = 0;
let cnv;

function setup() {
  cnv = createCanvas(windowWidth, windowHeight);
  noStroke();
  colorMode(HSB, 255);

  // 画面固定＆スクロール抑止（前回と同じ）
  cnv.position(0, 0);
  cnv.style('position', 'fixed');
  cnv.style('touch-action', 'none');
  document.body.style.overscrollBehavior = 'none';
  window.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

  // Pointer Eventsで筆圧を取得
  cnv.elt.addEventListener('pointermove', (e) => {
    pressure = e.pressure || 0; // Apple Pencilなら0〜1、マウスは0か0.5
  });
}

function draw() {
  background(245);

  // 速度（フォールバック用）を更新
  if (prevX !== undefined) {
    let dx = mouseX - prevX;
    let dy = mouseY - prevY;
    speed = 0.9 * speed + 0.1 * sqrt(dx*dx + dy*dy); // なめらかに
  }
  prevX = mouseX; prevY = mouseY;

  // 半径：筆圧が有効ならそれを優先、なければ速度で代用
  let targetR = baseR + (pressure > 0 ? pressure * maxDelta
                                      : constrain(map(speed, 0, 40, 0, maxDelta), 0, maxDelta));
  r = lerp(r, targetR, 0.2); // ふわっと追従

  // ゆっくり色相回転（前回のまま）
  let hue = (frameCount * 0.5) % 255;
  fill(hue, 200, 200);
  ellipse(mouseX, mouseY, r * 2, r * 2);

  // 情報表示
  colorMode(RGB, 255);
  fill(0);
  text("pressure: " + pressure.toFixed(2) + "  r: " + r.toFixed(1), 10, 20);
  colorMode(HSB, 255);
}

function touchMoved(){ return false; }
