const CACHE='academic-cat-v682-long-term-storage';
const ASSETS=['./','./index.html','./app-core.js','./v68.js','./v68.css','./analytics-worker.js','./image-worker.js','./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
async function staleWhileRevalidate(req){const cache=await caches.open(CACHE),cached=await cache.match(req);const network=fetch(req).then(r=>{if(r&&r.ok)cache.put(req,r.clone());return r}).catch(()=>null);return cached||await network||null}
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith((async()=>{if(e.request.mode==='navigate'){const cached=await caches.match('./index.html');const network=fetch(e.request).then(r=>{if(r&&r.ok)caches.open(CACHE).then(c=>c.put('./index.html',r.clone()));return r}).catch(()=>null);return cached||await network||new Response('Offline',{status:503})}const r=await staleWhileRevalidate(e.request);return r||Response.error()})())});
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting()});
