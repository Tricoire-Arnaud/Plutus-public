import bcrypt from "bcryptjs";
import models from "../models/index.js";
const { User, Budget, Expense, Revenu, Charge } = models;

const userController = {
  getUserPage: async (req, res) => {
    try {
      const user = await User.findByPk(req.session.userId);
      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }

      const flashMessage = req.session.flashMessage;
      req.session.flashMessage = null;

      res.render("user", {
        user,
        emailNotifications: user.emailNotifications || false,
        flashMessage,
      });
    } catch (error) {
      console.error("Erreur lors du chargement de la page utilisateur:", error);
      req.session.flashMessage = {
        type: "error",
        message: "Erreur lors du chargement de la page utilisateur",
      };
      res.redirect("/dashboard");
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { username, email } = req.body;
      const userId = req.session.userId;

      const existingUser = await User.findOne({
        where: {
          email,
          id: { [models.Sequelize.Op.ne]: userId },
        },
      });

      if (existingUser) {
        req.session.flashMessage = {
          type: "error",
          message: "Cet email est déjà utilisé",
        };
        return res.redirect("/user");
      }

      await User.update({ username, email }, { where: { id: userId } });

      req.session.flashMessage = {
        type: "success",
        message: "Profil mis à jour avec succès",
      };
      res.redirect("/user");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      req.session.flashMessage = {
        type: "error",
        message: "Erreur lors de la mise à jour du profil",
      };
      res.redirect("/user");
    }
  },

  updatePreferences: async (req, res) => {
    try {
      const { emailNotifications } = req.body;
      const userId = req.session.userId;

      await User.update(
        { emailNotifications: !!emailNotifications },
        { where: { id: userId } }
      );

      req.session.flashMessage = "Préférences mises à jour avec succès";
      res.redirect("/user");
    } catch (error) {
      console.error("Erreur lors de la mise à jour des préférences:", error);
      req.session.flashMessage =
        "Erreur lors de la mise à jour des préférences";
      res.redirect("/user");
    }
  },

  updatePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        req.session.flashMessage = "Tous les champs sont requis";
        return res.redirect("/user");
      }

      if (newPassword !== confirmPassword) {
        req.session.flashMessage =
          "Les nouveaux mots de passe ne correspondent pas";
        return res.redirect("/user");
      }

      const user = await User.findOne({
        where: { id: req.session.userId },
        attributes: ["id", "password"],
      });

      if (!user) {
        req.session.flashMessage = "Utilisateur non trouvé";
        return res.redirect("/user");
      }

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        req.session.flashMessage = "Mot de passe actuel incorrect";
        return res.redirect("/user");
      }

      const passwordValidation = {
        hasUpperCase: /[A-Z]/.test(newPassword),
        hasLowerCase: /[a-z]/.test(newPassword),
        hasNumbers: /\d/.test(newPassword),
        hasSpecialChar: /[^A-Za-z0-9]/.test(newPassword),
        isLongEnough: newPassword.length >= 8,
      };

      if (!Object.values(passwordValidation).every(Boolean)) {
        req.session.flashMessage =
          "Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial";
        return res.redirect("/user");
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.update(
        { password: hashedPassword },
        { where: { id: user.id } }
      );

      req.session.flashMessage = {
        type: "success",
        message: "Mot de passe mis à jour avec succès",
      };
      res.redirect("/user");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du mot de passe:", error);
      req.session.flashMessage = {
        type: "error",
        message: "Erreur lors de la mise à jour du mot de passe",
      };
      res.redirect("/user");
    }
  },

  deleteAccount: async (req, res) => {
    try {
      const userId = req.session.userId;

      await Promise.all([
        Budget.destroy({ where: { user_id: userId } }),
        Expense.destroy({ where: { user_id: userId } }),
        Revenu.destroy({ where: { user_id: userId } }),
        Charge.destroy({ where: { user_id: userId } }),
        User.destroy({ where: { id: userId } }),
      ]);

      req.session.destroy();
      res.redirect("/");
    } catch (error) {
      console.error("Erreur lors de la suppression du compte:", error);
      req.session.flashMessage = "Erreur lors de la suppression du compte";
      res.redirect("/user");
    }
  },
};

export default userController;
