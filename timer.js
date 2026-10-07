/* Chrono de repos (cahier des charges §3, refondu le 03/10/2026).

   Principe : on ne compte pas les secondes une à une, on note l'heure de départ et on calcule l'écart.
   Le chrono reste donc juste même si l'écran se met en veille ou si l'onglet est rechargé
   (l'état vit dans la séance en cours, sauvegardée dans le navigateur).

   live.repos          : repos en cours { start_ts, depart: "tap" | "validation", validee, cible: [min, max] | null }
                          validee = la série qui vient de finir a déjà été saisie.
   live.reposEnAttente : repos terminé { sec, precision }, accroché à la prochaine série validée.

   Précision enregistrée sur la série :
   - exact          : « Série finie » puis « Je repars » ;
   - depart_tardif  : « Série finie » oublié, départ pris à la validation de la série d'avant ;
   - approximatif   : « Je repars » oublié, la durée inclut la série elle-même. */

const Repos = {
  serieFinie(live, cible) {
    const now = Date.now();
    if (live.repos && live.repos.validee) {
      live.reposEnAttente = { sec: Math.round((now - live.repos.start_ts) / 1000), precision: "approximatif" };
    }
    live.repos = { start_ts: now, depart: "tap", validee: false, cible };
  },

  jeRepars(live) {
    if (!live.repos) return;
    const sec = Math.round((Date.now() - live.repos.start_ts) / 1000);
    live.reposEnAttente = { sec, precision: live.repos.depart === "tap" ? "exact" : "depart_tardif" };
    live.repos = null;
  },

  /* Appelé à chaque série validée : accroche le repos qui la précède et relance le chrono si besoin. */
  onValidation(live, serie, cible) {
    const now = Date.now();
    if (live.reposEnAttente) {
      serie.repos_avant_sec = live.reposEnAttente.sec;
      serie.repos_precision = live.reposEnAttente.precision;
      live.reposEnAttente = null;
    }
    if (live.repos && !live.repos.validee) {
      live.repos.validee = true;
      live.repos.cible = cible;
      return;
    }
    if (live.repos && live.repos.validee && serie.repos_avant_sec == null) {
      serie.repos_avant_sec = Math.round((now - live.repos.start_ts) / 1000);
      serie.repos_precision = "approximatif";
    }
    live.repos = { start_ts: now, depart: "validation", validee: true, cible };
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
