/* Fichiers écrits dans Drive (cahier des charges §2.7 et §5), lus ensuite par Claude dans le projet Trail.
   - journal-muscu-derniere-seance.md : la dernière séance (écrasé à chaque fois)
   - seance-AAAA-MM-JJ-MODELE.md     : une archive par séance
   - exo-<id>.md                      : tout l'historique d'un exercice, une ligne par date
   - journal-muscu-archives.json      : sauvegarde complète, au format brut */

const PRECISION_REPOS = { exact: "exact", depart_tardif: "départ tardif", approximatif: "approx., inclut la série" };
const TECHNIQUE_TXT = { propre: "🟢 propre", degradee: "🟡 dégradée" };

function detailSerie(exo, s) {
  const parts = [];
  if (s.cote) parts.push(s.cote);
  parts.push(formatSerie(exo, s));
  if (s.rir != null) parts.push(`RIR ${s.rir}`);
  if (s.technique) parts.push(TECHNIQUE_TXT[s.technique] || s.technique);
  if (s.repos_avant_sec != null) parts.push(`repos avant ${formatDuree(s.repos_avant_sec)} (${PRECISION_REPOS[s.repos_precision] || "?"})`);
  let txt = parts.join(" · ");
  if (s.commentaire) txt += ` — « ${s.commentaire} »`;
  return txt;
}

function commentairesExo(entry) {
  const out = [];
  if (entry.commentaire) out.push(entry.commentaire);
  if (entry.raison && entry.raison !== entry.commentaire) out.push(`raison : ${entry.raison}`);
  return out.join(" ; ");
}

function cell(txt) {
  return String(txt == null ? "" : txt).replace(/\|/g, "/").replace(/\n/g, " ");
}

function buildResumeMarkdown(archive) {
  const modele = Store.getModele(archive.modele);
  const L = [];
  L.push(`# Séance ${modele.nom} — ${archive.date}`, "");
  L.push(`- Modèle : ${archive.modele}${archive.version_programme != null ? " (v" + archive.version_programme + ")" : ""}`);
  L.push(`- Durée : ${archive.duree_min != null ? archive.duree_min + " min" : "non mesurée"}`);
  L.push(`- Tags : ${archive.tags && archive.tags.length ? archive.tags.join(", ") : "aucun"}`);
  L.push(`- Commentaire de séance : ${archive.commentaire_seance || "—"}`, "");
  L.push("*Généré par Journal Muscu. Échauffement noté à part : jamais compté dans le Σ (charge totale) ni dans les records.*", "");

  if (!modele.actif) L.push("*Séance d'un ancien programme : la colonne « Cible » n'est pas renseignée (la cible de l'époque n'est pas archivée).*", "");
  L.push("## Vue d'ensemble", "", "| Exercice | Cible | Dernière fois | Réalisé | Σ / total | Statut | Commentaire |", "|---|---|---|---|---|---|---|");
  const ecarts = [];
  const questions = [];
  for (const x of archive.exos) {
    const exo = Store.getExo(x.exo_id);
    const avant = Store.getPerfPassee(x.exo_id, archive);
    const avantTxt = avant ? `${formatSeries(exo, avant.entry.series)} (${avant.date})` : "absent";
    const total = totalSeance(exo, x.series);
    const cible = modele.actif ? formatCible(exo) : "—";
    L.push(`| ${cell(exo.nom)} | ${cell(cible)} | ${cell(avantTxt)} | ${cell(x.statut === "saute" ? "pas fait" : formatSeries(exo, x.series))} | ${cell(formatTotalDe(exo, x.series))} | ${x.statut} | ${cell(commentairesExo(x))} |`);

    if (x.statut === "saute") ecarts.push(`- ${exo.nom} : pas fait (${x.raison || x.commentaire || "raison non précisée"})`);
    if (x.statut === "partiel") ecarts.push(`- ${exo.nom} : partiel (${seriesTravail(x.series).length} séries de travail, cible ${formatCible(exo)})`);
    const sauts = Store.nbSautsRecents(x.exo_id, archive.modele);
    if (sauts >= 3) questions.push(`- ${exo.nom} : pas fait ${sauts} fois sur les 5 dernières séances de ce modèle → le programme doit peut-être bouger.`);

    if (avant && x.statut !== "saute") {
      const totAvant = totalSeance(exo, avant.entry.series);
      if (total != null && totAvant != null && total < totAvant) {
        const contexte = (archive.tags || []).some((t) => t === "decharge" || t === "avant_course") ? " — séance taguée décharge/avant course, baisse possiblement volontaire" : "";
        questions.push(`- ${exo.nom} : total en baisse vs la dernière fois (${formatTotal(exo, total)} contre ${formatTotal(exo, totAvant)})${contexte}.`);
      }
    }
    const rir0 = seriesTravail(x.series).filter((s) => s.rir === 0).length;
    if (rir0) questions.push(`- ${exo.nom} : ${rir0} série(s) à RIR 0.`);
    const ko = seriesTravail(x.series).filter((s) => s.technique === "degradee").length;
    if (ko) questions.push(`- ${exo.nom} : technique dégradée sur ${ko} série(s).`);
    const textes = [x.commentaire, ...x.series.map((s) => s.commentaire)].filter(Boolean).join(" ");
    if (/douleur|gêne|gene|alerte|mal |inconfort/i.test(textes)) questions.push(`- ${exo.nom} : commentaire mentionnant une douleur ou une gêne.`);
  }

  L.push("", "## Détail série par série");
  for (const x of archive.exos) {
    const exo = Store.getExo(x.exo_id);
    L.push("", `### ${exo.nom} — ${x.statut}`);
    if (!x.series.length) { L.push(`Pas fait${x.raison ? " : " + x.raison : ""}.`); continue; }
    let n = 0;
    for (const s of x.series) L.push(s.echauffement ? `- éch. ${detailSerie(exo, s)}` : `- ${++n}. ${detailSerie(exo, s)}`);
    if (x.commentaire) L.push(`- 💬 ${x.commentaire}`);
  }

  L.push("", "## Écarts au programme", ecarts.length ? ecarts.join("\n") : "Aucun écart.");

  L.push("", "## Records");
  for (const x of archive.exos) {
    if (!seriesTravail(x.series).length) continue;
    const exo = Store.getExo(x.exo_id);
    const rs = Store.getRecordSerie(x.exo_id);
    const rt = Store.getRecordSeance(x.exo_id);
    const nouveau = (rs && rs.date === archive.date) || (rt && rt.date === archive.date) ? " 🏆 nouveau record aujourd'hui" : "";
    L.push(`- ${exo.nom} : meilleure série ${rs ? formatSerie(exo, rs.serie) + " (" + rs.date + ")" : "—"} · meilleur total sur l'exo ${rt ? formatTotal(exo, rt.total) + " (" + rt.date + ")" : "—"}${nouveau}`);
  }

  L.push("", "## Tendances");
  const tonnage = (a) => a.exos.reduce((t, x) => t + (sigma(Store.getExo(x.exo_id), x.series) || 0), 0);
  L.push(`Σ de la séance (exos en kg uniquement) : ${tonnage(archive)} kg.`);
  const precedentes = Store.getArchives().filter((a) => a.modele === archive.modele && a.date < archive.date).slice(0, 3);
  L.push(precedentes.length ? `3 séances précédentes du même modèle : ${precedentes.map((a) => `${a.date} : ${tonnage(a)} kg`).join(", ")}.` : "Pas assez d'historique pour comparer.");
  L.push("*Le Σ total dépend des exos faits ce jour-là : une séance incomplète le fait baisser mécaniquement.*");

  L.push("", "## Questions ouvertes", questions.length ? questions.join("\n") : "Rien de particulier détecté automatiquement.");
  return L.join("\n");
}

function buildExoMarkdown(exoId) {
  const exo = Store.getExo(exoId);
  const rs = Store.getRecordSerie(exoId);
  const rt = Store.getRecordSeance(exoId);
  const L = [];
  L.push(`# ${exo.nom}`, "");
  L.push("*Généré automatiquement par Journal Muscu à chaque séance. Échauffement à part, jamais compté dans le Σ ni dans les records.*", "");
  L.push(`- Cible actuelle : ${formatCible(exo) || "—"}`);
  L.push(`- Meilleure série : ${rs ? formatSerie(exo, rs.serie) + " (" + rs.date + ")" : "—"}`);
  L.push(`- Meilleur total sur l'exo en une séance : ${rt ? formatTotal(exo, rt.total) + " (" + rt.date + ")" : "—"}`, "");
  L.push("| Date | Statut | Échauffement | Séries de travail (détail) | Σ / total | Commentaire |", "|---|---|---|---|---|---|");
  for (const h of Store.getHistoriqueExo(exoId)) {
    const x = h.entry;
    const ech = x.series.filter((s) => s.echauffement).map((s) => formatSerie(exo, s)).join(", ");
    const detail = seriesTravail(x.series).map((s) => detailSerie(exo, s)).join(" ; ");
    L.push(`| ${h.date} | ${x.statut} | ${cell(ech)} | ${cell(detail || "—")} | ${cell(formatTotalDe(exo, x.series))} | ${cell(commentairesExo(x))} |`);
  }
  return L.join("\n");
}

/* Répercute dans Drive les séances supprimées : fichier de séance à la corbeille, fichiers d'exercices,
   « dernière séance » et sauvegarde complète réécrits sans elles. */
async function retirerDeDrive(onProgress) {
  const aRetirer = lsGet("muscu:a_retirer", []);
  if (!aRetirer.length) return 0;
  const exos = new Set();
  for (const r of aRetirer) {
    if (onProgress) onProgress("Suppression du fichier de séance…");
    await DriveAuth.trashFile(`seance-${r.id}.md`);
    r.exos.forEach((e) => exos.add(e));
  }
  let i = 0;
  for (const exoId of exos) {
    if (onProgress) onProgress(`Mise à jour des fichiers par exercice… ${++i}/${exos.size}`);
    await DriveAuth.writeFile(`exo-${exoId}.md`, buildExoMarkdown(exoId));
  }
  const derniere = Store.getDerniereArchive();
  if (derniere) await DriveAuth.writeFile("journal-muscu-derniere-seance.md", buildResumeMarkdown(derniere));
  await DriveAuth.writeFile("journal-muscu-archives.json", JSON.stringify(Store.getArchives(), null, 1), "application/json");
  lsSet("muscu:a_retirer", []);
  return aRetirer.length;
}

/* Envoie toutes les séances en attente. En cas d'échec, la file reste intacte : un nouvel essai
   réécrit simplement les mêmes fichiers. Au tout premier envoi, on génère aussi les fichiers de
   tous les exercices de l'historique importé. */
async function envoyerOutbox(onProgress) {
  const premierEnvoi = !lsGet("muscu:drive_init", false);
  /* Une fois : un fichier par séance pour tout l'historique (importé compris), pas seulement les nouvelles. */
  const historiqueSeances = !lsGet("muscu:drive_seances_init_v2", false);
  const ids = historiqueSeances
    ? [...new Set([...Store.getArchives().map((a) => a.id), ...Store.getOutbox()])]
    : Store.getOutbox();
  if (!ids.length && !premierEnvoi) return 0;
  const derniere = Store.getDerniereArchive();
  const exosTouches = new Set(premierEnvoi ? Store.getExosAvecHistorique() : []);
  const envoyes = [];
  for (const id of ids) {
    const archive = Store.getArchive(id);
    if (!archive) { envoyes.push(id); continue; }
    if (onProgress) onProgress(`Envoi de la séance du ${archive.date}…`);
    const md = buildResumeMarkdown(archive);
    await DriveAuth.writeFile(`seance-${archive.id}.md`, md);
    if (derniere && derniere.id === archive.id) await DriveAuth.writeFile("journal-muscu-derniere-seance.md", md);
    archive.exos.forEach((x) => exosTouches.add(x.exo_id));
    envoyes.push(id);
  }
  let i = 0;
  for (const exoId of exosTouches) {
    if (onProgress) onProgress(`Fichiers par exercice… ${++i}/${exosTouches.size}`);
    await DriveAuth.writeFile(`exo-${exoId}.md`, buildExoMarkdown(exoId));
  }
  if (onProgress) onProgress("Sauvegarde complète…");
  await DriveAuth.writeFile("journal-muscu-archives.json", JSON.stringify(Store.getArchives(), null, 1), "application/json");
  envoyes.forEach((id) => Store.retirerOutbox(id));
  lsSet("muscu:drive_init", true);
  lsSet("muscu:drive_seances_init_v2", true);
  return envoyes.length;
}
