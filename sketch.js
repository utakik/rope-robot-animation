let r = 20, pressure = 0, prevX, prevY, speed = 0;
let cnv; // ← 追加
 
function setup(){
  cnv = createCanvas(windowWidth, windowHeight); // ← 受け取る
  noStroke();
  colorMode(HSB, 255);
 
  // iPad等の筆圧（対応デバイスのみ）
  cnv.elt.addEventListener('pointermove', e => { pressure = e.pressure || 0; });
 
  // 画面固定
  document.body.style.overscrollBehavior = 'none';
}
 
function draw(){
  background(245);
 
  // 移動速度（筆圧が無い端末のフォールバック）
  if (prevX !== undefined){
    const dx = mouseX - prevX, dy = mouseY - prevY;
    speed = 0.9*speed + 0.1*sqrt(dx*dx + dy*dy);
  }
  prevX = mouseX; prevY = mouseY;
 
  // ゆっくり色相を回す
  const hue = (frameCount * 0.5) % 255;
 
  // 半径：筆圧優先、なければ速度で
  const target = 20 + (pressure > 0
    ? pressure * 60
    : constrain(map(speed, 0, 40, 0, 60), 0, 60));
  r = lerp(r, target, 0.2);
 
  fill(hue, 200, 200);
  ellipse(mouseX, mouseY, r*2, r*2);
}
 
function windowResized(){ resizeCanvas(windowWidth, windowHeight); }
Domain Details Page
 
