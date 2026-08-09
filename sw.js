const CACHE='academic-cat-v66-offline-first-20260809';
const CORE=[
  './','./index.html','./manifest.webmanifest',
  './apple-touch-icon.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./icon-master-1024.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const req=event.request;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(req,{ignoreSearch:true});

    // App shell uses cache-first. When online, refresh the cache in the background.
    if(cached){
      event.waitUntil(fetch(req).then(res=>{
        if(res&&res.ok) return cache.put(req,res.clone());
      }).catch(()=>{}));
      return cached;
    }

    try{
      const fresh=await fetch(req);
      if(fresh&&fresh.ok) cache.put(req,fresh.clone());
      return fresh;
    }catch(e){
      if(req.mode==='navigate') return (await cache.match('./index.html')) || (await cache.match('./'));
      throw e;
    }
  })());
});
