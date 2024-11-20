// mainController.js

// Définition d'un objet qui contient toutes les méthodes du contrôleur principal
const mainController = {
  // Méthode pour la page d'accueil
  index: (req, res) => {
    // Rend la vue 'index' avec un titre 'Accueil'
    res.render("index", { title: "Accueil" });
  },

  // Méthode pour la page "À propos"
  about: (req, res) => {
    // Rend la vue 'about' avec un titre 'À propos'
    res.render("about", { title: "À propos" });
  },

  // Méthode pour la page de contact
  contact: (req, res) => {
    // Rend la vue 'contact' avec un titre 'Contact'
    res.render("contact", { title: "Contact" });
  },

  // Méthode pour la page de politique de confidentialité
  privacyPolicy: (req, res) => {
    // Rend la vue 'privacy-policy' avec un titre 'Politique de Confidentialité'
    res.render("privacy-policy", { title: "Politique de Confidentialité" });
  },
};

// Exporte le contrôleur pour qu'il puisse être utilisé dans d'autres fichiers
export default mainController;
