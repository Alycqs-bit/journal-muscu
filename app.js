if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => console.error("Service worker : ", err));
  });
}

const statusEl = $("status");
const btnConnect = $("btn-connect");

DriveAuth.init(() => {
  btnConnect.disabled = false;
  statusEl.textContent = "Prêt à te connecter.";
});

btnConnect.onclick = () => {
  statusEl.textContent = "Connexion…";
  DriveAuth.login((result) => {
    if (!result.ok) {
      statusEl.textContent = "Erreur de connexion : " + result.error;
      return;
    }
    try {
      renderAccueil();
    } catch (err) {
      showDebugError("Erreur après connexion : " + err.message);
      console.error(err);
    }
  });
};

$("btn-terminer-seance").onclick = () => renderFin();

$("btn-valider-archiver").onclick = async () => {
  $("btn-valider-archiver").disabled = true;
  await validerEtArchiver();
  $("btn-valider-archiver").disabled = false;
  renderAccueil();
};
