/* Original short lines. Persist the next position so revisits do not repeat. */
(() => {
 'use strict';
 const lines=[
 '风把远方，\n轻轻放在窗前。','把日子写成诗，\n把好奇留给明天。','山河慢慢走，\n故事慢慢收。','今天的风，\n也经过了你的梦。','在平凡的日子里，\n收藏一点闪光。',
 '让心事发芽，\n让时间开花。','沿着微光，\n走向自己的远方。','把脚步放轻，\n听见生活的回声。','云有云的去处，\n我有我的小路。','此刻不必匆忙，\n春天正在路上。',
 '把一页空白，\n交给今天的自己。','灯火可亲，\n人间值得慢行。','日落之前，\n再拥抱一次好奇。','愿每次出发，\n都带一点天真。','在风里读书，\n在雨里听梦。',
 '路过一朵云，\n留下一行字。','给生活留白，\n给热爱留灯。','慢慢生长，\n也慢慢靠近理想。','把昨天折好，\n翻开新的清晨。','光落在书页上，\n也落在心里。',
 '以好奇作舟，\n以日常为岸。','山野有回声，\n心里有答案。','星星还未到场，\n黄昏已很温柔。','走过的每一步，\n都会长成故事。','不妨把今天，\n过成一封来信。',
 '风停的时候，\n听见自己生长。','心里有一片海，\n日子便有潮汐。','把小小的发现，\n写给未来的我。','等一阵花香，\n也等一个灵感。','世界很大，\n先照亮这一页。',
 '在自己的时区，\n慢慢抵达。','让清晨有盼头，\n让夜晚有归处。','用一颗柔软的心，\n记录坚实的生活。','把生活的碎片，\n拼成喜欢的模样。','远山是一封信，\n风替它写落款。',
 '借一点月光，\n照亮未完成的梦。','一页一页翻过，\n一程一程长大。','把心放晴，\n等风带来消息。','日子不必发光，\n热爱自有回响。','在细小的事里，\n看见辽阔。',
 '愿手中的笔，\n接住途中的光。','一边探索世界，\n一边认识自己。','给灵感一扇窗，\n给勇气一条路。','人生这本书，\n今天再添一页。','把夏天的风，\n藏进冬天的信。',
 '花会慢慢开，\n我会慢慢来。','不用追赶所有风，\n认准自己的方向。','夜色很深，\n心里的灯还亮着。','愿平常的今天，\n有不寻常的欣喜。','走得再慢，\n也在走向远方。',
 '和世界轻轻碰面，\n和自己好好相处。','在漫长的路上，\n做一个有趣的人。','把偶然的相遇，\n写成温柔的章节。','今天也要记得，\n抬头看看天空。','让热爱落地，\n让想象远行。',
 '晨光替我起笔，\n晚风替我收尾。','读几行文字，\n走一段自己的路。','把迷路的心情，\n带回生活的小院。','愿每一份认真，\n都长出新的枝叶。','雨落在窗外，\n故事落在纸上。',
 '听风经过树林，\n看梦经过日常。','把今天的疑问，\n交给明天的探索。','愿眼里有远山，\n心中有小小花园。','故事还长，\n我们慢慢写。','不必每刻精彩，\n此刻自在就好。',
 '在时间的河边，\n捡拾闪光的石头。','小小的坚持，\n也能走出很远。','生活有时安静，\n安静也有风景。','把一瞬的心动，\n留成一页永远。','世界递来问题，\n我用好奇作答。',
 '愿所有微小，\n都被温柔看见。','在新的清晨，\n重新爱上出发。','把脚印留给路，\n把回忆留给自己。','让文字做一扇门，\n通向心里的旷野。','云走得很慢，\n刚好够我做个梦。',
 '慢一点没关系，\n花也有自己的花期。','把今天过好，\n就是给未来的礼物。','愿灵感像风，\n总有一次经过。','心中自有四季，\n眼前皆是新意。','和一页纸相遇，\n和一个念头同行。',
 '沿着热爱的方向，\n看更多的风景。','给忙碌一个逗号，\n给自己一次呼吸。','愿你来时有风，\n停留时有温暖。','在细碎的光里，\n认出生活的颜色。','一场雨会停，\n一朵云会散开。',
 '把梦种在今天，\n等时间轻轻浇灌。','山海终会相见，\n故事总有续篇。','用文字收藏此刻，\n用脚步丈量远方。','愿这片小天地，\n装得下大大的好奇。','风吹过的地方，\n也许正有新的答案。',
 '把心里的星星，\n一颗颗写下来。','愿普通的一天，\n值得认真纪念。','于无声处阅读，\n在日常中远行。','今天的每个念头，\n都是明天的种子。','一朵花的时间，\n也足够发生美好。',
 '把未说完的话，\n留给下次相见。','穿过琐碎日常，\n仍然相信明亮。','带着一点笨拙，\n认真地喜欢世界。','给过去一个微笑，\n给明天一点期待。','这一页有你，\n便多了一点温度。'
 ];
 let next=Math.floor(Math.random()*lines.length),timer=0;
 try{const stored=Number(localStorage.getItem('incloing-poem-next-v1'));if(Number.isInteger(stored)&&stored>=0)next=stored%lines.length;}catch{}
 function choose(){const text=lines[next];next=(next+1)%lines.length;try{localStorage.setItem('incloing-poem-next-v1',String(next));}catch{}return text;}
 function stop(){clearTimeout(timer);timer=0;}
 function start(target,valid){
  stop();if(!target)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),heading=target.closest('.poem');
  function active(){return target.isConnected&&valid();}
  function show(){if(!active())return;const text=choose(),chars=Array.from(text);let index=0;heading.setAttribute('aria-label',text.replace('\n','，'));heading.classList.remove('done');
   if(reduced.matches){target.textContent=text;timer=setTimeout(cycle,5000);return;}
   const began=performance.now();function type(){if(!active())return;target.textContent=chars.slice(0,index++).join('');if(index<=chars.length)timer=setTimeout(type,chars[index-1]==='\n'?110:58);else timer=setTimeout(cycle,Math.max(300,5000-(performance.now()-began)-(chars.length*29+180)));}type();
  }
  function cycle(){if(!active())return;if(document.hidden||document.querySelector('dialog[open]')){timer=setTimeout(cycle,500);return;}
   if(reduced.matches){show();return;}const chars=Array.from(target.textContent);function erase(){if(!active())return;chars.pop();target.textContent=chars.join('');if(chars.length)timer=setTimeout(erase,29);else timer=setTimeout(show,180);}erase();
  }show();
 }
 window.IncloingPoems=Object.freeze({start,stop,count:lines.length});
})();
