/* Historique importé (séances antérieures à l'app ou notées ailleurs). Lecture seule : les séances
   enregistrées par l'app vivent dans le stockage du navigateur (store.js) et s'ajoutent à celles-ci.

   Sources :
   - Ancien programme salle : Google Docs du dossier Drive « Historique Muscu ».
   - Force Bloc 1 (15/09 → 03/10) : Projet Trail, Analyses/Daily/AAAA-MM-JJ-force.md + log-seances-force.md.
   Règle R1 : rien d'inventé. Info non rapportée = champ absent. Un RIR donné en fourchette (« 0-1 »)
   n'est pas arrondi : il va dans le commentaire de la série. */

const HISTORIQUE = (() => {
/* Raccourcis d'écriture : w = série de travail, e = échauffement. */
function w(reps, charge, x) { return Object.assign({ reps, charge }, x || {}); }
function e(reps, charge, x) { return Object.assign({ reps, charge, echauffement: true }, x || {}); }
const OK = "propre", KO = "degradee";

return [
  /* ---------- Ancien programme salle (importé le 16/08 ; le reste est dans historique-ancien.js) ---------- */
  {
    id: "2026-07-23-HM", date: "2026-07-23", modele: "HM", version_programme: null, duree_min: null,
    commentaire_seance: "⚠️ Fichier « 23 juillet - HM » dont le titre interne dit « 17 juillet » (copier-coller) : séance distincte du 17/07, sa perf. passée reprenant le 20/07. Blocs haut du corps identiques au 17/07 sauf triceps (copie possible non mise à jour).", tags: [],
    exos: [
      { exo_id: "gastro_smith", statut: "fait", series: [w(9, 55), w(9, 55), w(9, 55), w(9, 55)], commentaire: "essayer d'éliminer le coup de cul" },
      { exo_id: "soleaire", statut: "fait", series: [w(16, 25), w(17, 25), w(17, 25), w(17, 25)], commentaire: "" },
      { exo_id: "tirage_horizontal", statut: "fait", series: [w(12, 55), w(9, 55)], commentaire: "tenue difficile en fin de série, redescendre à 50kg si ça persiste" },
      { exo_id: "tractions_assistees", statut: "fait", series: [w(12, 28), w(12, 28)], commentaire: "tester la progression à 21kg la prochaine fois" },
      { exo_id: "developpe_militaire", statut: "fait", series: [w(12, 16), w(12, 16)], commentaire: "" },
      { exo_id: "triceps_poulie", statut: "fait", series: [w(12, 15), w(14, 15)], commentaire: "" },
      { exo_id: "hammer_strength", statut: "fait", series: [w(15, 10), w(15, 10)], commentaire: "" },
      { exo_id: "pallof_press", statut: "fait", series: [{ charge: 15 }, { charge: 15 }], commentaire: "reps par côté non notées précisément ce jour-là" },
      { exo_id: "dead_hang", statut: "fait", series: [{ duree_sec: 90 }, { duree_sec: 60 }, { duree_sec: 60 }], commentaire: "" },
      { exo_id: "farmers", statut: "saute", series: [], commentaire: "réalisé non noté" },
      { exo_id: "curl_wrist", statut: "fait", series: [w(20, 5), w(20, 5)], commentaire: "" },
      { exo_id: "curl_wrist_reverse", statut: "fait", series: [w(20, 3), w(20, 3)], commentaire: "" },
    ],
  },
  {
    id: "2026-07-29-BM", date: "2026-07-29", modele: "BM", version_programme: null, duree_min: null,
    commentaire_seance: "séance chill avant le Montagnon", tags: ["avant_course"],
    exos: [
      { exo_id: "gastro_smith", statut: "fait", series: [w(8, 55), w(8, 55)], commentaire: "2 séries seulement, prépa Montagnon" },
      { exo_id: "soleaire", statut: "fait", series: [w(15, 25), w(15, 25)], commentaire: "" },
      { exo_id: "hip_thrust", statut: "fait", series: [w(10, 45), w(10, 45)], commentaire: "chill" },
      { exo_id: "leg_curl", statut: "fait", series: [w(10, 37.5), w(10, 37.5)], commentaire: "chill" },
      { exo_id: "presse_45", statut: "saute", series: [], commentaire: "supprimée pour l'été, neuro au repos" },
      { exo_id: "leg_ext", statut: "fait", series: [w(8, 42.5), w(8, 42.5)], commentaire: "chill" },
      { exo_id: "abducteurs", statut: "fait", series: [w(12, 35), w(12, 35)], commentaire: "chill" },
      { exo_id: "adducteurs", statut: "fait", series: [w(13, 37.5), w(13, 37.5)], commentaire: "chill" },
      { exo_id: "dead_hang", statut: "fait", series: [{ duree_sec: 120 }, { duree_sec: 60 }, { duree_sec: 43 }], commentaire: "objectif max" },
      { exo_id: "farmers", statut: "fait", series: [{ charge: 26 }, { charge: 26 }, { charge: 26 }], commentaire: "" },
      { exo_id: "curl_wrist", statut: "fait", series: [w(20, 4), w(20, 4)], commentaire: "" },
      { exo_id: "curl_wrist_reverse", statut: "fait", series: [w(20, 3), w(20, 3)], commentaire: "" },
    ],
  },
  {
    id: "2026-08-11-BM", date: "2026-08-11", modele: "BM", version_programme: 7, duree_min: null,
    commentaire_seance: "séance chill avant le Montagnon", tags: ["avant_course"],
    exos: [
      { exo_id: "gastro_smith", statut: "fait", series: [w(8, 55), w(8, 55), w(8, 55), w(8, 55)], commentaire: "" },
      { exo_id: "soleaire", statut: "fait", series: [w(15, 25), w(15, 25), w(15, 20), w(15, 20)], commentaire: "peut-être rester à 20kg pour valider les 20 reps" },
      { exo_id: "hip_thrust", statut: "fait", series: [w(10, 45), w(10, 45), w(10, 40)], commentaire: "avait oublié être passé à 2 séries en saison de course" },
      { exo_id: "leg_curl", statut: "fait", series: [w(12, 37.5), w(12, 37.5)], commentaire: "" },
      { exo_id: "presse_45", statut: "saute", series: [], commentaire: "supprimée pour l'été" },
      { exo_id: "leg_ext", statut: "fait", series: [w(10, 42.5), w(10, 42.5)], commentaire: "" },
      { exo_id: "abducteurs", statut: "partiel", series: [w(12, 35)], commentaire: "douleurs bizarres, pas en forme — arrêt avant la 2e série par précaution" },
      { exo_id: "adducteurs", statut: "fait", series: [w(12, 35), w(12, 35)], commentaire: "baisse de charge volontaire, pas en forme" },
      { exo_id: "dead_hang", statut: "fait", series: [{ duree_sec: 90 }, { duree_sec: 60 }, { duree_sec: 60 }], commentaire: "pas du tout envie ce jour-là" },
      { exo_id: "farmers", statut: "saute", series: [], commentaire: "flemme" },
      { exo_id: "curl_wrist", statut: "fait", series: [w(20, 4), w(20, 4)], commentaire: "" },
      { exo_id: "curl_wrist_reverse", statut: "fait", series: [w(20, 3), w(20, 3)], commentaire: "" },
    ],
  },
  {
    id: "2026-08-13-HM", date: "2026-08-13", modele: "HM", version_programme: 1, duree_min: null,
    commentaire_seance: "", tags: [],
    exos: [
      { exo_id: "gastro_smith", statut: "fait", series: [w(8, 55), w(8, 55), w(8, 55), w(8, 55)], commentaire: "chill" },
      { exo_id: "soleaire", statut: "fait", series: [w(17, 20), w(17, 20), w(15, 20), w(15, 20)], commentaire: "" },
      { exo_id: "tirage_horizontal", statut: "fait", series: [w(10, 55), w(10, 55)], commentaire: "mieux, bonne sensation dos" },
      { exo_id: "tractions_assistees", statut: "fait", series: [w(12, 28), w(12, 28)], commentaire: "tester la progression à 21kg la prochaine fois" },
      { exo_id: "developpe_militaire", statut: "fait", series: [w(12, 16), w(12, 16)], commentaire: "difficile" },
      { exo_id: "triceps_poulie", statut: "fait", series: [w(12, 15), w(12, 15)], commentaire: "difficile" },
      { exo_id: "hammer_strength", statut: "saute", series: [], commentaire: "pas le temps" },
      { exo_id: "pallof_press", statut: "saute", series: [], commentaire: "pas le temps" },
      { exo_id: "dead_hang", statut: "fait", series: [{ duree_sec: 75 }, { duree_sec: 75 }, { duree_sec: 38 }], commentaire: "explosion en fin de série" },
      { exo_id: "farmers", statut: "saute", series: [], commentaire: "pas le temps" },
      { exo_id: "curl_wrist", statut: "saute", series: [], commentaire: "pas le temps" },
      { exo_id: "curl_wrist_reverse", statut: "saute", series: [], commentaire: "pas le temps" },
    ],
  },

  /* ---------- Force Bloc 1 (projet Trail) ---------- */
  {
    id: "2026-09-15-FORCE_B1", date: "2026-09-15", modele: "FORCE_B1", version_programme: null, duree_min: 95, lieu: "salle",
    commentaire_seance: "Force lourde #1. Test unipodal du matin 18 D / 19 G. Échauffement footing 30'. Durée hors échauffement. RIR et technique non rapportés sur le moment.",
    tags: [],
    exos: [
      { exo_id: "mollet_tendu_smith", statut: "fait", series: [e(8, 40), w(6, 60), w(6, 70), w(6, 80)], commentaire: "" },
      { exo_id: "soleaire_presse", statut: "fait", series: [e(8, 20), w(6, 30), w(6, 35), w(6, 35)], commentaire: "« je dois pouvoir faire plus »" },
      { exo_id: "squat", statut: "fait", series: [e(6, 20), w(6, 60), w(6, 70), w(6, 90)], commentaire: "3 séries de travail : le 60 kg servait déjà à chercher la bonne charge" },
      { exo_id: "rdl", statut: "fait", series: [e(8, 20), w(6, 60), w(6, 80), w(6, 90)], commentaire: "technique à travailler, limite au niveau des poignets" },
      { exo_id: "fente_bulgare", statut: "fait", series: [w(6, 40, { cote: "G" }), w(6, 40, { cote: "D" }), w(6, 50, { cote: "G" }), w(6, 50, { cote: "D" })], commentaire: "2e série très difficile" },
      { exo_id: "nordic", statut: "fait", series: [{ reps: 6 }, { reps: 6 }], commentaire: "amplitude partielle — « je le sens pas de ouf, la tension est courte »" },
      { exo_id: "planche", statut: "fait", series: [{ duree_sec: 75 }, { duree_sec: 75 }, { duree_sec: 90 }], commentaire: "pas fait le max, flemme" },
      { exo_id: "farmers", statut: "fait", series: [{ charge: 24, duree_sec: 45 }, { charge: 24, duree_sec: 45 }, { charge: 24, duree_sec: 45 }], commentaire: "remplacé par le porté valise à partir de la séance suivante" },
    ],
  },
  {
    id: "2026-09-18-FORCE_B1", date: "2026-09-18", modele: "FORCE_B1", version_programme: null, duree_min: null, lieu: "salle",
    commentaire_seance: "Force lourde #2, journalisée en direct. Soléaire fait après le RDL (machine occupée).",
    tags: [],
    exos: [
      { exo_id: "mollet_tendu_smith", statut: "fait", series: [{ charge: 40, echauffement: true }, { charge: 60, echauffement: true }, w(6, 80), w(6, 80), w(6, 80, { rir: 0, technique: OK })], commentaire: "" },
      { exo_id: "soleaire_presse", statut: "fait", series: [w(6, 35), w(8, 35), w(8, 35, { commentaire: "RIR 0-1" })], commentaire: "" },
      { exo_id: "squat", statut: "fait", series: [{ charge: 20, echauffement: true }, { charge: 60, echauffement: true }, w(6, 90, { technique: OK }), w(6, 90, { rir: 1, technique: OK })], commentaire: "" },
      { exo_id: "rdl", statut: "fait", series: [{ charge: 20, echauffement: true }, e(6, 70), w(6, 90, { technique: OK, commentaire: "RIR 3-4, grip solide" }), w(6, 100, { technique: KO, commentaire: "RIR 1-2, très limite sur la fin" })], commentaire: "limite technique actuelle ≈ 90 kg, straps nécessaires pour aller au-delà" },
      { exo_id: "fente_bulgare", statut: "fait", series: [w(6, 50, { cote: "G" }), w(6, 50, { cote: "D" }), w(6, 50, { cote: "G", technique: KO, commentaire: "perte d'équilibre sur la dernière rep" }), w(6, 50, { cote: "D", commentaire: "RIR 0-1, plus facile à droite" })], commentaire: "" },
      { exo_id: "nordic", statut: "fait", series: [{ reps: 8 }, { reps: 8 }], commentaire: "amplitude partielle" },
      { exo_id: "planche", statut: "fait", series: [{ duree_sec: 90 }, { duree_sec: 90 }, { duree_sec: 90 }], commentaire: "durée fixe, repos 2'" },
      { exo_id: "porte_valise", statut: "fait", series: [
        { cote: "G", charge: 26, duree_sec: 45 }, { cote: "D", charge: 26, duree_sec: 45 },
        { cote: "G", charge: 26, duree_sec: 45 }, { cote: "D", charge: 26, duree_sec: 45 },
        { cote: "G", charge: 26, duree_sec: 45 }, { cote: "D", charge: 26, duree_sec: 45 }], commentaire: "1re fois. Ordre des côtés non rapporté." },
    ],
  },
  {
    id: "2026-09-23-FORCE_B1", date: "2026-09-23", modele: "FORCE_B1", version_programme: null, duree_min: null, lieu: "maison",
    commentaire_seance: "Force lourde #3, à la maison (barre + disques jusqu'à 80 kg, gilet lesté 10 kg). J+3 de la backyard de Gez. « Strict minimum » pour reprendre la semaine pro.",
    tags: [],
    exos: [
      { exo_id: "mollet_tendu_barre", statut: "fait", series: [e(6, 70, { commentaire: "petite marche instable" }), w(12, 70, { technique: KO }), w(12, 70, { technique: KO }), w(12, 70, { technique: KO })], commentaire: "setup improvisé, talon touchant le sol en fin de descente ; 80 kg pas tenté par prudence. RIR non donné." },
      { exo_id: "soleaire_presse", statut: "saute", series: [], commentaire: "Pas le temps" },
      { exo_id: "squat", statut: "fait", series: [e(10, 20), e(6, 50), e(4, 70), w(6, 90, { rir: 1 }), w(6, 90, { commentaire: "« peut-être RIR 1 »" })], commentaire: "barre 80 kg + gilet lesté 10 kg" },
      { exo_id: "rdl", statut: "fait", series: [e(6, 80), w(6, 90, { technique: KO, commentaire: "gilet lesté pas commode" }), w(6, 90, { rir: 2 })], commentaire: "barre + gilet lesté" },
      { exo_id: "fente_bulgare", statut: "saute", series: [], commentaire: "Pas le temps" },
      { exo_id: "nordic", statut: "saute", series: [], commentaire: "Pas le temps" },
      { exo_id: "planche", statut: "saute", series: [], commentaire: "Pas le temps" },
      { exo_id: "porte_valise", statut: "saute", series: [], commentaire: "Pas le temps" },
    ],
  },
  {
    id: "2026-09-30-FORCE_B1", date: "2026-09-30", modele: "FORCE_B1", version_programme: null, duree_min: 80, lieu: "salle",
    commentaire_seance: "Force lourde #4. Consigne RIR 1-2 partout. Reprise après le week-end à Majorque, fatigue. Test unipodal du 29/09 : 19 D / 20 G.",
    tags: ["reprise", "fatigue"],
    exos: [
      { exo_id: "mollet_tendu_smith", statut: "fait", series: [e(6, 40), w(6, 80, { rir: 2, technique: KO }), w(6, 80, { technique: KO, commentaire: "RIR 1-2" }), w(6, 80, { rir: 1, technique: KO })], commentaire: "pas concentré sur le tempo" },
      { exo_id: "soleaire_presse", statut: "fait", series: [w(6, 35, { rir: 1 }), w(6, 35, { rir: 1 }), w(6, 35, { rir: 0 })], commentaire: "même remarque sur le tempo" },
      { exo_id: "squat", statut: "fait", series: [e(10, 20), e(6, 40), e(6, 70), w(6, 90, { technique: OK, commentaire: "RIR 1-2" }), w(6, 90, { rir: 1, technique: OK })], commentaire: "" },
      { exo_id: "rdl", statut: "fait", series: [e(6, 70), w(6, 90, { rir: 2, technique: OK }), w(6, 90, { rir: 2, technique: OK })], commentaire: "" },
      { exo_id: "fente_bulgare", statut: "fait", series: [w(6, 50, { cote: "G", commentaire: "RIR 0-1" }), w(6, 50, { cote: "G", rir: 0 }), w(6, 50, { cote: "D", commentaire: "RIR 0-1" }), w(6, 50, { cote: "D", rir: 1 })], commentaire: "gauche en premier ; asymétrie jugée très légère" },
      { exo_id: "nordic", statut: "fait", series: [{ reps: 8 }, { reps: 9 }], commentaire: "séries enchaînées sans repos, sans faire exprès" },
      { exo_id: "planche", statut: "fait", series: [{ duree_sec: 90 }, { duree_sec: 60 }, { duree_sec: 60 }], commentaire: "1'30 de repos entre les séries" },
      { exo_id: "porte_valise", statut: "fait", series: [
        { cote: "G", charge: 26, duree_sec: 45 }, { cote: "D", charge: 26, duree_sec: 45 },
        { cote: "G", charge: 26, duree_sec: 45 }, { cote: "D", charge: 26, duree_sec: 45 },
        { cote: "G", charge: 26, duree_sec: 45 }, { cote: "D", charge: 26, duree_sec: 45 }], commentaire: "dernière série lâchée une seconde avant la fin" },
    ],
  },
  {
    id: "2026-10-03-FORCE_B1", date: "2026-10-03", modele: "FORCE_B1", version_programme: null, duree_min: 90, lieu: "salle",
    commentaire_seance: "Force lourde #5. Mollets inconfortables au footing d'échauffement (1-2/10). « Un peu plus bourriné que dû ». Durée avec du temps traîné, non comparable.",
    tags: [],
    exos: [
      { exo_id: "mollet_tendu_smith", statut: "fait", series: [e(6, 60), w(6, 80, { rir: 1, technique: OK }), w(6, 80, { rir: 1, technique: OK }), w(6, 80, { rir: 0, technique: OK })], commentaire: "tempo respecté à la lettre" },
      { exo_id: "soleaire_presse", statut: "fait", series: [w(6, 35, { technique: OK }), w(6, 35, { technique: OK }), w(6, 35, { rir: 0, technique: OK })], commentaire: "RIR 0 (non précisé si sur les 3 séries ou la dernière)" },
      { exo_id: "squat", statut: "fait", series: [w(6, 90, { rir: 2 }), w(6, 90, { rir: 1 })], commentaire: "échauffement « idem » (non détaillé)" },
      { exo_id: "rdl", statut: "fait", series: [e(6, 70), w(8, 90, { rir: 1 }), w(8, 90, { rir: 0, technique: KO, commentaire: "2 dernières reps moins bonnes, tenue des poignets" })], commentaire: "un peu chauffé. Straps attendus semaine du 05/10." },
      { exo_id: "fente_bulgare", statut: "fait", series: [w(6, 50, { cote: "G", commentaire: "RIR 0-1" }), w(6, 50, { cote: "G", rir: 0 }), w(6, 50, { cote: "D", rir: 1 }), w(6, 50, { cote: "D", rir: 1 })], commentaire: "toujours plus à l'aise à droite" },
      { exo_id: "nordic", statut: "fait", series: [{ reps: 8 }, { reps: 8 }], commentaire: "amplitude légère, petite alerte à l'ischio, prudence" },
      { exo_id: "planche", statut: "fait", series: [{ duree_sec: 60 }, { duree_sec: 60 }, { duree_sec: 60 }], commentaire: "séance fatigante, pas de violence" },
      { exo_id: "porte_valise", statut: "fait", series: [
        { cote: "G", charge: 28, duree_sec: 30 }, { cote: "D", charge: 28, duree_sec: 30 },
        { cote: "G", charge: 28, duree_sec: 30 }, { cote: "D", charge: 28, duree_sec: 30 },
        { cote: "G", charge: 28, duree_sec: 30 }, { cote: "D", charge: 28, duree_sec: 30 }], commentaire: "pas d'haltère de 26 kg ni de montre : durée approximative" },
    ],
  },
];
})();
