/* Chrono de repos (refondu le 03/10/2026, simplifié le 11/10/2026).

   Principe : on ne compte pas les secondes une à une, on note l'heure de départ et on calcule l'écart.
   Le chrono reste donc juste même si l'écran se met en veille ou si l'onglet est rechargé
   (l'état vit dans la séance en cours, sauvegardée dans le navigateur).

   Depuis le 11/10 : rien n'est plus enregistré (Alix : la saisie « Série finie / Je repars » demandait trop
   de rigueur pour des chiffres imprécis) ; le chrono n'est qu'un repère avec bips. Les séries archivées
   avant gardent leur `repos_avant_sec`.
   - Bouton « Lancer le repos », à la fin de la série : le chrono part tout de suite, et continue pendant
     qu'on note la série (la validation ne le relance pas, elle ajuste juste la cible).
   - Bouton oublié : le chrono part à la validation de la série, en repli.

   live.repos : repos en cours { start_ts, cible: [min, max] | null, prebip, attente_validation } */

const Repos = {
  lancer(live, cible) {
    live.repos = { start_ts: Date.now(), cible, prebip: false, attente_validation: true };
    live.reposEnAttente = null;
  },

  onValidation(live, cible) {
    if (live.repos && live.repos.attente_validation) {
      live.repos.attente_validation = false;
      live.repos.cible = cible;
      return;
    }
    live.repos = { start_ts: Date.now(), cible, prebip: false, attente_validation: false };
    live.reposEnAttente = null;
  },

  arreter(live) {
    live.repos = null;
    live.reposEnAttente = null;
  },

  /* État affichable : écoulé, restant (négatif après zéro), phase pour la couleur. */
  etat(live) {
    if (!live || !live.repos) return null;
    const ecoule = (Date.now() - live.repos.start_ts) / 1000;
    const cible = live.repos.cible;
    if (!cible) return { ecoule, restant: null, phase: "libre", cible };
    const restant = cible[0] - ecoule;
    const phase = restant > 0 ? "decompte" : ecoule <= cible[1] ? "pret" : "depasse";
    return { ecoule, restant, phase, cible };
  },
};

/* Repos après un échauffement (plan Trail, rampe de montée, proposition [P]) : ~45-60 s après une série
   légère, ~60-90 s après la dernière, la plus proche du poids de travail. Jamais les 2-4 min du travail. */
const REPOS_ECH_LEGER = [45, 60];
const REPOS_ECH_DERNIER = [60, 90];

/* Cible de repos après une série : échauffement, entre les deux côtés (unilatéral, tour pas fini) ou entre les tours. */
function cibleRepos(exo, seriesApres) {
  if (!exo) return null;
  const derniere = seriesApres[seriesApres.length - 1];
  if (derniere && derniere.echauffement) {
    const ech = seriesApres.filter((s) => s.echauffement);
    if (exo.unilateral) {
      const g = ech.filter((s) => s.cote === "G").length, d = ech.filter((s) => s.cote === "D").length;
      if (g !== d) return exo.repos_cotes_sec ? range(exo.repos_cotes_sec) : null;
    }
    const prevues = (exo.rampe_series || []).length;
    const faites = exo.unilateral ? ech.filter((s) => s.cote === derniere.cote).length : ech.length;
    return faites < prevues ? REPOS_ECH_LEGER : REPOS_ECH_DERNIER;
  }
  if (exo.unilateral) {
    const travail = seriesApres.filter((s) => !s.echauffement);
    const g = travail.filter((s) => s.cote === "G").length;
    const d = travail.filter((s) => s.cote === "D").length;
    if (g !== d) return exo.repos_cotes_sec ? range(exo.repos_cotes_sec) : null;
  }
  return range(exo.repos_sec);
}

/* Garder l'écran allumé pendant la séance (API Wake Lock, gérée par Firefox et Chrome).
   Le navigateur relâche le verrou quand l'onglet passe en arrière-plan : on le reprend au retour. */
const Ecran = {
  verrou: null,
  supporte() { return "wakeLock" in navigator; },
  voulu() { return lsGet("muscu:ecran_allume", true); },
  setVoulu(v) { lsSet("muscu:ecran_allume", v); v ? this.activer() : this.relacher(); },
  async activer() {
    if (!this.supporte() || !this.voulu() || this.verrou) return;
    try {
      this.verrou = await navigator.wakeLock.request("screen");
      this.verrou.addEventListener("release", () => { this.verrou = null; });
    } catch (err) {
      this.verrou = null;
    }
  },
  relacher() {
    if (this.verrou) this.verrou.release();
    this.verrou = null;
  },
};

if (typeof module !== "undefined") module.exports = { Repos, cibleRepos, REPOS_ECH_LEGER, REPOS_ECH_DERNIER };
