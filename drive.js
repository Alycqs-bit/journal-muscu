const CLIENT_ID = "68380651068-8sng7sm5q520vk581gvoeeve0m9hpmj3.apps.googleusercontent.com";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

const DriveAuth = (() => {
  let tokenClient = null;
  let accessToken = null;
  let loginCallback = null;

  function waitForGoogleIdentity(cb) {
    if (window.google && google.accounts && google.accounts.oauth2) cb();
    else setTimeout(() => waitForGoogleIdentity(cb), 100);
  }

  function init(onReady) {
    waitForGoogleIdentity(() => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: (response) => {
          if (response.error) {
            if (loginCallback) loginCallback({ ok: false, error: response.error });
            return;
          }
          accessToken = response.access_token;
          if (loginCallback) loginCallback({ ok: true });
        },
      });
      onReady();
    });
  }

  function login(callback) {
    loginCallback = callback;
    tokenClient.requestAccessToken();
  }

  function isConnected() {
    return !!accessToken;
  }

  async function findFileByName(name) {
    const q = encodeURIComponent(`name = '${name.replace(/'/g, "\\'")}' and trashed = false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    return data.files && data.files.length ? data.files[0] : null;
  }

  async function createFile(name, content, mimeType) {
    const boundary = "-------journalmuscu";
    const metadata = { name, mimeType };
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n${content}\r\n` +
      `--${boundary}--`;
    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    });
    return res.json();
  }

  async function updateFile(fileId, content, mimeType) {
    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": mimeType },
      body: content,
    });
    return res.json();
  }

  async function writeOrUpdateFile(name, content, mimeType = "text/markdown") {
    const existing = await findFileByName(name);
    return existing ? updateFile(existing.id, content, mimeType) : createFile(name, content, mimeType);
  }

  return { init, login, isConnected, writeOrUpdateFile };
})();
