// Attendre que le DOM soit complètement chargé avant d'exécuter le script
document.addEventListener("DOMContentLoaded", () => {
  // Graphique des dépenses par catégorie (graphique en camembert)
  // Récupérer le contexte du canvas pour le graphique des dépenses par catégorie
  const expensesByCategoryCtx = document
    .getElementById("expensesByCategoryChart")
    .getContext("2d");

  // Créer un nouveau graphique en utilisant Chart.js
  new Chart(expensesByCategoryCtx, {
    type: "pie", // Type de graphique : camembert
    data: {
      // Étiquettes pour chaque section du camembert
      labels: ["Alimentation", "Logement", "Transport", "Loisirs", "Autres"],
      datasets: [
        {
          // Données pour chaque section (en euros)
          data: [300, 500, 200, 150, 100],
          // Couleurs pour chaque section
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
          ],
        },
      ],
    },
    options: {
      responsive: true, // Le graphique s'adapte à la taille de son conteneur
      plugins: {
        legend: {
          position: "top", // Position de la légende en haut du graphique
        },
        title: {
          display: true, // Afficher le titre du graphique
          text: "Dépenses par catégorie", // Texte du titre
        },
      },
    },
  });

  // Graphique de tendance des dépenses (graphique en ligne)
  // Récupérer le contexte du canvas pour le graphique de tendance des dépenses
  const expensesTrendCtx = document
    .getElementById("expensesTrendChart")
    .getContext("2d");

  // Créer un nouveau graphique en utilisant Chart.js
  new Chart(expensesTrendCtx, {
    type: "line", // Type de graphique : ligne
    data: {
      // Étiquettes pour l'axe X (mois)
      labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
      datasets: [
        {
          label: "Dépenses", // Nom de la série de données
          // Données pour chaque mois (en euros)
          data: [1200, 1300, 1100, 1400, 1200, 1500],
          borderColor: "#36A2EB", // Couleur de la ligne
          tension: 0.1, // Tension de la courbe (0 = droite, 1 = très courbé)
        },
      ],
    },
    options: {
      responsive: true, // Le graphique s'adapte à la taille de son conteneur
      plugins: {
        legend: {
          position: "top", // Position de la légende en haut du graphique
        },
        title: {
          display: true, // Afficher le titre du graphique
          text: "Tendance des dépenses", // Texte du titre
        },
      },
      scales: {
        y: {
          beginAtZero: true, // L'axe Y commence à zéro
        },
      },
    },
  });
});
