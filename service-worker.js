const CACHE_NAME = "journal-muscu-v18";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
  "./style.css",
  "./data.js",
  "./historique-ancien.js",
  "./historique.js",
  "./timer.js",
  "./resume.js",
  "./drive.js",
  "./store.js",
  "./ui.js",
  "./app.js",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) return;
  /* « no-cache » : toujours redemander au serveur s'il y a plus récent (GitHub Pages garde sinon 10 min de cache),
     le cache local ne sert qu'en cas d'absence de réseau. */
  event.respondWith(
    fetch(event.request, { cache: "no-cache" })
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
