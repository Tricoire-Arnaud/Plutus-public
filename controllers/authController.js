import bcrypt from "bcryptjs";
import models from "../models/index.js";

const { User } = models;

// Fonction utilitaire pour le logging sécurisé
const logError = (message, error) => {
  if (process.env.NODE_ENV !== "production") {
    console.error(message, error);
  } else {
    console.error(message);
  }
};

const authController = {
  // Fonction pour valider la complexité d'un mot de passe
  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    const errors = [];

    if (password.length < minLength) {
      errors.push(`Au moins ${minLength} caractères`);
    }
    if (!hasUpperCase) {
      errors.push("Une lettre majuscule");
    }
    if (!hasLowerCase) {
      errors.push("Une lettre minuscule");
    }
    if (!hasNumbers) {
      errors.push("Un chiffre");
    }
    if (!hasSpecialChar) {
      errors.push("Un caractère spécial");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  },

  // Fonction pour obtenir les champs du formulaire d'inscription
  getRegisterFields() {
    return [
      {
        name: "username",
        type: "text",
        label: "Nom d'utilisateur",
        required: true,
      },
      {
        name: "email",
        type: "email",
        label: "Email",
        required: true,
      },
      {
        name: "password",
        type: "password",
        label: "Mot de passe",
        required: true,
      },
      {
        name: "confirmPassword",
        type: "password",
        label: "Confirmer le mot de passe",
        required: true,
      },
    ];
  },

  // Affiche la page de connexion
  showLoginPage: (req, res) => {
    res.render("login");
  },

  // Affiche la page d'inscription
  showRegisterPage: (req, res) => {
    res.render("register", {
      title: "Inscription",
      action: "/register",
      fields: authController.getRegisterFields(),
      error: null,
    });
  },

  // Gère l'inscription d'un nouvel utilisateur
  register: async (req, res) => {
    try {
      const { email, password, username, confirmPassword } = req.body;
      const trimmedUsername = username?.trim();
      const trimmedEmail = email?.trim().toLowerCase();

      if (!trimmedEmail || !password || !trimmedUsername || !confirmPassword) {
        return res.render("register", {
          title: "Inscription",
          action: "/register",
          error: "Tous les champs sont obligatoires",
          fields: authController.getRegisterFields(),
          username: trimmedUsername,
          email: trimmedEmail,
        });
      }

      if (password !== confirmPassword) {
        return res.render("register", {
          title: "Inscription",
          action: "/register",
          error: "Les mots de passe ne correspondent pas",
          fields: authController.getRegisterFields(),
          username: trimmedUsername,
          email: trimmedEmail,
        });
      }

      const existingUser = await User.findOne({
        where: { email: trimmedEmail },
      });

      if (existingUser) {
        return res.render("register", {
          title: "Inscription",
          action: "/register",
          error: "Un compte existe déjà avec cet email",
          fields: authController.getRegisterFields(),
          username: trimmedUsername,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        username: trimmedUsername,
        email: trimmedEmail,
        password: hashedPassword,
        role: "user",
      });

      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.username,
      };

      return res.redirect("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      return res.render("register", {
        title: "Inscription",
        action: "/register",
        error: "Une erreur est survenue lors de l'inscription",
        fields: authController.getRegisterFields(),
      });
    }
  },

  // Gère la connexion d'un utilisateur
  login: async (req, res) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).render("login", {
          error: "Veuillez remplir tous les champs",
          email: email || "",
        });
      }

      const user = await User.findOne({
        where: { email: email.trim().toLowerCase() },
        attributes: ["id", "email", "password"],
      });

      if (!user || !user.password) {
        return res.status(401).render("login", {
          error: "Identifiants incorrects",
          email: email,
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (isValidPassword) {
        req.session.regenerate((err) => {
          if (err) {
            throw new Error("Erreur session");
          }
          req.session.userId = user.id;
          req.session.save((err) => {
            if (err) {
              throw new Error("Erreur session");
            }
            res.redirect("/dashboard");
          });
        });
      } else {
        return res.status(401).render("login", {
          error: "Identifiants incorrects",
          email: email,
        });
      }
    } catch (error) {
      const emailFromRequest = req.body?.email || "";
      logError("Login error:", error);
      return res.status(500).render("login", {
        error: "Une erreur est survenue",
        email: emailFromRequest,
      });
    }
  },

  // Gère la déconnexion d'un utilisateur
  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        logError("Erreur lors de la déconnexion:", err);
      }
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  },
};

export default authController;
