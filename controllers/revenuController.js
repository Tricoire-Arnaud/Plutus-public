import models from "../models/index.js";
import { startOfMonth, endOfMonth } from "date-fns";
import { isAuthenticated } from "../middlewares/auth.js";

// Extraction du modèle Revenu depuis l'objet models importé
const { Revenu } = models;

// Définition du contrôleur pour gérer les opérations liées aux revenus
const revenuController = {
  // Méthode pour afficher la page des revenus
  getRevenusPage: [
    isAuthenticated,
    async (req, res) => {
      try {
        const startDate = req.session.startDate || startOfMonth(new Date());
        const endDate = req.session.endDate || endOfMonth(new Date());

        const revenus = await Revenu.getByUserIdAndDateRange(
          req.session.userId,
          {
            startDate,
            endDate,
          }
        );

        const flashMessage = req.session.flashMessage;
        req.session.flashMessage = null;

        res.render("revenus", {
          revenus,
          startDate,
          endDate,
          flashMessage,
          currentPage: "revenus",
          title: "Gestion des revenus",
        });
      } catch (error) {
        console.error("Erreur lors du chargement des revenus:", error);
        res.status(500).render("error", {
          message: "Une erreur est survenue lors du chargement des revenus.",
        });
      }
    },
  ],

  // Méthode pour ajouter un nouveau revenu
  addRevenu: [
    isAuthenticated,
    async (req, res) => {
      try {
        const { montant, description, date } = req.body;
        const userId = req.session.userId;

        // Vérifiez que toutes les données nécessaires sont présentes
        if (!montant || !description || !date) {
          throw new Error("Tous les champs sont requis.");
        }

        await Revenu.createForUser(userId, { montant, description, date });

        req.session.flashMessage = "Revenu ajouté avec succès";
        res.redirect("/revenus");
      } catch (error) {
        console.error("Erreur lors de l'ajout du revenu:", error);
        req.session.flashMessage = `Erreur: ${error.message}`;
        res.redirect("/revenus");
      }
    },
  ],

  // Méthode pour mettre à jour un revenu existant
  updateRevenu: [
    isAuthenticated,
    async (req, res) => {
      try {
        // Extraction des données du corps de la requête
        const { id, montant, description, date } = req.body;
        const userId = req.session.userId;

        // Mise à jour du revenu pour l'utilisateur
        await Revenu.updateForUser(id, userId, { montant, description, date });

        // Ajout d'un message flash pour informer l'utilisateur du succès
        req.session.flashMessage = "Revenu mis à jour avec succès";

        // Redirection vers la page des revenus
        res.redirect("/revenus");
      } catch (error) {
        // Gestion des erreurs : log de l'erreur et ajout d'un message flash d'erreur
        console.error("Erreur lors de la mise à jour du revenu:", error);
        req.session.flashMessage = `Erreur: ${error.message}`;
        res.redirect("/revenus");
      }
    },
  ],

  // Méthode pour supprimer un revenu
  deleteRevenu: [
    isAuthenticated,
    async (req, res) => {
      try {
        // Extraction de l'ID du revenu à supprimer depuis les paramètres de la requête
        const { id } = req.params;

        // Suppression du revenu pour l'utilisateur
        await Revenu.deleteForUser(id, req.session.userId);

        // Ajout d'un message flash pour informer l'utilisateur du succès
        req.session.flashMessage = "Revenu supprimé avec succès";

        // Redirection vers la page des revenus
        res.redirect("/revenus");
      } catch (error) {
        // Gestion des erreurs : log de l'erreur et ajout d'un message flash d'erreur
        console.error("Erreur lors de la suppression du revenu:", error);
        req.session.flashMessage = `Erreur: ${error.message}`;
        res.redirect("/revenus");
      }
    },
  ],
};

// Exportation du contrôleur pour utilisation dans d'autres parties de l'application
export default revenuController;
