import models from "../models/index.js";
import { format, parseISO } from "date-fns";
import logger from "../utils/logger.js";

const { Budget, Category, Revenu, Charge, Expense } = models;

// Fonctions utilitaires
const getDateRange = (req) => {
  // Utiliser les dates de session définies dans le dashboard
  const startDate = req.session.startDate
    ? new Date(req.session.startDate)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = req.session.endDate
    ? new Date(req.session.endDate)
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  return { startDate, endDate };
};

const budgetController = {
  getBudgetPage: async (req, res) => {
    try {
      const userId = req.session.userId;
      const { startDate, endDate } = getDateRange(req);

      // Utiliser les fonctions existantes avec la plage de dates
      const [
        budgets,
        categories,
        revenus,
        chargesFixes,
        chargesVariables,
        expenses,
      ] = await Promise.all([
        Budget.getByUserIdAndDateRange(userId, { startDate, endDate }),
        Category.getAll(),
        Revenu.getByUserIdAndDateRange(userId, { startDate, endDate }),
        Charge.getFixesByUserId(userId),
        Charge.getVariablesByUserIdAndDateRange(userId, { startDate, endDate }),
        Expense.getByUserIdAndDateRange(userId, { startDate, endDate }),
      ]);

      // Récupérer le message flash
      const flashMessage = req.session.flashMessage;
      // Effacer le message flash après l'avoir récupéré
      req.session.flashMessage = null;

      // Filtrer les budgets qui sont dans la plage de dates
      const filteredBudgets = budgets.filter((budget) => {
        const budgetStartDate = new Date(budget.start_date);
        const budgetEndDate = new Date(budget.end_date);
        return budgetStartDate >= startDate && budgetEndDate <= endDate;
      });

      // Calculer les totaux avec les budgets filtrés
      const totalRevenus = revenus.reduce(
        (sum, rev) => sum + Number(rev.montant),
        0
      );
      const totalChargesFixes = chargesFixes.reduce(
        (sum, charge) => sum + Number(charge.montant),
        0
      );
      const totalChargesVariables = chargesVariables.reduce(
        (sum, charge) => sum + Number(charge.montant),
        0
      );
      const totalDepenses = expenses.reduce(
        (sum, expense) => sum + Number(expense.amount),
        0
      );
      const totalBudget = filteredBudgets.reduce(
        (sum, budget) => sum + Number.parseFloat(budget.amount),
        0
      );

      const montantDisponible =
        totalRevenus -
        totalChargesFixes -
        totalChargesVariables -
        totalDepenses -
        totalBudget;

      const dateFilter = {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      };

      res.render("budget", {
        budgets: filteredBudgets, // Utiliser les budgets filtrés
        categories,
        dateFilter,
        montantDisponible,
        totalRevenus,
        totalChargesFixes,
        totalChargesVariables,
        totalDepenses,
        totalBudget,
        flashMessage, // Ajouter le message flash au rendu
      });
    } catch (error) {
      logger.error("Erreur lors du chargement de la page budget:", error);
      res.status(500).render("error", {
        message: "Une erreur est survenue lors du chargement de la page",
      });
    }
  },

  createBudget: async (req, res) => {
    try {
      const { amount, category, start_date, end_date } = req.body;
      const userId = req.session.userId;

      if (!amount || !category || !start_date || !end_date) {
        req.session.flashMessage = "Tous les champs sont requis";
        return res.redirect("/budgets");
      }

      await Budget.create({
        user_id: userId,
        amount,
        category_id: category,
        start_date: start_date,
        end_date: end_date,
      });

      req.session.flashMessage = "Budget défini avec succès";
      res.redirect("/budgets");
    } catch (error) {
      console.error("Erreur lors de la création du budget:", error);
      req.session.flashMessage = `Erreur: ${error.message}`;
      res.redirect("/budgets");
    }
  },

  updateBudget: async (req, res) => {
    try {
      const { id, amount, category, start_date, end_date } = req.body;
      const userId = req.session.userId;

      await Budget.update(
        {
          amount,
          category_id: category,
          start_date: start_date,
          end_date: end_date,
        },
        { where: { id, user_id: userId } }
      );

      req.session.flashMessage = "Budget mis à jour avec succès";
      res.redirect("/budgets");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du budget:", error);
      req.session.flashMessage = `Erreur: ${error.message}`;
      res.redirect("/budgets");
    }
  },

  deleteBudget: async (req, res) => {
    try {
      const { id } = req.params;
      await Budget.destroy({ where: { id, user_id: req.session.userId } });

      req.session.flashMessage = "Budget supprimé avec succès";
      res.redirect("/budgets");
    } catch (error) {
      console.error("Erreur lors de la suppression du budget:", error);
      req.session.flashMessage = `Erreur: ${error.message}`;
      res.redirect("/budgets");
    }
  },
};

export default budgetController;
