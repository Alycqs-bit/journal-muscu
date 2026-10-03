/* Ancien programme salle, 24 mars → 25 juin 2026 (+ juillet complété), importé le 03/10/2026 depuis les
   Google Docs du dossier « Historique Muscu ». Seule la colonne « Performance réalisée » est reprise
   (la « Perf. passée » n'est qu'un rappel de la séance d'avant).
   Règle R1 : rien d'inventé. Une case « réalisé » vide = exercice absent de la séance.
   Règle R5 : plusieurs fichiers portent dans leur titre interne une autre date que leur nom (copier-coller
   du modèle). Décision du 16/08 : le nom du fichier fait foi. Cas signalés dans le commentaire de séance.

   Notation (celle des Google Docs) : « 2x12x40 » = 2 séries de 12 reps à 40 kg, « 12x40 » = 1 série,
   « e: » devant = échauffement, « @20 » = charge seule (reps non notées), « r:11 » = reps seules. */

const HISTORIQUE_ANCIEN = (() => {
  function p(str) {
    return str.split("/").flatMap((raw) => {
      let tok = raw.trim();
      const ech = tok.startsWith("e:");
      if (ech) tok = tok.slice(2);
      const extra = ech ? { echauffement: true } : {};
      if (tok.startsWith("@")) return [Object.assign({ charge: Number(tok.slice(1)) }, extra)];
      if (tok.startsWith("r:")) return [Object.assign({ reps: Number(tok.slice(2)) }, extra)];
      const n = tok.split("x").map(Number);
      if (n.some(Number.isNaN) || n.length < 2 || n.length > 3) throw new Error("notation illisible : " + raw);
      const [sets, reps, charge] = n.length === 3 ? n : [1, n[0], n[1]];
      return Array.from({ length: sets }, () => Object.assign({ reps, charge }, extra));
    });
  }
  /* Dead hang : durées en secondes. */
  function dh(str) { return str.split("/").map((t) => ({ duree_sec: Number(t) })); }
  /* Farmer's walk : charges (45" prescrits par série). */
  function far(str) { return str.split("/").map((t) => ({ charge: Number(t) })); }
  /* Pallof press en 30" de maintien. */
  function pal30(str) { return str.split("/").map((t) => ({ charge: Number(t), duree_sec: 30 })); }
  function x(exo_id, series, commentaire = "") {
    return { exo_id, statut: series && series.length ? "fait" : "saute", series: series || [], commentaire };
  }
  /* Curl wrist + reverse en superset, 2 × 20 reps. */
  function curls(cw, rev, com = "") {
    return [x("curl_wrist", p(`2x20x${cw}`), com), x("curl_wrist_reverse", p(`2x20x${rev}`))];
  }
  function s(date, modele, commentaire, exos, tags = []) {
    return { id: `${date}-${modele}`, date, modele, version_programme: null, duree_min: null, lieu: "salle", commentaire_seance: commentaire, tags, exos: exos.flat() };
  }

  return [
    /* ---------- Fichier « 4 mai » (journal de mars-avril) ---------- */
    s("2026-03-24", "B", "Bas du corps — focus soléaire/tempo.", [
      x("leg_curl_24mars", p("4x10x55"), "buste très penché en avant (mains sur le dossier), posture à revoir"),
      x("adducteurs", p("12x30 / 15x25 / 12x27.5"), "tempo dynamique, pause 1 s"),
      x("hip_thrust", p("2x10x10 / 2x10x15")),
      x("iso_soleaire", [{ charge: 40, duree_sec: 45 }, { charge: 60, duree_sec: 45 }]),
    ]),
    s("2026-03-26", "B", "", [
      x("presse_45", [...p("e:@40 / e:@80 / e:@120 / e:@160"), ...p("3x8x200")], "noté « Presse » — supposée 45° (à confirmer)"),
      x("leg_ext", p("2x8x35 / 8x40"), "siège avancé au max, boudin bas 5, boudin haut 1 ; 40 kg sans problème"),
      x("hip_thrust", p("10x20 / 10x25 / 8x25")),
      x("abducteurs", p("12x45 / 12x40"), "douleur bizarre à 45 kg, redescendu à 40 kg, difficilement"),
      x("leg_curl", p("12x17.5 / 10x27.5")),
      x("adducteurs", p("12x27.5 / 2x12x25"), "pads réglés à 8 puis 7"),
    ]),
    s("2026-03-27", "H", "", [
      x("lat_pulldown", p("e:20x25 / 10x40 / 2x9x40")),
      x("tirage_horizontal", p("e:10x20 / 12x25 / 12x30 / 10x35"), "30 kg c'était bien"),
      x("developpe_militaire", p("2x12x10 / 11x10")),
      x("triceps_poulie", p("10x15 / 12x12.5 / 8x12.5")),
      x("releve_jambes", [{ reps: 12 }, { reps: 8 }], "barre de traction ; trop dur pour les avant-bras"),
      x("hammer_strength", p("2x10x2.5 / 15x0"), "en remplacement du relevé de jambes"),
      x("pallof_press", pal30("10/10/10"), "à genoux, 3 × 30\" ; « je peux monter à 15 kg à l'aise »"),
    ]),
    s("2026-03-30", "B", "", [
      x("presse_45", p("e:20x80 / 3x6x220 / 7x220"), "on reste sur 220 kg"),
      x("hip_thrust", p("8x25 / 3x10x25"), "passage à 30 kg"),
      x("leg_curl", p("3x10x30 / 10x32.5"), "noté « Leg Curl allongé »"),
      x("leg_ext", p("6x40"), "1re série : tâtonnement entre 50 et 40 kg, douleurs bizarres ; réglages un peu changés"),
      x("abducteurs", p("14x35 / 13x35 / 12x35")),
      x("adducteurs", p("@25 / @27.5"), "1 série à 25 kg, 1 série à 27,5 kg (reps non notées)"),
    ]),
    s("2026-03-31", "H", "", [
      x("lat_pulldown", p("e:20x25 / 4x12x40")),
      x("tirage_horizontal", p("e:20x10 / 4x12x30")),
      x("developpe_militaire", p("2x12x12 / 12x14")),
      x("triceps_poulie", p("2x15x12.5 / 13x12.5")),
      x("hammer_strength", p("15x2.5 / 12x2.5 / 13x2.5")),
      x("pallof_press", pal30("10/10/10"), "à genoux ; « je peux monter à 15 kg à l'aise »"),
    ]),
    s("2026-04-02", "B", "", [
      x("hip_thrust", p("3x12x25")),
      x("presse_horizontale", p("e:17x60 / 8x150 / 7x170 / 3x150 / 6x130 / 6x130"), "8×150 easy ; 7×170 trop loin du plateau, écart modifié ; 6×130 = sweet spot trouvé"),
      x("leg_ext", p("2x10x35"), "toujours pas à l'aise, ça picote à l'intérieur bas des cuisses, je reste sage"),
      x("leg_curl", p("3x10x30 / 10x32.5")),
      x("abducteurs", p("2x15x30 / 11x30"), "pas réussi la fin d'amplitude + 1\" d'iso sur la fin"),
      x("adducteurs", p("15x25")),
    ]),
    s("2026-04-04", "H", "", [
      x("lat_pulldown", p("e:20x25 / 2x10x45 / 9x45 / 9x40")),
      x("tirage_horizontal", p("e:20x15 / 10x35 / 11x35 / 9x35 / 10x35")),
      x("developpe_militaire", p("12x14 / 2x9x14")),
      x("triceps_poulie", p("15x15 / 2x9x15")),
      x("hammer_strength", p("15x2.5 / 13x2.5 / 13x2.5")),
      x("pallof_press", pal30("15/15/15"), "dur dur"),
    ]),
    s("2026-04-06", "B", "", [
      x("hip_thrust", p("4x12x30")),
      x("presse_horizontale", p("e:20x50 / 8x150 / 2x7x150 / 8x150"), "1re série siège 3, puis siège 2"),
      x("leg_curl", p("12x32.5 / 2x12x35"), "boudin 3"),
      x("leg_ext", p("12x35 / 2x9x40"), "12 reps au lieu de 8-10"),
      x("abducteurs", p("2x15x30 / 13x30")),
      x("adducteurs", p("15x27.5 / 12x30 / 14x30")),
    ]),
    s("2026-04-07", "H", "« J'suis pas simple simple sur cette séance… j'en chie. C'est parce que je me suis envoyé fort aux jambes hier ? »", [
      x("tirage_horizontal", p("e:20x15 / 12x35 / 11x35 / 9x35 / 11x35")),
      x("lat_pulldown", p("e:15x25 / 10x45 / 9x45 / 12x40 / 12x45"), "dernière série en mag grip, notée « 22 × 45 kg » le 07/04 mais « 12 × 45 kg » dans le rappel du 10/04 — 12 retenu, à confirmer"),
      x("developpe_militaire", p("2x12x14 / 8x14")),
      x("triceps_poulie", p("11x15 / 13x12.5 / 9x12.5"), "j'en chie fort bizarrement à 15 kg"),
      x("hammer_strength", p("3x15x2.5"), "dernière série siège quasiment au plus bas, ça travaille mieux ; passage à 5 kg possible"),
      x("pallof_press", pal30("15/15/15"), "dur dur"),
    ]),
    s("2026-04-09", "B", "", [
      x("hip_thrust", p("4x12x35")),
      x("presse_45", p("e:20x80 / 5x240 / 6x240 / 5x240 / 6x240")),
      x("leg_curl", p("2x11x37.5 / 10x37.5"), "boudin 3"),
      x("leg_ext", p("4x10x40"), "dégressif sur la dernière"),
      x("abducteurs", p("3x15x30")),
      x("adducteurs", p("3x15x30")),
    ]),
    s("2026-04-10", "H", "« Sensation de fatigue à la séance précédente. Maintenant ? » Pallof press : réalisé non noté.", [
      x("tirage_horizontal", p("e:10x20 / 3x10x40 / 9x40")),
      x("lat_pulldown", p("e:10x20 / 2x12x45 / 2x8x45")),
      x("developpe_militaire", p("2x12x14 / 10x14")),
      x("triceps_poulie", p("15x12.5 / 14x12.5 / 8x12.5")),
      x("hammer_strength", p("2x15x5 / 10x5")),
    ]),
    s("2026-04-13", "B", "Pour la prochaine fois : hip thrust et leg curl en premier, une série de plus au leg curl.", [
      x("hip_thrust", p("4x12x40")),
      x("leg_curl", p("2x12x37.5 / 7x37.5"), "7 reps « curieusement », puis drop set"),
      x("presse_45", p("e:20x80 / 2x8x240 / 6x240 / 5x240")),
      x("leg_ext", p("4x10x40"), "commencé à 42,5 kg, trop dur, redescendu à 40 kg en cours de 1re série ; puis drop set"),
      x("abducteurs", p("15x32.5 / 2x13x32.5")),
      x("adducteurs", p("3x15x30")),
    ]),
    s("2026-04-14", "H", "", [
      x("tirage_horizontal", p("4x12x40"), "échauffement PAP"),
      x("lat_pulldown", p("e:6x30 / 12x45")),
      x("developpe_militaire", p("3x12x14"), "échauffement oublié"),
      x("triceps_poulie", p("e:6x10 / 2x15x12.5 / 10x12.5"), "1'30 de repos à chaque fois"),
      x("hammer_strength", p("3x15x5")),
      x("pallof_press", p("@17.5 / @15 / @15"), "17,5 kg debout (à genoux ça glisse trop), puis 2 × 15 kg bien perpendiculaire à la machine"),
    ]),
    s("2026-04-16", "B", "Jour de décharge (douleurs mollets + 4e semaine muscu).", [
      x("hip_thrust", p("e:@20 / e:@30 / e:@35 / 2x12x40"), "PAP 20/30/35"),
      x("leg_curl", p("e:6x30 / 12x37.5 / 10x37.5")),
      x("presse_45", p("e:6x160 / 8x240 / 7x240")),
      x("leg_ext", p("e:6x30 / 2x10x40")),
      x("abducteurs", p("e:6x22.5 / 2x15x30")),
      x("adducteurs", p("e:6x22.5 / 2x15x32.5")),
    ], ["decharge"]),
    s("2026-04-17", "H", "Décharge n°1.", [
      x("tirage_horizontal", p("2x12x40"), "PAP"),
      x("lat_pulldown", p("e:6x30 / 2x12x40")),
      x("developpe_militaire", p("e:6x10 / 2x12x14")),
      x("triceps_poulie", p("e:6x10 / 2x15x12.5")),
      x("hammer_strength", p("2x15x7.5")),
      x("rotations_medecine_ball", p("2x12x20"), "avec un disque ; très inconfortable, les bras fatiguent avant les abdos → revenir au pallof press ?"),
    ], ["decharge"]),
    s("2026-04-20", "B", "Décharge n°2.", [
      x("leg_curl", p("12x37.5 / 11x37.5"), "PAP"),
      x("hip_thrust", p("e:5x30 / 2x12x40")),
      x("presse_45", p("e:6x160 / 2x7x240")),
      x("leg_ext", p("e:6x30 / 2x10x40")),
      x("abducteurs", p("e:6x22.5 / 2x15x30")),
      x("adducteurs", p("e:6x22.5 / 2x15x32.5")),
    ], ["decharge"]),
    s("2026-04-21", "H", "Décharge n°2. Développé militaire, triceps, hammer : réalisé non noté.", [
      x("tirage_horizontal", p("2x10x40"), "PAP"),
      x("lat_pulldown", p("e:6x30 / 2x12x40")),
      x("rotations_medecine_ball", p("2x20x10"), "medecine ball"),
    ], ["decharge"]),
    s("2026-04-23", "B", "Début post semaine de décharge, on essaie de upper tout et on voit ce qui passe et ce qui casse.", [
      x("hip_thrust", p("e:@20 / e:@30 / e:@40 / 4x10x45"), "PAP 20/30/40"),
      x("leg_curl", p("e:6x30 / 4x10x37.5")),
      x("presse_45", p("5x260 / 5x250 / 5x240"), "PAP. Je pensais pouvoir monter à 260 kg après la décharge, pas du tout (pas prêt, ou presse décalée après hip thrust et leg curl) ; en PLS sur la dernière rep à chaque fois"),
      x("leg_ext", p("e:6x30 / 3x10x42.5"), "3 séries au lieu de 4 : toute petite douleur dans le vaste interne en me levant"),
      x("abducteurs", p("2x15x32.5 / 12x32.5")),
      x("adducteurs", p("e:6x22.5 / 15x35 / 2x12x35")),
    ], ["reprise"]),
    s("2026-04-24", "H", "Reprise post décharge, on essaie de up.", [
      x("tirage_horizontal", p("2x12x50 / 10x50 / 8x40")),
      x("lat_pulldown", p("4x12x45"), "pas du tout aimé : impression de forcer comme un âne, de compenser de partout, pas senti les dorsaux → passage aux tractions assistées"),
      x("developpe_militaire", p("12x16 / 11x16 / 9x16")),
      x("triceps_poulie", p("2x10x15 / 9x15")),
      x("hammer_strength", p("15x7.5 / 2x10x10")),
      x("rotations_medecine_ball", p("3x20x10"), "j'hésite vraiment à repartir sur le pallof press"),
    ], ["reprise"]),
    s("2026-04-27", "B", "Sous corticoïdes, j'ai un peu abusé sur la charge, j'espère que je vais pas le payer.", [
      x("leg_curl", p("3x10x37.5 / 11x37.5")),
      x("hip_thrust", p("3x10x45 / 11x45")),
      x("presse_45", p("2x8x240 / 7x240 / 6x240")),
      x("leg_ext", p("2x10x45 / 8x45"), "finish dropset ; je reste sur 3 séries ; corticoïdes le matin, ça peut expliquer"),
      x("abducteurs", p("3x15x32.5")),
      x("adducteurs", p("15x37.5 / 10x37.5 / 8x37.5"), "voulais faire 35 kg, mis 37,5 kg sans faire exprès"),
    ]),
    s("2026-04-28", "H", "Sous corticoïdes, attention.", [
      x("tirage_horizontal", p("4x12x50")),
      x("tractions_assistees", p("12x42 / 12x35 / 12x28 / 10x28"), "échauffement scapula ; 1re séance de tractions à la place du lat pulldown"),
      x("developpe_militaire", p("2x12x16 / 8x16")),
      x("triceps_poulie", p("15x12.5 / 12x15 / 11x15")),
      x("hammer_strength", p("3x10x10")),
      x("pallof_press", pal30("12.5/12.5/12.5"), "retour au pallof press, assis, ça me va mieux"),
    ]),
    s("2026-04-30", "B", "Sous corticoïdes, attention, objectif maintien de la charge sans trop forcer sur les dernières reps.", [
      x("hip_thrust", p("4x10x45 / 9x45")),
      x("leg_curl", p("2x12x37.5 / 2x10x37.5")),
      x("presse_45", null, "rien le 30 avril, gêne au vaste interne"),
      x("leg_ext", null, "rien le 30 avril, gêne au vaste interne"),
      x("abducteurs", p("3x15x32.5")),
      x("adducteurs", p("3x15x35")),
    ]),

    /* ---------- Un fichier par séance (mai → juillet) ---------- */
    s("2026-05-05", "H", "Une séance de ratée juste avant (celle du 1er mai, réalisé vide dans le journal).", [
      x("tirage_horizontal", p("4x8x60"), "difficile, peut-être un peu beaucoup"),
      x("tractions_assistees", p("3x10x28 / 8x28"), "échauffement scapula"),
      x("developpe_militaire", p("2x12x16 / 10x16")),
      x("triceps_poulie", p("2x10x15 / 10x12.5")),
      x("hammer_strength", p("10x10 / 12x10 / 10x10")),
      x("pallof_press", pal30("12.5/12.5/12.5"), "assis"),
    ]),
    s("2026-05-07", "B", "", [
      x("hip_thrust", p("4x11x45")),
      x("leg_curl", p("4x11x37.5")),
      x("presse_45", p("4x6x240")),
      x("leg_ext", p("3x10x45")),
      x("abducteurs", p("3x13x35")),
      x("adducteurs", p("3x13x37.5")),
    ]),
    s("2026-05-08", "H", "⚠️ Fichier « 8 mai - H » dont le titre interne dit « 5 mai » (copier-coller) : daté au 8 mai d'après le nom du fichier, sa « perf. passée » reprenant le réalisé du 5 mai.", [
      x("tirage_horizontal", p("4x8x55")),
      x("tractions_assistees", p("2x10x28 / 9x28 / 8x28")),
      x("developpe_militaire", p("11x16 / 8x16"), "placé en dernier + pas de dossier, régression normale"),
      x("triceps_poulie", p("2x10x15 / 10x12.5")),
      x("hammer_strength", p("15x10 / 12x10")),
      x("pallof_press", pal30("12.5/12.5/12.5"), "assis"),
      x("dead_hang", dh("45/30/27"), "repos 45\""),
      x("farmers", far("26/24/22"), "24 kg : −2\" ; ça passe, tenter 3 × 24 kg"),
      x("curl_wrist", p("@4"), "séries non notées ; reverse à ajouter en superset (charge divisée par 2)"),
    ]),
    s("2026-05-12", "H", "", [
      x("tirage_horizontal", p("4x9x55")),
      x("tractions_assistees", p("4x10x28")),
      x("developpe_militaire", p("2x12x16 / 11x16")),
      x("triceps_poulie", p("2x10x15 / 7x15 / 3x12.5"), "3e série : 7 reps à 15 kg + 3 à 12,5 kg"),
      x("hammer_strength", p("4x13x10")),
      x("pallof_press", pal30("15/17.5/17.5"), "noté sous « rotations medecine ball », en pratique pallof press assis"),
      x("dead_hang", dh("60/45/39"), "un peu plus de 45\" de repos à chaque fois"),
      x("farmers", far("26/24/22"), "la dernière j'aurais pu tenter 24 kg"),
      curls(4, 2),
    ]),
    s("2026-05-14", "B", "Pas de presse ni de leg extension : cuisses détruites par le trail.", [
      x("hip_thrust", p("4x12x45")),
      x("leg_curl", p("4x12x37.5")),
      x("presse_45", null, "cuisses détruites par le trail"),
      x("leg_ext", null, "cuisses détruites par le trail"),
      x("abducteurs", p("4x14x35")),
      x("adducteurs", p("2x14x37.5 / r:11 / r:12"), "charge des 2 dernières séries non notée"),
    ]),
    s("2026-05-18", "B", "Presse en dernier et pas de leg extension : pas sûr d'avoir le temps, la presse c'est tout ce que j'ai pu faire.", [
      x("hip_thrust", p("3x8x50 / 10x50")),
      x("leg_curl", p("2x10x40 / 9x40 / 12x37.5")),
      x("presse_45", p("2x6x240 / 8x240")),
      x("leg_ext", null, "pas le temps"),
      x("abducteurs", p("2x15x35 / 12x35")),
      x("adducteurs", p("2x14x37.5 / 12x37.5")),
    ]),
    s("2026-05-19", "H", "Pas de haut du corps pendant 7 jours… tractions en 3 car machine occupée, développé militaire en 2 et up !", [
      x("tirage_horizontal", p("4x10x55")),
      x("tractions_assistees", p("2x11x28 / 10x28 / 8x28")),
      x("developpe_militaire", p("3x12x16")),
      x("triceps_poulie", p("3x10x15")),
      x("hammer_strength", p("3x14x10")),
      x("pallof_press", p("@15 / @15 / @15"), "debout, sans douleur : plus dur mais plus efficace"),
      x("dead_hang", dh("60/45/34"), "nazi sur le repos cette fois"),
      x("farmers", far("26/24/24")),
      curls(4, 2, "on va pouvoir monter à 4/3"),
    ]),
    s("2026-05-22", "B", "Séance horrible, je suis occis, les performances sont ridicules… il va falloir du repos / arrêter les séances 2× par semaine et passer en entretien.", [
      x("hip_thrust", p("2x10x50 / 9x50"), "dur dur, on s'arrête là, les mollets tirent déjà"),
      x("leg_curl", p("2x10x40 / 8x40"), "on s'arrête là, j'arrive pas à monter"),
      x("presse_45", p("5x240 / 2x8x200"), "5 × 240 éclaté ; 200 kg là on est bien"),
      x("leg_ext", p("8x47.5 / 2x8x45"), "47,5 kg sans faire exprès ; leg extension placé en dernier"),
      x("abducteurs", p("15x35 / 14x35 / 13x35")),
      x("adducteurs", p("2x14x37.5 / 10x37.5")),
    ], ["fatigue"]),
    s("2026-05-24", "H", "⚠️ Fichier « 24 mai - H » dont le titre interne dit « 19 mai » (copier-coller) : daté au 24 mai d'après le nom du fichier, ses chiffres suivant ceux du 19. Dead hang : réalisé non noté.", [
      x("tirage_horizontal", p("4x11x55")),
      x("tractions_assistees", p("4x11x28")),
      x("developpe_militaire", p("3x8x18")),
      x("triceps_poulie", p("3x10x15")),
      x("hammer_strength", p("3x15x10")),
      x("pallof_press", p("@15 / @15 / @15"), "debout"),
      x("farmers", far("26/26/24")),
      curls(4, 3),
    ]),
    s("2026-05-28", "H", "Passage à 2 séries partout, on ne vise pas la progression.", [
      x("tirage_horizontal", p("2x11x55")),
      x("tractions_assistees", p("11x28 / 8x28")),
      x("developpe_militaire", p("8x18 / 10x18")),
      x("triceps_poulie", p("10x15 / 12x15")),
      x("hammer_strength", p("2x15x10")),
      x("pallof_press", p("@15 / @15"), "debout"),
      x("dead_hang", dh("60/52/39"), "total 2'31\""),
      x("farmers", far("26/26/24")),
      curls(4, 3),
    ]),
    s("2026-06-01", "B", "⚠️ Fichier « 1er juin - B » dont le titre interne dit « 29 mai » : daté au 1er juin d'après le nom du fichier (les deux sont possibles, à confirmer).", [
      x("gastro_smith", p("4x15x20"), "1re fois ; on peut rester en fonction de comment ça évolue"),
      x("soleaire", p("15x20 / 3x15x10"), "très mauvaise exécution, compris la machine tardivement ; retenter 20 kg"),
      x("hip_thrust", p("2x10x50"), "on est bien, mais pourquoi pas 45 kg pour taper les 12 reps"),
      x("leg_curl", p("10x40 / 9x40"), "descendre à 37,5 kg pour allonger les reps et ménager le neuro ?"),
      x("presse_45", p("2x5x240"), "changement de chaussures ? j'en chie, descendre à 220 kg pour allonger les reps ?"),
      x("leg_ext", p("10x45 / 10x42.5"), "passé à 42,5 kg volontairement, en peine sur les dernières reps"),
      x("abducteurs", p("2x15x35")),
      x("adducteurs", p("2x15x37.5")),
    ]),
    s("2026-06-04", "H", "Le fichier note les mollets « pas faits le 3 juin » : date du 3 ou du 4 juin à confirmer, nom du fichier retenu.", [
      x("gastro_smith", null, "mollets fracassés"),
      x("soleaire", null, "mollets fracassés"),
      x("tirage_horizontal", p("2x12x55")),
      x("tractions_assistees", p("12x28 / 10x28")),
      x("developpe_militaire", p("2x12x16")),
      x("triceps_poulie", p("2x11x15")),
      x("hammer_strength", p("2x15x10")),
      x("pallof_press", p("@15 / @15"), "debout, niveau 22"),
      x("dead_hang", dh("60/60/42"), "total 2'42\""),
      x("farmers", far("26/26/26")),
      curls(4, 3),
    ]),
    s("2026-06-09", "B", "", [
      x("plio_rebonds", [{ reps: 20 }, { reps: 20 }, { reps: 20 }], "rebonds rapides"),
      x("gastro_smith", p("15x20 / 10x30 / 8x40 / 10x40"), "on peut essayer 50 kg la prochaine"),
      x("soleaire", p("10x20 / 9x25 / 2x10x25"), "on peut essayer 30 kg"),
      x("hip_thrust", p("2x12x45"), "nickel"),
      x("leg_curl", p("2x12x37.5"), "nickel"),
      x("presse_45", null, "supprimée pour l'été : neuro au repos, seul exo que je survole ; on y reviendra après la compétition"),
      x("leg_ext", p("2x10x42.5")),
      x("abducteurs", p("2x15x35")),
      x("adducteurs", p("2x15x37.5")),
    ]),
    s("2026-06-16", "H", "", [
      x("gastro_smith", p("3x8x50 / 10x50")),
      x("soleaire", p("4x8x30")),
      x("tirage_horizontal", p("2x12x55")),
      x("tractions_assistees", p("2x12x28")),
      x("developpe_militaire", p("2x12x16")),
      x("triceps_poulie", p("2x11x15")),
      x("hammer_strength", p("2x15x10")),
      x("pallof_press", p("@15 / @15"), "debout, niveau 22"),
      x("dead_hang", dh("60/51/33"), "grosse contre-performance, pas touché depuis 12 jours"),
      x("farmers", far("28/26/26")),
      curls(4, 3),
    ]),
    s("2026-06-18", "M", "Séance mollets + poigne. ⚠️ Gastro et soléaire non repris : le bloc est identique mot pour mot au 16/06 (perf. passée ET réalisé), probablement pas mis à jour — à confirmer.", [
      x("dead_hang", dh("60/60/52"), "reprise de la marche en avant ; 1' de repos au lieu de 45\" à la 2e série"),
      x("farmers", far("28/28/28"), "à stabiliser sur une séance complète"),
      curls(4, 3, "on peut passer à 5/3"),
    ]),
    s("2026-06-22", "H", "", [
      x("gastro_smith", p("4x10x50")),
      x("soleaire", p("3x9x30 / 12x30")),
      x("tirage_horizontal", p("2x12x55")),
      x("tractions_assistees", p("2x12x28")),
      x("developpe_militaire", p("2x12x16")),
      x("triceps_poulie", p("2x11x15")),
      x("hammer_strength", p("2x15x10")),
      x("pallof_press", p("@15 / @15"), "debout, niveau 22"),
      x("dead_hang", dh("60/60/45"), "tractions non assistées juste avant, donc pas mal"),
      x("farmers", far("26/26/26"), "28 kg pas dispo, pas plus mal : pas pu plier la dernière"),
      curls(5, 3),
    ]),
    s("2026-06-25", "M", "Séance mollets + poigne. ⚠️ Fichier « 25 juin - M » dont le titre interne dit « 18 juin » : daté au 25 juin d'après le nom. Farmer et curls non repris : identiques mot pour mot au 18/06, probablement pas mis à jour — à confirmer.", [
      x("gastro_smith", p("4x8x60")),
      x("soleaire", p("4x10x30")),
      x("dead_hang", dh("60/60/66"), "3 × 1' validé"),
    ]),
    s("2026-07-09", "HM", "", [
      x("gastro_smith", p("4x8x50"), "reprise chill"),
      x("soleaire", p("4x8x30"), "reprise chill"),
      x("tirage_horizontal", p("12x55 / 10x55"), "réalisé en dernier par rapport à l'ordre habituel"),
      x("tractions_assistees", p("2x12x28")),
      x("developpe_militaire", p("2x12x16")),
      x("triceps_poulie", p("2x11x15")),
      x("hammer_strength", p("2x15x10")),
      x("pallof_press", p("@15 / @15"), "debout, niveau 22"),
      x("dead_hang", dh("70/70/70")),
      x("farmers", far("28/28/26"), "j'en ai chié, mais j'avais bien cartonné le dead hang"),
      curls(4, 3),
    ]),
    s("2026-07-15", "BM", "Séance de reprise : dur dur, plus d'un mois sans bas du corps (sauf mollets), sortie d'un ultra 160 km / 10 000 D+ il y a 10 jours.", [
      x("gastro_smith", p("4x8x60"), "just just, obligé de mettre un coup de cul sur les dernières séries"),
      x("soleaire", p("4x8x35")),
      x("hip_thrust", p("2x12x45")),
      x("leg_curl", p("2x12x37.5")),
      x("presse_45", null, "supprimée pour l'été"),
      x("leg_ext", p("2x10x42.5")),
      x("abducteurs", p("2x15x35")),
      x("adducteurs", p("2x15x37.5")),
      x("dead_hang", dh("60/60/60"), "séance jambes, service minimum : j'assure mon 3 × 1'"),
      x("farmers", far("28/28/28")),
      curls(4, 3),
    ], ["reprise"]),
    s("2026-07-17", "HM", "", [
      x("mollet_vsquat", p("4x8x80"), "V-squat à la place de la Smith (forte affluence)"),
      x("soleaire", p("4x15x25"), "tempo 2\" excentrique / 1\" pause bas / 1\" concentrique ; cible passée à 15-20 reps"),
      x("tirage_horizontal", p("12x55 / 9x55"), "redescendre à 50 kg, je les tiens plus"),
      x("tractions_assistees", p("2x12x28"), "tester la progression à 21 kg"),
      x("developpe_militaire", p("2x12x16")),
      x("triceps_poulie", p("11x15 / 12x15")),
      x("hammer_strength", p("2x15x10")),
      x("pallof_press", p("@15 / @15"), "debout, niveau 22"),
      x("dead_hang", dh("70/70/70"), "passer à 1'15\" la prochaine"),
      x("farmers", far("26/26/24"), "j'en ai chié"),
      curls(4, 3, "à monter en 5/3"),
    ]),
    s("2026-07-20", "BM", "⚠️ Fichier « 20 juillet - BM » dont le titre interne dit « 15 juillet » : daté au 20 juillet d'après le nom (sa perf. passée reprend le 17/07). Commentaire de séance identique au 15/07, non repris.", [
      x("gastro_smith", p("4x8x55"), "essayer d'éliminer le coup de cul"),
      x("soleaire", p("4x16x25")),
      x("hip_thrust", p("2x12x45")),
      x("leg_curl", p("2x12x37.5")),
      x("presse_45", null, "supprimée pour l'été"),
      x("leg_ext", p("2x10x42.5")),
      x("abducteurs", p("15x35 / 13x35")),
      x("adducteurs", p("2x15x37.5")),
      x("dead_hang", dh("75/75/50")),
      x("farmers", far("26/26/26")),
      curls(5, 3),
    ]),
  ];
})();
