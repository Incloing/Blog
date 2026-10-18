(() => {
 'use strict';
 const BIRD_SCORE=160;
 const speedAt=seconds=>230+160*Math.log1p(Math.max(0,seconds)/30);
 function bounds(obstacle,ground,time){const top=obstacle.type==='bird'?ground-102+Math.sin(time*11+(obstacle.phase||0))*4:ground-obstacle.height;return {left:obstacle.x+5,right:obstacle.x+obstacle.width-5,top:top+4,bottom:top+obstacle.height-3};}
 function collides(player,obstacle,ground,time,ducking=false){const height=ducking&&player.bottom>=ground-.5?32:51,a={left:player.x+5,right:player.x+35,top:player.bottom-height,bottom:player.bottom-3},b=bounds(obstacle,ground,time);return a.right>b.left&&a.left<b.right&&a.bottom>b.top&&a.top<b.bottom;}
 function spawn(score,worldWidth,random=Math.random){const bird=score>=BIRD_SCORE&&random()<.42,type=bird?'bird':random()<.6?'plant':'rock';return {type,x:worldWidth+30,width:bird?46:type==='plant'?25+random()*9:32+random()*11,height:bird?28:type==='plant'?34+random()*17:24+random()*10,phase:random()*Math.PI*2};}
 window.IncloingDinoPhysics=Object.freeze({BIRD_SCORE,speedAt,bounds,collides,spawn});
})();
