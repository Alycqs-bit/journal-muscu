/* Stockage et calculs. Deux sources d'archives :
   - HISTORIQUE (historique.js) : séances importées, en lecture seule ;
   - le stockage du navigateur (localStorage) : séances enregistrées par l'app.
   La séance en cours est sauvegardée à chaque action (C7) : un rechargement de l'onglet ne perd rien. */

const LS_KEYS = {
  archives: "muscu:archives_app",
  live: "muscu:seance_live",
  outbox: "muscu:outbox",
};

function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { console.error("localStorage :", err); }
}

function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* Fourchette [min, max] quel que soit le format d'origine (les anciens exos ont des nombres seuls). */
function range(v) {
  if (v == null) return null;
  return Array.isArray(v) ? v : [v, v];
}

function formatRange(r, fmt) {
  if (!r) return "";
  return r[0] === r[1] ? fmt(r[0]) : `${fmt(r[0])}-${fmt(r[1])}`;
}

const Store = {
  /* ---------- Programme ---------- */
  getExo(id) {
    const exo = LIBRARY[id];
    if (!exo) return { id, nom: id, type_mesure: "reps_charge", unite: "kg", pas_charge: [1, 2.5], inconnu: true };
    return Object.assign({ id, unite: "kg", pas_charge: [1, 2.5] }, exo);
  },
  getModele(id) {
    return PROGRAMME[id] || { id, nom: id, blocs: [] };
  },
  getModelesActifs() {
    return Object.values(PROGRAMME).filter((m) => m.actif);
  },

  /* ---------- Archives ---------- */
  getArchivesApp() {
    return lsGet(LS_KEYS.archives, []);
  },
  getArchives() {
    const byId = {};
    for (const a of HISTORIQUE_ANCIEN) byId[a.id] = a;
    for (const a of HISTORIQUE) byId[a.id] = a;
    for (const a of this.getArchivesApp()) byId[a.id] = a;
    /* Plus récent d'abord. Même jour : l'id le plus long/grand passe devant (2e séance du jour = « …-12345 »). */
    return Object.values(byId).sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
  },
  getArchive(id) {
    return this.getArchives().find((a) => a.id === id) || null;
  },
  getDerniereArchive() {
    return this.getArchives()[0] || null;
  },

  /* Dernière fois que cet exo a été fait (séries de travail présentes). Avec « archive » : seulement
     les séances antérieures à celle-ci (pour le résumé). Sans : toutes (la séance en cours n'est pas encore archivée). */
  getPerfPassee(exoId, archive) {
    const liste = this.getArchives();
    const debut = archive ? liste.findIndex((a) => a.id === archive.id) + 1 : 0;
    for (const arch of liste.slice(debut)) {
      const entry = arch.exos.find((x) => x.exo_id === exoId);
      if (entry && seriesTravail(entry.series).length) return { date: arch.date, entry };
    }
    return null;
  },

  /* Toutes les fois où l'exo apparaît, du plus récent au plus ancien (écran historique). */
  getHistoriqueExo(exoId) {
    const out = [];
    for (const arch of this.getArchives()) {
      const entry = arch.exos.find((x) => x.exo_id === exoId);
      if (entry) out.push({ date: arch.date, archive: arch, entry });
    }
    return out;
  },

  getExosAvecHistorique() {
    const ids = new Set();
    for (const arch of this.getArchives()) for (const x of arch.exos) ids.add(x.exo_id);
    return [...ids];
  },

  /* Séances d'un modèle donné (sans modèle : toutes). Sert à retrouver la dernière variante utilisée. */
  archivesDuModele(modeleId) {
    const all = this.getArchives();
    return modeleId ? all.filter((a) => a.modele === modeleId) : all;
  },

  /* Le modèle actif qui contient cet exo (pour savoir sur quelles séances calculer ses records). */
  modeleDeReference(exoId) {
    for (const m of this.getModelesActifs()) {
      for (const b of m.blocs) for (const slot of b.slots) {
        const ids = typeof slot === "string" ? [slot] : slot.variantes || [slot.exo];
        if (ids.includes(exoId)) return m.id;
      }
    }
    return null;
  },

  /* Record série : meilleure série de travail isolée. */
  getRecordSerie(exoId, modeleId) {
    const exo = this.getExo(exoId);
    let best = null;
    for (const arch of this.archivesDuModele(modeleId).reverse()) {
      const entry = arch.exos.find((x) => x.exo_id === exoId);
      if (!entry) continue;
      for (const s of seriesTravail(entry.series)) {
        if (!best || isBetterSet(exo, s, best.serie)) best = { serie: s, date: arch.date };
      }
    }
    return best;
  },

  /* Record total séance : meilleur total sur une séance (tonnage, temps cumulé ou reps cumulées). */
  getRecordSeance(exoId, modeleId) {
    const exo = this.getExo(exoId);
    let best = null;
    for (const arch of this.archivesDuModele(modeleId).reverse()) {
      const entry = arch.exos.find((x) => x.exo_id === exoId);
      if (!entry) continue;
      const t = totalSeance(exo, entry.series);
      if (t != null && t > 0 && (!best || t > best.total)) best = { total: t, date: arch.date };
    }
    return best;
  },

  /* Dernière variante utilisée dans ce modèle (pour présélectionner la bonne à la maison / en salle).
     Jamais utilisée dans ce modèle : la première de la liste. */
  derniereVariante(variantes, modeleId) {
    for (const arch of this.archivesDuModele(modeleId)) {
      const hit = arch.exos.find((x) => variantes.includes(x.exo_id) && seriesTravail(x.series).length);
      if (hit) return hit.exo_id;
    }
    return variantes[0];
  },

  /* Nombre de fois où l'exo a été sauté sur les dernières séances du même modèle (signal programme, §4). */
  nbSautsRecents(exoId, modeleId, n = 5) {
    const recentes = this.getArchives().filter((a) => a.modele === modeleId).slice(0, n);
    return recentes.filter((a) => a.exos.some((x) => x.exo_id === exoId && x.statut === "saute")).length;
  },

  /* ---------- Séance en cours ---------- */
  demarrerSeance(modeleId) {
    const modele = this.getModele(modeleId);
    const date = localDate();
    const exos = [];
    for (const bloc of modele.blocs) {
      for (const slot of bloc.slots) {
        const variantes = typeof slot === "string" ? null : slot.variantes || null;
        const exoFixe = typeof slot === "string" ? slot : slot.exo;
        exos.push({
          bloc: bloc.titre,
          variantes,
          superset: typeof slot === "string" ? null : slot.superset || null,
          exo_id: variantes ? this.derniereVariante(variantes, modeleId) : exoFixe,
          statut: "a_faire",
          series: [],
          commentaire: "",
          raison: null,
        });
      }
    }
    const live = {
      id: `${date}-${modeleId}`,
      date,
      modele: modeleId,
      version_programme: modele.version,
      debut_ts: Date.now(),
      commentaire_seance: "",
      tags: [],
      exos,
      repos: null,
      reposEnAttente: null,
    };
    this.saveSeanceLive(live);
    return live;
  },
  getSeanceLive() {
    const live = lsGet(LS_KEYS.live, null);
    if (!live || typeof live !== "object") return null;
    if (Array.isArray(live.exos)) return live;
    /* Format de la version d'août : exos rangés dans live.blocs. On convertit pour ne rien perdre. */
    if (Array.isArray(live.blocs)) {
      live.exos = live.blocs.flatMap((b) => (b.exos || []).map((e) => ({
        bloc: b.titre || "",
        variantes: null,
        superset: null,
        exo_id: e.exo_id === "gastro_smith" ? "mollet_tendu_smith" : e.exo_id,
        statut: e.statut === "saute" ? "saute" : "a_faire",
        series: Array.isArray(e.series) ? e.series : [],
        commentaire: e.commentaire || "",
        raison: null,
      })));
      delete live.blocs;
      live.tags = live.tags || [];
      live.debut_ts = live.debut_ts || Date.now();
      live.repos = null;
      live.reposEnAttente = null;
      this.saveSeanceLive(live);
      return live;
    }
    return null;
  },
  saveSeanceLive(live) {
    lsSet(LS_KEYS.live, live);
  },
  abandonnerSeance() {
    localStorage.removeItem(LS_KEYS.live);
  },

  finaliserSeance(live) {
    const archive = {
      id: live.id,
      date: live.date,
      modele: live.modele,
      version_programme: live.version_programme,
      duree_min: Math.round((Date.now() - live.debut_ts) / 60000),
      commentaire_seance: live.commentaire_seance || "",
      tags: live.tags || [],
      exos: live.exos.map((x, i) => {
        const exo = this.getExo(x.exo_id);
        const series = x.series.map(cleanSerie);
        return {
          exo_id: x.exo_id,
          bloc: x.bloc,
          ordre: i,
          statut: statutExo(exo, x),
          raison: x.raison || null,
          series,
          commentaire: x.commentaire || "",
        };
      }),
    };
    /* Deux séances le même jour avec le même modèle : on n'écrase pas la première. */
    const archives = this.getArchivesApp();
    if (this.getArchive(archive.id)) archive.id = `${archive.id}-${Date.now() % 100000}`;
    archives.push(archive);
    lsSet(LS_KEYS.archives, archives);
    this.ajouterOutbox(archive.id);
    this.abandonnerSeance();
    return archive;
  },

  /* Supprime une séance enregistrée par l'app (jamais l'historique importé). Elle part dans la file
     « à retirer de Drive » jusqu'à ce que Drive soit mis à jour. */
  supprimerArchive(id) {
    const archives = this.getArchivesApp();
    const archive = archives.find((a) => a.id === id);
    if (!archive) return null;
    lsSet(LS_KEYS.archives, archives.filter((a) => a.id !== id));
    this.retirerOutbox(id);
    const aRetirer = lsGet("muscu:a_retirer", []);
    aRetirer.push({ id: archive.id, exos: archive.exos.map((x) => x.exo_id) });
    lsSet("muscu:a_retirer", aRetirer);
    return archive;
  },
  estArchiveApp(id) {
    return this.getArchivesApp().some((a) => a.id === id);
  },

  /* ---------- File d'attente Drive ---------- */
  getOutbox() {
    return lsGet(LS_KEYS.outbox, []);
  },
  ajouterOutbox(id) {
    const box = this.getOutbox();
    if (!box.includes(id)) box.push(id);
    lsSet(LS_KEYS.outbox, box);
  },
  retirerOutbox(id) {
    lsSet(LS_KEYS.outbox, this.getOutbox().filter((x) => x !== id));
  },
};

/* ---------- Calculs sur les séries ---------- */

function seriesTravail(series) {
  return (series || []).filter((s) => !s.echauffement);
}

/* On retire les champs de travail de l'interface (préfixés _) avant d'archiver. */
function cleanSerie(s) {
  const out = {};
  for (const k of Object.keys(s)) if (!k.startsWith("_") && s[k] != null && s[k] !== "") out[k] = s[k];
  return out;
}

function statutExo(exo, x) {
  const travail = seriesTravail(x.series);
  if (!travail.length) return "saute";
  const cible = range(exo.cible_series);
  if (!cible) return "fait";
  const n = exo.unilateral
    ? Math.min(travail.filter((s) => s.cote === "G").length, travail.filter((s) => s.cote === "D").length)
    : travail.length;
  return n < cible[0] ? "partiel" : "fait";
}

/* Le tonnage (Σ) n'a de sens qu'en kg sur reps_charge, hors charge inversée (R4, R2). */
function compteDansTonnage(exo) {
  return exo.type_mesure === "reps_charge" && (exo.unite || "kg") === "kg" && !exo.charge_inversee;
}

function sigma(exo, series) {
  if (!compteDansTonnage(exo)) return null;
  return seriesTravail(series).reduce((t, s) => t + (s.reps || 0) * (s.charge || 0), 0);
}

/* Total séance selon le type de mesure (record total séance, §2.5). */
function totalSeance(exo, series) {
  const travail = seriesTravail(series);
  if (!travail.length) return null;
  if (compteDansTonnage(exo)) return sigma(exo, series);
  if (exo.type_mesure === "temps" || exo.type_mesure === "temps_charge") return travail.reduce((t, s) => t + (s.duree_sec || 0), 0);
  if (exo.type_mesure === "reps_seules") return travail.reduce((t, s) => t + (s.reps || 0), 0);
  return null;
}

function formatTotal(exo, total) {
  if (total == null) return "—";
  if (compteDansTonnage(exo)) return `Σ ${total} kg`;
  if (exo.type_mesure === "temps" || exo.type_mesure === "temps_charge") return `${formatDuree(total)} cumulés`;
  if (exo.type_mesure === "reps_seules") return `${total} reps cumulées`;
  return String(total);
}

/* Total d'une séance, avec le détail par côté pour les unilatéraux en kg : « Σ 1200 kg (G 600 · D 600) ». */
function formatTotalDe(exo, series) {
  const total = totalSeance(exo, series);
  if (total == null) return "—";
  let txt = formatTotal(exo, total);
  if (exo.unilateral && compteDansTonnage(exo)) {
    const parCote = ["G", "D"].map((c) => `${c} ${sigma(exo, series.filter((s) => s.cote === c))}`);
    txt += ` (${parCote.join(" · ")})`;
  }
  return txt;
}

function isBetterSet(exo, a, b) {
  if (exo.type_mesure === "temps") return (a.duree_sec || 0) > (b.duree_sec || 0);
  if (exo.type_mesure === "temps_charge") {
    if ((a.charge || 0) !== (b.charge || 0)) return (a.charge || 0) > (b.charge || 0);
    return (a.duree_sec || 0) > (b.duree_sec || 0);
  }
  if (exo.type_mesure === "reps_seules") return (a.reps || 0) > (b.reps || 0);
  if (exo.charge_inversee) {
    const ca = a.charge ?? Infinity, cb = b.charge ?? Infinity;
    return ca < cb || (ca === cb && (a.reps || 0) > (b.reps || 0));
  }
  const ca = a.charge || 0, cb = b.charge || 0;
  return ca > cb || (ca === cb && (a.reps || 0) > (b.reps || 0));
}

/* ---------- Mise en forme ---------- */

function fmtNum(n) {
  return String(n).replace(".", ",");
}

function formatCharge(exo, charge) {
  if (charge == null) return "";
  return exo.unite && exo.unite !== "kg" ? `${exo.unite} ${fmtNum(charge)}` : `${fmtNum(charge)} kg`;
}

function formatDuree(sec) {
  if (sec == null) return "—";
  const neg = sec < 0;
  const a = Math.abs(Math.round(sec));
  const m = Math.floor(a / 60);
  const s = a % 60;
  const txt = m > 0 ? (s ? `${m}'${String(s).padStart(2, "0")}"` : `${m}'`) : `${s}"`;
  return neg ? "−" + txt : txt;
}

/* Une série en texte court : « 6 × 80 kg », « 1'30" », « 28 kg × 30" ». */
function formatSerie(exo, s) {
  if (exo.type_mesure === "temps") return formatDuree(s.duree_sec);
  if (exo.type_mesure === "temps_charge") {
    return [s.charge != null ? formatCharge(exo, s.charge) : null, s.duree_sec != null ? formatDuree(s.duree_sec) : null].filter(Boolean).join(" × ") || "—";
  }
  if (exo.type_mesure === "reps_seules") return `${s.reps ?? "?"} reps`;
  if (s.reps == null) return formatCharge(exo, s.charge);
  return `${s.reps} × ${formatCharge(exo, s.charge)}`;
}

/* Séries de travail regroupées : « 3 × (6 × 80 kg) », par côté pour les unilatéraux. */
function formatSeries(exo, series) {
  const travail = seriesTravail(series);
  if (!travail.length) return "—";
  if (exo.unilateral && travail.some((s) => s.cote)) {
    return ["G", "D"]
      .map((c) => {
        const cs = travail.filter((s) => s.cote === c);
        return cs.length ? `${c} ${groupIdentical(cs.map((s) => formatSerie(exo, s))).join(" / ")}` : null;
      })
      .filter(Boolean)
      .join(" · ");
  }
  return groupIdentical(travail.map((s) => formatSerie(exo, s))).join(" / ");
}

function groupIdentical(labels) {
  const out = [];
  let i = 0;
  while (i < labels.length) {
    let n = 1;
    while (i + n < labels.length && labels[i + n] === labels[i]) n++;
    out.push(n > 1 ? `${n} × (${labels[i]})` : labels[i]);
    i += n;
  }
  return out;
}

function formatCible(exo) {
  const parts = [];
  const series = range(exo.cible_series);
  const reps = range(exo.cible_reps);
  const temps = range(exo.cible_temps_sec);
  let dose = series ? formatRange(series, String) : "";
  if (exo.type_mesure === "temps" || exo.type_mesure === "temps_charge") {
    if (temps) dose += ` × ${formatRange(temps, formatDuree)}`;
  } else if (reps) {
    dose += ` × ${formatRange(reps, String)}`;
  }
  if (exo.unilateral) dose += " / côté";
  if (dose) parts.push(dose);
  if (exo.rir_cible) parts.push(`RIR ${exo.rir_cible}`);
  const repos = range(exo.repos_sec);
  if (repos) parts.push(`repos ${formatRange(repos, formatDuree)}`);
  return parts.join(" · ");
}

/* Pour Node (tests) — sans effet dans le navigateur. */
if (typeof module !== "undefined") {
  module.exports = { Store, seriesTravail, statutExo, sigma, totalSeance, isBetterSet, formatSeries, formatSerie, formatCible, formatDuree, range };
}
