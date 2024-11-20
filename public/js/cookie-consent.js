// Attendre que le DOM soit complètement chargé avant d'exécuter le script
document.addEventListener("DOMContentLoaded", () => {
  // Récupérer les éléments du DOM nécessaires
  const cookieConsent = document.getElementById("cookie-consent");
  const acceptCookiesButton = document.getElementById("accept-cookies");

  // Vérifier si l'utilisateur a déjà accepté les cookies
  if (!localStorage.getItem("cookiesAccepted")) {
    console.log("Cookies pas encore acceptés, affichage du consentement");
    // Afficher la bannière de consentement si les cookies n'ont pas été acceptés
    cookieConsent.style.display = "block";
  } else {
    console.log("Cookies déjà acceptés");
  }

  // Vérifier si le bouton d'acceptation existe dans le DOM
  if (acceptCookiesButton) {
    // Ajouter un écouteur d'événements sur le bouton d'acceptation
    acceptCookiesButton.addEventListener("click", () => {
      console.log("Bouton d'acceptation cliqué");
      // Enregistrer l'acceptation des cookies dans le stockage local
      localStorage.setItem("cookiesAccepted", "true");
      // Cacher la bannière de consentement après acceptation
      cookieConsent.style.display = "none";
    });
  }
});
