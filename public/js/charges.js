/* global bootstrap */

document.addEventListener("DOMContentLoaded", () => {
  // Initialiser et personnaliser les champs de date
  const dateInputs = document.querySelectorAll('input[type="date"]');
  for (const input of dateInputs) {
    if (!input.value) {
      input.valueAsDate = new Date();
    }

    // Personnalisation du calendrier
    input.addEventListener('focus', (e) => {
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 1);
      e.target.min = minDate.toISOString().split('T')[0];

      // Pour les charges variables, permettre les dates futures (jusqu'à 1 an)
      if (input.closest('form').querySelector('input[name="type"]')?.value === 'variable') {
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 1);
        e.target.max = maxDate.toISOString().split('T')[0];
      } else {
        // Pour les charges fixes, limiter à aujourd'hui
        e.target.max = new Date().toISOString().split('T')[0];
      }
    });
  }

  // Sélectionner tous les boutons d'édition de charge
  const editButtons = document.querySelectorAll(".edit-charge");
  // Créer une instance de modal Bootstrap
  const editChargeModal = document.getElementById("editChargeModal");
  const editModal = new bootstrap.Modal(editChargeModal);

  for (const button of editButtons) {
    button.addEventListener("click", function () {
      // Récupérer les données de la charge depuis les attributs data-*
      const chargeId = this.getAttribute("data-id");
      const montant = this.getAttribute("data-montant");
      const description = this.getAttribute("data-description");
      const type = this.getAttribute("data-type");
      const date = this.getAttribute("data-date");

      // Remplir le formulaire avec les données
      document.getElementById("editChargeId").value = chargeId;
      document.getElementById("editMontant").value = montant;
      document.getElementById("editDescription").value = description;
      document.getElementById("editChargeType").value = type;

      // Gérer l'affichage du champ date selon le type de charge
      const dateContainer = document.getElementById("editDateContainer");
      if (type === "variable") {
        dateContainer.style.display = "block";
        document.getElementById("editDate").value = date
          ? new Date(date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
        document.getElementById("editDate").required = true;
      } else {
        dateContainer.style.display = "none";
        document.getElementById("editDate").required = false;
      }

      // Afficher la modal
      editModal.show();
    });
  }
});

// Auto-suppression du message flash
document.addEventListener("DOMContentLoaded", () => {
  const flashMessage = document.getElementById("flashMessage");
  if (flashMessage) {
    setTimeout(() => {
      flashMessage.remove();
    }, 5000); // Supprime le message après 5 secondes
  }
});
