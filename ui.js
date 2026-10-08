/* Affichage. Chaque écran est reconstruit entièrement à chaque action (render…) : simple et sans
   état caché. Seuls la barre de repos et les chronos d'effort sont rafraîchis en continu (tick). */

let live = null;        // séance en cours (copie de travail, sauvegardée à chaque action)
let vue = "accueil";
let ouvert = null;      // index de l'exo déplié
let edition = null;     // { idx, si } : série en cours de correction
const flags = {};       // affichages temporaires par exo : { comment, saut, note, erreur }
let dernierePhase = null;
let commentSeanceOuvert = false;

function $(id) { return document.getElementById(id); }

function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "value") el.value = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat(Infinity)) if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
  return el;
}

function f(i) { return flags[i] || (flags[i] = {}); }
function save() { if (live) Store.saveSeanceLive(live); }
function vibrer(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (err) { /* rien */ } }

/* Bips : le navigateur n'autorise le son qu'après un appui de l'utilisateur, d'où debloquerSon() sur les boutons. */
let audioCtx = null;
function debloquerSon() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (err) { audioCtx = null; }
}
function bip(n = 2) {
  vibrer([200, 100, 200]);
  if (!audioCtx) return;
  try {
    for (let k = 0; k < n; k++) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      const t = audioCtx.currentTime + k * 0.3;
      o.frequency.value = 880;
      o.connect(g);
      g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.start(t);
      o.stop(t + 0.22);
    }
  } catch (err) { /* pas de son, la vibration suffit */ }
}

/* Petit message de confirmation en bas de l'écran. */
function toast(txt) {
  let el = $("toast");
  if (!el) { el = h("div", { id: "toast", class: "toast" }); document.body.append(el); }
  el.textContent = txt;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2200);
}

/* Champs proposés pour un exercice (data.js « saisie »), sinon tous ceux qui ont un sens pour son type.
   L'échauffement est proposé partout. */
function champ(exo, nom) {
  if (nom === "echauffement") return true;
  if (exo.saisie) return exo.saisie.includes(nom);
  const t = exo.type_mesure;
  if (nom === "reps" || nom === "rir") return t === "reps_charge" || t === "reps_seules";
  if (nom === "charge") return t === "reps_charge" || t === "temps_charge";
  if (nom === "duree") return t === "temps" || t === "temps_charge";
  return true;
}

/* Numéro de la prochaine série de travail (par côté pour un unilatéral). */
function numeroSerie(exo, x, cote) {
  return seriesTravail(x.series).filter((s) => !exo.unilateral || s.cote === cote).length + 1;
}

function dateFr(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}
function heure(ts) { return new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }
function nomCourt(exo) { return exo.nom.split(" — ")[1] || exo.nom; }
function autreCote(c) { return c === "G" ? "D" : "G"; }

function parseNombre(txt) {
  const n = parseFloat(String(txt).replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}
/* « 1:30 », « 1'30 » ou « 90 » → secondes. */
function parseDuree(txt) {
  const t = String(txt).trim();
  if (!t) return null;
  const m = t.match(/^(\d+)\s*[:'’]\s*(\d{1,2})"?$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const n = parseNombre(t);
  return n != null ? Math.round(n) : null;
}
function dureeInput(sec) {
  if (sec == null) return "";
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/* ---------- Navigation (le bouton retour d'Android revient à l'accueil) ---------- */

function allerA(fn) {
  if (!location.hash) history.pushState(null, "", "#app");
  fn();
  window.scrollTo(0, 0);
}
function retourAccueil() {
  if (location.hash) history.back();
  else renderAccueil();
}
window.addEventListener("popstate", () => renderAccueil());

function monter(...els) {
  const app = $("app");
  app.replaceChildren(...els.flat(Infinity).filter(Boolean));
  renderReposBar();
}

/* ---------- Accueil ---------- */

function renderGoogle() {
  if (DriveAuth.isConnected()) return h("span", { class: "pill ok" }, "Google ✓");
  return h("button", {
    class: "pill",
    onclick: async () => {
      try { await DriveAuth.ensureToken(); } catch (err) { alert("Connexion Google : " + err.message); }
      renderAccueil();
    },
  }, "Se connecter à Google");
}

function resumeCourt(archive) {
  const c = { fait: 0, partiel: 0, saute: 0 };
  archive.exos.forEach((x) => { c[x.statut] = (c[x.statut] || 0) + 1; });
  return h("p", { class: "muted" }, [`${c.fait} fait(s)`, c.partiel ? `${c.partiel} partiel(s)` : null, c.saute ? `${c.saute} pas fait(s)` : null].filter(Boolean).join(" · "));
}

function renderAccueil() {
  vue = "accueil";
  edition = null;
  live = Store.getSeanceLive();
  const els = [h("header", { class: "topline" }, h("h1", null, "Journal Muscu"), renderGoogle())];

  if (live) {
    const n = live.exos.reduce((t, x) => t + x.series.length, 0);
    els.push(h("section", { class: "card accent" },
      h("p", { class: "label" }, "Séance en cours"),
      h("p", { class: "big" }, Store.getModele(live.modele).nom),
      h("p", { class: "muted" }, `commencée à ${heure(live.debut_ts)} · ${n} série(s) notée(s)`),
      h("div", { class: "row" },
        h("button", { class: "btn-primary", onclick: () => allerA(ouvrirSeance) }, "Reprendre"),
        h("button", {
          class: "btn-ghost",
          onclick: () => {
            if (!confirm("Abandonner la séance en cours ? Les séries notées seront perdues.")) return;
            Store.abandonnerSeance();
            renderAccueil();
          },
        }, "Abandonner"))));
  } else {
    els.push(h("section", { class: "card" },
      h("p", { class: "label" }, "Démarrer une séance"),
      Store.getModelesActifs().map((m) => h("button", {
        class: "btn-primary btn-block",
        onclick: () => {
          /* Lancée en premier : sur un nouvel appareil, la fenêtre Google doit s'ouvrir dans la foulée du clic. */
          synchroniserEnArrierePlan();
          debloquerSon();
          live = Store.demarrerSeance(m.id);
          ouvert = null;
          allerA(ouvrirSeance);
        },
      }, m.nom))));
  }

  const der = Store.getDerniereArchive();
  if (der) {
    els.push(h("button", { class: "card card-btn", onclick: () => allerA(() => renderSeanceDetail(der.id, renderAccueil)) },
      h("span", { class: "label" }, "Dernière séance · voir le détail ›"),
      h("span", null, `${dateFr(der.date)} — ${Store.getModele(der.modele).nom}${der.duree_min ? ` · ${der.duree_min} min` : ""}`),
      resumeCourt(der)));
  }

  const aRetirer = lsGet("muscu:a_retirer", []);
  if (aRetirer.length) {
    const status = h("p", { class: "muted" });
    els.push(h("section", { class: "card warn" },
      h("p", null, `${aRetirer.length} séance(s) supprimée(s) sur le téléphone, pas encore retirée(s) de Drive.`),
      h("button", {
        class: "btn-secondary btn-block",
        onclick: async (ev) => {
          ev.target.disabled = true;
          try {
            await DriveAuth.ensureToken();
            await retirerDeDrive((msg) => { status.textContent = msg; });
            status.textContent = "✅ Drive mis à jour.";
            setTimeout(() => { if (vue === "accueil" || vue === "historique") renderAccueil(); }, 1200);
          } catch (err) {
            status.textContent = "Échec : " + err.message;
            ev.target.disabled = false;
          }
        },
      }, "Mettre Drive à jour"),
      status));
  }

  const box = Store.getOutbox();
  const jamaisEnvoye = !lsGet("muscu:drive_init", false);
  const seancesJamaisEnvoyees = !lsGet("muscu:drive_seances_init_v2", false);
  if (box.length || jamaisEnvoye || seancesJamaisEnvoyees) {
    const status = h("p", { class: "muted" });
    els.push(h("section", { class: "card warn" },
      h("p", null, box.length
        ? `${box.length} séance(s) pas encore envoyée(s) dans Drive.`
        : seancesJamaisEnvoyees && !jamaisEnvoye
          ? `Il manque dans Drive un fichier par séance pour l'historique (${Store.getArchives().length} séances). À envoyer une fois.`
          : "L'historique n'a pas encore été envoyé dans Drive (un fichier par séance et par exercice, pour les analyses)."),
      h("button", {
        class: "btn-secondary btn-block",
        onclick: async (ev) => {
          ev.target.disabled = true;
          try {
            await DriveAuth.ensureToken();
            await envoyerOutbox((msg) => { status.textContent = msg; });
            status.textContent = "✅ Envoyé dans Drive (dossier « Journal Muscu (app) »).";
            setTimeout(() => { if (vue === "accueil" || vue === "historique") renderAccueil(); }, 1500);
          } catch (err) {
            status.textContent = "Échec : " + err.message;
            ev.target.disabled = false;
          }
        },
      }, "Envoyer dans Drive"),
      status));
  }

  const statusSync = h("p", { class: "muted small" });
  els.push(h("button", {
    class: "btn-ghost small-btn",
    onclick: async (ev) => {
      ev.target.disabled = true;
      try {
        await DriveAuth.ensureToken();
        await retirerDeDrive((msg) => { statusSync.textContent = msg; });
        const avant = Store.getArchivesApp().length;
        await envoyerOutbox((msg) => { statusSync.textContent = msg; });
        const recuperees = Store.getArchivesApp().length - avant;
        statusSync.textContent = recuperees > 0 ? `✅ ${recuperees} séance(s) récupérée(s) depuis Drive.` : "✅ Tout est à jour avec Drive.";
        setTimeout(() => { if (vue === "accueil") renderAccueil(); }, 1800);
      } catch (err) {
        statusSync.textContent = "Échec : " + err.message;
        ev.target.disabled = false;
      }
    },
  }, "🔄 Synchroniser avec Drive"), statusSync);
  els.push(h("div", { class: "row" },
    h("button", { class: "btn-secondary", onclick: () => allerA(renderHistoriqueSeances) }, "📅 Historique par séance"),
    h("button", { class: "btn-secondary", onclick: () => allerA(renderHistorique) }, "📈 Historique par exercice")));
  monter(...els);
}

/* Au démarrage d'une séance : récupère sans bloquer les séances connues de Drive (autre appareil,
   données effacées). Silencieux : en cas d'échec, l'envoi de fin de séance resynchronisera de toute façon.
   La fenêtre Google ne s'ouvre que sur un appareil jamais synchronisé ou si une séance attend d'être envoyée. */
async function synchroniserEnArrierePlan() {
  try {
    if (!DriveAuth.isConnected()) {
      /* Fenêtre Google seulement sur un appareil jamais synchronisé, ou si une séance attend d'être envoyée. */
      if (lsGet("muscu:sync_init", false) && !Store.getOutbox().length || !DriveAuth.isReady()) return;
      await DriveAuth.ensureToken();
    }
    /* Une séance précédente pas encore partie dans Drive (envoi coupé) : on en profite pour la renvoyer. */
    const avant = Store.getArchivesApp().length;
    if (Store.getOutbox().length) await envoyerOutbox();
    else await synchroniserDepuisDrive();
    /* Réaffiche pour mettre à jour « dernière fois » et records, sauf si une saisie est en cours. */
    const saisieEnCours = document.activeElement && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
    if (Store.getArchivesApp().length > avant && vue === "seance" && !saisieEnCours) renderSeance();
  } catch (err) {
    console.warn("Synchronisation en arrière-plan :", err.message);
  }
}

/* Bouton à double appui : le premier arme, le second (dans les 5 s) supprime. */
function boutonSupprimer(archive) {
  const status = h("p", { class: "muted small" });
  let arme = false;
  let minuteur = null;
  const btn = h("button", {
    class: "btn-ghost small-btn",
    onclick: () => {
      if (!arme) {
        arme = true;
        btn.textContent = "Appuie encore pour confirmer la suppression";
        btn.className = "btn-danger small-btn";
        minuteur = setTimeout(() => { arme = false; btn.textContent = "🗑 Supprimer cette séance"; btn.className = "btn-ghost small-btn"; }, 5000);
        return;
      }
      clearTimeout(minuteur);
      supprimerSeance(archive, btn, status);
    },
  }, "🗑 Supprimer cette séance");
  return h("div", { class: "suppr" }, btn, status);
}

async function supprimerSeance(archive, btn, status) {
  btn.disabled = true;
  /* La fenêtre Google doit s'ouvrir tout de suite après le clic. */
  let erreurGoogle = null;
  const google = DriveAuth.ensureToken().catch((err) => { erreurGoogle = err; });
  Store.supprimerArchive(archive.id);
  status.textContent = "Supprimée du téléphone. Mise à jour de Drive…";
  await google;
  if (erreurGoogle) {
    status.textContent = `Supprimée du téléphone. Drive pas encore mis à jour (${erreurGoogle.message}) : réessaie depuis l'accueil.`;
    setTimeout(() => { if (vue === "accueil" || vue === "historique") renderAccueil(); }, 3000);
    return;
  }
  try {
    await retirerDeDrive((msg) => { status.textContent = msg; });
    status.textContent = "✅ Supprimée du téléphone et de Drive.";
  } catch (err) {
    status.textContent = `Supprimée du téléphone, mais Drive n'a pas pu être mis à jour (${err.message}).`;
  }
  setTimeout(() => { if (vue === "accueil" || vue === "historique") renderAccueil(); }, 2500);
}

/* ---------- Séance ---------- */

function ouvrirSeance() {
  live = Store.getSeanceLive();
  if (!live) return renderAccueil();
  vue = "seance";
  Ecran.activer();
  renderSeance();
}

function renderSeance() {
  const m = Store.getModele(live.modele);
  const head = h("header", { class: "seance-head" },
    h("div", null, h("h1", null, m.nom), h("p", { class: "muted" }, `${dateFr(live.date)} · depuis ${heure(live.debut_ts)}`)),
    h("div", { class: "row tight" },
      Ecran.supporte() ? h("button", {
        class: "icon-btn" + (Ecran.voulu() ? " on" : ""),
        title: "Empêche le téléphone de se mettre en veille pendant la séance",
        onclick: () => { Ecran.setVoulu(!Ecran.voulu()); renderSeance(); },
      }, Ecran.voulu() ? "Écran allumé ✓" : "Écran allumé ✗") : null,
      h("button", { class: "btn-secondary", onclick: () => { vue = "fin"; renderFin(); window.scrollTo(0, 0); } }, "Terminer")));

  const els = [head];
  if (m.echauffement) els.push(h("p", { class: "echauffement" }, "Échauffement : " + m.echauffement));

  let blocCourant = null;
  live.exos.forEach((x, i) => {
    if (x.bloc !== blocCourant) { blocCourant = x.bloc; els.push(h("h2", null, x.bloc)); }
    els.push(renderCarte(x, i));
  });
  els.push(h("h2", null, "Séance entière"));
  els.push(h("button", {
    class: "btn-ghost btn-block" + (live.commentaire_seance ? " has" : ""),
    onclick: () => { commentSeanceOuvert = !commentSeanceOuvert; renderSeance(); },
  }, live.commentaire_seance ? "💬 Commentaire de séance ✓" : "💬 Commentaire de séance"));
  if (commentSeanceOuvert || live.commentaire_seance) {
    els.push(h("textarea", {
      class: "comment-box", placeholder: "Commentaire sur toute la séance (forme, contexte, sensations…) — repris à la fin",
      value: live.commentaire_seance || "",
      oninput: (ev) => { live.commentaire_seance = ev.target.value; save(); },
    }));
  }
  els.push(h("button", { class: "btn-ghost btn-block", onclick: retourAccueil }, "← Accueil (la séance reste en cours)"));
  monter(...els);
}

function badgeExo(exo, x) {
  if (x.statut === "saute") return h("span", { class: "badge skip" }, "pas fait");
  const travail = seriesTravail(x.series);
  if (!travail.length) return x.series.length ? h("span", { class: "badge" }, "échauffement") : null;
  const n = exo.unilateral
    ? Math.min(travail.filter((s) => s.cote === "G").length, travail.filter((s) => s.cote === "D").length)
    : travail.length;
  const cible = range(exo.cible_series);
  const okCible = !cible || n >= cible[0];
  return h("span", { class: "badge " + (okCible ? "done" : "partial") }, cible ? `${n}/${formatRange(cible, String)}${exo.unilateral ? " tours" : ""}` : `${n}`);
}

function renderCarte(x, i) {
  const exo = Store.getExo(x.exo_id);
  const open = ouvert === i;
  const card = h("div", { class: "exo-card" + (open ? " open" : "") + (x.statut === "saute" ? " saute" : "") });
  card.append(h("button", {
    class: "exo-header",
    onclick: () => { ouvert = open ? null : i; edition = null; renderSeance(); },
  },
    h("span", { class: "exo-titre" }, h("span", { class: "exo-nom" }, exo.nom), badgeExo(exo, x)),
    exo.reglages ? h("span", { class: "exo-meta" }, exo.reglages) : null));
  if (open) card.append(renderCorps(x, i, exo));
  return card;
}

function renderCorps(x, i, exo) {
  const body = h("div", { class: "exo-body" });

  if (x.variantes) {
    body.append(h("div", { class: "chips" }, x.variantes.map((v) => {
      const ve = Store.getExo(v);
      return h("button", {
        class: "chip" + (v === x.exo_id ? " selected" : ""),
        onclick: () => {
          if (v === x.exo_id) return;
          if (x.series.length) { alert("Supprime d'abord les séries notées : les charges d'une variante à l'autre ne se comparent pas."); return; }
          x.exo_id = v;
          delete x._draft;
          save();
          renderSeance();
        },
      }, `${ve.lieu === "salle" ? "🏋️" : "🏠"} ${nomCourt(ve)}`);
    })));
  }

  body.append(h("p", { class: "cible" }, "Cible : " + formatCible(exo)));
  if (exo.rampe) body.append(h("p", { class: "rampe" }, "🔥 Échauffement : " + exo.rampe));
  const partenaire = partenaireSuperset(i);
  if (partenaire != null) {
    const autre = Store.getExo(live.exos[partenaire].exo_id).nom;
    body.append(h("p", { class: "superset" }, estMeneur(i)
      ? `↔ Superset avec « ${autre} » : après chaque série, une ligne apparaît ici pour le noter en un appui. Pas de repos à attendre, on enchaîne.`
      : `↔ Superset avec « ${autre} » : se note d'un appui depuis sa fiche. Ici seulement pour changer les valeurs.`));
  }
  if (exo.consignes) body.append(h("p", { class: "consignes" }, exo.consignes));

  const avant = Store.getPerfPassee(exo.id);
  body.append(renderBandeau(exo, avant));
  if (x.series.length) body.append(renderListeSeries(x, i, exo));
  const attente = estMeneur(i) ? suiveurEnAttente(i) : null;
  if (attente) body.append(renderSuiveurEnAttente(attente));
  if (x.statut !== "saute") body.append(renderSaisie(x, i, exo, avant));

  const actions = h("div", { class: "exo-actions" },
    h("button", { class: "btn-ghost" + (x.commentaire ? " has" : ""), onclick: () => { f(i).comment = !f(i).comment; renderSeance(); } }, x.commentaire ? "💬 Commentaire ✓" : "💬 Commentaire exo"));
  if (x.statut === "saute") {
    actions.append(h("button", { class: "btn-ghost", onclick: () => { x.statut = "a_faire"; x.raison = null; save(); renderSeance(); } }, "Annuler « pas fait »"));
  } else if (!seriesTravail(x.series).length) {
    actions.append(h("button", { class: "btn-ghost", onclick: () => { f(i).saut = !f(i).saut; renderSeance(); } }, "Pas fait"));
  }
  body.append(actions);

  if (f(i).saut && x.statut !== "saute") {
    body.append(h("div", { class: "chips" }, RAISONS_SAUT.map((r) => h("button", {
      class: "chip",
      onclick: () => { x.statut = "saute"; x.raison = r.label; f(i).saut = false; save(); ouvert = exoSuivantSiTermine(i); renderSeance(); if (ouvert != null) defilerVersOuvert(); },
    }, r.label))));
  }
  if (f(i).comment || x.statut === "saute" && x.commentaire) {
    body.append(h("textarea", {
      class: "comment-box",
      placeholder: "Commentaire sur l'exercice…",
      value: x.commentaire || "",
      oninput: (ev) => { x.commentaire = ev.target.value; save(); },
    }));
  }
  return body;
}

function renderBandeau(exo, avant) {
  const box = h("div", { class: "bandeau" });
  if (!avant) {
    box.append(h("p", { class: "muted" }, "Jamais fait — pas de repère."));
    return box;
  }
  const total = totalSeance(exo, avant.entry.series);
  box.append(h("p", null, h("span", { class: "label" }, `Dernière fois · ${dateFr(avant.date)}`), h("br"),
    h("strong", null, formatSeries(exo, avant.entry.series)), total != null ? `  ·  ${formatTotalDe(exo, avant.entry.series)}` : ""));
  const notes = [avant.entry.commentaire, ...avant.entry.series.map((s) => s.commentaire)].filter(Boolean);
  if (notes.length) box.append(h("p", { class: "note" }, "💬 " + notes.join(" · ")));
  const rs = Store.getRecordSerie(exo.id);
  const rt = Store.getRecordSeance(exo.id);
  if (rs || rt) {
    box.append(h("p", { class: "muted small" }, "Records : ",
      rs ? `meilleure série ${formatSerie(exo, rs.serie)} (${dateFr(rs.date)})` : "",
      rs && rt ? " · " : "",
      rt ? `meilleur total sur l'exo ${formatTotal(exo, rt.total)} (${dateFr(rt.date)})` : ""));
  }
  return box;
}

function renderListeSeries(x, i, exo) {
  const list = h("div", { class: "series" });
  let n = 0;
  x.series.forEach((s, si) => {
    const enEdition = edition && edition.idx === i && edition.si === si;
    /* Série de travail sans RIR ou sans technique alors que l'exo les demande : marqué en rouge, à compléter d'un appui. */
    const veutRir = !s.echauffement && champ(exo, "rir") && champ(exo, "reps") && !exo.reps_fixes;
    const veutTech = !s.echauffement && champ(exo, "technique");
    const tags = [];
    if (s.rir != null) tags.push(`RIR ${s.rir}  `);
    else if (veutRir) tags.push(h("span", { class: "manque" }, "RIR ?"), " ");
    if (s.technique) tags.push(s.technique === "propre" ? "🟢  " : "🟡  ");
    else if (veutTech) tags.push(h("span", { class: "manque rond", title: "Technique non notée" }, "?"), " ");
    if (s.repos_avant_sec != null) tags.push(`⏱ ${formatDuree(s.repos_avant_sec)}${s.repos_precision === "exact" ? "" : "~"}`);
    list.append(h("button", {
      class: "serie-row" + (s.echauffement ? " ech" : "") + (enEdition ? " editing" : ""),
      onclick: () => {
        if (enEdition) { edition = null; } else { edition = { idx: i, si }; x._edit = Object.assign({}, s); }
        renderSeance();
      },
    },
      h("span", { class: "num" }, s.echauffement ? "éch." : `${++n}`),
      h("span", { class: "main" }, (s.cote ? s.cote + " · " : "") + formatSerie(exo, s)),
      h("span", { class: "tags" }, tags),
      s.commentaire ? h("span", { class: "serie-note" }, "💬 " + s.commentaire) : null));
  });
  return list;
}

/* Valeurs proposées pour une série de travail : la dernière série de travail du jour, sinon la 1re de la dernière fois. */
function valeursTravail(exo, x, avant) {
  const travail = seriesTravail(x.series);
  const ref = travail[travail.length - 1] || (avant ? seriesTravail(avant.entry.series)[0] : null) || {};
  const reps = range(exo.cible_reps), temps = range(exo.cible_temps_sec);
  return {
    reps: ref.reps ?? (reps ? reps[0] : null),
    charge: ref.charge ?? null,
    duree_sec: ref.duree_sec ?? (temps ? temps[0] : null),
  };
}

/* Prochain échauffement prévu (data.js « rampe_series ») pour ce côté, ou null quand la rampe est faite
   ou que les séries de travail ont commencé. Une valeur non chiffrée reprend l'échauffement de la dernière fois. */
function etapeRampe(exo, x, avant, cote) {
  const prevues = exo.rampe_series || [];
  const duCote = (s) => !exo.unilateral || s.cote === cote;
  const series = x.series.filter(duCote);
  if (!prevues.length || series.some((s) => !s.echauffement)) return null;
  const k = series.length;
  if (k >= prevues.length) return null;
  const etape = prevues[k];
  const avantEch = avant ? avant.entry.series.filter((s) => s.echauffement && duCote(s)) : [];
  const ref = avantEch[k] || {};
  const travail = valeursTravail(exo, x, avant);
  return {
    reps: etape.reps ?? ref.reps ?? travail.reps,
    charge: etape.charge ?? ref.charge ?? travail.charge,
    duree_sec: etape.duree_sec ?? ref.duree_sec ?? travail.duree_sec,
    numero: k + 1, total: prevues.length,
  };
}

/* Brouillon de la prochaine série : échauffement prévu pré-rempli s'il en reste un, sinon série de travail. */
function defaultDraft(exo, x, avant) {
  const last = x.series[x.series.length - 1];
  const cote = exo.unilateral ? (last && last.cote ? autreCote(last.cote) : exo.premier_cote || "G") : null;
  const etape = etapeRampe(exo, x, avant, cote);
  const v = etape || valeursTravail(exo, x, avant);
  return {
    reps: v.reps, charge: v.charge, duree_sec: v.duree_sec, cote,
    rir: null, technique: null, echauffement: !!etape, rampe: !!etape, commentaire: "",
  };
}

/* Cocher / décocher « Échauffement » remplace les valeurs pré-remplies par celles qui conviennent. */
function basculerEchauffement(exo, x, d) {
  const avant = Store.getPerfPassee(exo.id);
  d.echauffement = !d.echauffement;
  if (d.echauffement) {
    const etape = etapeRampe(exo, x, avant, d.cote);
    if (etape) Object.assign(d, { reps: etape.reps, charge: etape.charge, duree_sec: etape.duree_sec, rampe: true });
  } else if (d.rampe) {
    Object.assign(d, valeursTravail(exo, x, avant), { rampe: false });
  }
}

function renderSaisie(x, i, exo, avant) {
  const enEdition = edition && edition.idx === i;
  const d = enEdition ? x._edit : (x._draft || (x._draft = defaultDraft(exo, x, avant)));
  const hasReps = champ(exo, "reps") && !exo.reps_fixes;
  const hasCharge = champ(exo, "charge");
  const hasDuree = champ(exo, "duree");
  const form = h("div", { class: "saisie" + (enEdition ? " editing" : "") });
  if (enEdition) {
    form.append(h("p", { class: "saisie-titre" }, "Correction de la série"));
  } else {
    const cote = exo.unilateral ? (d.cote === "G" ? " · gauche" : " · droite") : "";
    const cible = range(exo.cible_series);
    const n = numeroSerie(exo, x, d.cote);
    const etape = d.echauffement ? etapeRampe(exo, x, avant, d.cote) : null;
    form.append(h("p", { class: "saisie-titre" + (d.echauffement ? " ech" : "") }, d.echauffement
      ? `À noter : échauffement${etape ? ` ${etape.numero} / ${etape.total} prévu${etape.total > 1 ? "s" : ""}` : ""}${cote}`
      : `À noter : série ${n}${cible ? " / " + cible[1] : ""}${cote}${exo.reps_fixes ? ` — ${range(exo.cible_reps)[1]} reps` : ""}`));
  }

  if (exo.unilateral) {
    form.append(h("div", { class: "seg" }, ["G", "D"].map((c) => h("button", {
      class: d.cote === c ? "selected" : "",
      onclick: () => {
        d.cote = c;
        /* Changer de côté recale le pré-remplissage sur la rampe de ce côté-là. */
        if (!enEdition) {
          const etape = etapeRampe(exo, x, avant, c);
          if (etape) Object.assign(d, { reps: etape.reps, charge: etape.charge, duree_sec: etape.duree_sec, echauffement: true, rampe: true });
          else if (d.rampe) Object.assign(d, valeursTravail(exo, x, avant), { echauffement: false, rampe: false });
        }
        save();
        renderSeance();
      },
    }, c === "G" ? "Gauche" : "Droite"))));
  }

  if (hasReps) {
    const input = h("input", {
      class: "num-input", inputmode: "numeric", value: d.reps ?? "", "aria-label": "Reps",
      oninput: (ev) => { d.reps = parseNombre(ev.target.value); save(); },
    });
    const step = (delta) => { d.reps = Math.max(0, (d.reps || 0) + delta); input.value = d.reps; save(); };
    form.append(h("div", { class: "field" }, h("span", { class: "field-label" }, "Reps"),
      h("div", { class: "stepper" }, h("button", { onclick: () => step(-1) }, "−"), input, h("button", { onclick: () => step(1) }, "+"))));
  }

  if (hasCharge) {
    const [p1, p2] = exo.pas_charge;
    const input = h("input", {
      class: "num-input", inputmode: "decimal", value: d.charge != null ? fmtNum(d.charge) : "", "aria-label": "Charge",
      oninput: (ev) => { d.charge = parseNombre(ev.target.value); save(); },
    });
    const step = (delta) => {
      d.charge = Math.max(0, Math.round(((d.charge || 0) + delta) * 100) / 100);
      input.value = fmtNum(d.charge);
      save();
    };
    form.append(h("div", { class: "field" },
      h("span", { class: "field-label" }, exo.unite !== "kg" ? `Distance (${exo.unite})` : exo.charge_lest ? "Lest (kg) — 0 = poids du corps" : "Charge (kg)"),
      exo.charge_lest ? h("button", {
        class: "chip" + (d.charge === 0 ? " selected" : ""),
        onclick: () => { d.charge = 0; save(); renderSeance(); },
      }, "Poids du corps") : null,
      h("div", { class: "stepper wide" },
        h("button", { class: "small", onclick: () => step(-p2) }, `−${fmtNum(p2)}`),
        h("button", { class: "small", onclick: () => step(-p1) }, `−${fmtNum(p1)}`),
        input,
        h("button", { class: "small", onclick: () => step(p1) }, `+${fmtNum(p1)}`),
        h("button", { class: "small", onclick: () => step(p2) }, `+${fmtNum(p2)}`))));
  }

  if (hasDuree) {
    const effortEnCours = live.effort && live.effort.idx === i;
    const objectif = range(exo.cible_temps_sec);
    if (!enEdition) {
      form.append(h("button", {
        class: "btn-chrono-grand" + (effortEnCours ? " running" : ""),
        onclick: () => toggleEffort(x, i, exo, d),
      }, effortEnCours
        ? [h("span", { id: `effort-${i}`, class: "effort-temps" }, "…"), h("span", null, "■ Terminer — la série est enregistrée")]
        : [h("span", { class: "effort-temps" }, "▶"), h("span", null, `Lancer la série${objectif ? " · bip à " + formatDuree(objectif[0]) : ""}`)]));
    }
    form.append(h("div", { class: "field" }, h("span", { class: "field-label" }, enEdition ? "Durée" : "Ou saisir la durée à la main"),
      h("input", {
        class: "num-input", inputmode: "decimal", placeholder: "m:ss", value: dureeInput(d.duree_sec), "aria-label": "Durée",
        oninput: (ev) => { d.duree_sec = parseDuree(ev.target.value); save(); },
      })));
  }

  if (hasReps && champ(exo, "rir")) {
    form.append(h("div", { class: "field" }, h("span", { class: "field-label" }, "RIR"),
      h("div", { class: "seg" }, [0, 1, 2, 3, 4].map((n) => h("button", {
        class: d.rir === n ? "selected" : "",
        onclick: () => { d.rir = d.rir === n ? null : n; save(); renderSeance(); },
      }, String(n))))));
  }

  if (champ(exo, "technique")) {
    form.append(h("div", { class: "field" }, h("span", { class: "field-label" }, "Technique"),
      h("div", { class: "seg" },
        h("button", { class: d.technique === "propre" ? "selected ok" : "", onclick: () => { d.technique = d.technique === "propre" ? null : "propre"; save(); renderSeance(); } }, "🟢 Propre"),
        h("button", { class: d.technique === "degradee" ? "selected ko" : "", onclick: () => { d.technique = d.technique === "degradee" ? null : "degradee"; save(); renderSeance(); } }, "🟡 Dégradée"))));
  }

  const noteOuverte = f(i).note || d.commentaire;
  form.append(h("div", { class: "row" },
    h("button", {
      class: "toggle" + (d.echauffement ? " on" : ""),
      onclick: () => {
        if (enEdition) d.echauffement = !d.echauffement;
        else basculerEchauffement(exo, x, d);
        save();
        renderSeance();
      },
    }, d.echauffement ? "☑ Échauffement" : "☐ Échauffement"),
    h("button", { class: "toggle" + (noteOuverte ? " on" : ""), onclick: () => { f(i).note = !f(i).note; renderSeance(); } }, "💬 Note de série")));
  if (noteOuverte) {
    form.append(h("input", {
      class: "text-input", placeholder: "Note sur cette série…", value: d.commentaire || "",
      oninput: (ev) => { d.commentaire = ev.target.value; save(); },
    }));
  }

  if (f(i).erreur) form.append(h("p", { class: "erreur" }, f(i).erreur));

  if (enEdition) {
    form.append(h("div", { class: "row" },
      h("button", { class: "btn-danger", onclick: () => supprimerSerie(x, i) }, "Supprimer"),
      h("button", { class: "btn-ghost", onclick: () => { edition = null; f(i).erreur = null; renderSeance(); } }, "Annuler"),
      h("button", { class: "btn-primary", onclick: () => enregistrerCorrection(x, i, exo) }, "Enregistrer")));
  } else {
    form.append(h("div", { class: "row" },
      hasReps || hasCharge ? h("button", { class: "btn-secondary", onclick: () => copierPrecedente(x, exo, d, avant) }, "= précédente") : null,
      h("button", { class: "btn-primary grow", onclick: () => { debloquerSon(); validerSerie(x, i, exo); } },
        d.echauffement ? "Enregistrer l'échauffement" : `Enregistrer la série ${numeroSerie(exo, x, d.cote)}`)));
  }
  return form;
}

function construireSerie(exo, d, i) {
  const hasReps = champ(exo, "reps") && !exo.reps_fixes;
  const hasCharge = champ(exo, "charge");
  const hasDuree = champ(exo, "duree");
  let err = null;
  if (hasReps && !(d.reps > 0)) err = "Indique le nombre de reps.";
  else if (hasCharge && d.charge == null) err = exo.unite === "kg" ? "Indique la charge (0 si poids du corps)." : "Indique la distance.";
  else if (hasDuree && !(d.duree_sec > 0)) err = "Indique la durée (chrono ou m:ss).";
  else if (exo.unilateral && !d.cote) err = "Choisis le côté.";
  f(i).erreur = err;
  if (err) return null;
  const s = {};
  if (exo.unilateral) s.cote = d.cote;
  if (hasReps) s.reps = Math.round(d.reps);
  if (exo.reps_fixes) s.reps = range(exo.cible_reps)[1];
  if (hasCharge) s.charge = d.charge;
  if (hasDuree) s.duree_sec = Math.round(d.duree_sec);
  if (hasReps && champ(exo, "rir") && d.rir != null) s.rir = d.rir;
  if (champ(exo, "technique") && d.technique) s.technique = d.technique;
  if (champ(exo, "echauffement") && d.echauffement) s.echauffement = true;
  if (d.commentaire && d.commentaire.trim()) s.commentaire = d.commentaire.trim();
  return s;
}

function validerSerie(x, i, exo) {
  const serie = construireSerie(exo, x._draft, i);
  if (!serie) return renderSeance();
  const numero = numeroSerie(exo, x, serie.cote);
  Repos.onValidation(live, serie, cibleRepos(exo, [...x.series, serie]));
  x.series.push(serie);
  if (x.statut === "saute") x.statut = "a_faire";
  x._draft = defaultDraft(exo, x, Store.getPerfPassee(exo.id));
  f(i).note = false;
  const message = `✓ ${serie.echauffement ? "Échauffement" : "Série " + numero}${serie.cote ? (serie.cote === "G" ? " gauche" : " droite") : ""} enregistré${serie.echauffement ? "" : "e"} : ${formatSerie(exo, serie)}`;
  /* Exercice (ou superset entier) terminé : on passe directement au suivant.
     Sinon, superset : le meneur (mollet) reste ouvert, la ligne « à faire » du suiveur apparaît dans sa fiche ;
     une série notée depuis la fiche du suiveur ramène au meneur. */
  const suite = serie.echauffement ? null : exoSuivantSiTermine(i);
  const partenaire = suite != null || serie.echauffement || estMeneur(i) ? null : partenaireSuperset(i);
  const cible = suite != null ? suite : partenaire;
  const complete = !serie.echauffement && suite == null && live.exos.every((y, k) => exoTermine(k));
  toast(message + (suite != null ? ` → ${Store.getExo(live.exos[suite].exo_id).nom}` : complete ? " · séance complète ✓" : ""));
  if (cible != null) { ouvert = cible; edition = null; }
  save();
  vibrer(30);
  renderSeance();
  if (cible != null) defilerVersOuvert();
}

function defilerVersOuvert() {
  const carte = document.querySelector(".exo-card.open");
  if (carte) carte.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* Exercice terminé = nombre de séries de travail prévu atteint (haut de la cible, par côté pour un unilatéral),
   ou exercice marqué « pas fait ». */
function exoTermine(k) {
  const x = live.exos[k];
  if (!x) return true;
  if (x.statut === "saute") return true;
  const exo = Store.getExo(x.exo_id);
  const cible = range(exo.cible_series);
  if (!cible) return false;
  const travail = seriesTravail(x.series);
  const n = exo.unilateral
    ? Math.min(travail.filter((s) => s.cote === "G").length, travail.filter((s) => s.cote === "D").length)
    : travail.length;
  return n >= cible[1];
}

/* Si l'exercice i (et tout son superset) vient d'être terminé : index du prochain exercice pas encore fait
   (d'abord ceux qui suivent dans la séance, puis ceux sautés plus haut), sinon null. */
function exoSuivantSiTermine(i) {
  const x = live.exos[i];
  const groupe = x.superset ? live.exos.map((y, k) => (y.superset === x.superset ? k : -1)).filter((k) => k >= 0) : [i];
  if (!groupe.every(exoTermine)) return null;
  const dernier = Math.max(...groupe);
  const ordre = [...live.exos.keys()].filter((k) => k > dernier).concat([...live.exos.keys()].filter((k) => k < dernier && !groupe.includes(k)));
  const k = ordre.find((k) => !exoTermine(k));
  return k == null ? null : k;
}

/* Le meneur d'un superset est son premier exercice (le mollet), le suiveur le second (le releveur). */
function estMeneur(i) {
  const x = live.exos[i];
  return !!(x && x.superset) && live.exos.findIndex((y) => y.superset === x.superset) === i;
}

/* Côté du suiveur en retard sur le meneur (ex. mollet droit fait, releveur droit pas encore), avec les valeurs proposées. */
function suiveurEnAttente(i) {
  const j = partenaireSuperset(i);
  if (j == null) return null;
  const meneur = seriesTravail(live.exos[i].series);
  const suiveur = live.exos[j];
  if (suiveur.statut === "saute") return null;
  const faits = seriesTravail(suiveur.series);
  const vus = { G: 0, D: 0 };
  for (const s of meneur) {
    const c = s.cote || "D";
    vus[c]++;
    if (faits.filter((t) => (t.cote || "D") === c).length < vus[c]) {
      const exoS = Store.getExo(suiveur.exo_id);
      const avant = Store.getPerfPassee(exoS.id);
      const ref = [...faits].reverse().find((t) => t.cote === c) || faits[faits.length - 1]
        || (avant ? seriesTravail(avant.entry.series).find((t) => t.cote === c) : null)
        || { reps: range(exoS.cible_reps) ? range(exoS.cible_reps)[0] : null, charge: null };
      return { j, cote: c, exo: exoS, reps: ref.reps, charge: ref.charge };
    }
  }
  return null;
}

function renderSuiveurEnAttente(a) {
  const cote = a.cote === "G" ? "gauche" : "droite";
  const pret = a.reps != null && (a.charge != null || !champ(a.exo, "charge"));
  const valeurs = pret ? formatSerie(a.exo, { reps: a.reps, charge: a.charge }) : "valeurs à saisir";
  return h("div", { class: "suiveur" },
    h("span", null, h("strong", null, `${a.exo.nom.split(" — ")[0]} ${cote}`), ` : ${valeurs}`),
    h("div", { class: "row tight" },
      pret ? h("button", { class: "btn-primary", onclick: () => suiveurFait(a) }, "✓ Fait") : null,
      h("button", { class: "btn-ghost", onclick: () => modifierSuiveur(a) }, pret ? "Modifier" : "Saisir")));
}

/* Enregistre la série du suiveur sans toucher au chrono de repos du meneur (le releveur se fait pendant ce repos). */
function suiveurFait(a) {
  debloquerSon();
  const y = live.exos[a.j];
  const serie = { cote: a.cote, reps: a.reps };
  if (champ(a.exo, "charge")) serie.charge = a.charge;
  y.series.push(serie);
  if (y.statut === "saute") y.statut = "a_faire";
  y._draft = Object.assign({}, y._draft || {}, { cote: autreCote(a.cote), reps: a.reps, charge: a.charge, commentaire: "" });
  const suite = exoSuivantSiTermine(a.j);
  toast(`✓ ${a.exo.nom.split(" — ")[0]} ${a.cote === "G" ? "gauche" : "droite"} enregistré : ${formatSerie(a.exo, serie)}`
    + (suite != null ? ` → ${Store.getExo(live.exos[suite].exo_id).nom}` : ""));
  if (suite != null) { ouvert = suite; edition = null; }
  save();
  vibrer(30);
  renderSeance();
  if (suite != null) defilerVersOuvert();
}

function modifierSuiveur(a) {
  const y = live.exos[a.j];
  y._draft = Object.assign({}, y._draft || {}, { cote: a.cote, reps: a.reps, charge: a.charge });
  ouvert = a.j;
  edition = null;
  save();
  renderSeance();
  defilerVersOuvert();
}

/* Index de l'autre exercice du même superset, ou null. */
function partenaireSuperset(i) {
  const x = live.exos[i];
  if (!x || !x.superset) return null;
  const j = live.exos.findIndex((y, k) => k !== i && y.superset === x.superset);
  return j >= 0 ? j : null;
}

function enregistrerCorrection(x, i, exo) {
  const serie = construireSerie(exo, x._edit, i);
  if (!serie) return renderSeance();
  const ancienne = x.series[edition.si];
  if (ancienne.repos_avant_sec != null) { serie.repos_avant_sec = ancienne.repos_avant_sec; serie.repos_precision = ancienne.repos_precision; }
  x.series[edition.si] = serie;
  edition = null;
  save();
  renderSeance();
}

function supprimerSerie(x, i) {
  if (!confirm("Supprimer cette série ?")) return;
  x.series.splice(edition.si, 1);
  edition = null;
  f(i).erreur = null;
  save();
  renderSeance();
}

function copierPrecedente(x, exo, d, avant) {
  const ref = x.series[x.series.length - 1] || (avant ? seriesTravail(avant.entry.series)[0] : null);
  if (!ref) return;
  if (ref.reps != null) d.reps = ref.reps;
  if (ref.charge != null) d.charge = ref.charge;
  if (ref.duree_sec != null) d.duree_sec = ref.duree_sec;
  save();
  renderSeance();
}

/* Chrono d'effort (corde…) : le lancer met fin au repos ; le terminer enregistre la série et lance le repos.
   Bip quand l'objectif de durée est atteint, le chrono continue ensuite. */
function toggleEffort(x, i, exo, d) {
  debloquerSon();
  if (live.effort && live.effort.idx === i) {
    d.duree_sec = Math.round((Date.now() - live.effort.start_ts) / 1000);
    live.effort = null;
    Repos.serieFinie(live, cibleRepos(exo, [...x.series, { cote: d.cote, echauffement: d.echauffement }]));
    save();
    vibrer(30);
    validerSerie(x, i, exo);
    return;
  }
  if (live.repos) Repos.jeRepars(live);
  live.effort = { idx: i, start_ts: Date.now(), bip: false };
  save();
  vibrer(30);
  renderSeance();
}

/* ---------- Barre de repos (toujours en haut pendant la séance) ---------- */

function cibleDepuisExoOuvert() {
  if (ouvert == null || !live.exos[ouvert]) return null;
  const x = live.exos[ouvert];
  const exo = Store.getExo(x.exo_id);
  const d = x._draft || {};
  return cibleRepos(exo, [...x.series, { cote: d.cote, echauffement: d.echauffement }]);
}

function renderReposBar() {
  const bar = $("repos-bar");
  const actif = vue === "seance" && live;
  document.body.classList.toggle("has-bar", !!actif);
  bar.style.display = actif ? "" : "none";
  if (!actif) return;
  const st = Repos.etat(live);
  const temps = $("repos-temps"), sub = $("repos-sub"), btn = $("repos-btn");
  bar.className = "repos-bar " + (st ? st.phase : "idle");
  /* Clignote le bouton qu'on risque d'oublier : « Je repars » une fois le repos minimum atteint,
     puis « Série finie » pendant la série qui suit (jusqu'à l'appui ou la validation de la série).
     Rien pendant le décompte du repos, ni pendant un chrono d'effort (corde), qui a son propre bouton. */
  const clignote = st ? st.phase === "pret" || st.phase === "depasse" : !!live.reposEnAttente && !live.effort;
  btn.classList.toggle("clignote", clignote);
  if (!st) {
    dernierePhase = null;
    temps.textContent = live.reposEnAttente ? formatDuree(live.reposEnAttente.sec) : "Repos";
    sub.textContent = live.reposEnAttente ? "repos noté" : "à la fin de la série :";
    btn.textContent = "⏱ Série finie";
    return;
  }
  /* Pré-sonnerie : un bip court 10 s avant le bas de la fourchette (repos assez longs seulement). */
  if (st.cible && st.cible[0] > 20 && !live.repos.prebip && st.ecoule >= st.cible[0] - 10 && st.ecoule < st.cible[0]) {
    live.repos.prebip = true;
    save();
    bip(1);
  }
  if (dernierePhase === "decompte" && st.phase === "pret") bip(2);
  if (dernierePhase === "pret" && st.phase === "depasse") vibrer(400);
  dernierePhase = st.phase;
  temps.textContent = formatDuree(Math.floor(st.ecoule));
  sub.textContent = st.cible ? `repos · cible ${formatRange(st.cible, formatDuree)}` : "repos";
  btn.textContent = "▶ Je repars";
}

function onReposBtn() {
  if (!live) return;
  debloquerSon();
  if (live.repos) Repos.jeRepars(live);
  else Repos.serieFinie(live, cibleDepuisExoOuvert());
  save();
  vibrer(30);
  if (vue === "seance") renderSeance(); else renderReposBar();
}

function tick() {
  if (vue !== "seance" || !live) return;
  renderReposBar();
  if (live.effort) {
    const ecoule = Math.floor((Date.now() - live.effort.start_ts) / 1000);
    const el = $(`effort-${live.effort.idx}`);
    if (el) el.textContent = formatDuree(ecoule);
    const x = live.exos[live.effort.idx];
    const objectif = x ? range(Store.getExo(x.exo_id).cible_temps_sec) : null;
    if (objectif && !live.effort.bip && ecoule >= objectif[0]) {
      live.effort.bip = true;
      save();
      bip(3);
    }
  }
}

/* ---------- Fin de séance ---------- */

function renderFin() {
  const nonFaits = live.exos.map((x, i) => ({ x, i })).filter(({ x }) => !seriesTravail(x.series).length);
  const faits = live.exos.length - nonFaits.length;
  const els = [
    h("header", { class: "seance-head" }, h("h1", null, "Fin de séance"),
      h("button", { class: "btn-ghost", onclick: () => { vue = "seance"; renderSeance(); } }, "← Séance")),
    h("p", { class: "muted" }, `${faits} exercice(s) fait(s) sur ${live.exos.length} · ${Math.round((Date.now() - live.debut_ts) / 60000)} min`),
  ];

  if (nonFaits.length) {
    els.push(h("section", { class: "card" }, h("p", { class: "label" }, "Pas faits — pourquoi ?"),
      nonFaits.map(({ x }) => {
        const exo = Store.getExo(x.exo_id);
        const actuelle = x.raison || "Pas le temps";
        return h("div", { class: "nonfait" }, h("p", null, exo.nom),
          h("div", { class: "chips" }, RAISONS_SAUT.map((r) => h("button", {
            class: "chip" + (r.label === actuelle ? " selected" : ""),
            onclick: () => { x.raison = r.label; save(); renderFin(); },
          }, r.label))));
      })));
  }

  els.push(h("textarea", {
    class: "comment-box", placeholder: "Commentaire de séance (forme, contexte, sensations…)",
    value: live.commentaire_seance || "",
    oninput: (ev) => { live.commentaire_seance = ev.target.value; save(); },
  }));
  els.push(h("div", { class: "chips" }, TAGS_DISPONIBLES.map((t) => h("button", {
    class: "chip" + (live.tags.includes(t) ? " selected" : ""),
    onclick: () => { live.tags = live.tags.includes(t) ? live.tags.filter((y) => y !== t) : [...live.tags, t]; save(); renderFin(); },
  }, t))));
  els.push(h("button", { class: "btn-primary btn-block", onclick: (ev) => validerEtArchiver(ev.target) }, "Valider et archiver"));
  monter(...els);
}

async function validerEtArchiver(btn) {
  if (!confirm("Archiver la séance ? Elle ne sera plus modifiable.")) return;
  btn.disabled = true;
  /* La fenêtre Google doit s'ouvrir tout de suite après le clic, sinon le navigateur la bloque. */
  let erreurGoogle = null;
  const google = DriveAuth.ensureToken().catch((err) => { erreurGoogle = err; });

  live.exos.forEach((x) => { if (!seriesTravail(x.series).length && !x.raison) x.raison = "Pas le temps"; });
  Repos.arreter(live);
  live.effort = null;
  const archive = Store.finaliserSeance(live);
  live = null;
  Ecran.relacher();
  vue = "apres";

  const status = h("p", { class: "muted" }, "Envoi vers Drive…");
  monter(
    h("h1", null, "Séance archivée ✓"),
    h("section", { class: "card" }, h("p", null, `${dateFr(archive.date)} — ${Store.getModele(archive.modele).nom} · ${archive.duree_min} min`), resumeCourt(archive)),
    status,
    h("details", null, h("summary", null, "Voir le résumé envoyé"), h("pre", { class: "resume" }, buildResumeMarkdown(archive))),
    h("button", { class: "btn-primary btn-block", onclick: retourAccueil }, "Retour à l'accueil"));

  await google;
  if (erreurGoogle) {
    status.textContent = `Séance enregistrée sur le téléphone. Pas encore dans Drive (${erreurGoogle.message}) : tu pourras l'envoyer depuis l'accueil.`;
    return;
  }
  try {
    await envoyerOutbox((msg) => { status.textContent = msg; });
    status.textContent = "✅ Séance enregistrée et envoyée dans Drive.";
  } catch (err) {
    status.textContent = `Séance enregistrée sur le téléphone, mais l'envoi Drive a échoué (${err.message}). Réessaie depuis l'accueil.`;
  }
}

/* ---------- Historique par séance ---------- */

function renderHistoriqueSeances() {
  vue = "historique";
  const lignes = Store.getArchives().map((a) => h("button", { class: "list-row", onclick: () => renderSeanceDetail(a.id, renderHistoriqueSeances) },
    h("span", null, `${dateFr(a.date)} — ${Store.getModele(a.modele).nom}${a.duree_min ? ` · ${a.duree_min} min` : ""}`),
    resumeCourt(a)));
  monter(
    h("header", { class: "seance-head" }, h("h1", null, "Séances"), h("button", { class: "btn-ghost", onclick: retourAccueil }, "← Accueil")),
    h("p", { class: "muted small" }, `${lignes.length} séances, de la plus récente à la plus ancienne.`),
    lignes);
}

function renderSeanceDetail(id, retour) {
  vue = "historique";
  const a = Store.getArchive(id);
  if (!a) return renderHistoriqueSeances();
  const infos = [
    a.duree_min ? `${a.duree_min} min` : null,
    a.lieu ? (a.lieu === "maison" ? "à la maison" : "en salle") : null,
    a.tags && a.tags.length ? "tags : " + a.tags.join(", ") : null,
  ].filter(Boolean).join(" · ");
  const exos = a.exos.map((x) => {
    const exo = Store.getExo(x.exo_id);
    const total = totalSeance(exo, x.series);
    let n = 0;
    return h("section", { class: "card hist" },
      h("p", { class: "hist-head" }, h("strong", null, exo.nom),
        h("span", { class: "badge " + (x.statut === "saute" ? "skip" : x.statut === "partiel" ? "partial" : "done") }, x.statut === "saute" ? "pas fait" : x.statut)),
      x.statut === "saute"
        ? h("p", { class: "muted" }, x.raison || x.commentaire || "")
        : [h("p", null, h("strong", null, formatSeries(exo, x.series)), total != null ? ` · ${formatTotalDe(exo, x.series)}` : ""),
           h("div", { class: "hist-detail" }, x.series.map((s) => h("p", { class: s.echauffement ? "ech" : "" }, (s.echauffement ? "éch. " : `${++n}. `) + detailSerie(exo, s)))),
           x.commentaire ? h("p", { class: "note" }, "💬 " + x.commentaire) : null]);
  });
  monter(
    h("header", { class: "seance-head" },
      h("div", null, h("h1", null, dateFr(a.date)), h("p", { class: "muted" }, Store.getModele(a.modele).nom)),
      h("button", { class: "btn-ghost", onclick: () => (retour === renderAccueil ? retourAccueil() : retour()) }, "← Retour")),
    infos ? h("p", { class: "muted small" }, infos) : null,
    a.commentaire_seance ? h("p", { class: "note" }, "💬 " + a.commentaire_seance) : null,
    exos,
    Store.estArchiveApp(a.id) ? boutonSupprimer(a) : null);
  window.scrollTo(0, 0);
}

/* ---------- Historique par exercice ---------- */

function renderHistorique() {
  vue = "historique";
  const actuels = [];
  for (const m of Store.getModelesActifs()) for (const b of m.blocs) for (const slot of b.slots) {
    for (const id of typeof slot === "string" ? [slot] : slot.variantes || [slot.exo]) if (!actuels.includes(id)) actuels.push(id);
  }
  const autres = Store.getExosAvecHistorique().filter((id) => !actuels.includes(id));
  const ligne = (id) => {
    const exo = Store.getExo(id);
    const hist = Store.getHistoriqueExo(id).filter((y) => seriesTravail(y.entry.series).length);
    return h("button", { class: "list-row", onclick: () => allerA(() => renderHistoriqueExo(id)) },
      h("span", null, exo.nom),
      h("span", { class: "muted small" }, hist.length ? `${hist.length} séance(s) · ${dateFr(hist[0].date)}` : "jamais fait"));
  };
  monter(
    h("header", { class: "seance-head" }, h("h1", null, "Historique"), h("button", { class: "btn-ghost", onclick: retourAccueil }, "← Accueil")),
    h("h2", null, "Programme actuel"), actuels.map(ligne),
    autres.length ? h("h2", null, "Anciens exercices") : null, autres.map(ligne));
}

function renderHistoriqueExo(id) {
  vue = "historique";
  const exo = Store.getExo(id);
  const rs = Store.getRecordSerie(id);
  const rt = Store.getRecordSeance(id);
  const entrees = Store.getHistoriqueExo(id).map(({ date, entry }) => {
    const total = totalSeance(exo, entry.series);
    let n = 0;
    return h("section", { class: "card hist" },
      h("p", { class: "hist-head" }, h("strong", null, dateFr(date)), h("span", { class: "badge " + (entry.statut === "saute" ? "skip" : entry.statut === "partiel" ? "partial" : "done") }, entry.statut === "saute" ? "pas fait" : entry.statut)),
      entry.statut === "saute"
        ? h("p", { class: "muted" }, entry.raison || entry.commentaire || "")
        : [h("p", null, h("strong", null, formatSeries(exo, entry.series)), total != null ? ` · ${formatTotalDe(exo, entry.series)}` : ""),
           h("div", { class: "hist-detail" }, entry.series.map((s) => h("p", { class: s.echauffement ? "ech" : "" }, (s.echauffement ? "éch. " : `${++n}. `) + detailSerie(exo, s)))),
           entry.commentaire ? h("p", { class: "note" }, "💬 " + entry.commentaire) : null]);
  });
  monter(
    h("header", { class: "seance-head" }, h("h1", null, exo.nom), h("button", { class: "btn-ghost", onclick: () => renderHistorique() }, "← Liste")),
    h("p", { class: "cible" }, "Cible : " + (formatCible(exo) || "—")),
    h("p", { class: "muted" }, `Meilleure série : ${rs ? formatSerie(exo, rs.serie) + " (" + dateFr(rs.date) + ")" : "—"} · Meilleur total sur l'exo en une séance : ${rt ? formatTotal(exo, rt.total) + " (" + dateFr(rt.date) + ")" : "—"}`),
    entrees.length ? entrees : h("p", { class: "muted" }, "Aucune séance enregistrée."));
}
