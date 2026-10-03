/* Programme = données (cahier des charges C4). Pour changer la séance, on modifie ce fichier, jamais la logique.

   Champs d'un exercice :
   - type_mesure : reps_charge · reps_seules · temps · temps_charge
   - unilateral  : true → chaque série est notée G ou D
   - unite       : "kg" par défaut ; autre unité (ex. "dist.") → jamais comptée dans le tonnage (R4)
   - pas_charge  : les deux paliers de boutons de charge
   - cible_series / cible_reps / cible_temps_sec / repos_sec : fourchettes [min, max]
   - repos_cotes_sec : repos entre les deux côtés d'un exo unilatéral (null = on enchaîne)
   - lieu : "salle" / "maison" (info d'affichage, pour choisir la bonne variante)
   - ancien : true → exercice de l'ancien programme, gardé uniquement pour l'historique

   Cibles reprises de plan-bloc-1-reprise-fondation-force.md §4 (projet Trail, état au 03/10/2026). */

const LIBRARY = {
  /* ---------- Programme actuel : Force Bloc 1 ---------- */
  mollet_tendu_barre: {
    nom: "Mollet genou tendu — barre, 2 jambes", groupe: "mollets", lieu: "maison",
    type_mesure: "reps_charge", reglages: "tempo 3-1-3-2",
    cible_series: [3, 4], cible_reps: [6, 8], repos_sec: [120, 180],
    consignes: "Montée : 1 série proche du poids de travail. Variante maison sans Smith.",
  },
  mollet_tendu_uni: {
    nom: "Mollet genou tendu — 1 jambe, ceinture lestée", groupe: "mollets", lieu: "maison", unilateral: true,
    type_mesure: "reps_charge", reglages: "tempo 3-1-3-2",
    cible_series: [3, 4], cible_reps: [6, 8], repos_sec: [120, 180], repos_cotes_sec: null,
    consignes: "Variante maison si le 2 jambes n'est pas stable.",
  },
  mollet_tendu_smith: {
    nom: "Mollet genou tendu — Smith, 2 jambes", groupe: "mollets", lieu: "salle",
    type_mesure: "reps_charge", reglages: "tempo 3-1-3-2",
    cible_series: [3, 4], cible_reps: [6, 8], repos_sec: [120, 180],
    consignes: "Montée : 1 série proche du poids de travail (60×6). Historique avant septembre : ancien tempo (lent, 1\" iso).",
  },
  soleaire_barre: {
    nom: "Soléaire — barre sur les genoux", groupe: "mollets", lieu: "maison",
    type_mesure: "reps_charge", reglages: "assis, hanche à 90°, tempo 3-1-3-2",
    cible_series: [3, 4], cible_reps: [6, 8], repos_sec: [120, 180],
    consignes: "Pas de rampe : mollets déjà chauds. Variante maison de la presse assise.",
  },
  soleaire_presse: {
    nom: "Soléaire — presse assise", groupe: "mollets", lieu: "salle",
    type_mesure: "reps_charge", reglages: "tempo 3-1-3-2",
    cible_series: [3, 4], cible_reps: [6, 8], repos_sec: [120, 180],
    consignes: "Pas de rampe : mollets déjà chauds.",
  },
  squat: {
    nom: "Squat — barre", groupe: "quadriceps",
    type_mesure: "reps_charge", reglages: "",
    cible_series: [2, 2], cible_reps: [6, 8], repos_sec: [120, 240],
    consignes: "Montée : 20×10 → 40×6 → 70×4. On monte la charge quand 8 reps passent proprement.",
  },
  rdl: {
    nom: "RDL — barre", groupe: "ischios",
    type_mesure: "reps_charge", reglages: "",
    cible_series: [2, 2], cible_reps: [6, 8], repos_sec: [120, 240],
    consignes: "Montée : 70×6. Jamais au-dessus de 90 kg sans straps.",
  },
  fente_bulgare: {
    nom: "Fente bulgare — barre libre", groupe: "quadriceps", unilateral: true,
    type_mesure: "reps_charge", reglages: "gauche en premier",
    cible_series: [2, 2], cible_reps: [6, 8], repos_sec: [120, 240], repos_cotes_sec: [90, 120],
    consignes: "",
  },
  nordic: {
    nom: "Nordic curl", groupe: "ischios",
    type_mesure: "reps_seules", reglages: "amplitude partielle",
    cible_series: [2, 2], cible_reps: [5, 8], repos_sec: [90, 120],
    consignes: "Noter l'angle de perte de contrôle si possible.",
  },
  planche: {
    nom: "Planche", groupe: "tronc",
    type_mesure: "temps", reglages: "durée fixe, pas au max",
    cible_series: [3, 3], cible_temps_sec: [45, 60], repos_sec: [90, 120],
    consignes: "",
  },
  porte_valise: {
    nom: "Porté valise", groupe: "tronc", unilateral: true,
    type_mesure: "temps_charge", reglages: "1 haltère, un seul côté",
    cible_series: [3, 3], cible_temps_sec: [45, 45], repos_sec: [60, 90], repos_cotes_sec: null,
    consignes: "5-10 s de transition entre les mains.",
  },
  releveur: {
    nom: "Releveur — élastique", groupe: "releveur", unilateral: true, unite: "dist.", pas_charge: [0.5, 1],
    type_mesure: "reps_charge", reglages: "assis, orteils fléchis, relevé 1 s / retour 3 s",
    cible_series: [3, 3], cible_reps: [20, 25], repos_sec: [45, 60], repos_cotes_sec: null,
    consignes: "La « charge » = distance au point d'amarrage (repère fixe au sol). 3×30 propres → on recule et on repart à 3×20.",
  },

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

/* Un créneau de séance = un exo, ou { variantes: [...] } quand plusieurs versions existent (la première = défaut). */
const PROGRAMME = {
  FORCE_B1: {
    id: "FORCE_B1", nom: "Force Bloc 1", actif: true, version: 1, date_maj: "2026-10-03",
    echauffement: "Footing ou vélo 30' + mobilisation cheville",
    blocs: [
      { titre: "Mollets", slots: [
        { variantes: ["mollet_tendu_barre", "mollet_tendu_uni", "mollet_tendu_smith"] },
        { variantes: ["soleaire_barre", "soleaire_presse"] },
      ] },
      { titre: "Force", slots: ["squat", "rdl", "fente_bulgare", "nordic"] },
      { titre: "Tronc", slots: ["planche", "porte_valise"] },
      { titre: "Releveur", slots: ["releveur"] },
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
