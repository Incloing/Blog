/* Soft, recognisable leaves, drifting and turning without blocking the page. */
(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),canvas=document.createElement('canvas');
 canvas.className='ambient-leaves';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return;}
 const palette=[['#a5b28d','#c9cfa6'],['#c6ac7e','#e0d0a8'],['#c3ab97','#dfc9b2']];
 let width=0,height=0,frame=0,last=0,leaves=[],elapsed=0;
 function resize(){
  width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  const count=width<700?18:Math.min(34,Math.max(26,Math.round(width*height/45000)));
  leaves=Array.from({length:count},()=>({x:Math.random()*width,y:Math.random()*height,size:13+Math.random()*11,speed:22+Math.random()*23,phase:Math.random()*Math.PI*2,turn:Math.random()*6,sway:12+Math.random()*22,opacity:.25+Math.random()*.1,colors:palette[Math.floor(Math.random()*palette.length)]}));
 }
 function tick(time){
  if(time-last<33){frame=requestAnimationFrame(tick);return;}
  const dt=Math.min((time-last)/1000,.08);last=time;elapsed+=dt;ctx.clearRect(0,0,width,height);
  for(const leaf of leaves){
   leaf.y+=leaf.speed*dt;leaf.x+=6*dt;leaf.turn+=dt*.16;
   if(leaf.y>height+55){leaf.y=-55;leaf.x=Math.random()*width;}
   if(leaf.x>width+55)leaf.x=-55;
   const size=leaf.size;
   ctx.save();ctx.translate(leaf.x+Math.sin(elapsed*.65+leaf.phase)*leaf.sway,leaf.y);ctx.rotate(leaf.turn+Math.sin(elapsed*.8+leaf.phase)*.55);ctx.scale(.68+Math.abs(Math.cos(elapsed*.5+leaf.phase))*.32,1);
   ctx.globalAlpha=leaf.opacity;
   const color=ctx.createLinearGradient(-size*.5,-size,size*.5,size);color.addColorStop(0,leaf.colors[0]);color.addColorStop(1,leaf.colors[1]);ctx.fillStyle=color;
   ctx.beginPath();ctx.moveTo(0,-size);ctx.bezierCurveTo(size*.9,-size*.25,size*.75,size*.55,0,size);ctx.bezierCurveTo(-size*.75,size*.55,-size*.8,-size*.3,0,-size);ctx.fill();
   ctx.strokeStyle='#748166';ctx.lineWidth=.7;ctx.globalAlpha=leaf.opacity*.65;ctx.lineCap='round';
   ctx.beginPath();ctx.moveTo(0,size*1.18);ctx.quadraticCurveTo(-size*.12,0,0,-size*.9);
   for(const y of [-.35,.05,.4]){ctx.moveTo(-size*.025,size*y);ctx.lineTo(size*.4,size*(y-.21));ctx.moveTo(-size*.025,size*y);ctx.lineTo(-size*.35,size*(y-.22));}
   ctx.stroke();ctx.restore();
  }
  frame=requestAnimationFrame(tick);
 }
 function resume(){cancelAnimationFrame(frame);canvas.hidden=reduced.matches;if(!document.hidden&&!reduced.matches){last=performance.now();frame=requestAnimationFrame(tick);}}
 addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);resize();resume();
})();
