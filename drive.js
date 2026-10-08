/* Connexion Google + écriture dans Drive.

   - Le jeton d'accès (valable ~1 h) est gardé dans le navigateur : un rechargement ne déconnecte plus (C6).
   - La séance elle-même n'a pas besoin de Google : on ne demande la connexion qu'au moment d'écrire.
   - Autorisation « drive.file » : l'app n'écrit QUE dans les fichiers qu'elle a créés. Elle range tout dans
     son propre dossier « Journal Muscu (app) », qu'on peut déplacer où on veut dans Drive (C8).
   - Autorisation « drive.readonly » (ajoutée le 08/10/2026, choix d'Alix) : lecture seule du reste du Drive,
     pour lire les consignes du coach dans les analyses de force (dossier Analyses > Daily du projet Trail). */

const CLIENT_ID = "68380651068-8sng7sm5q520vk581gvoeeve0m9hpmj3.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly";
const DOSSIER_APP = "Journal Muscu (app)";
const TOKEN_KEY = "muscu:google_token";

const DriveAuth = (() => {
  let tokenClient = null;
  let pending = null;
  let dossierId = null;

  function waitForGoogleIdentity(cb, tries = 0) {
    if (window.google && google.accounts && google.accounts.oauth2) cb();
    else if (tries < 300) setTimeout(() => waitForGoogleIdentity(cb, tries + 1), 100);
  }

  function init(onReady) {
    waitForGoogleIdentity(() => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: (resp) => {
          const p = pending;
          pending = null;
          if (!p) return;
          if (resp.error) return p.reject(new Error(resp.error));
          lsSet(TOKEN_KEY, { access_token: resp.access_token, exp: Date.now() + (Number(resp.expires_in) || 3600) * 1000, scope: resp.scope || "" });
          p.resolve();
        },
        error_callback: (err) => {
          const p = pending;
          pending = null;
          if (p) p.reject(new Error(err && err.type === "popup_closed" ? "fenêtre Google fermée" : (err && err.type) || "connexion impossible"));
        },
      });
      if (onReady) onReady();
    });
  }

  function token() {
    const t = lsGet(TOKEN_KEY, null);
    /* Un jeton obtenu avant l'ajout de la lecture seule ne suffit plus : on en redemande un. */
    return t && t.exp > Date.now() + 60000 && (t.scope || "").includes("drive.readonly") ? t.access_token : null;
  }

  function isReady() { return !!tokenClient; }
  function isConnected() { return !!token(); }

  /* À appeler en tout premier dans un clic : le navigateur n'autorise la fenêtre Google
     que juste après un geste de l'utilisateur. */
  function ensureToken() {
    if (token()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      if (!tokenClient) return reject(new Error("Google pas encore chargé (connexion internet ?)"));
      pending = { resolve, reject };
      const dejaAutorise = !!lsGet(TOKEN_KEY, null);
      tokenClient.requestAccessToken(dejaAutorise ? { prompt: "" } : {});
    });
  }

  function deconnecter() {
    localStorage.removeItem(TOKEN_KEY);
  }

  async function api(url, options = {}) {
    const res = await fetch(url, Object.assign({}, options, {
      headers: Object.assign({ Authorization: `Bearer ${token()}` }, options.headers || {}),
    }));
    if (res.status === 401) {
      deconnecter();
      throw new Error("session Google expirée, reconnecte-toi");
    }
    if (!res.ok) throw new Error(`Drive a répondu ${res.status} : ${(await res.text()).slice(0, 200)}`);
    return res.json();
  }

  function q(str) { return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'"); }

  async function getDossier() {
    if (dossierId) return dossierId;
    const query = encodeURIComponent(`name = '${q(DOSSIER_APP)}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
    const found = await api(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`);
    if (found.files && found.files.length) return (dossierId = found.files[0].id);
    const created = await api("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: DOSSIER_APP, mimeType: "application/vnd.google-apps.folder" }),
    });
    return (dossierId = created.id);
  }

  async function writeFile(name, content, mimeType = "text/markdown") {
    const parent = await getDossier();
    const query = encodeURIComponent(`name = '${q(name)}' and '${parent}' in parents and trashed = false`);
    const found = await api(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`);
    if (found.files && found.files.length) {
      return api(`https://www.googleapis.com/upload/drive/v3/files/${found.files[0].id}?uploadType=media`, {
        method: "PATCH",
        headers: { "Content-Type": `${mimeType}; charset=UTF-8` },
        body: content,
      });
    }
    const boundary = "-------journalmuscu";
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name, mimeType, parents: [parent] })}\r\n` +
      `--${boundary}\r\nContent-Type: ${mimeType}; charset=UTF-8\r\n\r\n${content}\r\n` +
      `--${boundary}--`;
    return api("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    });
  }

  /* Contenu texte d'un fichier du dossier de l'app, ou null s'il n'existe pas. */
  async function readFile(name) {
    const parent = await getDossier();
    const query = encodeURIComponent(`name = '${q(name)}' and '${parent}' in parents and trashed = false`);
    const found = await api(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`);
    if (!found.files || !found.files.length) return null;
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${found.files[0].id}?alt=media`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (!res.ok) throw new Error(`lecture Drive impossible (${res.status})`);
    return res.text();
  }

  /* Fichiers (ou dossiers) d'un dossier quelconque du Drive, lecture seule. */
  async function listerDossier(parentId, filtre = "") {
    const query = encodeURIComponent(`'${parentId}' in parents and trashed = false${filtre ? " and " + filtre : ""}`);
    const res = await api(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType)&pageSize=200`);
    return res.files || [];
  }

  /* Contenu texte d'un fichier par son identifiant (un Google Doc est exporté en texte). */
  async function lireParId(id, mimeType) {
    const url = mimeType === "application/vnd.google-apps.document"
      ? `https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=text/plain`
      : `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token()}` } });
    if (!res.ok) throw new Error(`lecture Drive impossible (${res.status})`);
    return res.text();
  }

  /* Met à la corbeille Drive (récupérable 30 jours) un fichier du dossier de l'app. */
  async function trashFile(name) {
    const parent = await getDossier();
    const query = encodeURIComponent(`name = '${q(name)}' and '${parent}' in parents and trashed = false`);
    const found = await api(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`);
    for (const f of found.files || []) {
      await api(`https://www.googleapis.com/drive/v3/files/${f.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trashed: true }),
      });
    }
  }

  return { init, isReady, isConnected, ensureToken, deconnecter, writeFile, readFile, trashFile, listerDossier, lireParId };
})();
