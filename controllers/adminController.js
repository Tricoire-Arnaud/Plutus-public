import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import models from "../models/index.js";

const { User, Budget, Expense, Revenu, sequelize } = models;
const { Op } = sequelize;

const adminController = {
  // Méthode pour afficher la page d'administration
  getAdminPage: async (req, res) => {
    try {
      // Vérifie si l'utilisateur est un administrateur
      if (!req.user || req.user.role !== "admin") {
        return res
          .status(403)
          .send("Accès refusé. Vous devez être administrateur.");
      }

      // Récupère les statistiques globales
      const totalUsers = await User.count();
      const totalBudgets = await Budget.count();
      const totalExpenses = await Expense.count();
      const totalIncomes = await Revenu.count();
      const recentActivities = await getRecentActivities();

      // Calcule les statistiques détaillées
      const detailedStats = {
        moyenneBudgets: Number.parseFloat(
          (await Budget.findOne({
            attributes: [
              [sequelize.fn("AVG", sequelize.col("amount")), "moyenne"],
            ],
            raw: true,
          })?.moyenne) || 0
        ).toFixed(2),
        moyenneDepenses: Number.parseFloat(
          (await Expense.findOne({
            attributes: [
              [sequelize.fn("AVG", sequelize.col("amount")), "moyenne"],
            ],
            raw: true,
          })?.moyenne) || 0
        ).toFixed(2),
        moyenneRevenus: Number.parseFloat(
          (await Revenu.findOne({
            attributes: [
              [sequelize.fn("AVG", sequelize.col("montant")), "moyenne"],
            ],
            raw: true,
          })?.moyenne) || 0
        ).toFixed(2),
      };

      // Récupère les informations des utilisateurs récents
      const users = await User.findAll({
        attributes: ["id", "username", "email", "role", "createdAt"],
        limit: 10,
      });

      // Rend la page admin avec les données récupérées
      res.render("admin", {
        totalUsers,
        totalBudgets,
        totalExpenses,
        totalIncomes,
        detailedStats,
        recentActivities: recentActivities.map((activity) => ({
          user:
            activity.type === "new_user" ? activity.details.split(": ")[1] : "",
          action: activity.details,
          date: new Date(activity.timestamp).toLocaleDateString("fr-FR"),
        })),
        users: users.map((user) => ({
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role,
          createdAt: new Date(user.createdAt).toLocaleDateString("fr-FR"),
        })),
      });
    } catch (error) {
      console.error("Erreur lors du chargement de la page admin:", error);
      res.status(500).send("Erreur lors du chargement de la page admin");
    }
  },

  // Méthode pour récupérer les utilisateurs avec pagination et recherche
  getUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const offset = (page - 1) * limit;

      // Recherche des utilisateurs selon le critère de recherche
      const users = await User.findAndCountAll({
        where: {
          [Op.or]: [
            { username: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
          ],
        },
        attributes: ["id", "username", "email", "role", "createdAt"],
        limit: Number.parseInt(limit),
        offset: offset,
      });

      // Retourne les utilisateurs trouvés et les informations de pagination
      res.json({
        users: users.rows,
        totalPages: Math.ceil(users.count / limit),
        currentPage: page,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des utilisateurs" });
    }
  },

  // Méthode pour ajouter un nouvel utilisateur
  addUser: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, role } = req.body;
      // Hashage du mot de passe avant de le stocker
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        role,
      });

      // Retourne un message de succès avec l'ID du nouvel utilisateur
      res.status(201).json({
        id: newUser.id,
        message: "Utilisateur créé avec succès",
      });
    } catch (createError) {
      console.error(
        "Erreur lors de la création de l'utilisateur:",
        createError
      );
      res.status(500).json({
        error: "Une erreur est survenue lors de la création du user",
      });
    }
  },

  // Méthode pour modifier un utilisateur existant
  editUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { username, role } = req.body;

      // Vérifie si le rôle est valide
      if (role && !["user", "admin"].includes(role)) {
        return res
          .status(400)
          .json({ error: "Le rôle doit être 'user' ou 'admin'" });
      }

      // Recherche l'utilisateur par son ID
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Met à jour les informations de l'utilisateur
      await user.update({
        username: username || user.username,
        role: role || user.role,
      });

      res.json({ message: "Utilisateur mis à jour avec succès" });
    } catch (error) {
      console.error("Erreur lors de la modification d'un utilisateur:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la modification d'un utilisateur" });
    }
  },

  // Méthode pour supprimer un utilisateur
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifie que l'utilisateur existe
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Empêche la suppression de l'admin principal
      if (user.role === "admin" && user.id === req.session.userId) {
        return res.status(403).json({
          success: false,
          message: "Impossible de supprimer l'administrateur principal",
        });
      }

      // Supprime l'utilisateur et toutes ses données associées
      await user.destroy();

      return res.json({
        success: true,
        message: "Utilisateur supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression d'un utilisateur:", error);
      return res.status(500).json({
        success: false,
        message: "Une erreur est survenue lors de la suppression",
      });
    }
  },

  // Méthode pour obtenir des statistiques avancées
  getAdvancedStats: async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return {
      totalTransactions: (await Expense.count()) + (await Revenu.count()),
      totalMoneyTracked:
        (await Expense.sum("amount")) + (await Revenu.sum("montant")),
      activeUsers: await User.count({
        where: {
          updatedAt: {
            [Op.gte]: thirtyDaysAgo,
          },
        },
      }),
    };
  },

  // Méthode pour mettre à jour les paramètres système
  updateSystemSettings: async (req, res) => {
    try {
      const { maintenanceMode, debugMode } = req.body;

      // Retourne un message de succès avec les nouveaux paramètres
      res.json({
        success: true,
        message: "Paramètres système mis à jour avec succès",
        settings: { maintenanceMode, debugMode },
      });
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour des paramètres système:",
        error
      );
      res.status(500).json({
        error: "Erreur lors de la mise à jour des paramètres système",
      });
    }
  },
};

// Fonction pour obtenir les activités récentes
async function getRecentActivities() {
  const recentUsers = await User.findAll({
    order: [["createdAt", "DESC"]],
    limit: 10,
    attributes: ["username", "createdAt"],
  });

  return recentUsers.map((user) => ({
    type: "new_user",
    details: `Nouvel utilisateur: ${user.username}`,
    timestamp: user.createdAt,
  }));
}

export default adminController;
