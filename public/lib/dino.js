/* Incloing's little runner: an original canvas Easter egg, drawn in rectangles. */
(() => {
  'use strict';
  if(window.IncloingDino)return;
  const BEST_KEY='incloing-dino-best-v1';
  let dialog=null,canvas=null,ctx=null,scoreEl=null,bestEl=null,message=null,messageTitle=null,messageText=null,startButton=null,pauseButton=null;
  let raf=0,lastFrame=0,state='ready',score=0,best=0,worldWidth=800,worldHeight=300,ground=252;
  let player={x:64,bottom:252,velocity:0},obstacles=[],distance=0,nextSpawn=400,runTime=0,ducking=false;
  let bodyLock=null,returnFocus=null,resizeObserver=null;
  try{const stored=Number(localStorage.getItem(BEST_KEY));if(Number.isFinite(stored)&&stored>0)best=Math.floor(stored);}catch(_){/* Play still works with storage disabled. */}
  const random=(min,max)=>min+Math.random()*(max-min);
  const isOpen=()=>Boolean(dialog?.open);
  function stopFrame(){if(raf)cancelAnimationFrame(raf);raf=0;lastFrame=0;}
  function updateBest(){if(score>best){best=Math.floor(score);try{localStorage.setItem(BEST_KEY,String(best));}catch(_){}}bestEl.textContent=String(best).padStart(4,'0');}
  function setMessage(title,copy){message.hidden=false;messageTitle.textContent=title;messageText.textContent=copy;}
  function updateControls(){startButton.textContent=state==='ready'?'开始跑步':state==='over'?'再跑一次':'重新开始';pauseButton.textContent=state==='paused'?'继续':'暂停';pauseButton.disabled=state==='ready'||state==='over';pauseButton.setAttribute('aria-label',state==='paused'?'继续游戏':'暂停游戏');}
  function reset(){stopFrame();score=0;distance=0;runTime=0;ducking=false;obstacles=[];nextSpawn=worldWidth*.72;player={x:Math.min(72,worldWidth*.14),bottom:ground,velocity:0};scoreEl.textContent='0000';}
  function start(){if(!isOpen())return;reset();state='running';message.hidden=true;updateControls();canvas.focus({preventScroll:true});raf=requestAnimationFrame(frame);}
  function jump(){if(state==='over'){start();return;}if(state!=='running')return;if(player.bottom>=ground-.5){ducking=false;player.velocity=-690;}}
  function pause(){if(state==='running'){state='paused';stopFrame();setMessage('歇一小会儿','点“继续”或按空格，接着向前。');updateControls();draw();}else if(state==='paused'){state='running';message.hidden=true;updateControls();raf=requestAnimationFrame(frame);}}
  function gameOver(){state='over';stopFrame();updateBest();setMessage('这一小段，跑得不错。',`这次跑了 ${Math.floor(score)} 分。点“再跑一次”，或按空格重新出发。`);updateControls();draw();}
  const physics=window.IncloingDinoPhysics;
  function collision(obstacle){return physics.collides(player,obstacle,ground,runTime,ducking);}
  function spawn(){obstacles.push(physics.spawn(score,worldWidth));}
  function tick(dt){
    runTime+=dt;const speed=physics.speedAt(runTime),move=speed*dt;distance+=move;score=distance/15;
    player.velocity+=1900*dt;player.bottom+=player.velocity*dt;if(player.bottom>ground){player.bottom=ground;player.velocity=0;}
    nextSpawn-=move;if(nextSpawn<=0){spawn();nextSpawn=random(Math.max(325,speed*1.12),Math.max(490,speed*1.6));}
    for(const obstacle of obstacles){obstacle.x-=move;if(collision(obstacle)){gameOver();return;}}
    obstacles=obstacles.filter(obstacle=>obstacle.x+obstacle.width>-30);scoreEl.textContent=String(Math.floor(score)).padStart(4,'0');
  }
  function frame(now){raf=0;if(state!=='running'||!isOpen())return;const dt=lastFrame?Math.min((now-lastFrame)/1000,.035):0;lastFrame=now;tick(dt);draw();if(state==='running')raf=requestAnimationFrame(frame);}
  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function drawCloud(x,y,scale){const s=scale;rect(x,y,44*s,6*s,'#ffffff72');rect(x+8*s,y-7*s,28*s,7*s,'#ffffff72');rect(x+17*s,y-11*s,11*s,4*s,'#ffffff72');}
  function drawDino(){
    const x=player.x,b=player.bottom,onGround=b>=ground-.5,duck=ducking&&onGround;
    ctx.save();ctx.translate(x,b);if(duck)ctx.scale(1,.63);else if(onGround&&state==='running')ctx.translate(0,Math.sin(runTime*20)>.3?-1:0);
    const body='#7c9e83',shade='#6e8e75',light='#a5bd92',cheek='#c5b5c9';
    rect(-17,-29,9,8,shade);rect(-10,-31,12,13,body);rect(-2,-39,26,27,body);rect(5,-17,22,9,body);
    rect(18,-50,12,28,body);rect(24,-58,21,23,body);rect(42,-49,12,13,body);rect(28,-61,12,4,light);
    rect(25,-53,17,5,light);rect(35,-52,5,6,'#eff5dc');rect(38,-51,2,4,'#3e5d4e');rect(43,-39,9,2,shade);rect(40,-43,4,3,cheek);
    rect(1,-40,5,5,light);rect(8,-43,5,5,light);rect(15,-44,5,5,light);rect(25,-31,9,5,shade);rect(31,-29,4,4,shade);
    const step=state==='running'&&onGround?Math.sin(runTime*21):0;
    rect(3,-11,8,step>0?8:11,shade);rect(3,step>0?-4:-3,13,4,shade);rect(20,-10,7,step<0?7:10,body);rect(20,step<0?-5:-3,12,4,body);
    rect(3,-31,4,14,light);ctx.restore();
  }
  function drawObstacle(obstacle){const x=obstacle.x,w=obstacle.width,h=obstacle.height;
    if(obstacle.type==='bird'){const y=ground-102+Math.sin(runTime*11+obstacle.phase)*4,wing=Math.sin(runTime*17+obstacle.phase)>0;rect(x+9,y+10,25,12,'#a59bb9');rect(x+31,y+5,12,14,'#b9afd0');rect(x+40,y+12,8,4,'#d9bd9c');rect(x+35,y+8,3,3,'#40514c');rect(x+14,y+(wing?0:17),15,11,'#c7bbd6');rect(x+1,y+7,11,6,'#b7aac8');rect(x+13,y+21,4,5,'#8a839c');}
    else if(obstacle.type==='plant'){const stem=w*.34;rect(x+stem,ground-h,w*.38,h,'#91aa75');rect(x+stem+3,ground-h+3,w*.13,h-5,'#b5c794');rect(x+2,ground-h*.65,w*.38,7,'#91aa75');rect(x+1,ground-h*.82,7,h*.28,'#91aa75');rect(x+w*.62,ground-h*.43,w*.34,7,'#809967');rect(x+w-7,ground-h*.68,7,h*.3,'#809967');rect(x+stem+3,ground-h-3,w*.17,4,'#c3b5c9');}
    else{rect(x+5,ground-h+7,w-8,h-7,'#b5b3bd');rect(x+12,ground-h,w-19,8,'#c8c4cb');rect(x+2,ground-15,w-2,14,'#a5a5b1');rect(x+9,ground-h+10,w*.3,4,'#d6d1d3');rect(x+w-12,ground-10,7,6,'#969ba6');}
  }
  function draw(){
    if(!ctx||!canvas.width)return;
    ctx.setTransform(canvas.width/worldWidth,0,0,canvas.height/worldHeight,0,0);ctx.clearRect(0,0,worldWidth,worldHeight);
    const cloudOffset=state==='ready'?0:distance*.07;
    for(let i=0;i<4;i++){const x=((i*230+80-cloudOffset)%(worldWidth+160)+worldWidth+160)%(worldWidth+160)-80;drawCloud(x,76+(i%2)*24,.8+(i%3)*.2);}
    ctx.fillStyle='#dbe6cf65';ctx.beginPath();ctx.moveTo(0,ground);ctx.bezierCurveTo(worldWidth*.2,ground-60,worldWidth*.34,ground-20,worldWidth*.51,ground);ctx.bezierCurveTo(worldWidth*.7,ground-52,worldWidth*.86,ground-40,worldWidth,ground-5);ctx.lineTo(worldWidth,ground+30);ctx.lineTo(0,ground+30);ctx.fill();
    rect(0,ground,worldWidth,1,'#a7b99a');rect(0,ground+1,worldWidth,worldHeight-ground,'#e6edda65');
    for(let i=0;i<18;i++){const x=((i*67-distance*.9)%(worldWidth+80)+worldWidth+80)%(worldWidth+80)-20;rect(x,ground+9+(i%3)*10,i%3===0?9:4,1,'#b8c7a880');}
    for(const obstacle of obstacles)drawObstacle(obstacle);
    drawDino();
  }
  function resize(){
    if(!isOpen())return;const bounds=canvas.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(bounds.width*ratio));canvas.height=Math.max(1,Math.round(bounds.height*ratio));
    const previousWidth=worldWidth;worldWidth=Math.max(480,Math.min(940,bounds.width*1.08));
    if(Math.abs(previousWidth-worldWidth)>10&&state==='running')pause();
    if(previousWidth!==worldWidth){const delta=worldWidth-previousWidth;for(const obstacle of obstacles)obstacle.x=Math.max(player.x+90,obstacle.x+delta);}
    player.x=Math.min(72,worldWidth*.14);draw();
  }
  function lockBody(){if(bodyLock)return;const body=document.body;bodyLock={y:window.scrollY,position:body.style.position,top:body.style.top,width:body.style.width,overflow:body.style.overflow};Object.assign(body.style,{position:'fixed',top:`-${bodyLock.y}px`,width:'100%',overflow:'hidden'});}
  function unlockBody(){if(!bodyLock)return;const saved=bodyLock;bodyLock=null;Object.assign(document.body.style,{position:saved.position,top:saved.top,width:saved.width,overflow:saved.overflow});window.scrollTo({top:saved.y,behavior:'instant'});}
  function close(){if(!dialog?.open)return;dialog.close();}
  function onClose(){stopFrame();state='ready';ducking=false;unlockBody();resizeObserver?.disconnect();returnFocus?.focus?.({preventScroll:true});returnFocus=null;}
  function keyDown(event){
    if(!isOpen()||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;
    if(event.key==='Escape')return;
    if(event.code==='Space'||event.key==='ArrowUp'){event.preventDefault();event.stopPropagation();if(event.repeat)return;if(state==='ready'||state==='over')start();else if(state==='paused')pause();else jump();}
    else if(event.key==='ArrowDown'){event.preventDefault();event.stopPropagation();ducking=true;}
    else if(event.key.toLowerCase()==='p'){event.preventDefault();if(!event.repeat)pause();}
  }
  function glass(event){const button=event.target.closest('button');if(!button||button.disabled)return;const bounds=button.getBoundingClientRect(),wave=document.createElement('i');wave.className='dino-glass-wave';wave.setAttribute('aria-hidden','true');wave.style.left=`${event.detail?event.clientX-bounds.left:bounds.width/2}px`;wave.style.top=`${event.detail?event.clientY-bounds.top:bounds.height/2}px`;button.append(wave);setTimeout(()=>wave.remove(),700);}
  function create(){
    dialog=document.createElement('dialog');dialog.className='incloing-dino';dialog.id='incloing-dino-dialog';dialog.setAttribute('aria-labelledby','dino-title');dialog.setAttribute('aria-describedby','dino-instructions');
    dialog.innerHTML=`<div class="dino-heading"><div><p class="dino-eyebrow">A LITTLE DETOUR · INCLOING</p><h2 id="dino-title" class="dino-title">向前，再一小步<span>。</span></h2></div><button type="button" class="dino-close" aria-label="关闭小游戏"><span class="close-mark" aria-hidden="true"></span></button></div><div class="dino-screen"><div class="dino-scoreboard"><span>这一程 <strong class="dino-score">0000</strong></span><span class="dino-best">本机最佳 <strong>0000</strong></span></div><canvas class="dino-canvas" tabindex="0" role="img" aria-label="小恐龙跑步游戏画面，空格或点击画面跳跃"></canvas><div class="dino-message" role="status" aria-live="polite"><strong></strong><span></span></div></div><div class="dino-controls"><div class="dino-control-buttons"><button type="button" class="dino-action dino-start">开始跑步</button><button type="button" class="dino-secondary dino-pause" disabled>暂停</button><button type="button" class="dino-secondary dino-jump">跳一下 ↑</button></div><p id="dino-instructions" class="dino-instructions"><kbd>Space</kbd> / <kbd>↑</kbd> 跳跃 · <kbd>↓</kbd> 蹲下 · <kbd>P</kbd> 暂停<br>160 分后出现空中小怪物，留在地面避开它<br>手机轻点画面或“跳一下” · <kbd>Esc</kbd> 退出</p></div><div class="dino-bottom-note"><p>绕一小段路，也可以是今天的快乐。</p><p>最佳成绩仅保存在当前浏览器</p></div>`;
    const nativeClose=dialog.close.bind(dialog);
    // The host may close all dialogs and open another one in the same event.
    // Release our private scroll lock synchronously before its next modal locks.
    dialog.close=value=>{if(!dialog.open)return;nativeClose(value);onClose();};
    document.body.append(dialog);canvas=dialog.querySelector('canvas');ctx=canvas.getContext('2d');scoreEl=dialog.querySelector('.dino-score');bestEl=dialog.querySelector('.dino-best strong');message=dialog.querySelector('.dino-message');messageTitle=message.querySelector('strong');messageText=message.querySelector('span');startButton=dialog.querySelector('.dino-start');pauseButton=dialog.querySelector('.dino-pause');
    dialog.querySelector('.dino-close').addEventListener('click',close);startButton.addEventListener('click',start);pauseButton.addEventListener('click',pause);
    dialog.querySelector('.dino-jump').addEventListener('click',()=>{if(state==='ready'||state==='over')start();else if(state==='paused')pause();else jump();});
    canvas.addEventListener('pointerdown',event=>{if(!event.isPrimary||event.button>0)return;event.preventDefault();canvas.focus({preventScroll:true});if(state==='ready'||state==='over')start();else if(state==='paused')pause();else jump();});
    dialog.addEventListener('keydown',keyDown);dialog.addEventListener('keyup',event=>{if(event.key==='ArrowDown'){event.preventDefault();ducking=false;}});
    dialog.addEventListener('close',()=>{if(!dialog.open)onClose();});dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('click',glass);
    dialog.addEventListener('wheel',event=>{event.preventDefault();event.stopPropagation();},{passive:false});
    dialog.addEventListener('touchmove',event=>{if(event.target===canvas){event.preventDefault();event.stopPropagation();}},{passive:false});
    window.addEventListener('blur',()=>{ducking=false;if(state==='running'&&isOpen())pause();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='running'&&isOpen())pause();});
    resizeObserver=new ResizeObserver(resize);
  }
  function open(){if(!dialog)create();if(isOpen()){canvas.focus({preventScroll:true});return;}returnFocus=document.activeElement;lockBody();try{dialog.showModal();}catch(error){unlockBody();throw error;}state='ready';reset();updateBest();setMessage('小恐龙，准备出发。','越跑越快，160 分后会遇到空中小怪物。遇到它时留在地面，别跳起来。');updateControls();resize();resizeObserver.observe(canvas);}
  window.IncloingDino=Object.freeze({open});
})();
