const CLIENT_ID = "68380651068-8sng7sm5q520vk581gvoeeve0m9hpmj3.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

const statusEl = document.getElementById("status");
const btnConnect = document.getElementById("btn-connect");

let tokenClient;
let accessToken = null;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.error("Service worker : ", err);
    });
  });
}

function waitForGoogleIdentity(callback) {
  if (window.google && google.accounts && google.accounts.oauth2) {
    callback();
  } else {
    setTimeout(() => waitForGoogleIdentity(callback), 100);
  }
}

function initGoogleAuth() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: handleTokenResponse,
  });
  btnConnect.disabled = false;
  statusEl.textContent = "Prêt à te connecter.";
}

function handleTokenResponse(response) {
  if (response.error) {
    statusEl.textContent = "Erreur de connexion : " + response.error;
    return;
  }
  accessToken = response.access_token;
  statusEl.textContent = "Connecté. Écriture du fichier test dans ton Drive…";
  writeTestFileToDrive();
}

function writeTestFileToDrive() {
  const boundary = "-------journalmuscu";
  const metadata = { name: "journal-muscu-test.txt", mimeType: "text/plain" };
  const content = "Connexion Journal Muscu reussie le " + new Date().toISOString();
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: text/plain\r\n\r\n${content}\r\n` +
    `--${boundary}--`;

  fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  })
    .then((res) => res.json())
    .then((data) => {
      statusEl.textContent = data.id
        ? "Fichier créé dans ton Drive (id " + data.id + "). La connexion marche !"
        : "Réponse inattendue : " + JSON.stringify(data);
    })
    .catch((err) => {
      statusEl.textContent = "Erreur d'écriture Drive : " + err;
    });
}

btnConnect.addEventListener("click", () => tokenClient.requestAccessToken());

waitForGoogleIdentity(initGoogleAuth);
