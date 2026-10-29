/* OTC早見手帳 オフライン対応 */
const C='otc-techo-2026.10.29a';
const CORE=['./','./index.html','./data.json','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.searchParams.has('fresh'))return; // 更新確認はネットから直接
  if(u.origin===location.origin){
    // 保存済みのものをすぐ表示し、裏で新しいものに入れ替える（次に開いたときに反映）
    e.respondWith(caches.open(C).then(async c=>{
      const hit=await c.match(r,{ignoreSearch:true})||(r.mode==='navigate'?await c.match('./index.html'):null);
      const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>null);
      if(hit){e.waitUntil(net);return hit}
      return(await net)||new Response('オフラインです',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }));
  }else if(/fonts\.(googleapis|gstatic)\.com$/.test(u.host)){
    e.respondWith(caches.open(C).then(async c=>{const hit=await c.match(r);if(hit)return hit;try{const res=await fetch(r);if(res.ok||res.type==='opaque')c.put(r,res.clone());return res}catch(err){return new Response('',{status:504})}}));
  }
});
