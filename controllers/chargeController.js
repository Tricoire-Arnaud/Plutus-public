// Importation des modèles de données et des fonctions utilitaires pour la gestion des dates
import models from "../models/index.js";
import { startOfMonth, endOfMonth } from "date-fns";
const { Charge } = models;
// Définition du contrôleur pour la gestion des charges
const chargeController = {
  // Méthode pour afficher la page des charges
  getChargesPage: async (req, res) => {
    try {
      const userId = req.session.userId;

      // Récupérer les dates de la session
      const startDate = req.session.startDate || startOfMonth(new Date());
      const endDate = req.session.endDate || endOfMonth(new Date());

      // Utiliser startDate et endDate dans vos requêtes
      const chargesFixes = await Charge.getFixesByUserId(userId);
      const chargesVariables = await Charge.getVariablesByUserIdAndDateRange(
        userId,
        { startDate, endDate }
      );

      res.render("charges", {
        chargesFixes,
        chargesVariables,
        startDate,
        endDate,
        flashMessage: req.session.flashMessage,
      });

      req.session.flashMessage = null;
    } catch (error) {
      console.error("Erreur lors du chargement de la page des charges:", error);
      res.status(500).render("error", {
        message: "Erreur lors du chargement de la page des charges",
      });
    }
  },

  addCharge: async (req, res) => {
    try {
      const { montant, description, date, type } = req.body;

      // Validation du montant
      if (!montant || Number.isNaN(montant) || montant <= 0) {
        throw new Error("Le montant doit être un nombre positif");
      }

      // Validation de la description
      if (!description || description.trim().length === 0) {
        throw new Error("La description est requise");
      }

      // Validation du type
      if (!["fixe", "variable"].includes(type)) {
        throw new Error("Type de charge invalide");
      }

      // Validation de la date pour les charges variables
      if (type === "variable" && !date) {
        throw new Error("La date est requise pour les charges variables");
      }

      const userId = req.session.userId;
      await Charge.create({
        user_id: userId,
        montant,
        description,
        date,
        type,
      });
      req.session.flashMessage = "Charge ajoutée avec succès";
      res.redirect("/charges");
    } catch (error) {
      console.error("Erreur lors de l'ajout de la charge:", error);
      req.session.flashMessage = `Erreur: ${error.message}`;
      res.redirect("/charges");
    }
  },

  updateCharge: async (req, res) => {
    try {
      const { id, montant, description, date, type } = req.body;
      const userId = req.session.userId;

      // Vérifier que la charge appartient bien à l'utilisateur
      const charge = await Charge.findOne({
        where: {
          id,
          user_id: userId,
        },
      });

      if (!charge) {
        throw new Error("Charge non trouvée ou non autorisée");
      }

      // Préparer les données de mise à jour
      const updateData = {
        montant,
        description,
        type,
      };

      // Ajouter la date seulement pour les charges variables
      if (type === "variable" && date) {
        updateData.date = date;
      }

      // Mettre à jour la charge
      await Charge.update(updateData, {
        where: {
          id,
          user_id: userId,
        },
      });

      req.session.flashMessage = "Charge mise à jour avec succès";
      res.redirect("/charges");
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la charge:", error);
      req.session.flashMessage = `Erreur: ${error.message}`;
      res.redirect("/charges");
    }
  },

  deleteCharge: async (req, res) => {
    try {
      const { id } = req.params;
      await Charge.destroy({ where: { id, user_id: req.session.userId } });
      req.session.flashMessage = "Charge supprimée avec succès";
      res.redirect("/charges");
    } catch (error) {
      console.error("Erreur lors de la suppression de la charge:", error);
      req.session.flashMessage = `Erreur: ${error.message}`;
      res.redirect("/charges");
    }
  },

  resetCharges: async (req, res) => {
    try {
      const userId = req.session.userId;

      // Suppression de toutes les charges de l'utilisateur
      await Charge.destroy({ where: { user_id: userId } });

      req.session.flashMessage = "Charges réinitialisées avec succès";
      res.redirect("/dashboard"); // or wherever you want to redirect after reset
    } catch (error) {
      console.error("Erreur lors de la réinitialisation des charges:", error);
      req.session.flashMessage = `Erreur: ${error.message}`;
      res.redirect("/dashboard"); // or appropriate error page
    }
  },
};

export default chargeController;
