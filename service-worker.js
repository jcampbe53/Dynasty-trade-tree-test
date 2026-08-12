const CACHE="dynasty-trade-tree-v1.5.2.1";
const CORE=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];

self.addEventListener("install",event=>{
 self.skipWaiting();
 event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(CORE)).catch(()=>{})
 );
});

self.addEventListener("activate",event=>{
 event.waitUntil(
  caches.keys()
   .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
   .then(()=>self.clients.claim())
 );
});

self.addEventListener("message",event=>{
 if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting();
});

self.addEventListener("fetch",event=>{
 const url=event.request.url;

 // Never intercept live external data calls.
 if(
  url.startsWith("https://api.sleeper.app/") ||
  url.startsWith("https://api.github.com/") ||
  url.startsWith("https://raw.githubusercontent.com/")
 ) return;

 // Navigation/app shell: NETWORK FIRST.
 // This is the key fix for installed iPhone PWAs sticking to an old index.html.
 if(event.request.mode==="navigate"){
  event.respondWith(
   fetch(event.request,{cache:"no-store"})
    .then(resp=>{
     const copy=resp.clone();
     caches.open(CACHE).then(c=>c.put("./index.html",copy)).catch(()=>{});
     return resp;
    })
    .catch(()=>caches.match("./index.html"))
  );
  return;
 }

 // Static assets: cache first, then network.
 event.respondWith(
  caches.match(event.request).then(cached=>{
   if(cached)return cached;
   return fetch(event.request).then(resp=>{
    const copy=resp.clone();
    caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{});
    return resp;
   });
  })
 );
});
