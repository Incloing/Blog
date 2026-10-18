/* The GitHub mirror reads public live data from the same backend. No private token. */
(() => {
 const mirror=location.hostname==='incloing.github.io'&&location.pathname.startsWith('/Blog/'),origin=mirror?'https://incloing-blog.pages.dev':location.origin;
 window.IncloingRuntime=Object.freeze({mirror,api:path=>new URL(path,origin).href,content:()=>mirror?origin+'/content/posts.json':'./content/posts.json',upload:path=>mirror?new URL('/'+path,origin).href:null});
})();
