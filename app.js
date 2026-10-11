/* Démarrage : l'app s'ouvre sans attendre Google. Si une séance était en cours (onglet rechargé,
   téléphone redémarré…), on y retourne directement (C7). */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => console.error("Service worker : ", err));
  });
}

/* Corrections ponctuelles de séances enregistrées, demandées par Alix (voir journal de bord).
   Appliquées une seule fois sur l'appareil qui a la séance ; Drive suit à la synchronisation suivante. */
const CORRECTIONS_SEANCES = [
  /* Séance du 10/10/2026 enregistrée au 09/10 (app ouverte la veille) ; durée faussée (1448 min), réelle inconnue. */
  { ancien: "2026-10-09-FONDATION", date: "2026-10-10", modifs: { duree_min: null } },
];
CORRECTIONS_SEANCES.forEach((c) => Store.redaterArchive(c.ancien, c.date, c.modifs));
/* 10/10/2026 : durée de la montre (59 min, Alix) et erreur de dictée dans le commentaire du mollet tendu. */
Store.corrigerArchive("2026-10-10-duree-commentaire", "2026-10-10-FONDATION", (a) => {
  a.duree_min = 59;
  a.exos.forEach((x) => { if (x.commentaire) x.commentaire = x.commentaire.replace("ça passe mais trop mal", "ça passe pas trop mal"); });
});

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
/* Une séance en cours d'un autre jour ne se rouvre pas toute seule : l'accueil demande quoi en faire. */
const enCours = Store.getSeanceLive();
if (enCours && enCours.date === localDate()) allerA(ouvrirSeance);
else renderAccueil();
