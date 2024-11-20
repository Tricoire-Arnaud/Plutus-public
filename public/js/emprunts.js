// Fonction utilitaire pour les requêtes fetch
async function secureFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "X-Requested-With": "XMLHttpRequest",
        "Cache-Control": "no-store",
        "X-No-Log": "true", // En-tête personnalisé pour désactiver le logging
      },
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error("Erreur réseau");
    }

    return await response.json();
  } catch (error) {
    showNotification("Une erreur est survenue", "error");
    throw error;
  }
}

// Fonction pour afficher les détails d'un emprunt
async function getEmpruntDetails(id) {
  try {
    return await secureFetch(`/emprunts/${id}/details`);
  } catch {
    // Gérer silencieusement l'erreur
    return null;
  }
}

// Fonction pour afficher une notification
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// Gestionnaires d'événements
document.addEventListener("DOMContentLoaded", () => {
  // Gérer les clics sur les boutons de détails
  document.querySelectorAll(".details-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const id = btn.dataset.id;
      const details = await getEmpruntDetails(id);
      if (details) {
        // Mettre à jour l'UI avec les détails
        updateDetailsUI(details);
      }
    });
  });
});

// Fonction pour mettre à jour l'UI avec les détails
function updateDetailsUI(details) {
  // Mise à jour silencieuse de l'UI
  // ... code pour mettre à jour l'interface
}
