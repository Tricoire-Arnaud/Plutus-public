import models from "../models/index.js";
const { Emprunt, Remboursement, User } = models;
import logger from "../utils/logger.js";

const empruntController = {
  getEmpruntsPage: async (req, res) => {
    try {
      const userId = req.session.userId;
      const emprunts = await Emprunt.findAll({
        where: { user_id: userId },
        attributes: [
          "id",
          "nom",
          "montant_initial",
          "taux_interet",
          "duree_mois",
          "date_debut",
          "montant_rembourse",
        ],
        include: [
          {
            model: Remboursement,
            attributes: ["date", "montant"],
          },
        ],
      });

      const { debugLogs, flashMessage } = req.session;
      req.session.debugLogs = null;
      req.session.flashMessage = null;
      await req.session.save();

      res.render("emprunts", {
        emprunts,
        debugLogs,
        flashMessage,
      });
    } catch (error) {
      logger.error("Erreur lors du chargement de la page des emprunts:", error);
      res.status(500).render("error", {
        message: "Erreur lors du chargement de la page des emprunts",
      });
    }
  },

  addEmprunt: async (req, res) => {
    try {
      const userId = req.session.userId;
      const user = await User.findByPk(userId);

      if (!user) {
        req.session.flashMessage =
          "Session invalide, veuillez vous reconnecter";
        return res.redirect("/login");
      }

      const { nom, montant_initial, taux_interet, duree_mois, date_debut } =
        req.body;

      const parsedData = {
        montant_initial: Number.parseFloat(montant_initial),
        taux_interet: Number.parseFloat(taux_interet),
        duree_mois: Number.parseInt(duree_mois, 10),
      };

      await Emprunt.create({
        user_id: userId,
        nom: nom.trim(),
        montant_initial: parsedData.montant_initial,
        taux_interet: parsedData.taux_interet,
        duree_mois: parsedData.duree_mois,
        date_debut: new Date(date_debut),
        montant_rembourse: 0,
      });

      req.session.flashMessage = "Emprunt ajouté avec succès";
      return res.redirect("/emprunts");
    } catch (error) {
      logger.error("Erreur lors de l'ajout de l'emprunt:", error);
      req.session.flashMessage =
        "Une erreur est survenue lors de l'ajout de l'emprunt";
      return res.redirect("/emprunts");
    }
  },

  addRemboursement: async (req, res) => {
    try {
      const { empruntId, montant, date } = req.body;
      const userId = req.session.userId;

      const emprunt = await Emprunt.findOne({
        where: { id: empruntId, user_id: userId },
      });

      if (!emprunt) {
        req.session.flashMessage = "Emprunt non trouvé";
        return res.redirect("/emprunts");
      }

      await Remboursement.create({
        emprunt_id: empruntId,
        montant: Number.parseFloat(montant),
        date,
      });

      const nouveauMontantRembourse =
        Number.parseFloat(emprunt.montant_rembourse || 0) +
        Number.parseFloat(montant);
      await emprunt.update({ montant_rembourse: nouveauMontantRembourse });

      req.session.flashMessage = "Remboursement ajouté avec succès";
      res.redirect("/emprunts");
    } catch (error) {
      logger.error("Erreur lors de l'ajout du remboursement:", error);
      req.session.flashMessage =
        "Une erreur est survenue lors de l'ajout du remboursement";
      res.redirect("/emprunts");
    }
  },

  deleteEmprunt: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.userId;

      const emprunt = await Emprunt.findOne({
        where: { id, user_id: userId },
      });

      if (!emprunt) {
        req.session.flashMessage = "Emprunt non trouvé";
        return res.redirect("/emprunts");
      }

      await emprunt.destroy();
      req.session.flashMessage = "Emprunt supprimé avec succès";
      res.redirect("/emprunts");
    } catch (error) {
      logger.error("Erreur lors de la suppression de l'emprunt:", error);
      req.session.flashMessage =
        "Une erreur est survenue lors de la suppression";
      res.redirect("/emprunts");
    }
  },

  getEmpruntDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const emprunt = await Emprunt.findOne({
        where: {
          id,
          user_id: req.session.userId,
        },
        include: [
          {
            model: Remboursement,
            attributes: ["date", "montant"],
            order: [["date", "DESC"]],
          },
        ],
      });

      if (!emprunt) {
        return res.status(404).json({ message: "Emprunt non trouvé" });
      }

      res.json(emprunt);
    } catch (error) {
      logger.error("Erreur lors de la récupération des détails:", error);
      res.status(500).json({ message: "Une erreur est survenue" });
    }
  },
};

export default empruntController;
