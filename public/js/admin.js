// Import Bootstrap si nécessaire (à ajouter dans le head de admin.ejs)
// <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>

document.addEventListener("DOMContentLoaded", () => {
  // Initialisation des modals
  const editUserModal = new bootstrap.Modal(
    document.getElementById("editUserModal")
  );

  // Gestion du bouton d'ajout d'utilisateur
  document.getElementById("addUserBtn")?.addEventListener("click", async () => {
    // Créer un nouveau modal pour l'ajout (à ajouter dans admin.ejs)
    const username = prompt("Nom d'utilisateur:");
    const email = prompt("Email:");
    const password = prompt("Mot de passe:");
    const role = prompt("Rôle (user/admin):");

    if (!username || !email || !password || !role) {
      return;
    }

    try {
      const response = await fetch("/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.reload();
      } else {
        alert(data.message || "Erreur lors de l'ajout de l'utilisateur");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'ajout de l'utilisateur");
    }
  });

  // Gestion de l'édition d'utilisateur
  const editButtons = document.querySelectorAll('.edit-user');
  for (const button of editButtons) {
    button.addEventListener('click', function() {
      const userId = this.dataset.userId;
      const username = this.dataset.username;
      const role = this.dataset.role;

      document.getElementById('editUserId').value = userId;
      document.getElementById('editUsername').value = username;
      document.getElementById('editRole').value = role;

      editUserModal.show();
    });
  }

  // Gestion de la sauvegarde des modifications
  document.getElementById("saveUserEdit")?.addEventListener("click", async () => {
    const userId = document.getElementById("editUserId").value;
    const username = document.getElementById("editUsername").value;
    const role = document.getElementById("editRole").value;

    try {
      const response = await fetch(`/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, role }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.reload();
      } else {
        alert(data.message || "Erreur lors de la modification de l'utilisateur");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la modification de l'utilisateur");
    }
  });

  // Gestion de la suppression d'utilisateur
  const deleteButtons = document.querySelectorAll('.delete-user');
  for (const button of deleteButtons) {
    button.addEventListener('click', async function() {
      if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
        return;
      }

      const userId = this.dataset.userId;

      try {
        const response = await fetch(`/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.success) {
          this.closest('tr').remove();
          alert('Utilisateur supprimé avec succès');
        } else {
          alert(data.message || 'Erreur lors de la suppression de l\'utilisateur');
        }
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression de l\'utilisateur');
      }
    });
  }
});
