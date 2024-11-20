import models from "../models/index.js";
const { Expense, Category } = models;
import { startOfMonth, endOfMonth, format } from "date-fns";
import logger from "../utils/logger.js";

const expenseController = {
  getExpensesPage: async (req, res) => {
    try {
      const userId = req.session.userId;

      const startDate = req.session.startDate
        ? new Date(req.session.startDate)
        : startOfMonth(new Date());
      const endDate = req.session.endDate
        ? new Date(req.session.endDate)
        : endOfMonth(new Date());

      const expenses = await Expense.findAll({
        where: {
          user_id: userId,
          date: {
            [models.Sequelize.Op.between]: [startDate, endDate],
          },
        },
        order: [["date", "DESC"]],
      });

      const categories = await Category.findAll();

      const dateFilter = {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      };

      const flashMessage = req.session.flashMessage;
      req.session.flashMessage = null;

      res.render("expenses", {
        expenses,
        categories,
        dateFilter,
        flashMessage,
      });
    } catch (error) {
      logger.error("Erreur lors du chargement de la page des dépenses:", error);
      req.session.flashMessage =
        "Erreur lors du chargement de la page des dépenses";
      res.status(500).redirect("/error");
    }
  },

  createExpense: async (req, res) => {
    try {
      const { amount, category, date, description } = req.body;
      const userId = req.session.userId;

      if (!amount || !category || !date) {
        req.session.flashMessage =
          "Tous les champs obligatoires doivent être remplis";
        return res.redirect("/depenses");
      }

      const sanitizedDescription = description
        ? encodeURIComponent(description)
        : "";

      await Expense.create({
        amount,
        category_id: category,
        date,
        description: sanitizedDescription,
        user_id: userId,
      });

      req.session.flashMessage = "Dépense ajoutée avec succès";
      res.redirect("/depenses");
    } catch (error) {
      logger.error("Erreur lors de l'ajout de la dépense:", error);
      req.session.flashMessage =
        "Une erreur est survenue lors de l'ajout de la dépense";
      res.redirect("/depenses");
    }
  },

  updateExpense: async (req, res) => {
    try {
      const { amount, category, date, description } = req.body;
      const { id } = req.params;
      const userId = req.session.userId;

      const sanitizedDescription = description
        ? encodeURIComponent(description)
        : "";

      await Expense.update(
        {
          amount,
          category_id: category,
          date,
          description: sanitizedDescription,
        },
        { where: { id, user_id: userId } }
      );
      req.session.flashMessage = "Dépense mise à jour avec succès";
      res.redirect("/depenses");
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la dépense:", error);
      req.session.flashMessage = `Erreur: ${error.message}`;
      res.redirect("/depenses");
    }
  },

  deleteExpense: async (req, res) => {
    try {
      const { id } = req.params;
      await Expense.destroy({ where: { id, user_id: req.session.userId } });
      req.session.flashMessage = "Dépense supprimée avec succès";
      res.redirect("/depenses");
    } catch (error) {
      console.error("Erreur lors de la suppression de la dépense:", error);
      req.session.flashMessage = `Erreur: ${error.message}`;
      res.redirect("/depenses");
    }
  },
};

export default expenseController;
