const TAGS_DISPONIBLES = ["decharge", "avant_course", "fatigue", "test_max", "reprise"];
const RAISONS_SAUT = [
  { id: "machine", label: "Machine prise" },
  { id: "douleur", label: "Douleur" },
  { id: "temps", label: "Temps" },
  { id: "choix", label: "Choix" },
];

let live = null;
let openKey = null;
let timerInterval = null;

function $(id) { return document.getElementById(id); }
function show(id) { $(id).hidden = false; }
function hide(id) { $(id).hidden = true; }

function showView(name) {
  ["view-connect", "view-accueil", "view-seance", "view-fin"].forEach(hide);
  show(`view-${name}`);
}

/* ---------- Accueil ---------- */

function renderAccueil() {
  const derniere = Store.getDerniereArchive();
  const prochain = Store.prochainModele();
  const modele = Store.getModele(prochain);

  $("derniere-seance-resume").innerHTML = derniere
    ? `<p>Dernière séance : <strong>${derniere.modele}</strong> le ${derniere.date}${derniere.duree_min ? " (" + derniere.duree_min + " min)" : ""}</p>`
    : `<p>Aucune séance archivée pour l'instant.</p>`;

  $("btn-demarrer").textContent = `Démarrer ${modele.nom} (${prochain})`;
  $("btn-demarrer").onclick = () => demarrerOuReprendre(prochain);

  showView("accueil");
}

function demarrerOuReprendre(modeleId) {
  live = Store.getSeanceLive();
  if (!live) live = Store.demarrerSeance(modeleId);
  openKey = null;
  renderSeance();
}

/* ---------- Écran séance ---------- */

function renderSeance() {
  const modele = Store.getModele(live.modele);
  $("seance-titre").textContent = `${modele.nom} — ${live.date}`;
  $("echauffement-rappel").textContent = modele.echauffement;

  const container = $("blocs-container");
  container.innerHTML = "";

  live.blocs.forEach((bloc, bi) => {
    const blocEl = document.createElement("div");
    blocEl.className = "bloc";
    const titre = document.createElement("h2");
    titre.textContent = bloc.titre;
    blocEl.appendChild(titre);

    bloc.exos.forEach((e, ei) => {
      blocEl.appendChild(renderExoCard(e, bi, ei));
    });

    container.appendChild(blocEl);
  });

  showView("seance");
}

function renderExoCard(e, bi, ei) {
  const exo = Store.getExo(e.exo_id);
  const key = `${bi}-${ei}`;
  const isOpen = key === openKey;

  const card = document.createElement("div");
  card.className = "exo-card" + (isOpen ? " open" : "") + (e.statut === "saute" ? " saute" : "");

  const header = document.createElement("button");
  header.className = "exo-header";
  header.innerHTML = `
    <span class="exo-nom">${exo.nom}${e.statut === "saute" ? " (sauté)" : ""}</span>
    <span class="exo-meta">${exo.reglages || ""}</span>
  `;
  header.onclick = () => { openKey = isOpen ? null : key; renderSeance(); };
  card.appendChild(header);

  if (isOpen) card.appendChild(renderExoBody(e, exo, bi, ei));

  return card;
}

function renderExoBody(e, exo, bi, ei) {
  const body = document.createElement("div");
  body.className = "exo-body";

  const perfPassee = Store.getPerfPassee(exo.id, live.date);
  const record = Store.getRecord(exo.id);

  const cibleTxt = formatCible(exo);
  body.innerHTML += `
    <p class="cible">Cible : ${cibleTxt}</p>
    <p class="bandeau">Perf. passée : <strong>${perfPassee ? formatSeries(exo, perfPassee.series) : "absent"}</strong>
      &nbsp;·&nbsp; Record : <strong>${record ? formatSeries(exo, [record]) : "absent"}</strong></p>
    ${exo.consignes ? `<p class="consignes">${exo.consignes}</p>` : ""}
  `;

  const journal = document.createElement("div");
  journal.className = "series-log";
  journal.innerHTML = e.series.length
    ? "Séries faites : " + formatSeries(exo, e.series)
    : "Aucune série encore.";
  body.appendChild(journal);

  if (e.statut !== "saute") {
    body.appendChild(renderSaisie(e, exo, bi, ei, perfPassee));
  }

  const actions = document.createElement("div");
  actions.className = "exo-actions";

  const btnComment = document.createElement("button");
  btnComment.textContent = "💬 Commentaire";
  btnComment.onclick = () => toggleComment(bi, ei);
  actions.appendChild(btnComment);

  if (e.statut !== "saute") {
    const btnSkip = document.createElement("button");
    btnSkip.textContent = "Passer";
    btnSkip.onclick = () => toggleSkipReasons(bi, ei);
    actions.appendChild(btnSkip);
  } else {
    const btnUnskip = document.createElement("button");
    btnUnskip.textContent = "Annuler le saut";
    btnUnskip.onclick = () => { e.statut = "a_faire"; e.commentaire = ""; Store.saveSeanceLive(live); renderSeance(); };
    actions.appendChild(btnUnskip);
  }

  body.appendChild(actions);

  if (e._showComment) {
    const textarea = document.createElement("textarea");
    textarea.className = "comment-box";
    textarea.value = e.commentaire || "";
    textarea.placeholder = "Commentaire sur l'exo…";
    textarea.oninput = () => { e.commentaire = textarea.value; Store.saveSeanceLive(live); };
    body.appendChild(textarea);
  }

  if (e._showSkipReasons) {
    const raisons = document.createElement("div");
    raisons.className = "raisons-saut";
    RAISONS_SAUT.forEach((r) => {
      const b = document.createElement("button");
      b.textContent = r.label;
      b.onclick = () => { e.statut = "saute"; e.commentaire = r.label; e._showSkipReasons = false; Store.saveSeanceLive(live); renderSeance(); };
      raisons.appendChild(b);
    });
    body.appendChild(raisons);
  }

  return body;
}

function renderSaisie(e, exo, bi, ei, perfPassee) {
  const wrap = document.createElement("div");
  wrap.className = "saisie";

  if (exo.type_mesure === "temps") {
    wrap.appendChild(renderChrono(e, (sec) => ajouterSerie(e, exo, bi, ei, { duree_sec: sec })));
    return wrap;
  }

  const state = e._draft || (e._draft = defaultDraft(exo, e, perfPassee));

  if (exo.type_mesure !== "temps_charge") {
    wrap.appendChild(renderStepper("Reps", state.reps, 1, (v) => { state.reps = v; renderSeance(); }));
  }
  wrap.appendChild(renderStepper("Charge (kg)", state.charge, 2.5, (v) => { state.charge = v; renderSeance(); }));

  const row = document.createElement("div");
  row.className = "saisie-actions";

  const btnPrev = document.createElement("button");
  btnPrev.textContent = "= série précédente";
  btnPrev.onclick = () => {
    const ref = e.series.length ? e.series[e.series.length - 1] : perfPassee && perfPassee.series[perfPassee.series.length - 1];
    if (ref) { state.reps = ref.reps ?? state.reps; state.charge = ref.charge ?? state.charge; }
    renderSeance();
  };
  row.appendChild(btnPrev);

  const btnValider = document.createElement("button");
  btnValider.className = "btn-primary";
  btnValider.textContent = "Valider la série";
  btnValider.onclick = () => {
    const serie = exo.type_mesure === "temps_charge" ? { charge: state.charge } : { reps: state.reps, charge: state.charge };
    ajouterSerie(e, exo, bi, ei, serie);
  };
  row.appendChild(btnValider);

  wrap.appendChild(row);
  return wrap;
}

function defaultDraft(exo, e, perfPassee) {
  const ref = e.series.length ? e.series[e.series.length - 1] : perfPassee && perfPassee.series[0];
  return {
    reps: (ref && ref.reps) ?? (exo.cible_reps ? exo.cible_reps[0] : 0),
    charge: (ref && ref.charge) ?? 0,
  };
}

function renderStepper(label, value, step, onChange) {
  const row = document.createElement("div");
  row.className = "stepper";
  const minus = document.createElement("button");
  minus.textContent = "−";
  minus.onclick = () => onChange(Math.max(0, round1(value - step)));
  const val = document.createElement("span");
  val.textContent = `${label} : ${value}`;
  const plus = document.createElement("button");
  plus.textContent = "+";
  plus.onclick = () => onChange(round1(value + step));
  row.append(minus, val, plus);
  return row;
}

function round1(n) { return Math.round(n * 10) / 10; }

function renderChrono(e, onStop) {
  const wrap = document.createElement("div");
  wrap.className = "chrono";
  const display = document.createElement("span");
  display.textContent = "0:00";
  const btn = document.createElement("button");
  btn.className = "btn-primary";
  btn.textContent = "Démarrer";

  let startTs = null;
  let interval = null;

  btn.onclick = () => {
    if (startTs === null) {
      startTs = Date.now();
      btn.textContent = "Arrêter";
      interval = setInterval(() => { display.textContent = formatDuree(Math.floor((Date.now() - startTs) / 1000)); }, 250);
    } else {
      clearInterval(interval);
      const sec = Math.floor((Date.now() - startTs) / 1000);
      startTs = null;
      btn.textContent = "Démarrer";
      display.textContent = "0:00";
      onStop(sec);
    }
  };

  wrap.append(display, btn);
  return wrap;
}

function ajouterSerie(e, exo, bi, ei, serie) {
  e.series.push(serie);
  e.statut = "fait";
  delete e._draft;
  Store.saveSeanceLive(live);
  renderSeance();
  if (exo.repos_sec) startRestTimer(exo.repos_sec);
}

function toggleComment(bi, ei) {
  const e = live.blocs[bi].exos[ei];
  e._showComment = !e._showComment;
  renderSeance();
}

function toggleSkipReasons(bi, ei) {
  const e = live.blocs[bi].exos[ei];
  e._showSkipReasons = !e._showSkipReasons;
  renderSeance();
}

/* ---------- Chrono de repos ---------- */

function startRestTimer(sec) {
  clearInterval(timerInterval);
  const bar = $("rest-timer");
  let remaining = sec;
  show("rest-timer");
  bar.textContent = `Repos : ${formatDuree(remaining)}`;
  bar.classList.remove("done");
  timerInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(timerInterval);
      bar.textContent = "Repos terminé !";
      bar.classList.add("done");
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      setTimeout(() => hide("rest-timer"), 4000);
    } else {
      bar.textContent = `Repos : ${formatDuree(remaining)}`;
    }
  }, 1000);
}

/* ---------- Fin de séance ---------- */

function renderFin() {
  $("commentaire-seance").value = live.commentaire_seance || "";

  const tagsEl = $("tags-container");
  tagsEl.innerHTML = "";
  TAGS_DISPONIBLES.forEach((tag) => {
    const btn = document.createElement("button");
    btn.textContent = tag;
    btn.className = "tag" + (live.tags.includes(tag) ? " selected" : "");
    btn.onclick = () => {
      live.tags = live.tags.includes(tag) ? live.tags.filter((t) => t !== tag) : [...live.tags, tag];
      Store.saveSeanceLive(live);
      renderFin();
    };
    tagsEl.appendChild(btn);
  });

  showView("fin");
}

async function validerEtArchiver() {
  live.commentaire_seance = $("commentaire-seance").value;
  Store.saveSeanceLive(live);

  const archive = Store.finaliserSeance(live.commentaire_seance, live.tags);
  const resume = buildResumeMarkdown(archive);

  $("resume-preview").textContent = "Écriture dans Drive…";
  try {
    await DriveAuth.writeOrUpdateFile("journal-muscu-derniere-seance.md", resume, "text/markdown");
    await DriveAuth.writeOrUpdateFile(`journal-muscu-archive-${archive.date}-${archive.modele}.md`, resume, "text/markdown");
    $("resume-preview").textContent = "Séance archivée et écrite dans ton Drive.";
  } catch (err) {
    $("resume-preview").textContent = "Séance archivée localement, mais échec d'écriture Drive : " + err;
  }

  live = null;
  openKey = null;
}

/* ---------- Résumé Markdown (cahier des charges §5) ---------- */

function formatCible(exo) {
  if (exo.type_mesure === "reps_charge" || exo.type_mesure === "reps_seules") {
    return `${exo.cible_series}x${exo.cible_reps[0]}-${exo.cible_reps[1]}, repos ${formatDuree(exo.repos_sec)}`;
  }
  if (exo.type_mesure === "temps") return `${exo.cible_series} séries, repos ${formatDuree(exo.repos_sec)}`;
  if (exo.type_mesure === "temps_charge") return `${exo.cible_series}x${formatDuree(exo.cible_temps_sec)}, repos ${formatDuree(exo.repos_sec)}`;
  return `${exo.cible_series} séries`;
}

function meilleureSerie(exo, series) {
  let best = null;
  for (const s of series) if (!best || isBetterSet(exo, s, best)) best = s;
  return best;
}

function computeDelta(exo, perfSeries, realiseSeries) {
  if (!perfSeries || !realiseSeries || !realiseSeries.length) return "—";
  const prev = meilleureSerie(exo, perfSeries);
  const now = meilleureSerie(exo, realiseSeries);
  if (!prev || !now) return "—";
  if (exo.type_mesure === "temps") {
    const d = (now.duree_sec || 0) - (prev.duree_sec || 0);
    return (d >= 0 ? "+" : "") + d + "s";
  }
  let d = (now.charge || 0) - (prev.charge || 0);
  if (exo.charge_inversee) d = -d;
  return (d >= 0 ? "+" : "") + d + "kg";
}

function tonnage(archive) {
  let t = 0;
  for (const e of archive.exos) {
    const exo = Store.getExo(e.exo_id);
    if (exo.type_mesure === "reps_charge" && !exo.charge_inversee) {
      t += e.series.reduce((s, ser) => s + (ser.reps || 0) * (ser.charge || 0), 0);
    }
  }
  return t;
}

function buildResumeMarkdown(archive) {
  const modele = Store.getModele(archive.modele);
  const lines = [];
  lines.push(`# Séance ${archive.modele} — ${archive.date}`, "");
  lines.push(`Modèle : ${modele.nom} (v${archive.version_programme ?? modele.version})`);
  lines.push(`Durée : ${archive.duree_min != null ? archive.duree_min + " min" : "non mesurée"}`);
  lines.push(`Tags : ${archive.tags.length ? archive.tags.join(", ") : "aucun"}`);
  lines.push(`Commentaire : ${archive.commentaire_seance || "—"}`, "");
  lines.push("## Exercices", "", "| Exercice | Cible | Perf. passée | Réalisé | Δ | Commentaire |", "|---|---|---|---|---|---|");

  const ecarts = [];
  const questions = [];

  for (const e of archive.exos) {
    const exo = Store.getExo(e.exo_id);
    const perfObj = Store.getPerfPassee(e.exo_id, archive.date);
    const perfTxt = perfObj ? formatSeries(exo, perfObj.series) : "absent";
    const realiseTxt = e.statut === "saute" ? "sauté" : formatSeries(exo, e.series);
    const delta = e.statut === "saute" ? "—" : computeDelta(exo, perfObj ? perfObj.series : null, e.series);
    lines.push(`| ${exo.nom} | ${formatCible(exo)} | ${perfTxt} | ${realiseTxt} | ${delta} | ${(e.commentaire || "").replace(/\|/g, "/")} |`);

    if (e.statut === "saute") ecarts.push(`- ${exo.nom} : sauté (${e.commentaire || "raison non précisée"})`);
    if (delta.startsWith("-")) questions.push(`- ${exo.nom} : baisse vs perf. passée (${delta})`);
  }

  lines.push("", "## Écarts au programme", ecarts.length ? ecarts.join("\n") : "Aucun écart.");

  lines.push("", "## Repères historiques (record par exo)");
  for (const e of archive.exos) {
    const exo = Store.getExo(e.exo_id);
    const record = Store.getRecord(e.exo_id);
    lines.push(`- ${exo.nom} : ${record ? formatSeries(exo, [record]) : "absent"}`);
  }

  lines.push("", "## Tendances");
  lines.push(`Tonnage de la séance (exos reps_charge uniquement, hors charge inversée) : ${tonnage(archive)} kg.`);
  const precedentes = Store.getArchives().filter((a) => a.modele === archive.modele && a.date < archive.date).slice(0, 3);
  lines.push(
    precedentes.length
      ? `3 séances précédentes du même modèle : ${precedentes.map((a) => `${a.date}: ${tonnage(a)}kg`).join(", ")}.`
      : "Pas assez d'historique pour comparer."
  );

  lines.push("", "## Contexte");
  lines.push(`Tags de cette séance : ${archive.tags.length ? archive.tags.join(", ") : "aucun"}.`);

  lines.push("", "## Questions ouvertes");
  lines.push(questions.length ? questions.join("\n") : "Rien de particulier détecté automatiquement.");

  return lines.join("\n");
}
