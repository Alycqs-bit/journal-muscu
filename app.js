const statusEl = document.getElementById("status");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => {
        statusEl.textContent = "Squelette OK — app installable et fonctionnelle hors-ligne.";
      })
      .catch((err) => {
        statusEl.textContent = "Erreur service worker : " + err;
      });
  });
} else {
  statusEl.textContent = "Service worker non supporté par ce navigateur.";
}
