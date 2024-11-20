import models from "../models/index.js";
import { startOfMonth, endOfMonth, parseISO, format } from "date-fns";
import numeral from "numeral";

const { Budget, Expense, Revenu, Charge, Category } = models;

// Fonction utilitaire pour initialiser les dates du mois
const initializeMonthDates = () => {
  const currentDate = new Date();
  const firstDay = startOfMonth(currentDate);
  const lastDay = endOfMonth(currentDate);

  return {
    startDate: format(firstDay, "yyyy-MM-dd"),
    endDate: format(lastDay, "yyyy-MM-dd"),
  };
};

const formatDateForDB = (dateString) => {
  const date = parseISO(dateString);
  return {
    start: `${format(date, "yyyy-MM-dd")} 00:00:00`,
    end: `${format(date, "yyyy-MM-dd")} 23:59:59`,
  };
};

const validateDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !Number.isNaN(date.getTime());
};

const dashboardController = {
  getDashboard: async (req, res) => {
    try {
      const userId = req.session.userId;

      if (!userId) {
        req.flash(
          "error",
          "Vous devez être connecté pour accéder au tableau de bord"
        );
        return res.redirect("/login");
      }

      // Initialisation des dates si nécessaire
      if (!req.session.startDate || !req.session.endDate) {
        const monthDates = initializeMonthDates();
        req.session.startDate = monthDates.startDate;
        req.session.endDate = monthDates.endDate;
      }

      // Formater les dates pour la base de données
      const formattedStartDate = formatDateForDB(req.session.startDate);
      const formattedEndDate = formatDateForDB(req.session.endDate);

      const dateFilter = {
        startDate: formattedStartDate.start,
        endDate: formattedEndDate.end,
      };

      // Récupération des données avec les dates formatées
      const [
        revenus,
        expenses,
        chargesFixes,
        chargesVariables,
        budgets,
        categories,
      ] = await Promise.all([
        Revenu.getByUserIdAndDateRange(userId, dateFilter),
        Expense.getByUserIdAndDateRange(userId, dateFilter),
        Charge.getFixesByUserId(userId),
        Charge.getVariablesByUserIdAndDateRange(userId, dateFilter),
        Budget.getByUserIdAndDateRange(userId, dateFilter),
        Category.getAll(),
      ]);

      // Vérification des données reçues
      if (!Array.isArray(revenus) || !Array.isArray(expenses)) {
        throw new Error("Format de données invalide");
      }

      // Calcul des totaux avec gestion d'erreur
      const totalRevenus = revenus.reduce((sum, rev) => {
        const montant = Number(rev.montant);
        return Number.isNaN(montant) ? sum : sum + montant;
      }, 0);

      const totalChargesFixes = chargesFixes.reduce((sum, charge) => {
        const montant = Number(charge.montant);

        return Number.isNaN(montant) ? sum : sum + montant;
      }, 0);

      const totalChargesVariables = chargesVariables.reduce((sum, charge) => {
        const montant = Number(charge.montant);
        return Number.isNaN(montant) ? sum : sum + montant;
      }, 0);

      const totalDepenses = expenses.reduce((sum, expense) => {
        const montant = Number(expense.amount);
        return Number.isNaN(montant) ? sum : sum + montant;
      }, 0);

      const montantDisponible =
        totalRevenus -
        totalChargesFixes -
        totalChargesVariables -
        totalDepenses;

      // Traitement des catégories
      const categoriesDataMap = new Map(
        categories.map((category) => [
          category.id,
          { name: category.name, budgeted: 0, spent: 0 },
        ])
      );

      // Mise à jour des budgets
      for (const budget of budgets) {
        if (categoriesDataMap.has(budget.category_id)) {
          const categoryData = categoriesDataMap.get(budget.category_id);
          const montant = Number(budget.amount);
          if (!Number.isNaN(montant)) {
            categoryData.budgeted += montant;
          }
        }
      }

      // Mise à jour des dépenses
      for (const expense of expenses) {
        if (categoriesDataMap.has(expense.category_id)) {
          const categoryData = categoriesDataMap.get(expense.category_id);
          const montant = Number(expense.amount);
          if (!Number.isNaN(montant)) {
            categoryData.spent += montant;
          }
        }
      }

      const categoriesData = Array.from(categoriesDataMap.values()).filter(
        (category) => category.budgeted > 0 || category.spent > 0
      );

      const totalBudget = categoriesData.reduce(
        (sum, cat) => sum + cat.budgeted,
        0
      );
      const totalSpent = categoriesData.reduce(
        (sum, cat) => sum + cat.spent,
        0
      );

      const renderData = {
        revenus,
        budgets,
        chargesFixes,
        chargesVariables,
        totalRevenus,
        totalChargesFixes,
        totalChargesVariables,
        totalDepenses,
        montantDisponible,
        dateFilter,
        categoriesData,
        totalBudget,
        totalSpent,
        numeral,
        startDate: req.session.startDate,
        endDate: req.session.endDate,
        displayStartDate: req.session.startDate.split("-").reverse().join("/"),
        displayEndDate: req.session.endDate.split("-").reverse().join("/"),
        messages: {
          success: req.flash("success"),
          error: req.flash("error"),
          info: req.flash("info"),
        },
      };

      res.render("dashboard", renderData);
    } catch (error) {
      console.error("Erreur lors du chargement du tableau de bord:", error);
      req.flash(
        "error",
        process.env.NODE_ENV === "production"
          ? "Une erreur est survenue lors du chargement du tableau de bord"
          : error.message
      );
      res.redirect("/dashboard");
    }
  },

  updateDateFilter: async (req, res) => {
    try {
      let { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        const monthDates = initializeMonthDates();
        startDate = monthDates.startDate;
        endDate = monthDates.endDate;
        req.flash("info", "Dates réinitialisées au mois en cours");
      } else {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (!validateDate(startDate) || !validateDate(endDate)) {
          req.flash("error", "Format de date incorrect");
          return res.redirect("/dashboard");
        }

        if (start > end) {
          req.flash(
            "error",
            "La date de début ne peut pas être postérieure à la date de fin"
          );
          return res.redirect("/dashboard");
        }

        req.flash("success", "Période mise à jour avec succès");
      }

      req.session.startDate = startDate;
      req.session.endDate = endDate;
      res.redirect("/dashboard");
    } catch (error) {
      console.error("Erreur lors de la mise à jour des dates:", error);
      req.flash(
        "error",
        "Une erreur est survenue lors de la mise à jour des dates"
      );
      res.redirect("/dashboard");
    }
  },

  resetBudget: async (req, res) => {
    try {
      await Budget.resetForUser(req.session.userId);
      req.flash("success", "Budget réinitialisé avec succès");
      res.json({ success: true });
    } catch (error) {
      console.error("Erreur lors de la réinitialisation du budget:", error);
      res.json({
        success: false,
        message: "Erreur lors de la réinitialisation du budget",
      });
    }
  },

  resetCharges: async (req, res) => {
    try {
      await Charge.destroy({ where: { user_id: req.session.userId } });
      res.json({ success: true });
    } catch (error) {
      console.error("Erreur lors de la réinitialisation des charges:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  resetRevenus: async (req, res) => {
    try {
      await Revenu.resetForUser(req.session.userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Erreur lors de la réinitialisation des revenus:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  resetDepenses: async (req, res) => {
    try {
      await Expense.resetForUser(req.session.userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Erreur lors de la réinitialisation des dépenses:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

export default dashboardController;
