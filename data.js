/* Programme = données (cahier des charges C4). Pour changer la séance, on modifie ce fichier, jamais la logique.

   Champs d'un exercice :
   - type_mesure : reps_charge · reps_seules · temps · temps_charge
   - unilateral  : true → chaque série est notée G ou D
   - unite       : "kg" par défaut ; autre unité (ex. "dist.") → jamais comptée dans le tonnage (R4)
   - pas_charge  : les deux paliers de boutons de charge
   - cible_series / cible_reps / cible_temps_sec / repos_sec : fourchettes [min, max]
   - repos_cotes_sec : repos entre les deux côtés d'un exo unilatéral (null = on enchaîne)
   - lieu : "salle" / "maison" (info d'affichage, pour choisir la bonne variante)
   - premier_cote : côté par lequel commencer un exo unilatéral ("G" par défaut)
   - saisie : champs proposés à la saisie parmi reps, charge, duree, rir, technique
     (absent = tous ceux qui ont un sens pour le type de mesure). La note de série et la case
     « Échauffement » sont toujours proposées, sur tous les exercices (demande d'Alix du 07/10).
   - rampe_series : échauffements prévus, pré-remplis dans l'ordre avant la 1re série de travail
     ({ reps, charge } ; une valeur absente = reprise de l'échauffement de la dernière fois).
     Sur un unilatéral, la liste vaut pour chaque côté.
   - reps_fixes : on valide la série sans saisir les reps (= haut de la cible)
   - charge_lest : la charge est un lest ajouté au poids du corps ; 0 s'affiche « poids du corps »
   - ancien : true → exercice de l'ancien programme, gardé uniquement pour l'historique

   Cibles reprises de plan-bloc-1-reprise-fondation-force.md §4 (projet Trail, état au 03/10/2026). */

const LIBRARY = {
  /* ---------- Programme actuel : Fondation force (version du 03/10/2026) ----------
     Source : plan-bloc-1-reprise-fondation-force.md §4 « SÉANCE TYPE EN VIGUEUR » (projet Trail). */
  corde: {
    saisie: ["duree"],
    nom: "Corde à sauter", groupe: "pliométrie",
    type_mesure: "temps", reglages: "surface souple",
    cible_series: [2, 2], cible_temps_sec: [30, 30], repos_sec: [60, 90],
    consignes: "Contacts au sol les plus brefs possible ; la hauteur ne compte pas.",
  },
  pogos_2pieds: {
    saisie: [], reps_fixes: true,
    nom: "Pogos — deux pieds (niveau 1)", groupe: "pliométrie",
    type_mesure: "reps_seules", reglages: "surface souple",
    cible_series: [3, 3], cible_reps: [10, 10], repos_sec: [60, 90],
    consignes: "Petits rebonds sur place, genoux presque tendus : ça rebondit par les chevilles, contacts brefs. Niveau 2 après 2 séances sans symptôme et un test du lundi à 20 ou plus. On recule d'un niveau si les mollets sont pris le lendemain matin, si une douleur dépasse 2/10 ou si le test du lundi baisse. Jamais dans les 48 h avant une séance de descente.",
  },
  pogos_1jambe: {
    saisie: [], reps_fixes: true,
    nom: "Pogos — une jambe (niveau 2)", groupe: "pliométrie", unilateral: true,
    type_mesure: "reps_seules", reglages: "surface souple",
    cible_series: [3, 3], cible_reps: [10, 10], repos_sec: [60, 90], repos_cotes_sec: null,
    consignes: "Même rebond sur place, sur une seule jambe. Niveau 3 quand le test est confirmé à 20-25 ou plus et que 20 sauts unipodaux passent sans symptôme. On recule d'un niveau si les mollets sont pris le lendemain matin, si une douleur dépasse 2/10 ou si le test du lundi baisse. Jamais dans les 48 h avant une séance de descente.",
  },
  sauts_unipodaux: {
    saisie: [], reps_fixes: true,
    nom: "Sauts unipodaux + cloche-pied (niveau 3)", groupe: "pliométrie", unilateral: true,
    type_mesure: "reps_seules", reglages: "surface souple",
    cible_series: [3, 3], cible_reps: [5, 10], repos_sec: [60, 120], repos_cotes_sec: null,
    consignes: "Flexion puis saut vertical sur une jambe, puis sauts à cloche-pied en avançant. On recule d'un niveau si les mollets sont pris le lendemain matin, si une douleur dépasse 2/10 ou si le test du lundi baisse. Jamais dans les 48 h avant une séance de descente.",
  },
  mollet_tendu_uni_maison: {
    saisie: ["reps", "charge", "rir", "technique"],
    nom: "Mollet genou tendu — 1 jambe, escalier", groupe: "mollets", lieu: "maison", unilateral: true, premier_cote: "D", charge_lest: true,
    type_mesure: "reps_charge", reglages: "ceinture lestée + disques, une main au mur · tempo 3-1-3-2 (3 s montée, 1 s en haut, 3 s descente, 2 s en bas)",
    rampe: "1 série plus légère par jambe avant les 3 séries de travail, pour monter en charge", rampe_series: [{}], rir_cible: "1-2",
    cible_series: [3, 3], cible_reps: [6, 8], repos_sec: null, repos_cotes_sec: null,
    consignes: "Charge = lest de la ceinture, hors poids du corps. Talon sous le niveau de la marche en bas, montée maximale en haut. Progression : quand les 3 séries passent à 8 reps à RIR 1, on alourdit et on repart à 6.",
  },
  mollet_tendu_uni_smith: {
    saisie: ["reps", "charge", "rir", "technique"],
    nom: "Mollet genou tendu — 1 jambe, Smith", groupe: "mollets", lieu: "salle", unilateral: true, premier_cote: "D",
    type_mesure: "reps_charge", reglages: "tempo 3-1-3-2 (3 s montée, 1 s en haut, 3 s descente, 2 s en bas)",
    rampe: "1 série plus légère par jambe avant les 3 séries de travail, pour monter en charge", rampe_series: [{}], rir_cible: "1-2",
    cible_series: [3, 3], cible_reps: [6, 8], repos_sec: null, repos_cotes_sec: null,
    consignes: "Talon bas en bas, montée maximale en haut. Progression : quand les 3 séries passent à 8 reps à RIR 1, on alourdit et on repart à 6.",
  },
  mollet_tendu_smith: {
    saisie: ["reps", "charge", "rir", "technique"],
    nom: "Mollet genou tendu — Smith, 2 jambes", groupe: "mollets", lieu: "salle",
    type_mesure: "reps_charge", reglages: "tempo 3-1-3-2 (3 s montée, 1 s en haut, 3 s descente, 2 s en bas)",
    rampe: "1 série plus légère avant les séries de travail", rampe_series: [{}], rir_cible: "1-2",
    cible_series: [3, 4], cible_reps: [6, 8], repos_sec: [120, 180],
    consignes: "Repli si l'unilatéral est trop long. Progression : quand les 3 séries passent à 8 reps à RIR 1, on alourdit et on repart à 6.",
  },
  releveur: {
    saisie: ["reps", "charge"],
    nom: "Releveur — élastique", groupe: "releveur", unilateral: true, premier_cote: "D", unite: "dist.", pas_charge: [0.5, 1],
    type_mesure: "reps_charge", reglages: "assis au sol, orteils griffés vers la plante, relevé 1 s / retour freiné 3 s",
    cible_series: [3, 3], cible_reps: [20, 20], repos_sec: null, repos_cotes_sec: null,
    consignes: "3 × 20 par pied, les 3 dernières reps très dures (règle d'Alix du 11/10). La distance au point d'amarrage se règle au ressenti : reculer si c'est trop facile, avancer si les 20 ne passent pas ; la noter comme repère approximatif.",
  },
  soleaire_barre: {
    /* Abandonné le 10/10/2026, retiré de la séance le 11/10 (v2), gardé pour l'historique. */
    saisie: ["reps", "charge", "rir", "technique"],
    nom: "Mollet genou fléchi — barre sur les genoux", groupe: "mollets", lieu: "maison",
    type_mesure: "reps_charge", reglages: "assis, hanche à 90° · tempo 3-1-3-2 (3 s montée, 1 s en haut, 3 s descente, 2 s en bas)",
    rampe: "aucun, les mollets sont déjà chauds", rir_cible: "1-2",
    cible_series: [3, 3], cible_reps: [6, 8], repos_sec: [120, 180],
    consignes: "Progression : quand les 3 séries passent à 8 reps à RIR 1, on alourdit et on repart à 6.",
  },
  soleaire_presse: {
    saisie: ["reps", "charge", "rir", "technique"],
    nom: "Mollet genou fléchi — machine assise", groupe: "mollets", lieu: "salle",
    type_mesure: "reps_charge", reglages: "tempo 3-1-3-2 (3 s montée, 1 s en haut, 3 s descente, 2 s en bas)",
    rampe: "aucun, les mollets sont déjà chauds", rir_cible: "1-2",
    cible_series: [3, 3], cible_reps: [6, 8], repos_sec: [120, 180],
    consignes: "Progression : quand les 3 séries passent à 8 reps à RIR 1, on alourdit et on repart à 6.",
  },
  squat: {
    saisie: ["reps", "charge", "rir", "technique"],
    nom: "Squat — barre", groupe: "quadriceps", pas_charge: [5, 10],
    type_mesure: "reps_charge", reglages: "descente contrôlée, montée explosive",
    rampe: "20×10 → 50×6 → 70×4", rampe_series: [{ reps: 10, charge: 20 }, { reps: 6, charge: 50 }, { reps: 4, charge: 70 }], rir_cible: "1-2",
    cible_series: [2, 2], cible_reps: [6, 8], repos_sec: [120, 240],
    consignes: "Progression : quand les 2 séries passent à 8 reps propres à RIR 1, +5 kg (paliers de 5 kg à la maison) et on repart à 6.",
  },
  rdl: {
    saisie: ["reps", "charge", "rir", "technique"],
    nom: "RDL — barre", groupe: "ischios", pas_charge: [5, 10],
    type_mesure: "reps_charge", reglages: "descente contrôlée, montée explosive",
    rampe: "1 série d'approche : 70×6", rampe_series: [{ reps: 6, charge: 70 }], rir_cible: "1-2",
    cible_series: [2, 2], cible_reps: [6, 8], repos_sec: [120, 240],
    consignes: "Progression : quand les 2 séries passent à 8 reps propres à RIR 1, +5 kg (paliers de 5 kg à la maison) et on repart à 6.",
  },
  fente_bulgare: {
    saisie: ["reps", "charge", "rir", "technique"],
    nom: "Fente bulgare — barre libre", groupe: "quadriceps", pas_charge: [5, 10], unilateral: true, premier_cote: "G",
    type_mesure: "reps_charge", reglages: "descente contrôlée, montée explosive · commencer par la gauche",
    rampe: "aucun, déjà chaud après squat et RDL", rir_cible: "1-2",
    cible_series: [2, 2], cible_reps: [6, 8], repos_sec: [120, 240], repos_cotes_sec: [30, 60],
    consignes: "Progression : quand les 2 séries passent à 8 reps propres à RIR 1, +5 kg (paliers de 5 kg à la maison) et on repart à 6.",
  },
  nordic: {
    saisie: ["reps"],
    nom: "Nordic curl", groupe: "ischios",
    type_mesure: "reps_seules", reglages: "",
    rampe: "aucun",
    cible_series: [2, 2], cible_reps: [5, 8], repos_sec: [90, 120],
    consignes: "Amplitude toujours la même, tout donner à chaque série (règle d'Alix du 11/10) : seules les reps comptent.",
  },

  /* ---------- Force Bloc 1, version du 15/09 (historique uniquement) ---------- */
  mollet_tendu_barre: { ancien: true, nom: "Mollet genou tendu — barre, 2 jambes", groupe: "mollets", lieu: "maison", type_mesure: "reps_charge", reglages: "tempo 3-1-3-2", cible_series: [3, 4], cible_reps: [6, 8], repos_sec: [120, 180], consignes: "" },
  planche: { ancien: true, nom: "Planche", groupe: "tronc", type_mesure: "temps", reglages: "durée fixe, pas au max", cible_series: [3, 3], cible_temps_sec: [45, 60], repos_sec: [90, 120], consignes: "retirée le 03/10" },
  porte_valise: { ancien: true, nom: "Porté valise", groupe: "tronc", unilateral: true, type_mesure: "temps_charge", reglages: "1 haltère, un seul côté", cible_series: [3, 3], cible_temps_sec: [45, 45], repos_sec: [60, 90], repos_cotes_sec: null, consignes: "retiré le 03/10" },

  /* ---------- Ancien programme salle (historique uniquement) ---------- */
  soleaire: { ancien: true, nom: "Soléaire (ancien prog.)", groupe: "mollets", type_mesure: "reps_charge", reglages: "", cible_series: 4, cible_reps: [15, 20], repos_sec: 105, consignes: "" },
  hip_thrust: { ancien: true, nom: "Hip Thrust", groupe: "fessiers", type_mesure: "reps_charge", reglages: "2\" iso", cible_series: 4, cible_reps: [8, 12], repos_sec: 105, consignes: "" },
  leg_curl: { ancien: true, nom: "Leg Curl couché", groupe: "ischios", type_mesure: "reps_charge", reglages: "boudin 3", cible_series: 4, cible_reps: [10, 12], repos_sec: 90, consignes: "" },
  presse_45: { ancien: true, nom: "Presse 45°", groupe: "quadriceps", type_mesure: "reps_charge", reglages: "", cible_series: 4, cible_reps: [5, 8], repos_sec: 165, consignes: "" },
  leg_ext: { ancien: true, nom: "Leg Extension", groupe: "quadriceps", type_mesure: "reps_charge", reglages: "siège 4, boudin bas 5", cible_series: 4, cible_reps: [8, 10], repos_sec: 90, consignes: "" },
  abducteurs: { ancien: true, nom: "Abducteurs", groupe: "hanches", type_mesure: "reps_charge", reglages: "", cible_series: 3, cible_reps: [12, 15], repos_sec: 75, consignes: "" },
  adducteurs: { ancien: true, nom: "Adducteurs", groupe: "hanches", type_mesure: "reps_charge", reglages: "réglage 7", cible_series: 3, cible_reps: [12, 15], repos_sec: 75, consignes: "" },
  tirage_horizontal: { ancien: true, nom: "Tirage horizontal (poulie basse)", groupe: "dos", type_mesure: "reps_charge", reglages: "", cible_series: 2, cible_reps: [8, 12], repos_sec: 90, consignes: "" },
  tractions_assistees: { ancien: true, nom: "Tractions assistées", groupe: "dos", type_mesure: "reps_charge", charge_inversee: true, reglages: "", cible_series: 2, cible_reps: [8, 12], repos_sec: 90, consignes: "charge inversée : baisser la charge = progresser" },
  developpe_militaire: { ancien: true, nom: "Développé militaire", groupe: "épaules", type_mesure: "reps_charge", reglages: "", cible_series: 2, cible_reps: [8, 12], repos_sec: 90, consignes: "" },
  triceps_poulie: { ancien: true, nom: "Extensions triceps poulie haute", groupe: "triceps", type_mesure: "reps_charge", reglages: "", cible_series: 3, cible_reps: [10, 15], repos_sec: 75, consignes: "" },
  hammer_strength: { ancien: true, nom: "Hammer Strength (épaule latérale)", groupe: "épaules", type_mesure: "reps_charge", reglages: "", cible_series: 3, cible_reps: [10, 15], repos_sec: 60, consignes: "" },
  pallof_press: { ancien: true, nom: "Pallof press (genoux, assis ou debout)", groupe: "tronc", type_mesure: "reps_charge", reglages: "", cible_series: 3, cible_reps: [10, 12], repos_sec: 60, consignes: "" },
  dead_hang: { ancien: true, nom: "Dead hang", groupe: "poigne", type_mesure: "temps", reglages: "", cible_series: 3, repos_sec: 45, consignes: "" },
  farmers: { ancien: true, nom: "Farmer's walk", groupe: "poigne", type_mesure: "temps_charge", reglages: "", cible_series: 3, cible_temps_sec: 45, repos_sec: 45, consignes: "" },
  curl_wrist: { ancien: true, nom: "Curl wrist", groupe: "avant-bras", type_mesure: "reps_charge", reglages: "", cible_series: 2, cible_reps: [20, 20], repos_sec: 30, consignes: "" },
  curl_wrist_reverse: { ancien: true, nom: "Curl wrist reverse", groupe: "avant-bras", type_mesure: "reps_charge", reglages: "", cible_series: 2, cible_reps: [20, 20], repos_sec: 30, consignes: "" },
  lat_pulldown: { ancien: true, nom: "Tirage vertical (lat pulldown)", groupe: "dos", type_mesure: "reps_charge", reglages: "mag grip moyen", cible_series: [3, 4], cible_reps: [8, 12], repos_sec: 90, consignes: "remplacé par les tractions assistées le 28/04" },
  presse_26mars: { ancien: true, nom: "Presse (type non précisé, 26/03)", groupe: "quadriceps", type_mesure: "reps_charge", reglages: "", cible_series: 3, cible_reps: [8, 8], repos_sec: 165, consignes: "" },
  presse_horizontale: { ancien: true, nom: "Presse horizontale", groupe: "quadriceps", type_mesure: "reps_charge", reglages: "", cible_series: 4, cible_reps: [5, 8], repos_sec: 165, consignes: "début avril, avant la presse 45°" },
  leg_curl_24mars: { ancien: true, nom: "Leg curl (machine du 24/03, à confirmer)", groupe: "ischios", type_mesure: "reps_charge", reglages: "", cible_series: 4, cible_reps: [10, 10], repos_sec: 90, consignes: "55 kg, buste penché, mains sur le dossier : sans doute une autre machine que le leg curl couché" },
  iso_soleaire: { ancien: true, nom: "Isométrique soléaire", groupe: "mollets", type_mesure: "temps_charge", reglages: "", cible_series: 2, cible_temps_sec: 45, repos_sec: 90, consignes: "" },
  releve_jambes: { ancien: true, nom: "Relevé de jambes (barre de traction)", groupe: "tronc", type_mesure: "reps_seules", reglages: "", cible_series: 3, cible_reps: [10, 15], repos_sec: 60, consignes: "" },
  rotations_medecine_ball: { ancien: true, nom: "Rotations medecine ball assis", groupe: "tronc", type_mesure: "reps_charge", reglages: "", cible_series: 3, cible_reps: [10, 12], repos_sec: 60, consignes: "reps par côté" },
  plio_rebonds: { ancien: true, nom: "Pliométrie — rebonds rapides", groupe: "mollets", type_mesure: "reps_seules", reglages: "", cible_series: 3, cible_reps: [20, 20], repos_sec: 90, consignes: "" },
  mollet_vsquat: { ancien: true, nom: "Mollets au V-squat", groupe: "mollets", type_mesure: "reps_charge", reglages: "", cible_series: 4, cible_reps: [8, 10], repos_sec: 105, consignes: "remplacement ponctuel de la Smith (17/07)" },
  corde_a_sauter: { ancien: true, nom: "Pliométrie mollets (corde à sauter)", groupe: "mollets", type_mesure: "temps", reglages: "", cible_series: 3, cible_temps_sec: 30, repos_sec: 90, consignes: "" },
};

/* Un créneau de séance = un exo, { exo }, ou { variantes: [...] } quand plusieurs versions existent (la première = défaut).
   « superset » : les exos d'un même groupe s'enchaînent, l'app ouvre le suivant après chaque série de travail.
   « surcharge » : champs de l'exercice propres à cette séance (cible_series, consignes, facultatif…), qui remplacent
   ceux de LIBRARY seulement ici. Même exercice (même id) donc même historique, records et charges comparables.
   « facultatif: true » (dans la surcharge) : pas fait = pas un écart, aucune raison demandée en fin de séance.
   Champs d'affichage d'une séance : echauffement, consigne (encadré en tête de séance).
   Champs d'affichage d'un exo : rampe (échauffement propre à l'exercice), rir_cible (affiché dans la cible). */
const REGLE_ENTRETIEN = "Entretien : on réduit la fréquence et le volume, jamais la charge. Garder la charge de fin de fondation à RIR 1-2 ; si elle devient facile, l'augmenter pour rester à RIR 1-2. Pas de progression recherchée, mais pas de baisse.";

const PROGRAMME = {
  FONDATION: {
    id: "FONDATION", nom: "Fondation force", actif: true, version: 2, date_maj: "2026-10-11",
    echauffement: "Footing 10'. L'échauffement propre à chaque exercice est indiqué dans sa fiche.",
    blocs: [
      { titre: "Pliométrie", slots: ["corde", { variantes: ["pogos_2pieds", "pogos_1jambe", "sauts_unipodaux"] }] },
      { titre: "Mollet tendu + releveur (superset)", slots: [
        { variantes: ["mollet_tendu_uni_maison", "mollet_tendu_uni_smith", "mollet_tendu_smith"], superset: "mollet" },
        { exo: "releveur", superset: "mollet" },
      ] },
      /* Mollet fléchi retiré le 11/10/2026 (v2, décision d'Alix) : barre sur les genoux douloureuse et trop légère
         même en unilatéral, plus d'abonnement en salle pour la machine. Le mollet tendu reste. */
      { titre: "Force", slots: ["squat", "rdl", "fente_bulgare", "nordic"] },
    ],
  },

  /* Séance d'entretien (décision du 12/10/2026, projet Trail : plan-bloc-1-reprise-fondation-force.md §4,
     encadré « SÉANCE D'ENTRETIEN »). Prend le relais de la fondation vers fin décembre 2026, 1×/semaine jusqu'au GTVO.
     Proposée dès maintenant à côté de « Fondation force » : Alix choisit au démarrage. */
  ENTRETIEN: {
    id: "ENTRETIEN", nom: "Entretien force", actif: true, version: 1, date_maj: "2026-10-12",
    echauffement: "Pas d'échauffement général (séance faite le jour d'une qualité, au moins 6 h après). L'échauffement propre à chaque exercice est indiqué dans sa fiche.",
    consigne: REGLE_ENTRETIEN,
    blocs: [
      /* Mêmes exos et mêmes niveaux qu'en fondation : leur dosage actuel tombe déjà dans les ~40-60 contacts. */
      { titre: "Pliométrie (rappel, ~40-60 contacts)", slots: ["corde", { variantes: ["pogos_2pieds", "pogos_1jambe", "sauts_unipodaux"] }] },
      { titre: "Mollet tendu + releveur (superset)", slots: [
        { variantes: ["mollet_tendu_uni_maison", "mollet_tendu_uni_smith", "mollet_tendu_smith"], superset: "mollet",
          surcharge: { cible_series: [2, 2], rampe: "1 série plus légère par jambe avant les 2 séries de travail, pour monter en charge",
            consignes: "Priorité de la séance. " + REGLE_ENTRETIEN } },
        { exo: "releveur", superset: "mollet",
          surcharge: { cible_series: [2, 2], consignes: "2 × 20 par pied, les 3 dernières reps très dures. La distance au point d'amarrage se règle au ressenti ; la noter comme repère approximatif." } },
      ] },
      /* Fente bulgare retirée de l'entretien (doublon du squat). */
      { titre: "Force", slots: [
        { exo: "squat", surcharge: { consignes: REGLE_ENTRETIEN } },
        { exo: "rdl", surcharge: { consignes: REGLE_ENTRETIEN } },
        { exo: "nordic", surcharge: { cible_series: [1, 1], facultatif: true,
          consignes: "Facultatif : seulement si le temps le permet (pas fait = pas un écart). Amplitude toujours la même, tout donner : seules les reps comptent." } },
      ] },
    ],
  },

  /* Séance Force Bloc 1 du 15/09 au 03/10, remplacée par « Fondation force ». */
  FORCE_B1: {
    id: "FORCE_B1", nom: "Force Bloc 1 (15/09 → 03/10)", actif: false, version: 1, date_maj: "2026-09-15",
    blocs: [
      { titre: "Mollets", slots: [{ variantes: ["mollet_tendu_smith", "mollet_tendu_barre"] }, { variantes: ["soleaire_presse", "soleaire_barre"] }] },
      { titre: "Force", slots: ["squat", "rdl", "fente_bulgare", "nordic"] },
      { titre: "Tronc", slots: ["planche", "porte_valise"] },
    ],
  },

  /* Anciens modèles salle, plus proposés au démarrage. */
  BM: {
    id: "BM", nom: "Bas du corps + mollets (ancien)", actif: false, version: 7, date_maj: "2026-08-11",
    blocs: [
      { titre: "Mollets", slots: ["mollet_tendu_smith", "soleaire"] },
      { titre: "Chaîne principale", slots: ["hip_thrust", "leg_curl", "presse_45", "leg_ext"] },
      { titre: "Hanches", slots: ["abducteurs", "adducteurs"] },
      { titre: "Poigne A", slots: ["dead_hang", "farmers", "curl_wrist", "curl_wrist_reverse"] },
    ],
  },
  B: { id: "B", nom: "Bas du corps (printemps)", actif: false, blocs: [] },
  H: { id: "H", nom: "Haut du corps + tronc (printemps)", actif: false, blocs: [] },
  M: { id: "M", nom: "Mollets + poigne (juin)", actif: false, blocs: [] },
  HM: {
    id: "HM", nom: "Haut du corps + mollets (ancien)", actif: false, version: 1, date_maj: "2026-08-13",
    blocs: [
      { titre: "Mollets", slots: ["mollet_tendu_smith", "soleaire"] },
      { titre: "Push / Dos", slots: ["tirage_horizontal", "tractions_assistees", "developpe_militaire", "triceps_poulie", "hammer_strength"] },
      { titre: "Tronc", slots: ["pallof_press"] },
      { titre: "Poigne B", slots: ["dead_hang", "farmers", "curl_wrist", "curl_wrist_reverse"] },
    ],
  },
};

const TAGS_DISPONIBLES = ["decharge", "avant_course", "apres_course", "fatigue", "test_max", "reprise"];
const RAISONS_SAUT = [
  { id: "temps", label: "Pas le temps" },
  { id: "douleur", label: "Douleur" },
  { id: "choix", label: "Choix" },
  { id: "materiel", label: "Matériel" },
];
