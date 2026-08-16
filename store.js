/* Données de départ extraites des vraies séances Drive (11/08, 29/07 BM ; 13/08, 17/07 HM).
   Duree_min absente des notes sources -> laissee a null plutot qu'inventee (R1). */

const SEED_LIBRARY = {
  gastro_smith: { id: "gastro_smith", nom: "Gastrocnémiens Smith machine", groupe: "mollets", type_mesure: "reps_charge", charge_inversee: false, reglages: "lent, 1\" iso", cible_series: 4, cible_reps: [8, 10], repos_sec: 105, consignes: "éliminer le coup de cul" },
  soleaire: { id: "soleaire", nom: "Soléaire", groupe: "mollets", type_mesure: "reps_charge", charge_inversee: false, reglages: "lent 1\" iso (variante : 2\" exc / 1\" pause / 1\" conc)", cible_series: 4, cible_reps: [15, 20], repos_sec: 105, consignes: "" },
  hip_thrust: { id: "hip_thrust", nom: "Hip Thrust", groupe: "fessiers", type_mesure: "reps_charge", charge_inversee: false, reglages: "2\" iso", cible_series: 4, cible_reps: [8, 12], repos_sec: 105, consignes: "" },
  leg_curl: { id: "leg_curl", nom: "Leg Curl couché", groupe: "ischios", type_mesure: "reps_charge", charge_inversee: false, reglages: "boudin 3", cible_series: 4, cible_reps: [10, 12], repos_sec: 90, consignes: "" },
  presse_45: { id: "presse_45", nom: "Presse 45°", groupe: "quadriceps", type_mesure: "reps_charge", charge_inversee: false, reglages: "charge lourde", cible_series: 4, cible_reps: [5, 8], repos_sec: 165, consignes: "souvent sautée mi-2026 (neuro/saison course) — surveiller si le motif revient ≥3 fois" },
  leg_ext: { id: "leg_ext", nom: "Leg Extension", groupe: "quadriceps", type_mesure: "reps_charge", charge_inversee: false, reglages: "siège 4, boudin bas 5, freinage excentrique 4\"", cible_series: 4, cible_reps: [8, 10], repos_sec: 90, consignes: "" },
  abducteurs: { id: "abducteurs", nom: "Abducteurs", groupe: "hanches", type_mesure: "reps_charge", charge_inversee: false, reglages: "1\" iso", cible_series: 3, cible_reps: [12, 15], repos_sec: 75, consignes: "" },
  adducteurs: { id: "adducteurs", nom: "Adducteurs", groupe: "hanches", type_mesure: "reps_charge", charge_inversee: false, reglages: "réglage 7, 1\" iso", cible_series: 3, cible_reps: [12, 15], repos_sec: 75, consignes: "" },
  tirage_horizontal: { id: "tirage_horizontal", nom: "Tirage horizontal (poulie basse)", groupe: "dos", type_mesure: "reps_charge", charge_inversee: false, reglages: "", cible_series: 2, cible_reps: [8, 12], repos_sec: 90, consignes: "passé à 2 séries, on ne vise pas la progression" },
  tractions_assistees: { id: "tractions_assistees", nom: "Tractions assistées", groupe: "dos", type_mesure: "reps_charge", charge_inversee: true, reglages: "", cible_series: 2, cible_reps: [8, 12], repos_sec: 90, consignes: "charge inversée : baisser la charge = progresser" },
  developpe_militaire: { id: "developpe_militaire", nom: "Développé militaire (overhead press)", groupe: "épaules", type_mesure: "reps_charge", charge_inversee: false, reglages: "", cible_series: 2, cible_reps: [8, 12], repos_sec: 90, consignes: "" },
  triceps_poulie: { id: "triceps_poulie", nom: "Extensions triceps poulie haute", groupe: "triceps", type_mesure: "reps_charge", charge_inversee: false, reglages: "", cible_series: 3, cible_reps: [10, 15], repos_sec: 75, consignes: "" },
  hammer_strength: { id: "hammer_strength", nom: "Hammer Strength", groupe: "pectoraux", type_mesure: "reps_charge", charge_inversee: false, reglages: "", cible_series: 3, cible_reps: [10, 15], repos_sec: 60, consignes: "" },
  pallof_press: { id: "pallof_press", nom: "Pallof press debout", groupe: "tronc", type_mesure: "reps_charge", charge_inversee: false, reglages: "stabilité rotatoire, niveau 22", cible_series: 3, cible_reps: [10, 12], repos_sec: 60, consignes: "reps comptées par côté" },
  dead_hang: { id: "dead_hang", nom: "Dead hang", groupe: "poigne", type_mesure: "temps", charge_inversee: false, reglages: "", cible_series: 3, repos_sec: 45, consignes: "objectif : tenir le plus longtemps possible" },
  farmers: { id: "farmers", nom: "Farmer's walk", groupe: "poigne", type_mesure: "temps_charge", charge_inversee: false, reglages: "", cible_series: 3, cible_temps_sec: 45, repos_sec: 45, consignes: "durée fixe 45\" par série, la charge tenue (kg) est ce qu'on fait progresser" },
  curl_wrist: { id: "curl_wrist", nom: "Curl wrist", groupe: "avant-bras", type_mesure: "reps_charge", charge_inversee: false, reglages: "", cible_series: 2, cible_reps: [20, 20], repos_sec: 30, consignes: "" },
  curl_wrist_reverse: { id: "curl_wrist_reverse", nom: "Curl wrist reverse", groupe: "avant-bras", type_mesure: "reps_charge", charge_inversee: false, reglages: "", cible_series: 2, cible_reps: [20, 20], repos_sec: 30, consignes: "" },
  corde_a_sauter: { id: "corde_a_sauter", nom: "Pliométrie mollets (corde à sauter)", groupe: "mollets", type_mesure: "duree_libre", charge_inversee: false, reglages: "", cible_series: 3, cible_temps_sec: 30, repos_sec: 90, consignes: "apparue une fois (17/07), pas systématique — disponible en bibliothèque au besoin" },
};

const SEED_PROGRAMME = {
  BM: {
    id: "BM", nom: "Bas du corps + mollets", version: 7, date_maj: "2026-08-11",
    blocs: [
      { titre: "Mollets", exos: ["gastro_smith", "soleaire"] },
      { titre: "Chaîne principale", exos: ["hip_thrust", "leg_curl", "presse_45", "leg_ext"] },
      { titre: "Hanches", exos: ["abducteurs", "adducteurs"] },
      { titre: "Poigne A", exos: ["dead_hang", "farmers", "curl_wrist", "curl_wrist_reverse"] },
    ],
    echauffement: "Cardio 3-5' · PAP 1er exo : 10@50% / 5@75% / 2@90% · autres : 4-6 @60-70%",
  },
  HM: {
    id: "HM", nom: "Haut du corps + mollets", version: 1, date_maj: "2026-08-13",
    blocs: [
      { titre: "Mollets", exos: ["gastro_smith", "soleaire"] },
      { titre: "Push / Dos", exos: ["tirage_horizontal", "tractions_assistees", "developpe_militaire", "triceps_poulie", "hammer_strength"] },
      { titre: "Tronc", exos: ["pallof_press"] },
      { titre: "Poigne B", exos: ["dead_hang", "farmers", "curl_wrist", "curl_wrist_reverse"] },
    ],
    echauffement: "Cardio 3-5' · PAP 1er exo : 10@50% / 5@75% / 2@90% · autres : 4-6 @60-70%",
  },
};

const SEED_ARCHIVES = [
  {
    id: "2026-07-29-BM", date: "2026-07-29", modele: "BM", version_programme: null, duree_min: null,
    commentaire_seance: "séance chill avant le Montagnon", tags: ["avant_course"],
    exos: [
      { exo_id: "gastro_smith", statut: "fait", series: [{ reps: 8, charge: 55 }, { reps: 8, charge: 55 }], commentaire: "2 séries seulement, prépa Montagnon" },
      { exo_id: "soleaire", statut: "fait", series: [{ reps: 15, charge: 25 }, { reps: 15, charge: 25 }], commentaire: "" },
      { exo_id: "hip_thrust", statut: "fait", series: [{ reps: 10, charge: 45 }, { reps: 10, charge: 45 }], commentaire: "chill" },
      { exo_id: "leg_curl", statut: "fait", series: [{ reps: 10, charge: 37.5 }, { reps: 10, charge: 37.5 }], commentaire: "chill" },
      { exo_id: "presse_45", statut: "saute", series: [], commentaire: "supprimée pour l'été, neuro au repos, seul exo qu'il survolait" },
      { exo_id: "leg_ext", statut: "fait", series: [{ reps: 8, charge: 42.5 }, { reps: 8, charge: 42.5 }], commentaire: "chill" },
      { exo_id: "abducteurs", statut: "fait", series: [{ reps: 12, charge: 35 }, { reps: 12, charge: 35 }], commentaire: "chill" },
      { exo_id: "adducteurs", statut: "fait", series: [{ reps: 13, charge: 37.5 }, { reps: 13, charge: 37.5 }], commentaire: "chill" },
      { exo_id: "dead_hang", statut: "fait", series: [{ duree_sec: 120 }, { duree_sec: 60 }, { duree_sec: 43 }], commentaire: "objectif max" },
      { exo_id: "farmers", statut: "fait", series: [{ charge: 26 }, { charge: 26 }, { charge: 26 }], commentaire: "" },
      { exo_id: "curl_wrist", statut: "fait", series: [{ reps: 20, charge: 4 }, { reps: 20, charge: 4 }], commentaire: "" },
      { exo_id: "curl_wrist_reverse", statut: "fait", series: [{ reps: 20, charge: 3 }, { reps: 20, charge: 3 }], commentaire: "" },
    ],
  },
  {
    id: "2026-08-11-BM", date: "2026-08-11", modele: "BM", version_programme: 7, duree_min: null,
    commentaire_seance: "séance chill avant le Montagnon", tags: ["avant_course"],
    exos: [
      { exo_id: "gastro_smith", statut: "fait", series: [{ reps: 8, charge: 55 }, { reps: 8, charge: 55 }, { reps: 8, charge: 55 }, { reps: 8, charge: 55 }], commentaire: "" },
      { exo_id: "soleaire", statut: "fait", series: [{ reps: 15, charge: 25 }, { reps: 15, charge: 25 }, { reps: 15, charge: 20 }, { reps: 15, charge: 20 }], commentaire: "peut-être rester à 20kg pour valider les 20 reps" },
      { exo_id: "hip_thrust", statut: "fait", series: [{ reps: 10, charge: 45 }, { reps: 10, charge: 45 }, { reps: 10, charge: 40 }], commentaire: "avait oublié être passé à 2 séries en saison de course" },
      { exo_id: "leg_curl", statut: "fait", series: [{ reps: 12, charge: 37.5 }, { reps: 12, charge: 37.5 }], commentaire: "" },
      { exo_id: "presse_45", statut: "saute", series: [], commentaire: "supprimée pour l'été" },
      { exo_id: "leg_ext", statut: "fait", series: [{ reps: 10, charge: 42.5 }, { reps: 10, charge: 42.5 }], commentaire: "" },
      { exo_id: "abducteurs", statut: "partiel", series: [{ reps: 12, charge: 35 }], commentaire: "douleurs bizarres, pas en forme — arrêt avant la 2e série par précaution" },
      { exo_id: "adducteurs", statut: "fait", series: [{ reps: 12, charge: 35 }, { reps: 12, charge: 35 }], commentaire: "baisse de charge volontaire, pas en forme" },
      { exo_id: "dead_hang", statut: "fait", series: [{ duree_sec: 90 }, { duree_sec: 60 }, { duree_sec: 60 }], commentaire: "pas du tout envie ce jour-là" },
      { exo_id: "farmers", statut: "saute", series: [], commentaire: "flemme" },
      { exo_id: "curl_wrist", statut: "fait", series: [{ reps: 20, charge: 4 }, { reps: 20, charge: 4 }], commentaire: "" },
      { exo_id: "curl_wrist_reverse", statut: "fait", series: [{ reps: 20, charge: 3 }, { reps: 20, charge: 3 }], commentaire: "" },
    ],
  },
  {
    id: "2026-07-17-HM", date: "2026-07-17", modele: "HM", version_programme: null, duree_min: null,
    commentaire_seance: "", tags: [],
    exos: [
      { exo_id: "gastro_smith", statut: "fait", series: [{ reps: 9, charge: 55 }, { reps: 9, charge: 55 }, { reps: 9, charge: 55 }, { reps: 9, charge: 55 }], commentaire: "essayer d'éliminer le coup de cul" },
      { exo_id: "soleaire", statut: "fait", series: [{ reps: 16, charge: 25 }, { reps: 17, charge: 25 }, { reps: 17, charge: 25 }, { reps: 17, charge: 25 }], commentaire: "" },
      { exo_id: "tirage_horizontal", statut: "fait", series: [{ reps: 12, charge: 55 }, { reps: 9, charge: 55 }], commentaire: "tenue difficile en fin de série, redescendre à 50kg si ça persiste" },
      { exo_id: "tractions_assistees", statut: "fait", series: [{ reps: 12, charge: 28 }, { reps: 12, charge: 28 }], commentaire: "tester la progression à 21kg la prochaine fois" },
      { exo_id: "developpe_militaire", statut: "fait", series: [{ reps: 12, charge: 16 }, { reps: 12, charge: 16 }], commentaire: "" },
      { exo_id: "triceps_poulie", statut: "fait", series: [{ reps: 12, charge: 15 }, { reps: 14, charge: 15 }], commentaire: "" },
      { exo_id: "hammer_strength", statut: "fait", series: [{ reps: 15, charge: 10 }, { reps: 15, charge: 10 }], commentaire: "" },
      { exo_id: "pallof_press", statut: "fait", series: [{ charge: 15 }, { charge: 15 }], commentaire: "reps par côté non notées précisément ce jour-là" },
      { exo_id: "dead_hang", statut: "fait", series: [{ duree_sec: 90 }, { duree_sec: 60 }, { duree_sec: 60 }], commentaire: "" },
      { exo_id: "farmers", statut: "saute", series: [], commentaire: "pas le temps" },
      { exo_id: "curl_wrist", statut: "fait", series: [{ reps: 20, charge: 5 }, { reps: 20, charge: 5 }], commentaire: "" },
      { exo_id: "curl_wrist_reverse", statut: "fait", series: [{ reps: 20, charge: 3 }, { reps: 20, charge: 3 }], commentaire: "" },
    ],
  },
  {
    id: "2026-08-13-HM", date: "2026-08-13", modele: "HM", version_programme: 1, duree_min: null,
    commentaire_seance: "", tags: [],
    exos: [
      { exo_id: "gastro_smith", statut: "fait", series: [{ reps: 8, charge: 55 }, { reps: 8, charge: 55 }, { reps: 8, charge: 55 }, { reps: 8, charge: 55 }], commentaire: "chill" },
      { exo_id: "soleaire", statut: "fait", series: [{ reps: 17, charge: 20 }, { reps: 17, charge: 20 }, { reps: 15, charge: 20 }, { reps: 15, charge: 20 }], commentaire: "" },
      { exo_id: "tirage_horizontal", statut: "fait", series: [{ reps: 10, charge: 55 }, { reps: 10, charge: 55 }], commentaire: "mieux, bonne sensation dos" },
      { exo_id: "tractions_assistees", statut: "fait", series: [{ reps: 12, charge: 28 }, { reps: 12, charge: 28 }], commentaire: "tester la progression à 21kg la prochaine fois" },
      { exo_id: "developpe_militaire", statut: "fait", series: [{ reps: 12, charge: 16 }, { reps: 12, charge: 16 }], commentaire: "difficile" },
      { exo_id: "triceps_poulie", statut: "fait", series: [{ reps: 12, charge: 15 }, { reps: 12, charge: 15 }], commentaire: "difficile" },
      { exo_id: "hammer_strength", statut: "saute", series: [], commentaire: "pas le temps" },
      { exo_id: "pallof_press", statut: "saute", series: [], commentaire: "pas le temps" },
      { exo_id: "dead_hang", statut: "fait", series: [{ duree_sec: 75 }, { duree_sec: 75 }, { duree_sec: 38 }], commentaire: "explosion en fin de série" },
      { exo_id: "farmers", statut: "saute", series: [], commentaire: "pas le temps" },
      { exo_id: "curl_wrist", statut: "saute", series: [], commentaire: "pas le temps" },
      { exo_id: "curl_wrist_reverse", statut: "saute", series: [], commentaire: "pas le temps" },
    ],
  },
];

const LS_KEYS = { archives: "muscu:archives", live: "muscu:seance_live" };

function loadArchives() {
  const raw = localStorage.getItem(LS_KEYS.archives);
  return raw ? JSON.parse(raw) : SEED_ARCHIVES.slice();
}

function saveArchives(archives) {
  localStorage.setItem(LS_KEYS.archives, JSON.stringify(archives));
}

const Store = {
  getBibliotheque() {
    return SEED_LIBRARY;
  },
  getExo(id) {
    return SEED_LIBRARY[id];
  },
  getModele(id) {
    return SEED_PROGRAMME[id];
  },
  getArchives() {
    return loadArchives().sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  getDerniereArchive() {
    const archives = this.getArchives();
    return archives.length ? archives[0] : null;
  },
  prochainModele() {
    const derniere = this.getDerniereArchive();
    if (!derniere) return "BM";
    return derniere.modele === "BM" ? "HM" : "BM";
  },
  getPerfPassee(exoId, avantDate) {
    const archives = this.getArchives().filter((a) => !avantDate || a.date < avantDate);
    for (const arch of archives) {
      const entry = arch.exos.find((e) => e.exo_id === exoId && (e.statut === "fait" || e.statut === "partiel"));
      if (entry && entry.series.length) return { date: arch.date, series: entry.series };
    }
    return null;
  },
  getRecord(exoId) {
    const exo = this.getExo(exoId);
    const archives = this.getArchives();
    let best = null;
    for (const arch of archives) {
      const entry = arch.exos.find((e) => e.exo_id === exoId && (e.statut === "fait" || e.statut === "partiel"));
      if (!entry) continue;
      for (const s of entry.series) {
        if (!best) { best = s; continue; }
        best = isBetterSet(exo, s, best) ? s : best;
      }
    }
    return best;
  },
  demarrerSeance(modeleId) {
    const modele = this.getModele(modeleId);
    const today = new Date().toISOString().slice(0, 10);
    const live = {
      id: `${today}-${modeleId}`,
      date: today,
      modele: modeleId,
      version_programme: modele.version,
      debut_ts: Date.now(),
      commentaire_seance: "",
      tags: [],
      blocs: modele.blocs.map((b) => ({
        titre: b.titre,
        exos: b.exos.map((exoId, i) => ({ exo_id: exoId, statut: "a_faire", ordre_reel: i, series: [], commentaire: "" })),
      })),
    };
    this.saveSeanceLive(live);
    return live;
  },
  getSeanceLive() {
    const raw = localStorage.getItem(LS_KEYS.live);
    return raw ? JSON.parse(raw) : null;
  },
  saveSeanceLive(seance) {
    localStorage.setItem(LS_KEYS.live, JSON.stringify(seance));
  },
  clearSeanceLive() {
    localStorage.removeItem(LS_KEYS.live);
  },
  finaliserSeance(commentaire, tags) {
    const live = this.getSeanceLive();
    if (!live) return null;
    const dureeMin = Math.round((Date.now() - live.debut_ts) / 60000);
    const archive = {
      id: live.id,
      date: live.date,
      modele: live.modele,
      version_programme: live.version_programme,
      duree_min: dureeMin,
      commentaire_seance: commentaire,
      tags,
      exos: live.blocs.flatMap((b) =>
        b.exos.map((e) => ({ exo_id: e.exo_id, statut: e.statut === "a_faire" ? "saute" : e.statut, series: e.series, commentaire: e.commentaire }))
      ),
    };
    const archives = loadArchives();
    archives.push(archive);
    saveArchives(archives);
    this.clearSeanceLive();
    return archive;
  },
};

function isBetterSet(exo, candidate, current) {
  if (exo.type_mesure === "temps") {
    return (candidate.duree_sec || 0) > (current.duree_sec || 0);
  }
  if (exo.type_mesure === "temps_charge") {
    return (candidate.charge || 0) > (current.charge || 0);
  }
  if (exo.charge_inversee) {
    return (candidate.charge ?? Infinity) < (current.charge ?? Infinity);
  }
  return (candidate.charge || 0) > (current.charge || 0) || ((candidate.charge || 0) === (current.charge || 0) && (candidate.reps || 0) > (current.reps || 0));
}

function formatSeries(exo, series) {
  if (!series || !series.length) return "—";
  if (exo.type_mesure === "temps") {
    return series.map((s) => formatDuree(s.duree_sec)).join("/");
  }
  if (exo.type_mesure === "temps_charge") {
    const groups = groupIdentical(series.map((s) => `${s.charge}kg`));
    return groups.join(" / ");
  }
  const groups = groupIdentical(series.map((s) => (s.reps != null ? `${s.reps}x${s.charge}kg` : `${s.charge}kg`)));
  return groups.join(" / ");
}

function groupIdentical(labels) {
  const out = [];
  let i = 0;
  while (i < labels.length) {
    let count = 1;
    while (i + count < labels.length && labels[i + count] === labels[i]) count++;
    out.push(count > 1 ? `${count}x${labels[i]}` : labels[i]);
    i += count;
  }
  return out;
}

function formatDuree(sec) {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}'${String(s).padStart(2, "0")}"` : `${s}"`;
}
