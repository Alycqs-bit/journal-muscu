/* Démarrage : l'app s'ouvre sans attendre Google. Si une séance était en cours (onglet rechargé,
   téléphone redémarré…), on y retourne directement (C7). */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => console.error("Service worker : ", err));
  });
}

$("repos-btn").addEventListener("click", onReposBtn);
setInterval(tick, 250);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && vue === "seance") {
    Ecran.activer();
    tick();
  }
});

DriveAuth.init(() => { if (vue === "accueil") renderAccueil(); });

history.replaceState(null, "", location.pathname);
if (Store.getSeanceLive()) allerA(ouvrirSeance);
else renderAccueil();
