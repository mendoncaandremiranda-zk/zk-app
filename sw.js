/* Chácara ZK — service worker.
   Estratégia: REDE PRIMEIRO (online sempre vê a versão atual), cache como reserva (offline abre o app).
   Dados do Supabase nunca passam pelo cache — offline, o app usa o snapshot local da última posição. */
const CACHE = "zk-shell-v1";
const CDN_OK = ["cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  if (u.hostname.endsWith(".supabase.co")) return; // dados e auth: sempre rede
  e.respondWith((async () => {
    try {
      const r = await fetch(e.request);
      if (r && r.ok && (u.origin === self.location.origin || CDN_OK.includes(u.hostname))) {
        const c = await caches.open(CACHE);
        c.put(e.request, r.clone());
      }
      return r;
    } catch (err) {
      const hit = await caches.match(e.request, { ignoreSearch: u.origin === self.location.origin });
      if (hit) return hit;
      throw err;
    }
  })());
});
