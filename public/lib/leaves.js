/* Quiet ambient leaves: a small canvas, paused when hidden or motion is reduced. */
(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),canvas=document.createElement('canvas');
 canvas.className='ambient-leaves';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return;}
 let width=0,height=0,frame=0,last=0,leaves=[];
 function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);leaves=Array.from({length:width<700?6:10},()=>({x:Math.random()*width,y:Math.random()*height,size:4+Math.random()*4,speed:9+Math.random()*12,phase:Math.random()*Math.PI*2,turn:Math.random()*6,color:Math.random()>.5?'#889d7b':'#b5a17f'}));}
 function tick(time){
  if(time-last<33){frame=requestAnimationFrame(tick);return;}
  const dt=Math.min((time-last)/1000,.08);last=time;ctx.clearRect(0,0,width,height);
  for(const leaf of leaves){
   leaf.y+=leaf.speed*dt;leaf.x+=Math.sin(time/4300+leaf.phase)*5*dt;leaf.turn+=dt*.12;
   if(leaf.y>height+20){leaf.y=-20;leaf.x=Math.random()*width;}
   ctx.save();ctx.translate(leaf.x,leaf.y);ctx.rotate(leaf.turn+Math.sin(time/3100+leaf.phase)*.5);ctx.scale(.45+Math.abs(Math.cos(time/5300+leaf.phase))*.55,1);
   ctx.globalAlpha=.16;ctx.fillStyle=leaf.color;ctx.beginPath();ctx.moveTo(0,-leaf.size);ctx.bezierCurveTo(leaf.size,0,leaf.size*.6,leaf.size*.9,0,leaf.size);ctx.bezierCurveTo(-leaf.size*.6,leaf.size*.2,-leaf.size*.7,-leaf.size*.5,0,-leaf.size);ctx.fill();ctx.restore();
  }
  frame=requestAnimationFrame(tick);
 }
 function resume(){cancelAnimationFrame(frame);canvas.hidden=reduced.matches;if(!document.hidden&&!reduced.matches){last=performance.now();frame=requestAnimationFrame(tick);}}
 addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);resize();resume();
})();
